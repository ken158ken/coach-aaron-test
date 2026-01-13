const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

// 載入環境變數
dotenv.config();

// 環境變數驗證
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_KEY",
  "JWT_SECRET",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  console.error("Please create a .env file based on .env.example");
  process.exit(1);
}

// 路由
const authRoutes = require("./routes/auth");
const coursesRoutes = require("./routes/courses");
const videosRoutes = require("./routes/videos");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// 允許的 origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // 允許沒有 origin 的請求（如 Postman）
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API 路由
app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/admin", adminRoutes);

// 健康檢查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "伺服器錯誤" });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: "找不到該路由" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Supabase URL: ${process.env.SUPABASE_URL}`);
});
