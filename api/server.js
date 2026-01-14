/**
 * Vercel Serverless API Handler
 * 將所有請求轉發到 backend Express app
 * 
 * @module api/server
 */

const app = require('../backend/index');

module.exports = app;
