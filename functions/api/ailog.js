export async function onRequest(context) {
  // 获取请求参数
  const { request } = context;
  const { searchParams } = new URL(request.url);

  // 提取必要的参数
  const date = searchParams.get('date') || new Date().toLocaleDateString('zh-CN');
  const weather = searchParams.get('weather') || '';
  const wind = searchParams.get('wind') || '';
  const isMeeting = searchParams.get('isMeeting') === 'true';
  const isHoliday = searchParams.get('isHoliday') === 'true';
  const substituteName = searchParams.get('substituteName') || '';
  const keywords = searchParams.get('keywords') || '';

  // 创建响应的ReadableStream对象
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 调用腾讯云混元大模型API
        const aiResponse = await generateGuardLog(
          context,
          date, weather, wind, isMeeting, isHoliday, substituteName, keywords
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
async function generateGuardLog(context, date, weather, wind, isMeeting, isHoliday, substituteName, keywords) {
  try {
    // 构建提示词
    const systemPrompt = "你是一名护林员助手，负责根据提供的信息生成简洁的护林员巡护日志。";

    // 根据条件构建特殊提示
    let specialInstructions = "";

    if (isHoliday && substituteName) {
      specialInstructions += `今天轮我公休，管护区的巡护工作由${substituteName}同事负责代班巡护。`;
    }

    if (weather.includes('雨') || weather.includes('雪')) {
      if (isMeeting) {
        specialInstructions += "统一集中前往场部参加护林工作例会，集体进行政治思想教育学习。";
      } else {
        specialInstructions += "今天是雨雪天气，不能外出巡护，驻守管护站打扫卫生、进行政治思想学习。";
      }
    }

    let element = "";
    if (!isMeeting) {
      element = `
      日志可以包含：
        - 发现的情况（建议写一切正常，偶尔可以写道路有枯枝落叶已及时清理打扫，如果日期是冬季12~2月可以写清理道路积雪）
        - 特殊事项（如有会议、休假、代班等）
        - 林区沿途道路是否通畅，路面平整情况、有无枯枝落叶动物粪便在路中央
        - 有无发现误野生动物活动的情况
        - 有无牛羊家畜放牧啃食林草的现象出现（只能写没有）
        - 有无发现盗猎、违法砍伐等非法行为
        - 未发现林木病虫害
        - 未发现火灾隐患
        以上描述元素不必同时出现，可以出现其中一个或多个，如果当日有护林工作例会，以上描述元素都不能出现
      `
    }

    const userPrompt = `
请根据以下信息生成一份护林员巡护日志，字数控制在一百字以内，二三十字左右：
日期：${date}
天气：${weather} ${wind}
${isMeeting ? '今日集体统一前往场部参加护林工作例会' : ''}
${isHoliday ? '今日休假' : ''}
${(isHoliday && substituteName) ? `代班同事：${substituteName}` : ''}
${keywords ? `${keywords}` : ''}
${specialInstructions ? `特殊要求：${specialInstructions}` : ''}

${element}

以下提供几篇日志供你参考：
今日上午9时从管护站出发前往管区例行巡护查看，未见闲杂人员活动，无乱砍乱伐非法捕猎等违法行为，沿途道路通畅，无盗猎等非法行为，未发现异常情况和森林火险隐患。

今日天有降雨，未外出巡护查看林区，学习了政治思想教育学习，做学习笔记摘录。

今日集中统一前往场部参加护林工作例会，听取近期工作总结及今后工作重点，接受集体思想教育学习。

最后要检查确保生成的日志与提供的日期、天气、是否休假代班，是否有会议等条件是否合理，如果不合理，重新生成。日志正文中不要出现具体日期、星期。
如果当天参加护林工作例会，则不要提及任何巡护相关的内容，只能写会议相关的内容。
`;

    // 腾讯云混元大模型API配置（OpenAI兼容接口）
    const API_KEY = context.env.HUNYUAN_API_KEY; // 从环境变量获取API密钥
    const API_ENDPOINT = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
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