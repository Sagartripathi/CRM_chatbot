const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Get proxy URL from environment variable, fallback to localhost:8000
  const proxyUrl = process.env.REACT_APP_PROXY_URL || "http://localhost:8000";
  
  // Determine if target is HTTPS
  const isHttps = proxyUrl.startsWith("https://");
  
  console.log(`🔗 Proxy configuration: ${proxyUrl} (HTTPS: ${isHttps})`);

  app.use(
    "/api",
    createProxyMiddleware({
      target: proxyUrl,
      changeOrigin: true,
      secure: isHttps, // Use HTTPS validation only if target is HTTPS
      logLevel: "debug",
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying ${req.method} ${req.url} to ${proxyUrl}`);
      },
      onError: (err, req, res) => {
        console.error("Proxy error:", err);
        if (isHttps && err.code === 'CERT_HAS_EXPIRED') {
          console.error("SSL Certificate expired. Check your backend SSL configuration.");
        }
      },
    })
  );
};
