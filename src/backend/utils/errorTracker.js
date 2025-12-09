const logger = require('./logger');

/**
 * Error Tracking utility
 * Centralized error tracking with Sentry and Rollbar support
 */
class ErrorTracker {
  constructor() {
    this.sentry = null;
    this.rollbar = null;
    this.notificationConfig = {
      enabled: process.env.ERROR_NOTIFICATIONS_ENABLED === 'true',
      email: process.env.ERROR_NOTIFICATION_EMAIL,
      slackWebhook: process.env.ERROR_NOTIFICATION_SLACK_WEBHOOK,
      threshold: parseInt(process.env.ERROR_NOTIFICATION_THRESHOLD || '5', 10) // Notify after N errors
    };
    this.errorCounts = new Map(); // Track error frequency
    this.initialize();
  }

  /**
   * Initialize error tracking services
   */
  initialize() {
    // Initialize Sentry
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = require('@sentry/node');
        const Tracing = require('@sentry/tracing');
        
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          release: process.env.APP_VERSION || '1.0.0',
          
          // Performance monitoring
          tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
          profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
          
          // Error filtering
          beforeSend(event, hint) {
            // Filter out known non-critical errors
            const error = hint.originalException;
            if (error) {
              // Don't track 404 errors
              if (error.status === 404) {
                return null;
              }
              
              // Don't track validation errors (client errors)
              if (error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 403) {
                return null;
              }
            }
            
            return event;
          },
          
          // Integrations
          integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app: null }),
            new Tracing.Integrations.Postgres(),
          ],
          
          // Additional options
          maxBreadcrumbs: 50,
          attachStacktrace: true,
          sendDefaultPii: false, // Don't send PII
        });

        this.sentry = Sentry;
        logger.info('Sentry error tracking initialized');
      } catch (error) {
        logger.warn('Failed to initialize Sentry:', error.message);
      }
    }

    // Initialize Rollbar
    if (process.env.ROLLBAR_ACCESS_TOKEN) {
      try {
        const Rollbar = require('rollbar');
        
        this.rollbar = new Rollbar({
          accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
          environment: process.env.NODE_ENV || 'development',
          captureUncaught: true,
          captureUnhandledRejections: true,
          payload: {
            code_version: process.env.APP_VERSION || '1.0.0',
            server: {
              host: process.env.HOST || 'localhost'
            }
          }
        });

        logger.info('Rollbar error tracking initialized');
      } catch (error) {
        logger.warn('Failed to initialize Rollbar:', error.message);
      }
    }
  }

  /**
   * Capture and track an error
   */
  captureError(error, context = {}) {
    const errorKey = this.getErrorKey(error);
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    // Add error context
    const errorContext = {
      ...context,
      errorCount: count,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    };

    // Track with Sentry
    if (this.sentry) {
      this.sentry.withScope((scope) => {
        // Set context
        Object.keys(errorContext).forEach(key => {
          if (key !== 'user' && key !== 'tags' && key !== 'level') {
            scope.setContext(key, errorContext[key]);
          }
        });

        // Set user context if available
        if (errorContext.user) {
          scope.setUser(errorContext.user);
        }

        // Set tags
        if (errorContext.tags) {
          Object.keys(errorContext.tags).forEach(tag => {
            scope.setTag(tag, errorContext.tags[tag]);
          });
        }

        // Set level
        const level = this.getErrorLevel(error);
        scope.setLevel(level);

        // Capture exception
        this.sentry.captureException(error);
      });
    }

    // Track with Rollbar
    if (this.rollbar) {
      const level = this.getErrorLevel(error);
      this.rollbar[level](error, errorContext);
    }

    // Log error
    logger.error('Error tracked', {
      message: error.message,
      stack: error.stack,
      context: errorContext,
      count
    });

    // Send notification if threshold exceeded
    if (this.notificationConfig.enabled && count === this.notificationConfig.threshold) {
      this.sendNotification(error, errorContext, count);
    }
  }

  /**
   * Capture a message (non-error)
   */
  captureMessage(message, level = 'info', context = {}) {
    // Sentry
    if (this.sentry) {
      this.sentry.withScope((scope) => {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
        this.sentry.captureMessage(message, level);
      });
    }

    // Rollbar
    if (this.rollbar) {
      this.rollbar[level](message, context);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user) {
    if (this.sentry) {
      this.sentry.setUser({
        id: user.id,
        username: user.username,
        email: user.email
      });
    }

    if (this.rollbar) {
      this.rollbar.configure({
        payload: {
          person: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        }
      });
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
    if (this.sentry) {
      this.sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000
      });
    }

    if (this.rollbar) {
      this.rollbar.info(message, { category, level, ...data });
    }
  }

  /**
   * Get error level based on error type
   */
  getErrorLevel(error) {
    if (error.status >= 500) {
      return 'error';
    } else if (error.status >= 400) {
      return 'warning';
    } else if (error.name === 'ValidationError') {
      return 'info';
    }
    return 'error';
  }

  /**
   * Generate unique key for error grouping
   */
  getErrorKey(error) {
    const message = error.message || 'Unknown error';
    const stack = error.stack ? error.stack.split('\n')[0] : '';
    return `${message}:${stack}`;
  }

  /**
   * Send error notification
   */
  async sendNotification(error, context, count) {
    if (!this.notificationConfig.enabled) {
      return;
    }

    const notification = {
      title: `Error Alert: ${error.message}`,
      message: `Error occurred ${count} times`,
      error: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        status: error.status,
        name: error.name
      },
      context: {
        ...context,
        count
      },
      timestamp: new Date().toISOString()
    };

    // Send email notification
    if (this.notificationConfig.email) {
      try {
        await this.sendEmailNotification(notification);
      } catch (err) {
        logger.error('Failed to send email notification:', err);
      }
    }

    // Send Slack notification
    if (this.notificationConfig.slackWebhook) {
      try {
        await this.sendSlackNotification(notification);
      } catch (err) {
        logger.error('Failed to send Slack notification:', err);
      }
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    // This would integrate with your email service
    // For now, just log it
    logger.warn('Email notification (not implemented)', notification);
    
    // TODO: Integrate with email service (nodemailer, SendGrid, etc.)
    // Example:
    // const transporter = nodemailer.createTransport(...);
    // await transporter.sendMail({
    //   to: this.notificationConfig.email,
    //   subject: notification.title,
    //   text: JSON.stringify(notification, null, 2)
    // });
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(notification) {
    const https = require('https');
    const url = require('url');

    return new Promise((resolve, reject) => {
      const webhookUrl = url.parse(this.notificationConfig.slackWebhook);
      const payload = JSON.stringify({
        text: notification.title,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Error Message', value: notification.error.message, short: false },
            { title: 'Count', value: notification.context.count.toString(), short: true },
            { title: 'Environment', value: notification.context.environment, short: true },
            { title: 'Timestamp', value: notification.timestamp, short: true }
          ],
          text: `\`\`\`${notification.error.stack}\`\`\``
        }]
      });

      const options = {
        hostname: webhookUrl.hostname,
        port: webhookUrl.port || 443,
        path: webhookUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Slack webhook returned ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      uniqueErrors: this.errorCounts.size,
      topErrors: Array.from(this.errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => ({ error: key, count }))
    };
  }

  /**
   * Reset error counts (useful for testing)
   */
  reset() {
    this.errorCounts.clear();
  }
}

// Singleton instance
const errorTracker = new ErrorTracker();

module.exports = errorTracker;



