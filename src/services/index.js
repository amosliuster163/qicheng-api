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
  // 从数据文件读取热门专业详情
  const dataPath = path.join(__dirname, '../../data/majors-hot-detail.json');
  
  if (fs.existsSync(dataPath)) {
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    // 转换为前端友好格式
    const data = raw.majors || raw.data || raw;
    return { total: data.length, data };
  }
  
  // 默认返回10个热门专业
  return {
    total: 10,
    data: [
      { code: '080901', name: '计算机科学与技术', category: '工学', description: '研究计算机系统设计与开发', employment: '软件工程师、系统架构师' },
      { code: '080701', name: '电子信息工程', category: '工学', description: '研究电子设备与信息系统', employment: '硬件工程师、通信工程师' },
      { code: '120201', name: '工商管理', category: '管理学', description: '研究企业管理与经营决策', employment: '企业管理、市场营销' },
      { code: '020101', name: '经济学', category: '经济学', description: '研究经济运行规律', employment: '金融分析师、经济研究员' },
      { code: '050101', name: '汉语言文学', category: '文学', description: '研究汉语与中国文学', employment: '编辑、教师、文案' },
      { code: '030101', name: '法学', category: '法学', description: '研究法律制度与实践', employment: '律师、法务、公务员' },
      { code: '100301', name: '临床医学', category: '医学', description: '培养临床医生', employment: '医院临床医师' },
      { code: '070101', name: '数学与应用数学', category: '理学', description: '研究数学理论与应用', employment: '数据分析师、教师' },
      { code: '080601', name: '电气工程及其自动化', category: '工学', description: '研究电力系统与自动化', employment: '电气工程师、自动化工程师' },
      { code: '120103', name: '会计学', category: '管理学', description: '研究财务会计与管理', employment: '会计师、财务经理' }
    ]
  };
}

/**
 * 学校列表
 */
async function getUniversities(level = 'all', province = null) {
  // 根据level选择数据文件
  let dataFile = 'universities-top100.json';
  if (level === '985') dataFile = 'universities-985.json';
  if (level === '211') dataFile = 'universities-211.json';
  if (province === '天津') dataFile = 'universities-tianjin.json';
  
  const dataPath = path.join(__dirname, '../../data', dataFile);
  
  // 添加调试信息
  const debug = {
    requestedLevel: level,
    requestedProvince: province,
    selectedFile: dataFile,
    filePath: dataPath,
    fileExists: fs.existsSync(dataPath)
  };
  
  if (fs.existsSync(dataPath)) {
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let data = raw.universities || raw.data || raw;
    
    // 筛选
    if (province && province !== '天津') {
      data = data.filter(u => u.province === province || u.city === province);
    }
    
    return { total: data.length, data: data.slice(0, 50), debug };
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
    ],
    debug
  };
}

module.exports = {
  chat,
  recommend,
  getMajors,
  getUniversities
};