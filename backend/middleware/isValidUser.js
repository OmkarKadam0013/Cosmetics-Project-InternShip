const jwt = require("jsonwebtoken");

// Authentication Middleware For User
const authenticateToken = (req, res, next) => {
  // Extract token from the cookie
  const token = req.cookies.token;
  // If token doesn't exist, return an error
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }
    // Verify the token using the secret key
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // If there's an error in verifying the token (invalid or expired)
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    // Attach the decoded user info to the request object
    req.user = user;

    // Pass control to the next middleware or route handler
    next();
  });
};

module.exports = authenticateToken;
