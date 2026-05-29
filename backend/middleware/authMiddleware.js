const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        error: "Access denied",
      });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verified;

    next();
  } catch (err) {
    res.status(403).json({
      error: "Invalid token",
    });
  }
};

module.exports = verifyToken;
