#!/usr/bin/env node
/**
 * Health Check Monitoring Script
 * 
 * Monitors application health endpoints and sends alerts if unhealthy.
 * 
 * Usage:
 *   - Manual: node scripts/monitor-health.js
 *   - Cron (every 5 minutes): */5 * * * * cd /path/to/project && node scripts/monitor-health.js
 *   - Scheduled: use cron or a systemd timer; see README.md
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const { URL } = require('url');

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
};

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || process.env.HEALTH_CHECK_URL || 'http://localhost:3001';
const HEALTH_ENDPOINT = '/health';
const READY_ENDPOINT = '/ready';
const TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 2;

// Alert configuration
const ALERT_EMAIL = process.env.HEALTH_ALERT_EMAIL;
const ALERT_SLACK_WEBHOOK = process.env.HEALTH_ALERT_SLACK_WEBHOOK;
const ALERT_THRESHOLD = parseInt(process.env.HEALTH_ALERT_THRESHOLD || '2', 10); // Alert after 2 consecutive failures

// Track consecutive failures
let consecutiveFailures = 0;
let lastAlertTime = null;
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown between alerts

/**
 * Make HTTP request to health endpoint
 */
function checkHealth(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BACKEND_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'HealthCheckMonitor/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            health: health,
            responseTime: Date.now() - startTime
          });
        } catch (error) {
          reject(new Error(`Failed to parse health response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check request timeout'));
    });

    const startTime = Date.now();
    req.end();
  });
}

/**
 * Send alert notification
 */
async function sendAlert(message, details) {
  const now = Date.now();
  
  // Cooldown check - don't spam alerts
  if (lastAlertTime && (now - lastAlertTime) < ALERT_COOLDOWN_MS) {
    logger.warn('Alert cooldown active, skipping alert');
    return;
  }

  lastAlertTime = now;
  
  const alertMessage = `🚨 Health Check Alert\n\n${message}\n\nDetails:\n${JSON.stringify(details, null, 2)}`;

  // Email alert (if configured)
  if (ALERT_EMAIL) {
    try {
      // Use system mail command (requires mailx or similar)
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Try to send email (platform-specific)
      if (process.platform === 'win32') {
        // Windows - use PowerShell Send-MailMessage
        logger.warn('Email alerts not configured for Windows. Use Slack or external service.');
      } else {
        // Linux/Mac - use mail command
        await execAsync(`echo "${alertMessage}" | mail -s "Health Check Alert" ${ALERT_EMAIL}`);
        logger.info(`Alert email sent to ${ALERT_EMAIL}`);
      }
    } catch (error) {
      logger.warn('Failed to send email alert:', error.message);
    }
  }

  // Slack alert (if configured)
  if (ALERT_SLACK_WEBHOOK) {
    try {
      const https = require('https');
      const { URL } = require('url');
      const slackUrl = new URL(ALERT_SLACK_WEBHOOK);
      
      const payload = JSON.stringify({
        text: alertMessage,
        username: 'Health Check Monitor',
        icon_emoji: ':warning:'
      });

      const options = {
        hostname: slackUrl.hostname,
        port: 443,
        path: slackUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          logger.info('Alert sent to Slack');
        } else {
          logger.warn(`Slack alert failed with status ${res.statusCode}`);
        }
      });

      req.on('error', (error) => {
        logger.warn('Failed to send Slack alert:', error.message);
      });

      req.write(payload);
      req.end();
    } catch (error) {
      logger.warn('Failed to send Slack alert:', error.message);
    }
  }

  // Console output (always)
  logger.error(alertMessage);
}

/**
 * Perform health check
 */
async function performHealthCheck() {
  try {
    logger.info(`Checking health at ${BACKEND_URL}${HEALTH_ENDPOINT}...`);

    // Check /health endpoint
    const healthResult = await checkHealth(HEALTH_ENDPOINT);
    
    // Check /ready endpoint
    let readyResult = null;
    try {
      readyResult = await checkHealth(READY_ENDPOINT);
    } catch (error) {
      logger.warn(`Ready endpoint check failed: ${error.message}`);
    }

    // Evaluate health status
    const isHealthy = healthResult.statusCode === 200 && 
                     healthResult.health?.status === 'healthy';
    const isReady = readyResult && 
                   readyResult.statusCode === 200;

    if (isHealthy && isReady) {
      consecutiveFailures = 0;
      logger.info('✅ Health check passed', {
        status: healthResult.health.status,
        responseTime: `${healthResult.responseTime}ms`,
        services: Object.keys(healthResult.health.services || {}).length
      });
      return { success: true, health: healthResult.health };
    } else {
      consecutiveFailures++;
      const errorDetails = {
        healthStatus: healthResult.health?.status || 'unknown',
        healthStatusCode: healthResult.statusCode,
        readyStatus: readyResult ? (readyResult.statusCode === 200 ? 'ready' : 'not ready') : 'not checked',
        responseTime: healthResult.responseTime,
        services: healthResult.health?.services || {}
      };

      logger.warn(`⚠️ Health check failed (${consecutiveFailures}/${ALERT_THRESHOLD})`, errorDetails);

      // Send alert if threshold reached
      if (consecutiveFailures >= ALERT_THRESHOLD) {
        await sendAlert(
          `Application health check failed ${consecutiveFailures} times`,
          {
            backendUrl: BACKEND_URL,
            healthEndpoint: HEALTH_ENDPOINT,
            ...errorDetails
          }
        );
      }

      return { success: false, health: healthResult.health, error: errorDetails };
    }
  } catch (error) {
    consecutiveFailures++;
    const errorDetails = {
      error: error.message,
      backendUrl: BACKEND_URL,
      endpoint: HEALTH_ENDPOINT
    };

    logger.error(`❌ Health check error (${consecutiveFailures}/${ALERT_THRESHOLD}):`, errorDetails);

    // Send alert if threshold reached
    if (consecutiveFailures >= ALERT_THRESHOLD) {
      await sendAlert(
        `Health check failed: ${error.message}`,
        errorDetails
      );
    }

    return { success: false, error: errorDetails };
  }
}

// Main execution
if (require.main === module) {
  performHealthCheck()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('Health check monitor error:', error);
      process.exit(1);
    });
}

module.exports = { performHealthCheck };

