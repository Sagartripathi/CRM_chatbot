const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Get proxy URL from environment variable, fallback to localhost:8000
  const proxyUrl = process.env.REACT_APP_PROXY_URL || "http://localhost:8000";

  app.use(
    "/api",
    createProxyMiddleware({
      target: proxyUrl,
      changeOrigin: true,
      secure: false,
      logLevel: "debug",
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying ${req.method} ${req.url} to ${proxyUrl}`);
      },
      onError: (err, req, res) => {
        console.error("Proxy error:", err);
      },
    })
  );
};
