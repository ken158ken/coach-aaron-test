/**
 * Vercel Serverless API Handler
 * 將所有請求轉發到 backend Express app
 *
 * @module api/server
 */

import app from "../backend/dist/index.js";

export default app;
