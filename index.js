const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Konfigurasi koneksi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Ganti sesuai user MySQL Anda
  password: "", // Ganti sesuai password MySQL Anda
  database: "telegram", // Ganti sesuai nama database Anda
});

// Cek koneksi MySQL
db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Endpoint root (cek server)
app.get("/", (req, res) => {
  res.send("API is running");
});

// Endpoint register/login
app.post("/register", (req, res) => {
  const { username, display_name, avatar_url } = req.body;

  // Validasi input
  if (!username || !display_name) {
    return res
      .status(400)
      .json({ message: "Username dan display_name wajib diisi" });
  }

  // Cek apakah username sudah ada
  const checkSql =
    "SELECT id, username, display_name, avatar_url, joined_at FROM tb_user WHERE username = ?";
  db.query(checkSql, [username], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("MySQL check error:", checkErr);
      return res
        .status(500)
        .json({ message: "Error database saat pengecekan", error: checkErr });
    }

    if (checkResults.length > 0) {
      // User sudah terdaftar → anggap sebagai login
      const existingUser = checkResults[0];
      return res.status(200).json({
        message: "Nomor sudah terdaftar, login berhasil",
        user: {
          id: existingUser.id,
          username: existingUser.username,
          display_name: existingUser.display_name,
          avatar_url: existingUser.avatar_url,
          joined_at: existingUser.joined_at,
        },
      });
    }

    // Jika user belum terdaftar → simpan baru
    const joinedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    const insertSql =
      "INSERT INTO tb_user (username, display_name, avatar_url, joined_at) VALUES (?, ?, ?, ?)";
    db.query(
      insertSql,
      [username, display_name, avatar_url || "", joinedAt],
      (insertErr, insertResult) => {
        if (insertErr) {
          console.error("MySQL insert error:", insertErr);
          return res
            .status(500)
            .json({ message: "Error saat menyimpan user", error: insertErr });
        }

        res.status(201).json({
          message: "User berhasil didaftarkan",
          user: {
            id: insertResult.insertId,
            username,
            display_name,
            avatar_url,
            joined_at: joinedAt,
          },
        });
      }
    );
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
