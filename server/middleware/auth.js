const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  // 1. Check for token in the Authorization header
  // Format: Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. If no token in header, check cookies (optional backup, but headers are preferred)
  // if (!token && req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // 3. If still no token, deny access
  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // 4. Verify the Access Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach user ID to the request object
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    // If token is expired, send a specific 401 message so frontend knows to call /refresh
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "token_expired" });
    }

    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { protect };

// const jwt = require("jsonwebtoken");

// const protect = (req, res, next) => {
//   // 1. Get token from cookies (cookies were parsed by cookie-parser in index.js)
//   const token = req.cookies.token;

//   // 2. Check if token exists
//   if (!token) {
//     return res.status(401).json({ message: "Not authorized, please login" });
//   }

//   try {
//     // 3. Verify token using your JWT_SECRET
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // 4. Add user id to the request object so future routes know who the user is
//     req.user = decoded;

//     next();
//   } catch (error) {
//     console.error("Auth Middleware Error:", error.message);
//     res.status(401).json({ message: "Token is not valid" });
//   }
// };

// module.exports = { protect };
