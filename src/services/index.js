/**
 * 服务层
 * - chat: AI问答（调用OpenClaw或智谱AI）
 * - recommend: 择校推荐算法
 * - getMajors: 专业数据查询
 * - getUniversities: 学校数据查询
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 智谱AI配置
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || 'c4c32871827f4f61885704a9c18878fd.kk4jmvYIbEC6NW6b';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 系统提示词（高考志愿填报专家）
const SYSTEM_PROMPT = `你是启程老师，一位高考志愿填报专家。你的任务是帮助学生选择适合的专业和学校。

回答风格：
- 用学生易懂的语言，不要太学术
- 给出具体建议，不要只说"需要综合考虑"
- 每次回答控制在200字以内
- 可以用例子说明（比如"小明选了计算机专业后..."）

专业领域：
- 了解740个本科专业的培养方向
- 了解985/211高校的特色和分数线
- 了解新高考3+3选科要求
- 了解就业前景和薪资水平`;

/**
 * AI问答
 */
async function chat(message, context = []) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context,
    { role: 'user', content: message }
  ];

  try {
    const response = await axios.post(ZHIPU_API_URL, {
      model: 'glm-4-flash',
      messages,
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      }
    });

    const reply = response.data.choices[0].message.content;
    
    return {
      reply,
      history: [
        ...context,
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      ]
    };
  } catch (error) {
    throw new Error('AI服务暂时不可用: ' + error.message);
  }
}

/**
 * 择校推荐
 * TODO: 实现基于分数、省份、兴趣的推荐算法
 */
async function recommend(score, province, interests) {
  // 简单示例：返回推荐学校列表
  const universities = await getUniversities();
  
  // 根据分数筛选（粗略）
  const filtered = universities.data
    .filter(u => u.minScore <= score + 20 && u.minScore >= score - 30)
    .slice(0, 5);
  
  return {
    score,
    province,
    interests,
    recommendations: filtered,
    tips: '这是基于你的分数初步筛选的学校，建议进一步咨询启程老师获取详细建议。'
  };
}

/**
 * 专业列表
 */
async function getMajors() {
  // 从数据文件读取
  const dataPath = path.join(__dirname, '../../data/majors-hot.json');
  
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return { total: data.length, data };
  }
  
  // 默认返回10个热门专业
  return {
    total: 10,
    data: [
      { code: '080901', name: '计算机科学与技术', category: '工学', hot: true },
      { code: '080701', name: '电子信息工程', category: '工学', hot: true },
      { code: '120201', name: '工商管理', category: '管理学', hot: true },
      { code: '020101', name: '经济学', category: '经济学', hot: true },
      { code: '050101', name: '汉语言文学', category: '文学', hot: true },
      { code: '030101', name: '法学', category: '法学', hot: true },
      { code: '100301', name: '临床医学', category: '医学', hot: true },
      { code: '070101', name: '数学与应用数学', category: '理学', hot: true },
      { code: '080601', name: '电气工程及其自动化', category: '工学', hot: true },
      { code: '120103', name: '会计学', category: '管理学', hot: true }
    ]
  };
}

/**
 * 学校列表
 */
async function getUniversities(level = 'all', province = null) {
  const dataPath = path.join(__dirname, '../../data/universities-985.json');
  
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    let filtered = data;
    if (level === '985') filtered = data.filter(u => u.level === '985');
    if (level === '211') filtered = data.filter(u => u.level === '211');
    if (province) filtered = filtered.filter(u => u.province === province);
    
    return { total: filtered.length, data: filtered.slice(0, 20) };
  }
  
  // 默认返回示例数据
  return {
    total: 5,
    data: [
      { name: '清华大学', level: '985', province: '北京', minScore: 680 },
      { name: '北京大学', level: '985', province: '北京', minScore: 680 },
      { name: '南开大学', level: '985', province: '天津', minScore: 630 },
      { name: '天津大学', level: '985', province: '天津', minScore: 625 },
      { name: '复旦大学', level: '985', province: '上海', minScore: 670 }
    ]
  };
}

module.exports = {
  chat,
  recommend,
  getMajors,
  getUniversities
};