export async function onRequest(context) {
  const url = new URL(context.request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  let year;
  if (queryParams.year) {
    year = queryParams.year;
  } else {
    year = new Date().getFullYear();
  }

  let keys = await guardlog_kv.list({ "prefix": `clendar_${year}`, "limit": 370 });

  let result = [];
  for (let index = 0; index < keys.keys.length; index++) {
    const key = keys.keys[index].key;
    const value = await guardlog_kv.get(key, 'json');
    result.push(value);
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,DELETE,PUT,OPTIONS",
      "content-type": "application/json",
    }
  });
}