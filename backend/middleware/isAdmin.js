const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Import the User model

// Middleware to check if the user is authenticated and an admin
const isAdmin = async (req, res, next) => {
  try {
    // Get token from the cookie
    const token = req.cookies.token;

    // If no token is provided
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by the decoded ID
    const user = await User.findById(decoded.id);
    
    // If user doesn't exist or is not an admin
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Attach user information to the request
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = isAdmin;
