export async function onRequestPost(context) {
  const queryParams = context.request.json()

  if (!queryParams.date || !queryParams.weather) return new Response('参数填写有误', { status: 400 });

  const keyname = `clendar_${queryParams.date.replace(/-/g, '_')}`
  const data = {
    date: queryParams.date,
    weather: queryParams.weather,
    wind: queryParams.wind,
    keyword: queryParams.keyword,
    event: queryParams.event,
  }

  await guardlog_kv.put(keyname, JSON.stringify(data))
  return new Response('保存成功', { status: 200 });
}