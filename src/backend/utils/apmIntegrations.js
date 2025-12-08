const logger = require('./logger');

/**
 * APM Integration utilities
 * Provides integration points for popular APM tools
 */

class APMIntegrations {
  constructor() {
    this.integrations = {
      newrelic: null,
      datadog: null,
      sentry: null
    };
    this.initializeIntegrations();
  }

  /**
   * Initialize APM integrations based on environment variables
   */
  initializeIntegrations() {
    // New Relic
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        require('newrelic');
        this.integrations.newrelic = true;
        logger.info('New Relic APM initialized');
      } catch (error) {
        logger.warn('New Relic not available:', error.message);
      }
    }

    // Datadog
    if (process.env.DD_API_KEY) {
      try {
        const tracer = require('dd-trace');
        tracer.init({
          service: process.env.DD_SERVICE || 'iam-blog-backend',
          env: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '1.0.0'
        });
        this.integrations.datadog = tracer;
        logger.info('Datadog APM initialized');
      } catch (error) {
        logger.warn('Datadog APM not available:', error.message);
      }
    }

    // Sentry
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = require('@sentry/node');
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
          profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1')
        });
        this.integrations.sentry = Sentry;
        logger.info('Sentry APM initialized');
      } catch (error) {
        logger.warn('Sentry not available:', error.message);
      }
    }
  }

  /**
   * Track custom transaction
   */
  trackTransaction(name, operation, callback) {
    // New Relic
    if (this.integrations.newrelic) {
      const newrelic = require('newrelic');
      return newrelic.startWebTransaction(name, () => {
        return newrelic.startSegment(operation, true, callback);
      });
    }

    // Datadog
    if (this.integrations.datadog) {
      const span = this.integrations.datadog.startSpan(operation);
      try {
        const result = callback();
        if (result && typeof result.then === 'function') {
          return result.finally(() => span.finish());
        }
        span.finish();
        return result;
      } catch (error) {
        span.setTag('error', true);
        span.finish();
        throw error;
      }
    }

    // Sentry
    if (this.integrations.sentry) {
      const transaction = this.integrations.sentry.startTransaction({
        name,
        op: operation
      });
      try {
        const result = callback();
        if (result && typeof result.then === 'function') {
          return result.finally(() => transaction.finish());
        }
        transaction.finish();
        return result;
      } catch (error) {
        this.integrations.sentry.captureException(error);
        transaction.finish();
        throw error;
      }
    }

    // Fallback: just execute callback
    return callback();
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    // Sentry
    if (this.integrations.sentry) {
      this.integrations.sentry.withScope((scope) => {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
        this.integrations.sentry.captureException(error);
      });
    }

    // New Relic
    if (this.integrations.newrelic) {
      const newrelic = require('newrelic');
      newrelic.noticeError(error, context);
    }

    // Datadog
    if (this.integrations.datadog) {
      const span = this.integrations.datadog.scope().active();
      if (span) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        span.setTag('error.type', error.name);
      }
    }
  }

  /**
   * Track custom metric
   */
  trackMetric(name, value, tags = {}) {
    // New Relic
    if (this.integrations.newrelic) {
      const newrelic = require('newrelic');
      newrelic.recordMetric(name, value);
    }

    // Datadog
    if (this.integrations.datadog) {
      this.integrations.datadog.dogstatsd.gauge(name, value, tags);
    }

    // Sentry doesn't support custom metrics directly
  }

  /**
   * Track database query
   */
  trackDatabaseQuery(query, duration, error = null) {
    // New Relic
    if (this.integrations.newrelic) {
      const newrelic = require('newrelic');
      newrelic.recordMetric('Database/Query/Time', duration);
      if (error) {
        newrelic.recordMetric('Database/Query/Errors', 1);
      }
    }

    // Datadog
    if (this.integrations.datadog) {
      const span = this.integrations.datadog.startSpan('db.query', {
        service: 'postgresql',
        resource: query.substring(0, 100),
        type: 'db'
      });
      span.setTag('db.query', query.substring(0, 100));
      span.setTag('db.duration', duration);
      if (error) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
      }
      span.finish();
    }

    // Sentry
    if (this.integrations.sentry && error) {
      this.integrations.sentry.captureException(error, {
        tags: {
          query: query.substring(0, 100),
          duration
        }
      });
    }
  }

  /**
   * Track HTTP request
   */
  trackHttpRequest(method, path, statusCode, duration, error = null) {
    // New Relic
    if (this.integrations.newrelic) {
      const newrelic = require('newrelic');
      newrelic.recordMetric(`Http/${method}`, duration);
      if (error) {
        newrelic.recordMetric('Http/Errors', 1);
      }
    }

    // Datadog
    if (this.integrations.datadog) {
      const span = this.integrations.datadog.startSpan('http.request', {
        service: 'iam-blog-backend',
        resource: `${method} ${path}`,
        type: 'web'
      });
      span.setTag('http.method', method);
      span.setTag('http.url', path);
      span.setTag('http.status_code', statusCode);
      span.setTag('http.duration', duration);
      if (error) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
      }
      span.finish();
    }

    // Sentry
    if (this.integrations.sentry && error) {
      this.integrations.sentry.captureException(error, {
        tags: {
          method,
          path,
          statusCode,
          duration
        }
      });
    }
  }

  /**
   * Get active integrations
   */
  getActiveIntegrations() {
    return Object.keys(this.integrations).filter(
      key => this.integrations[key] !== null
    );
  }
}

// Singleton instance
const apmIntegrations = new APMIntegrations();

module.exports = apmIntegrations;


