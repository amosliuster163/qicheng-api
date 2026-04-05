/**
 * 服务层 - Vercel优化版本
 * 使用require加载JSON文件，确保Vercel正确打包
 */

const axios = require('axios');

// 智谱AI配置
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 系统提示词（高考志愿填报专家）
const SYSTEM_PROMPT = `你是启程老师，一位高考志愿填报专家。你的任务是帮助学生选择适合的专业和学校。

回答风格：
- 用学生易懂的语言，不要太学术
- 给出具体建议，不要只说"需要综合考虑"
- 每次回答控制在200字以内
- 可以用例子说明

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
 */
async function recommend(score, province, interests) {
  const universities = await getUniversities();
  
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
 * 专业列表 - 使用require加载JSON
 */
async function getMajors() {
  try {
    // require会自动处理路径，Vercel构建时会正确打包
    const raw = require('../data/majors-hot-detail.json');
    const data = raw.majors || raw.data || raw;
    return { total: data.length, data };
  } catch (e) {
    // 如果加载失败，返回默认数据
    return {
      total: 10,
      data: [
        { code: '080901', name: '计算机科学与技术', category: '工学', description: '研究计算机系统设计与开发' },
        { code: '080701', name: '电子信息工程', category: '工学', description: '研究电子设备与信息系统' },
        { code: '120201', name: '工商管理', category: '管理学', description: '研究企业管理与经营决策' },
        { code: '020101', name: '经济学', category: '经济学', description: '研究经济运行规律' },
        { code: '050101', name: '汉语言文学', category: '文学', description: '研究汉语与中国文学' },
        { code: '030101', name: '法学', category: '法学', description: '研究法律制度与实践' },
        { code: '100301', name: '临床医学', category: '医学', description: '培养临床医生' },
        { code: '070101', name: '数学与应用数学', category: '理学', description: '研究数学理论与应用' },
        { code: '080601', name: '电气工程及其自动化', category: '工学', description: '研究电力系统与自动化' },
        { code: '120103', name: '会计学', category: '管理学', description: '研究财务会计与管理' }
      ],
      error: e.message
    };
  }
}

/**
 * 学校列表 - 使用require加载JSON
 */
async function getUniversities(level = 'all', province = null) {
  try {
    // 根据参数选择数据文件
    let dataModule;
    if (province === '天津') {
      dataModule = require('../data/universities-tianjin.json');
    } else if (level === '985') {
      dataModule = require('../data/universities-985.json');
    } else if (level === '211') {
      dataModule = require('../data/universities-211.json');
    } else {
      dataModule = require('../data/universities-top100.json');
    }
    
    let data = dataModule.universities || dataModule.data || dataModule;
    
    // 筛选
    if (province && province !== '天津') {
      data = data.filter(u => u.province === province || u.city === province);
    }
    
    return { total: data.length, data: data.slice(0, 50) };
  } catch (e) {
    // 如果加载失败，返回默认数据
    return {
      total: 5,
      data: [
        { name: '清华大学', level: '985', province: '北京', minScore: 680 },
        { name: '北京大学', level: '985', province: '北京', minScore: 680 },
        { name: '南开大学', level: '985', province: '天津', minScore: 630 },
        { name: '天津大学', level: '985', province: '天津', minScore: 625 },
        { name: '复旦大学', level: '985', province: '上海', minScore: 670 }
      ],
      error: e.message
    };
  }
}

/**
 * 天津高中列表
 */
async function getHighschools(district = null) {
  try {
    const raw = require('../data/highschools-tianjin.json');
    let data = raw.highschools || raw.data || raw;
    
    // 筛选区域
    if (district) {
      data = data.filter(h => h.district === district);
    }
    
    return { total: data.length, data };
  } catch (e) {
    return {
      total: 5,
      data: [
        { name: '天津市第一中学', level: '市重点', district: '和平区', minScore: 560 },
        { name: '天津市南开中学', level: '市重点', district: '南开区', minScore: 555 },
        { name: '天津市耀华中学', level: '市重点', district: '和平区', minScore: 550 },
        { name: '天津市新华中学', level: '市重点', district: '河西区', minScore: 545 },
        { name: '天津市实验中学', level: '市重点', district: '河西区', minScore: 540 }
      ],
      error: e.message
    };
  }
}

/**
 * 天津初中列表（河西区）
 */
async function getMiddleschools(district = null) {
  try {
    const raw = require('../data/middleschools-hexi.json');
    let data = raw.middleschools || raw.data || raw;
    
    // 筛选区域
    if (district) {
      data = data.filter(m => m.district === district);
    }
    
    return { total: data.length, data };
  } catch (e) {
    return {
      total: 5,
      data: [
        { name: '天津市新华中学初中部', level: '区重点', district: '河西区', highschool_rate: '85%' },
        { name: '天津市实验中学初中部', level: '区重点', district: '河西区', highschool_rate: '80%' },
        { name: '天津市第四中学初中部', level: '区重点', district: '河西区', highschool_rate: '70%' },
        { name: '天津市第四十二中学初中部', level: '区重点', district: '河西区', highschool_rate: '65%' },
        { name: '天津市海河中学初中部', level: '区重点', district: '河西区', highschool_rate: '60%' }
      ],
      error: e.message
    };
  }
}

module.exports = {
  chat,
  recommend,
  getMajors,
  getUniversities,
  getHighschools,
  getMiddleschools
};