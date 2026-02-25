/**
 * Widget Token Authentication Middleware
 * Validates base64-encoded tokens from the embed widget
 */
async function authenticateWidget(req, res, next) {
  const widgetToken = req.headers["x-widget-token"];

  if (!widgetToken) {
    return next(); // Let other auth methods handle it
  }

  try {
    // Decode the base64 token
    const decoded = JSON.parse(Buffer.from(widgetToken, "base64").toString());

    // Validate token structure
    if (!decoded.userId || !decoded.email) {
      return res.status(401).json({ error: "Invalid widget token" });
    }

    // Check expiration (tokens expire after 1 hour)
    if (decoded.exp && decoded.exp < Date.now()) {
      return res.status(401).json({ error: "Widget token expired" });
    }

    // Attach user info to request
    req.user = {
      _id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Widget auth error:", error);
    return res.status(401).json({ error: "Invalid widget token format" });
  }
}

export default authenticateWidget;
