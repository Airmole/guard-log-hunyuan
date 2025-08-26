export async function onRequest(context) {
  const url = new URL(context.request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  
  let year;
  if (queryParams.year) {
    year = queryParams.year;
  } else {
    year = new Date().getFullYear();
  }

  let dataUrl = 'https://gist.githubusercontent.com/Airmole';
  if (year == 2025) dataUrl = dataUrl + '/4d44f4877017a9085f1a9c2a6fb4bf5d/raw/7bf071baf22ddd65f3d4f7c71535cee3d41fc013/guard-log.json';
  
  // 资源地址，也作为缓存键
  const request = new Request(dataUrl);
  // 缓存默认实例
  const cache = caches.default;

  try {
    // 获取关联的缓存内容，缓存过，接口底层不主动回源，抛出 504 错误
    let response = await cache.match(request);
    // 缓存不存在，重新获取远程资源
    if (!response) return fetchData(context, request);
    // 命中缓存，设置响应头标识
    response.headers.append('x-edgefunctions-cache', 'hit');
    response.headers.append('Access-Control-Allow-Origin', '*');
    response.headers.append('Access-Control-Allow-Methods', 'GET,HEAD,POST,DELETE,PUT,OPTIONS');
    response.headers.append('Access-Control-Max-Age', '86400');
    return response;
  } catch (error) {
    await cache.delete(request);
    // 缓存过期或其他异常，重新获取远程资源
    return fetchData(context, request);
  }
}

async function fetchData(context, request) {
  const cache = caches.default;
  // 缓存没有命中，回源并缓存
  let response = await fetch(request);

  // 在响应头添加 Cahe-Control，设置缓存时长 10m
  response.headers.append('Cache-Control', 's-maxage=600');
  context.waitUntil(cache.put(request, response.clone()));

  // 未命中缓存，设置响应头标识
  response.headers.append('x-edgefunctions-cache', 'miss');
  response.headers.append('Access-Control-Allow-Origin', '*');
  response.headers.append('Access-Control-Allow-Methods', 'GET,HEAD,POST,DELETE,PUT,OPTIONS');
  response.headers.append('Access-Control-Max-Age', '86400');
  return response;
}