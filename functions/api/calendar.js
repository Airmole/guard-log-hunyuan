export async function onRequest(context) {
  const url = new URL(context.request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  
  let month;
  if (queryParams.month) {
    month = queryParams.month;
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = now.getMonth() + 1;
    month = `${year}-${monthNum.toString().padStart(2, '0')}`;
  }
  
  let result = [];

  const mockData = 'https://gist.githubusercontent.com/Airmole/4d44f4877017a9085f1a9c2a6fb4bf5d/raw/7bf071baf22ddd65f3d4f7c71535cee3d41fc013/guard-log.json';
  const response = await fetch(mockData);
  const json = await response.json();
  
  // 返回包含query参数和month值的响应
  return new Response(JSON.stringify(json), {
    headers: {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET,HEAD,POST,DELETE,PUT,OPTIONS",
		"Access-Control-Max-Age": "86400",
		"content-type": "application/json",
    },
  });
}
