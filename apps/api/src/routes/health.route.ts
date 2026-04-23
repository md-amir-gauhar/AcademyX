import { Router, Request, Response } from "express";
import { db } from "../db";
import { redis } from "../config/redis";
import { sql } from "drizzle-orm";
import { healthCheckRateLimiter } from "../middlewares/rate-limiter.middleware";

const router = Router();

/**
 * @openapi
 * /health-check:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check endpoint with database and Redis status
 *     description: Returns comprehensive server health status including database and Redis connections
 *     responses:
 *       200:
 *         description: Server health status with service checks
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 services:
 *                   type: object
 */
router.get("/", healthCheckRateLimiter, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const acceptHeader = req.headers.accept || "";
  const wantsJson = acceptHeader.includes("application/json");

  // Check database
  let dbStatus = "unknown";
  let dbResponseTime = 0;
  let dbError = null;
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1 as health`);
    dbResponseTime = Date.now() - dbStart;
    dbStatus = "healthy";
  } catch (error: any) {
    dbStatus = "unhealthy";
    dbError = error.message;
  }

  // Check Redis
  let redisStatus = "unknown";
  let redisResponseTime = 0;
  let redisError = null;
  if (redis) {
    try {
      const redisStart = Date.now();
      await redis.ping();
      redisResponseTime = Date.now() - redisStart;
      redisStatus = redis.status === "ready" ? "healthy" : "degraded";
    } catch (error: any) {
      redisStatus = "unhealthy";
      redisError = error.message;
    }
  } else {
    redisStatus = "disabled";
  }

  const healthData = {
    status: dbStatus === "healthy" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: parseInt(process.env.PORT || "3000", 10),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`,
        error: dbError,
      },
      redis: {
        status: redisStatus,
        responseTime:
          redisStatus !== "disabled" ? `${redisResponseTime}ms` : "N/A",
        error: redisError,
      },
      server: {
        status: "healthy",
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(
            process.memoryUsage().heapTotal / 1024 / 1024
          )}MB`,
        },
      },
    },
    responseTime: `${Date.now() - startTime}ms`,
  };

  // Return JSON if requested
  if (wantsJson) {
    return res.status(dbStatus === "healthy" ? 200 : 503).json(healthData);
  }

  // Return HTML UI
  const statusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "#10b981";
      case "degraded":
        return "#f59e0b";
      case "unhealthy":
        return "#ef4444";
      case "disabled":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return "✓";
      case "degraded":
        return "⚠";
      case "unhealthy":
        return "✕";
      case "disabled":
        return "○";
      default:
        return "?";
    }
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Queztlearn Health Check</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 800px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .header .status {
      font-size: 16px;
      opacity: 0.95;
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      margin-top: 8px;
    }
    .content {
      padding: 32px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .info-card {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .info-card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .info-card .value {
      font-size: 20px;
      color: #111827;
      font-weight: 600;
    }
    .services {
      margin-top: 24px;
    }
    .services h2 {
      font-size: 18px;
      color: #111827;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .service-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 12px;
      border: 2px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    .service-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
    .service-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .service-name {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .service-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      color: white;
    }
    .service-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
    }
    .service-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .service-detail {
      font-size: 13px;
      color: #6b7280;
    }
    .service-detail strong {
      color: #111827;
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .error-message {
      background: #fef2f2;
      color: #991b1b;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      margin-top: 8px;
      border: 1px solid #fecaca;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Queztlearn Service</h1>
      <div class="status">${healthData.status.toUpperCase()}</div>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-card">
          <div class="label">Environment</div>
          <div class="value">${healthData.environment}</div>
        </div>
        <div class="info-card">
          <div class="label">Port</div>
          <div class="value">${healthData.port}</div>
        </div>
        <div class="info-card">
          <div class="label">Uptime</div>
          <div class="value">${Math.floor(
            healthData.uptime / 60
          )}m ${Math.floor(healthData.uptime % 60)}s</div>
        </div>
        <div class="info-card">
          <div class="label">Response Time</div>
          <div class="value">${healthData.responseTime}</div>
        </div>
      </div>

      <div class="services">
        <h2>Service Health</h2>
        
        <!-- Database Service -->
        <div class="service-card">
          <div class="service-header">
            <div class="service-name">
              <div class="service-icon" style="background-color: ${statusColor(
                healthData.services.database.status
              )}">
                ${statusIcon(healthData.services.database.status)}
              </div>
              <span>Database (PostgreSQL)</span>
            </div>
            <div class="service-status" style="background-color: ${statusColor(
              healthData.services.database.status
            )}">
              ${healthData.services.database.status}
            </div>
          </div>
          <div class="service-details">
            <div class="service-detail">
              <strong>Response Time</strong>
              ${healthData.services.database.responseTime}
            </div>
            <div class="service-detail">
              <strong>Connection</strong>
              ${
                healthData.services.database.status === "healthy"
                  ? "Active"
                  : "Failed"
              }
            </div>
          </div>
          ${
            healthData.services.database.error
              ? `<div class="error-message">Error: ${healthData.services.database.error}</div>`
              : ""
          }
        </div>

        <!-- Redis Service -->
        <div class="service-card">
          <div class="service-header">
            <div class="service-name">
              <div class="service-icon" style="background-color: ${statusColor(
                healthData.services.redis.status
              )}">
                ${statusIcon(healthData.services.redis.status)}
              </div>
              <span>Redis Cache</span>
            </div>
            <div class="service-status" style="background-color: ${statusColor(
              healthData.services.redis.status
            )}">
              ${healthData.services.redis.status}
            </div>
          </div>
          <div class="service-details">
            <div class="service-detail">
              <strong>Response Time</strong>
              ${healthData.services.redis.responseTime}
            </div>
            <div class="service-detail">
              <strong>Connection</strong>
              ${
                healthData.services.redis.status === "disabled"
                  ? "Not Configured"
                  : healthData.services.redis.status === "healthy"
                  ? "Active"
                  : "Failed"
              }
            </div>
          </div>
          ${
            healthData.services.redis.error
              ? `<div class="error-message">Error: ${healthData.services.redis.error}</div>`
              : ""
          }
        </div>

        <!-- Server Service -->
        <div class="service-card">
          <div class="service-header">
            <div class="service-name">
              <div class="service-icon" style="background-color: ${statusColor(
                healthData.services.server.status
              )}">
                ${statusIcon(healthData.services.server.status)}
              </div>
              <span>Application Server</span>
            </div>
            <div class="service-status" style="background-color: ${statusColor(
              healthData.services.server.status
            )}">
              ${healthData.services.server.status}
            </div>
          </div>
          <div class="service-details">
            <div class="service-detail">
              <strong>Memory Used</strong>
              ${healthData.services.server.memory.used}
            </div>
            <div class="service-detail">
              <strong>Memory Total</strong>
              ${healthData.services.server.memory.total}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      Last checked: ${new Date(
        healthData.timestamp
      ).toLocaleString()} • Add ?format=json for JSON response
    </div>
  </div>
</body>
</html>
  `;

  res.status(dbStatus === "healthy" ? 200 : 503).send(html);
});

export default router;
