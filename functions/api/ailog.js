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
 * 调用腾讯云混元大模型API生成护林员巡护日志
 */
async function generateGuardLog(context, date, weather, wind, isMeeting, isHoliday, keywords) {
  try {
    // 构建提示词
    const prompt = `
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
    
    // 腾讯云混元大模型API配置
    const API_KEY = context.env.HUNYUAN_API_KEY; // 从环境变量获取API密钥
    const API_ENDPOINT = 'https://hunyuan.tencentcloudapi.com';
    const MODEL_NAME = 'hunyuan-lite'; // 混元大模型名称，根据实际情况选择
    
    // 构建API请求参数
    const requestBody = {
      Model: MODEL_NAME,
      Prompt: prompt,
      MaxTokens: 200, // 限制生成字数
      Temperature: 0.7, // 控制生成内容的随机性
      TopP: 0.9, // 控制生成内容的多样性
      StopSequences: []
    };
    
    // 生成签名（腾讯云API通常需要签名）
    // 注意：实际签名生成逻辑需要根据腾讯云官方文档实现
    // 这里简化处理，实际项目中需要按照腾讯云API签名规范生成
    
    // 发送API请求
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`, // 假设使用Bearer认证
        'X-TC-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'X-TC-Version': '2023-09-01',
        'X-TC-Region': 'ap-guangzhou'
      },
      body: JSON.stringify(requestBody)
    });
    
    // 处理API响应
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 解析返回结果（根据实际API返回格式调整）
    let generatedLog = '';
    if (data.Response && data.Response.Choices && data.Response.Choices.length > 0) {
      generatedLog = data.Response.Choices[0].Text.trim();
    } else if (data.result) {
      generatedLog = data.result.trim();
    } else {
      throw new Error('API返回格式不符合预期');
    }
    
    return generatedLog;
  } catch (error) {
    console.error('调用混元大模型失败:', error);
    throw new Error('生成巡护日志失败');
  }
}