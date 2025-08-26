export async function onRequest(context) {
  let dataUrl = 'https://gist.githubusercontent.com/Airmole';
  dataUrl = dataUrl + '/4d44f4877017a9085f1a9c2a6fb4bf5d/raw/7bf071baf22ddd65f3d4f7c71535cee3d41fc013/guard-log.json';
  
  // 资源地址，也作为缓存键
  const request = new Request(dataUrl);
  // 缓存默认实例
  const cache = caches.default;
  
  let response = await cache.match(request);
  // 缓存不存在，重新获取远程资源
  if (!response) response = await fetch(request);
  const json = response.json()

  for (const month in json) {
    for (let index = 0; index < json[month].length; index++) {
        const day = json[month][index];
        await guardlog_kv.put(`clendar${day.date}`, JSON.stringify(day))
    }
  }


  return new Response("ok", {});
}