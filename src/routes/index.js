/**
 * API路由
 */

const express = require('express');
const router = express.Router();
const { chat, recommend, getMajors, getUniversities, getHighschools } = require('../services');

// AI问答接口
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const result = await chat(message, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 择校推荐接口
router.post('/recommend', async (req, res) => {
  try {
    const { score, province, interests } = req.body;
    const result = await recommend(score, province, interests);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 专业列表接口
router.get('/majors', async (req, res) => {
  try {
    const result = await getMajors();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 学校列表接口
router.get('/universities', async (req, res) => {
  try {
    const { level, province } = req.query;
    const result = await getUniversities(level, province);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 天津高中列表接口
router.get('/highschools', async (req, res) => {
  try {
    const { district } = req.query;
    const result = await getHighschools(district);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;