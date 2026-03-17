// server/db.js
const { Pool } = require("pg");
require("dotenv").config();

// Initialize the connection pool using the string from your .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // This helps prevent connection timeouts
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listener to confirm connection
pool.on("connect", () => {
  console.log("✅ Successfully connected to the PostgreSQL database");
});

// Event listener for errors
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle database client", err);
  process.exit(-1);
});

// We export a helper function called 'query'
// This allows us to use db.query() in other files
module.exports = {
  query: (text, params) => pool.query(text, params),
};
