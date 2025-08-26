export async function onRequest(context) {
  const url = new URL(context.request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  let year;
  if (queryParams.year) {
    year = queryParams.year;
  } else {
    year = new Date().getFullYear();
  }

 
  let clendarData = [];
  let result;
  let cursor;
  do {
      result = await guardlog_kv.list({ "prefix": `clendar_${year}`, "limit": 200 });
      cursor = result.cursor;
      for (let index = 0; index < result.keys.length; index++) {
          const keyname = result.keys[index].key;
          const value = await guardlog_kv.get(keyname, 'json');
          clendarData.push(value);
      }
  } while (result && !result.complete);
  
  return new Response(JSON.stringify(clendarData), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,DELETE,PUT,OPTIONS",
      "content-type": "application/json",
    }
  });
}