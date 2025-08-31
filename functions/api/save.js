export async function onRequest(context) {
    // 1. 获取请求和参数
  const { request } = context;
  const {searchParams} = new URL(request.url);

  if (!searchParams.get('date') || !searchParams.get('weather')) return new Response('参数填写有误', { status: 400 });

  const keyname = `clendar_${searchParams.get('date').replace(/-/g, '_')}`
  const data = {
    date: searchParams.get('date'),
    weather: searchParams.get('weather'),
    wind: searchParams.get('wind'),
    keyword: searchParams.get('keyword'),
    event: searchParams.get('event')
  }

  await guardlog_kv.put(keyname, JSON.stringify(data))
  return new Response('保存成功', { status: 200 });
}