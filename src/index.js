/**
 * 启程项目API网关
 * 
 * 功能：
 * 1. 专业问答 - 学生提问，AI回答
 * 2. 择校推荐 - 根据分数/兴趣推荐学校
 * 3. 专业列表 - 返回热门专业数据
 * 4. 学校列表 - 返回学校数据
 */

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '启程API网关运行正常' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 启程API网关已启动: http://localhost:${PORT}`);
  console.log(`📋 可用接口:`);
  console.log(`   POST /api/chat      - AI问答`);
  console.log(`   POST /api/recommend - 择校推荐`);
  console.log(`   GET  /api/majors    - 专业列表`);
  console.log(`   GET  /api/universities - 学校列表`);
});