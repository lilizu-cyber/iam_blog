const logger = require('./logger');

/**
 * Comprehensive health check utility
 * Checks all critical services and returns detailed status
 */
class HealthChecker {
  constructor(eventStore, readModelStore, redisClient) {
    this.eventStore = eventStore;
    this.readModelStore = readModelStore;
    this.redisClient = redisClient;
  }

  /**
   * Check PostgreSQL database connectivity (Read Model Store)
   */
  async checkDatabase() {
    const startTime = Date.now();
    try {
      if (!this.readModelStore || !this.readModelStore.sequelize) {
        return {
          status: 'unhealthy',
          error: 'ReadModelStore not initialized',
          responseTime: Date.now() - startTime
        };
      }

      // Test database connection with a simple query
      await this.readModelStore.sequelize.authenticate();
      
      // Optional: Run a simple query to verify read/write capability
      const [results] = await this.readModelStore.sequelize.query('SELECT 1 as health_check');
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          database: this.readModelStore.sequelize.getDatabaseName(),
          host: this.readModelStore.sequelize.config.host,
          port: this.readModelStore.sequelize.config.port
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check Event Store connectivity
   */
  async checkEventStore() {
    const startTime = Date.now();
    try {
      if (!this.eventStore) {
        return {
          status: 'unhealthy',
          error: 'EventStore not initialized',
          responseTime: Date.now() - startTime
        };
      }

      // Check if event store is connected
      const isConnected = this.eventStore.isConnected;
      
      if (!isConnected) {
        return {
          status: 'unhealthy',
          error: 'EventStore not connected',
          responseTime: Date.now() - startTime
        };
      }

      // Optional: Test with a simple query
      // This depends on your EventStore implementation
      if (typeof this.eventStore.healthCheck === 'function') {
        const healthResult = await this.eventStore.healthCheck();
        return {
          status: healthResult.status || 'healthy',
          responseTime: Date.now() - startTime,
          details: healthResult.details || {}
        };
      }

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('EventStore health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  async checkRedis() {
    const startTime = Date.now();
    try {
      if (!this.redisClient) {
        return {
          status: 'degraded',
          message: 'Redis not configured',
          responseTime: Date.now() - startTime
        };
      }

      // Check if Redis client is ready
      if (this.redisClient.isReady !== undefined) {
        if (!this.redisClient.isReady) {
          return {
            status: 'unhealthy',
            error: 'Redis client not ready',
            responseTime: Date.now() - startTime
          };
        }
      }

      // Test Redis connection with PING command
      const result = await this.redisClient.ping();
      
      if (result === 'PONG') {
        // Get Redis info
        const info = await this.redisClient.info('server');
        const versionMatch = info.match(/redis_version:([^\r\n]+)/);
        
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          details: {
            version: versionMatch ? versionMatch[1] : 'unknown',
            connected: true
          }
        };
      }

      return {
        status: 'unhealthy',
        error: 'Redis PING failed',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'degraded',
        error: error.message,
        message: 'Redis unavailable, using memory store for rate limiting',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check system resources (memory, uptime)
   */
  checkSystemResources() {
    try {
      const usage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Calculate memory usage percentages
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(usage.rss / 1024 / 1024);
      const heapUsedPercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

      // Warn if memory usage is high (>90%)
      const memoryStatus = heapUsedPercent > 90 ? 'warning' : 'healthy';

      return {
        status: memoryStatus,
        memory: {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          rss: `${rssMB}MB`,
          heapUsedPercent: `${heapUsedPercent}%`
        },
        uptime: {
          seconds: Math.round(uptime),
          formatted: formatUptime(uptime)
        },
        nodeVersion: process.version,
        platform: process.platform
      };
    } catch (error) {
      logger.error('System resources check failed:', error);
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = Date.now();
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {}
    };

    // Run all checks in parallel for faster response
    const [database, eventStore, redis, system] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkEventStore(),
      this.checkRedis(),
      Promise.resolve(this.checkSystemResources())
    ]);

    // Process database check
    if (database.status === 'fulfilled') {
      checks.services.database = database.value;
    } else {
      checks.services.database = {
        status: 'unhealthy',
        error: database.reason?.message || 'Database check failed'
      };
    }

    // Process event store check
    if (eventStore.status === 'fulfilled') {
      checks.services.eventStore = eventStore.value;
    } else {
      checks.services.eventStore = {
        status: 'unhealthy',
        error: eventStore.reason?.message || 'EventStore check failed'
      };
    }

    // Process Redis check
    if (redis.status === 'fulfilled') {
      checks.services.redis = redis.value;
    } else {
      checks.services.redis = {
        status: 'degraded',
        error: redis.reason?.message || 'Redis check failed'
      };
    }

    // Process system resources check
    if (system.status === 'fulfilled') {
      checks.services.system = system.value;
    } else {
      checks.services.system = {
        status: 'unknown',
        error: system.reason?.message || 'System check failed'
      };
    }

    // Determine overall health status
    const criticalServices = ['database', 'eventStore'];
    const criticalStatuses = criticalServices.map(service => 
      checks.services[service]?.status
    );

    // Overall status logic:
    // - If any critical service is unhealthy, overall is unhealthy
    // - If Redis is degraded but critical services are healthy, overall is healthy (degraded)
    // - Otherwise, healthy
    if (criticalStatuses.some(status => status === 'unhealthy')) {
      checks.status = 'unhealthy';
    } else if (checks.services.redis?.status === 'degraded') {
      checks.status = 'healthy'; // Redis is optional
    } else if (criticalStatuses.every(status => status === 'healthy')) {
      checks.status = 'healthy';
    } else {
      checks.status = 'degraded';
    }

    checks.responseTime = Date.now() - startTime;
    checks.version = process.env.APP_VERSION || '1.0.0';
    checks.environment = process.env.NODE_ENV || 'development';

    return checks;
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

module.exports = HealthChecker;

