const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateTokens = async (userId, res) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, refreshToken, expiresAt],
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
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

    const accessToken = await generateTokens(user.rows[0].id, res);

    res.json({
      message: "Logged in",
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
      },
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
      refreshToken,
    ]);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

const refresh = async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const tokenResult = await db.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [oldRefreshToken],
    );

    if (tokenResult.rows.length === 0) {
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Token invalid or already used" });
    }

    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);

    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
      oldRefreshToken,
    ]);

    const newAccessToken = await generateTokens(decoded.id, res);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.clearCookie("refreshToken");
    res.status(403).json({ message: "Session expired, please login again" });
  }
};

const getMe = async (req, res) => {
  try {
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

module.exports = { register, login, logout, refresh, getMe };
