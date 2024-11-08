const jwt = require("jsonwebtoken");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1] || req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "No access token provided." });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired access token." });
  }
};

module.exports = authenticateToken;
