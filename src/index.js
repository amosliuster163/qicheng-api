/**
 * 启程项目API网关
 * Vercel Serverless版本
 */

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '启程API网关运行正常' });
});

// Vercel Serverless导出
module.exports = app;