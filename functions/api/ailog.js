// EdgeOne Pages边缘函数 - 护林员巡护日志生成API
export async function onRequest(context) {
  try {
    const { request } = context;
    const { searchParams } = new URL(request.url);

    const date = searchParams.get('date') || new Date().toLocaleDateString('zh-CN');
    const weather = searchParams.get('weather') || '晴朗';
    const wind = searchParams.get('wind') || '微风';
    const isMeeting = searchParams.get('isMeeting') === 'true';
    const isHoliday = searchParams.get('isHoliday') === 'true';
    const substituteName = searchParams.get('substituteName') || '';
    const isSubstitute = searchParams.get('isSubstitute') === 'true';
    const keywords = searchParams.get('keywords') || '';

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,DELETE,PUT,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers
      });
    }

    const logContent = await generateGuardLog(
      context,
      date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords
    );

    headers.set('Content-Type', 'application/json');

    return new Response(JSON.stringify({
      status: 'success',
      log: logContent
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message || '生成巡护日志失败'
    }), {
      status: 500,
      headers
    });
  }
}

function buildPrompt(date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords) {
  let systemPrompt = "你是一名护林员助手，负责根据提供的信息生成简洁、真实的护林员巡护日志。符合实际工作场景，字数控制在100字以内，通常30-50字左右。";

  let specialInstructions = "";

  if (isMeeting) {
    specialInstructions += "今日统一集中前往场部参加护林工作例会，集体进行政治思想教育学习。";
    return {
      systemPrompt,
      userPrompt: specialInstructions
    };
  }

  if (isHoliday) {
    systemPrompt += '如果公休，则只需说清楚由代班同事负责即可，无需写巡护内容。';
    specialInstructions += `今天轮我公休，我不在单位，管护区的巡护工作由同事${substituteName || '代班人员'}负责代班巡护，全权负责。`;
    return {
      systemPrompt,
      userPrompt: specialInstructions
    };
  }

  if (weather.includes('雨') || weather.includes('雪')) {
    specialInstructions += "今天因天气原因，未外出巡护，驻守管护站打扫卫生、进行政治思想学习。";
    return {
      systemPrompt,
      userPrompt: specialInstructions
    };
  }

  if (isSubstitute) {
    specialInstructions += `今日同事公休，我在完成自己管护区域巡护工作后，巡护了${substituteName || '同事'}的管护区域巡护工作。`;
  }

  let element = `
  日志可包含以下元素（不必同时出现）：
    - 巡护基本情况（如出发时间等）
    - 道路情况（通畅程度、是否有清理，可以写道路有枯枝落叶已及时清理打扫）
    - 林区状况（野生动物活动、异常情况等）
    - 特殊发现（如清理道路枯枝落叶）
    - 安全检查结果（无盗猎、无火灾隐患、无病虫害等）
    - 有无发现误野生动物活动的情况（如发现黄鼠狼、鹿、野兔、野鸡等）
    - 有无牛羊家畜放牧啃食林草的现象出现（只能写没有）
    - 有无发现盗猎、违法砍伐等非法行为（只能写没有）
  `;
  
  const month = (new Date(date)).getMonth() + 1
  if (month >= 12 || month <= 2) {
	  element += `
	  - 清理沿途道路积雪`
  }

  let keywordText = '';
  if (keywords) {
    keywordText = `关键词：${keywords}\n`;
  }

  const userPrompt = `
请根据以下信息生成一份护林员巡护日志：
日期：${date}
天气：${weather} ${wind}
${keywordText}${specialInstructions ? `特殊情况：${specialInstructions}\n` : ''}

${element}

以下提供一篇参考日志格式：
今日上午9时从管护站出发前往管区例行巡护，未见闲杂人员活动，无乱砍乱伐非法捕猎等违法行为，沿途道路通畅，未发现异常情况和森林火险隐患。

注意：请不要在日志中直接提及日期和天气信息。`;

  return { systemPrompt, userPrompt };
}

async function generateGuardLog(context, date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords) {
  try {
    const { systemPrompt, userPrompt } = buildPrompt(date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords);

    const API_KEY = context.env.HUNYUAN_API_KEY;
    if (!API_KEY) {
      throw new Error('API密钥未配置，请在EdgeOne Pages控制台设置HUNYUAN_API_KEY环境变量');
    }
    
    const API_ENDPOINT = context.env.HUNYUAN_API_ENDPOINT || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    const MODEL_NAME = context.env.HUNYUAN_MODEL || 'glm-4.7-flash';

    const requestBody = {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: false
    };

    console.log('GLM API Request:', { endpoint: API_ENDPOINT, model: MODEL_NAME });
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('GLM API Response Status:', response.status);
    
    if (!response.ok) {
      let errorBody = '';
      try {
        if (response.body) {
          errorBody = await response.text();
        }
      } catch (e) {
        console.error('读取错误响应体失败:', e);
      }
      
      console.error('GLM API Error:', errorBody);
      throw new Error(`API请求失败: ${response.status} ${response.statusText} ${errorBody}`);
    }
    
    const responseData = await response.json();
    console.log('GLM API Response Data:', JSON.stringify(responseData).substring(0, 500));
    
    if (!responseData.choices || responseData.choices.length === 0) {
      throw new Error('API返回数据格式不正确');
    }
    
    const content = responseData.choices[0].message?.content;
    if (!content) {
      throw new Error('API未返回内容');
    }
    
    return content.trim();
  } catch (error) {
    console.error('调用大模型失败:', error);
    throw error;
  }
}
