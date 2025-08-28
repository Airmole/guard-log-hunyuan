// EdgeOne Pages边缘函数 - 护林员巡护日志生成API
export async function onRequest(context) {
  try {
    // 1. 获取请求和参数
    const { request } = context;
    const { searchParams } = new URL(request.url);

    // 2. 提取请求参数
    const date = searchParams.get('date') || new Date().toLocaleDateString('zh-CN');
    const weather = searchParams.get('weather') || '晴朗';
    const wind = searchParams.get('wind') || '微风';
    const isMeeting = searchParams.get('isMeeting') === 'true';
    const isHoliday = searchParams.get('isHoliday') === 'true';
    const substituteName = searchParams.get('substituteName') || '';
    const isSubstitute = searchParams.get('isSubstitute') === 'true';
    const keywords = searchParams.get('keywords') || '';

    // 3. 处理预检请求和设置CORS头
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

    // 4. 调用大模型生成日志，获取流式响应
    const aiResponseStream = await generateGuardLog(
      context,
      date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords
    );

    // 5. 设置SSE响应头
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    // 6. 创建转换流，将AI响应转换为SSE格式
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          const chunkStr = decoder.decode(chunk, { stream: true });
          const lines = chunkStr.split('\n');
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(5));
                if (data.choices && data.choices.length > 0) {
                  const delta = data.choices[0].delta;
                  if (delta.content) {
                    fullResponse += delta.content;
                    // 以SSE格式实时发送增量数据
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'delta',
                      content: delta.content,
                      status: 'success'
                    })}\n\n`));
                  }
                }
                // 检查是否结束
                if (data.finish_reason === 'stop') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'end',
                    log: fullResponse.trim(),
                    status: 'success'
                  })}\n\n`));
                  controller.terminate();
                }
              } catch (e) {
                // 忽略解析错误的行
                console.error('解析流式数据错误:', e);
                continue;
              }
            }
          }
        } catch (e) {
          console.error('处理数据块错误:', e);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: '处理响应数据时发生错误',
            status: 'error'
          })}\n\n`));
          controller.close();
        }
      }
    });

    // 7. 返回转换后的SSE响应流
    return new Response(aiResponseStream.pipeThrough(transformStream), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    
    // 8. 错误处理 - 创建错误响应流
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: error.message || '生成巡护日志失败',
          status: 'error'
        })}\n\n`));
        controller.close();
      }
    });
    
    // 设置错误响应头
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(errorStream, {
      status: 500,
      headers
    });
  }
}

/**
 * 构建护林员日志生成提示词
 */
function buildPrompt(date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords) {
  // 系统提示词 - 定义角色和基本要求
  let systemPrompt = "你是一名护林员助手，负责根据提供的信息生成简洁、真实的护林员巡护日志。日志需口语化、符合实际工作场景，字数控制在100字以内，通常30-50字左右。";

  // 根据条件构建特殊提示
  let specialInstructions = "";

  // 处理会议情况
  if (isMeeting) {
    specialInstructions += "今日统一集中前往场部参加护林工作例会，集体进行政治思想教育学习。";
    return {
      systemPrompt,
      userPrompt: specialInstructions
    };
  }

  // 处理公休情况
  if (isHoliday) {
    systemPrompt += '如果公休，则只需说清楚由代班同事负责即可，无需写巡护内容。';
    specialInstructions += `今天轮我公休，管护区的巡护工作由同事${substituteName || '代班人员'}负责代班巡护，全权负责。`;
    return {
      systemPrompt,
      userPrompt: specialInstructions
    };
  }

  // 处理恶劣天气情况
  if (weather.includes('雨') || weather.includes('雪') || weather.includes('暴雨') || weather.includes('暴雪')) {
    specialInstructions += "今天因天气原因，未外出巡护，驻守管护站打扫卫生、进行政治思想学习。";
    return {
      systemPrompt,
      userPrompt: specialInstructions
    };
  }

  // 代班情况处理
  if (isSubstitute) {
    specialInstructions += `今日同事公休，我在完成自己管护区域巡护后，额外承担了${substituteName || '同事'}的管护区域巡护工作。`;
  }

  // 常规巡护提示
  let element = `
  日志可包含以下元素（不必同时出现）：
    - 巡护基本情况（如出发时间、路线等）
    - 道路情况（通畅程度、是否有清理）
    - 林区状况（野生动物活动、异常情况等）
    - 特殊发现（如清理道路枯枝落叶、冬季清理积雪等）
    - 安全检查结果（无盗猎、无火灾隐患、无病虫害等）
  `;

  // 添加关键词
  let keywordText = '';
  if (keywords) {
    keywordText = `关键词：${keywords}\n`;
  }

  // 构建完整用户提示词
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

/**
 * 调用腾讯云混元大模型API生成护林员巡护日志（使用OpenAI兼容接口，支持SSE流式返回）
 */
async function generateGuardLog(context, date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords) {
  try {
    // 1. 构建提示词
    const { systemPrompt, userPrompt } = buildPrompt(date, weather, wind, isMeeting, isHoliday, substituteName, isSubstitute, keywords);

    // 2. 腾讯云混元大模型API配置（OpenAI兼容接口）
    const API_KEY = context.env.HUNYUAN_API_KEY;
    if (!API_KEY) {
      throw new Error('API密钥未配置，请在EdgeOne Pages控制台设置HUNYUAN_API_KEY环境变量');
    }
    
    const API_ENDPOINT = context.env.HUNYUAN_API_ENDPOINT || 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
    const MODEL_NAME = context.env.HUNYUAN_MODEL || 'hunyuan-lite';

    // 3. 构建OpenAI兼容格式的请求参数（流式调用）
    const requestBody = {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,    // 限制生成字数
      temperature: 0.7,   // 控制生成内容的随机性
      top_p: 0.9,         // 控制生成内容的多样性
      n: 1,
      stream: true        // 启用流式返回
    };

    // 4. 发送API请求
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}` // OpenAI标准认证方式
      },
      body: JSON.stringify(requestBody),
      // EdgeOne Pages环境下的fetch配置
      cf: {
        cacheTtl: 0
      }
    });
    
    // 5. 处理API响应
    if (!response.ok) {
      // 尝试获取详细错误信息
      let errorBody = '';
      try {
        if (response.body) {
          errorBody = await response.text();
        }
      } catch (e) {
        console.error('读取错误响应体失败:', e);
      }
      
      throw new Error(`API请求失败: ${response.status} ${response.statusText} ${errorBody}`);
    }
    
    // 6. 验证响应体是否存在
    if (!response.body) {
      throw new Error('API返回空响应体');
    }
    
    return response.body;
  } catch (error) {
    console.error('调用混元大模型失败:', error);
    throw error;
  }
}