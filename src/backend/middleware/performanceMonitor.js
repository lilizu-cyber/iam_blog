const logger = require('../utils/logger');

/**
 * Performance monitoring middleware
 * Tracks response times, error rates, and system metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatus: {},
        byRoute: {}
      },
      responseTimes: {
        min: Infinity,
        max: 0,
        sum: 0,
        count: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        recent: [] // Last 100 response times for percentile calculation
      },
      errors: {
        total: 0,
        byType: {},
        recent: [] // Last 100 errors
      },
      database: {
        queries: 0,
        slowQueries: 0, // Queries > 1000ms
        totalTime: 0,
        averageTime: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        rss: 0,
        external: 0
      }
    };

    // Update memory metrics every 30 seconds
    this.memoryUpdateInterval = setInterval(() => {
      this.updateMemoryMetrics();
    }, 30000);

    // Calculate percentiles every minute
    this.percentileInterval = setInterval(() => {
      this.calculatePercentiles();
    }, 60000);
  }

  /**
   * Middleware to track request performance
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      req.startTime = startTime;

      // Track request
      this.metrics.requests.total++;

      // Track route
      const route = req.route?.path || req.path;
      if (!this.metrics.requests.byRoute[route]) {
        this.metrics.requests.byRoute[route] = {
          count: 0,
          totalTime: 0,
          errors: 0
        };
      }
      this.metrics.requests.byRoute[route].count++;

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Update metrics
        this.recordResponseTime(duration);
        this.recordRequestStatus(statusCode, route, duration);

        // Log slow requests
        if (duration > 1000) {
          logger.warn('Slow request detected', {
            method: req.method,
            path: req.path,
            duration: `${duration}ms`,
            statusCode
          });
        }

        // Track errors
        if (statusCode >= 400) {
          this.recordError({
            type: statusCode >= 500 ? 'server_error' : 'client_error',
            statusCode,
            path: req.path,
            method: req.method,
            duration
          });
        }
      });

      next();
    };
  }

  /**
   * Record response time
   */
  recordResponseTime(duration) {
    const metrics = this.metrics.responseTimes;
    
    metrics.min = Math.min(metrics.min, duration);
    metrics.max = Math.max(metrics.max, duration);
    metrics.sum += duration;
    metrics.count++;

    // Keep last 100 response times for percentile calculation
    metrics.recent.push(duration);
    if (metrics.recent.length > 100) {
      metrics.recent.shift();
    }

    // Update average
    metrics.average = metrics.sum / metrics.count;
  }

  /**
   * Record request status
   */
  recordRequestStatus(statusCode, route, duration) {
    // Track by status code
    if (!this.metrics.requests.byStatus[statusCode]) {
      this.metrics.requests.byStatus[statusCode] = 0;
    }
    this.metrics.requests.byStatus[statusCode]++;

    // Track success/failure
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track route performance
    if (this.metrics.requests.byRoute[route]) {
      this.metrics.requests.byRoute[route].totalTime += duration;
      if (statusCode >= 400) {
        this.metrics.requests.byRoute[route].errors++;
      }
    }
  }

  /**
   * Record error
   */
  recordError(error) {
    this.metrics.errors.total++;
    
    // Track by type
    if (!this.metrics.errors.byType[error.type]) {
      this.metrics.errors.byType[error.type] = 0;
    }
    this.metrics.errors.byType[error.type]++;

    // Keep last 100 errors
    this.metrics.errors.recent.push({
      ...error,
      timestamp: new Date().toISOString()
    });
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent.shift();
    }
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(duration, query = null) {
    this.metrics.database.queries++;
    this.metrics.database.totalTime += duration;
    this.metrics.database.averageTime = 
      this.metrics.database.totalTime / this.metrics.database.queries;

    if (duration > 1000) {
      this.metrics.database.slowQueries++;
      logger.warn('Slow database query detected', {
        duration: `${duration}ms`,
        query: query ? query.substring(0, 100) : 'N/A'
      });
    }
  }

  /**
   * Update memory metrics
   */
  updateMemoryMetrics() {
    const usage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      heapUsedPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };

    // Alert if memory usage is high
    // Threshold can be adjusted via environment variable (default: 90%)
    // Only warn if heap is reasonably sized (> 100MB) to avoid false alarms on small heaps
    const memoryThreshold = parseInt(process.env.MEMORY_WARNING_THRESHOLD || '90', 10);
    const minHeapSizeForWarning = 100; // Only warn if heap is at least 100MB
    
    if (this.metrics.memory.heapUsedPercent > memoryThreshold && 
        this.metrics.memory.heapTotal > minHeapSizeForWarning) {
      logger.warn('High memory usage detected', {
        heapUsedPercent: `${this.metrics.memory.heapUsedPercent}%`,
        heapUsed: `${this.metrics.memory.heapUsed}MB`,
        heapTotal: `${this.metrics.memory.heapTotal}MB`,
        threshold: `${memoryThreshold}%`,
        recommendation: 'Consider restarting the server or investigating memory leaks'
      });
    } else if (this.metrics.memory.heapTotal <= minHeapSizeForWarning) {
      // Log info instead of warning for small heaps (likely development with limited memory)
      logger.debug('Small heap size detected', {
        heapUsed: `${this.metrics.memory.heapUsed}MB`,
        heapTotal: `${this.metrics.memory.heapTotal}MB`,
        note: 'Heap size is small. Consider increasing with --max-old-space-size flag'
      });
    }
  }

  /**
   * Calculate percentiles
   */
  calculatePercentiles() {
    const recent = [...this.metrics.responseTimes.recent].sort((a, b) => a - b);
    if (recent.length === 0) return;

    const p50Index = Math.floor(recent.length * 0.5);
    const p95Index = Math.floor(recent.length * 0.95);
    const p99Index = Math.floor(recent.length * 0.99);

    this.metrics.responseTimes.p50 = recent[p50Index] || 0;
    this.metrics.responseTimes.p95 = recent[p95Index] || 0;
    this.metrics.responseTimes.p99 = recent[p99Index] || 0;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    // Calculate current percentiles
    this.calculatePercentiles();
    
    // Update memory
    this.updateMemoryMetrics();

    return {
      ...this.metrics,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get metrics summary for monitoring
   */
  getSummary() {
    const metrics = this.getMetrics();
    const errorRate = metrics.requests.total > 0
      ? (metrics.requests.failed / metrics.requests.total * 100).toFixed(2)
      : 0;

    return {
      requests: {
        total: metrics.requests.total,
        successful: metrics.requests.successful,
        failed: metrics.requests.failed,
        errorRate: `${errorRate}%`
      },
      performance: {
        averageResponseTime: Math.round(metrics.responseTimes.average || 0),
        p50: metrics.responseTimes.p50,
        p95: metrics.responseTimes.p95,
        p99: metrics.responseTimes.p99,
        min: metrics.responseTimes.min === Infinity ? 0 : metrics.responseTimes.min,
        max: metrics.responseTimes.max
      },
      errors: {
        total: metrics.errors.total,
        byType: metrics.errors.byType
      },
      database: {
        queries: metrics.database.queries,
        averageTime: Math.round(metrics.database.averageTime),
        slowQueries: metrics.database.slowQueries
      },
      memory: metrics.memory,
      uptime: Math.round(metrics.uptime)
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatus: {},
        byRoute: {}
      },
      responseTimes: {
        min: Infinity,
        max: 0,
        sum: 0,
        count: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        recent: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      database: {
        queries: 0,
        slowQueries: 0,
        totalTime: 0,
        averageTime: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        rss: 0,
        external: 0
      }
    };
  }

  /**
   * Cleanup intervals
   */
  destroy() {
    if (this.memoryUpdateInterval) {
      clearInterval(this.memoryUpdateInterval);
    }
    if (this.percentileInterval) {
      clearInterval(this.percentileInterval);
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;

