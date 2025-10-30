/**
 * Keep Alive Service
 * Pings the backend health endpoint every 10 minutes to prevent Render free tier from spinning down
 */

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const HEALTH_CHECK_URL = `${BACKEND_URL}/api/health`;
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

let pingInterval: NodeJS.Timeout | null = null;

/**
 * Ping the backend health endpoint
 */
async function pingBackend(): Promise<void> {
  try {
    const response = await fetch(HEALTH_CHECK_URL);
    if (response.ok) {
      console.log(
        `[KeepAlive] Backend health check successful at ${new Date().toISOString()}`
      );
    } else {
      console.warn(
        `[KeepAlive] Backend health check returned status ${response.status}`
      );
    }
  } catch (error) {
    console.error("[KeepAlive] Failed to ping backend:", error);
  }
}

/**
 * Start the keep-alive service
 */
export function startKeepAlive(): void {
  // Only start in production (not during development)
  if (process.env.NODE_ENV === "production" && !pingInterval) {
    console.log("[KeepAlive] Starting keep-alive service...");

    // Ping immediately
    pingBackend();

    // Then ping every 10 minutes
    pingInterval = setInterval(pingBackend, PING_INTERVAL);

    console.log(
      `[KeepAlive] Keep-alive service started (pinging every ${
        PING_INTERVAL / 1000 / 60
      } minutes)`
    );
  } else if (pingInterval) {
    console.log("[KeepAlive] Keep-alive service already running");
  } else {
    console.log("[KeepAlive] Keep-alive service disabled in development mode");
  }
}

/**
 * Stop the keep-alive service
 */
export function stopKeepAlive(): void {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log("[KeepAlive] Keep-alive service stopped");
  }
}
