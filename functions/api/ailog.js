export async function onRequest(context) {
  // 获取请求参数
  const { request } = context;
  const { searchParams } = new URL(request.url);
  
  // 提取必要的参数
  const date = searchParams.get('date') || new Date().toLocaleDateString('zh-CN');
  const weather = searchParams.get('weather') || '晴朗';
  const wind = searchParams.get('wind') || '微风';
  const isMeeting = searchParams.get('isMeeting') === 'true';
  const isHoliday = searchParams.get('isHoliday') === 'true';
  const keywords = searchParams.get('keywords') || '';
  
  // 创建响应的ReadableStream对象
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 调用腾讯云混元大模型API
        const aiResponse = await generateGuardLog(
          context,
          date, weather, wind, isMeeting, isHoliday, keywords
        );
        
        // 以SSE格式发送数据
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          log: aiResponse,
          status: 'success'
        })}\n\n`));
      } catch (error) {
        // 发送错误信息
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          error: error.message || '生成巡护日志失败',
          status: 'error'
        })}\n\n`));
      } finally {
        // 结束流
        controller.close();
      }
    }
  });
  
  // 返回SSE响应
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,DELETE,PUT,OPTIONS'
    }
  });
}

/**
 * 调用腾讯云混元大模型API生成护林员巡护日志（使用OpenAI兼容接口）
 */
async function generateGuardLog(context, date, weather, wind, isMeeting, isHoliday, keywords) {
  try {
    // 构建提示词
    const systemPrompt = "你是一名护林员助手，负责根据提供的信息生成简洁的护林员巡护日志。";
    const userPrompt = `
请根据以下信息生成一份护林员巡护日志，字数控制在一百字以内：
日期：${date}
天气：${weather}
风力：${wind}
${isMeeting ? '当日有会议' : '当日无会议'}
${isHoliday ? '当日休假' : '当日正常工作'}
${keywords ? `活动关键字：${keywords}` : ''}

日志应包含：
- 日期和天气情况
- 巡护路线或区域
- 发现的情况（如无异常可写一切正常）
- 特殊事项（如有会议、休假等）
- 护林员签名（可虚拟）
`;
    
    // 腾讯云混元大模型API配置（OpenAI兼容接口）
    const API_KEY = context.env.HUNYUAN_API_KEY; // 从环境变量获取API密钥
    const API_ENDPOINT = context.env.HUNYUAN_API_ENDPOINT || 'https://api.hunyuan.tencentcloud.com/v1/chat/completions';
    const MODEL_NAME = context.env.HUNYUAN_MODEL || 'hunyuan-lite'; // 混元大模型名称
    
    // 构建OpenAI兼容格式的请求参数
    const requestBody = {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200, // 限制生成字数
      temperature: 0.7, // 控制生成内容的随机性
      top_p: 0.9, // 控制生成内容的多样性
      n: 1,
      stream: false
    };
    
    // 发送API请求（使用OpenAI兼容接口格式）
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}` // OpenAI标准认证方式
      },
      body: JSON.stringify(requestBody)
    });
    
    // 处理API响应
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 解析OpenAI格式的返回结果
    let generatedLog = '';
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      generatedLog = data.choices[0].message.content.trim();
    } else {
      throw new Error('OpenAI兼容接口返回格式不符合预期');
    }
    
    return generatedLog;
  } catch (error) {
    console.error('调用混元大模型失败:', error);
    throw new Error('生成巡护日志失败');
  }
}