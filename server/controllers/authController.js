const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Helper to create tokens and save refresh token to DB
const generateTokens = async (userId, res) => {
  // 1. Create short-lived Access Token (15 mins)
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // 2. Create long-lived Refresh Token (7 days)
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // 3. Save Refresh Token to Database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, refreshToken, expiresAt],
  );

  // 4. Send Refresh Token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return accessToken;
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExist = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userExist.rows.length > 0)
      return res.status(400).json({ message: "User exists" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hash],
    );

    // Generate tokens for immediate login after signup
    const accessToken = await generateTokens(newUser.rows[0].id, res);

    res.status(201).json({ user: newUser.rows[0], accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate tokens
    const accessToken = await generateTokens(user.rows[0].id, res);

    res.json({
      message: "Logged in",
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
      },
      accessToken, // Frontend keeps this in memory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // Remove from DB
  if (refreshToken) {
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
      refreshToken,
    ]);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

// const refresh = async (req, res) => {
//   const oldRefreshToken = req.cookies.refreshToken;

//   if (!oldRefreshToken)
//     return res.status(401).json({ message: "Refresh token missing" });

//   try {
//     // 1. Check if token exists in DB
//     const tokenResult = await db.query(
//       "SELECT * FROM refresh_tokens WHERE token = $1",
//       [oldRefreshToken],
//     );
//     if (tokenResult.rows.length === 0)
//       return res.status(403).json({ message: "Invalid refresh token" });

//     // 2. Verify JWT
//     const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);

//     // 3. STEP 4: ROTATION - Delete the old token so it can't be used again
//     await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
//       oldRefreshToken,
//     ]);

//     // 4. Generate brand new pair of tokens
//     const newAccessToken = await generateTokens(decoded.id, res);

//     res.json({ accessToken: newAccessToken });
//   } catch (err) {
//     res.status(403).json({ message: "Token expired or invalid" });
//   }
// };

// const refresh = async (req, res) => {
//   const oldRefreshToken = req.cookies.refreshToken;

//   if (!oldRefreshToken)
//     return res.status(401).json({ message: "Refresh token missing" });

//   try {
//     // 1. Check if token exists in DB
//     const tokenResult = await db.query(
//       "SELECT * FROM refresh_tokens WHERE token = $1",
//       [oldRefreshToken],
//     );

//     // If it's not in the DB, it's either expired or already used (Hacker attempt!)
//     if (tokenResult.rows.length === 0) {
//       // Clear the cookie anyway so the user has to log in again
//       res.clearCookie("refreshToken");
//       return res
//         .status(403)
//         .json({ message: "Invalid or already used refresh token" });
//     }

//     // 2. Verify JWT
//     const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);

//     // 3. ROTATION - Delete the old token IMMEDIATELY
//     // We 'await' this to ensure it's gone from the DB before we move on
//     await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
//       oldRefreshToken,
//     ]);

//     // 4. Generate brand new pair of tokens
//     const newAccessToken = await generateTokens(decoded.id, res);

//     res.json({ accessToken: newAccessToken });
//   } catch (err) {
//     console.error("Refresh Error:", err.message);
//     res.status(403).json({ message: "Token expired or invalid" });
//   }
// };

const refresh = async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    // 1. Check if token exists in DB
    const tokenResult = await db.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [oldRefreshToken],
    );

    // CRITICAL: If token is not in DB, someone is reusing an old/stolen token!
    if (tokenResult.rows.length === 0) {
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Token invalid or already used" });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);

    // 3. ROTATION: Delete the old token from the DB so it can NEVER be used again
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
      oldRefreshToken,
    ]);

    // 4. Generate brand new pair of tokens (This adds 1 NEW row to DB)
    const newAccessToken = await generateTokens(decoded.id, res);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    // If JWT is expired or malformed, clear the cookie
    res.clearCookie("refreshToken");
    res.status(403).json({ message: "Session expired, please login again" });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user.id comes from the protect middleware we'll update in Step 5
    const user = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.user.id],
    );
    if (user.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE your exports at the bottom of the file
module.exports = { register, login, logout, refresh, getMe };

// const db = require("../db");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// const register = async (req, res) => {
//   const { name, email, password } = req.body;
//   try {
//     const userExist = await db.query("SELECT * FROM users WHERE email = $1", [
//       email,
//     ]);
//     if (userExist.rows.length > 0)
//       return res.status(400).json({ message: "User exists" });

//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(password, salt);

//     const newUser = await db.query(
//       "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
//       [name, email, hash],
//     );
//     res.status(201).json(newUser.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// const login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await db.query("SELECT * FROM users WHERE email = $1", [
//       email,
//     ]);
//     if (user.rows.length === 0)
//       return res.status(401).json({ message: "Invalid credentials" });

//     const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
//     if (!isValid)
//       return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });

//     // Section 8: httpOnly cookie implementation
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 3600000, // 1 hour
//     });

//     res.json({
//       message: "Logged in",
//       user: { id: user.rows[0].id, name: user.rows[0].name },
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// const logout = (req, res) => {
//   res.clearCookie("token");
//   res.json({ message: "Logged out" });
// };

// const getMe = async (req, res) => {
//   try {
//     const user = await db.query(
//       "SELECT id, name, email, created_at FROM users WHERE id = $1",
//       [req.user.id],
//     );
//     res.json(user.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// // Update your module.exports to include getMe
// module.exports = { register, login, logout, getMe };
