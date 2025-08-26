export async function onRequest(context) {
  let dataUrl = 'https://gist.githubusercontent.com/Airmole';
  dataUrl = dataUrl + '/4d44f4877017a9085f1a9c2a6fb4bf5d/raw/7bf071baf22ddd65f3d4f7c71535cee3d41fc013/guard-log.json';
  
  // 资源地址，也作为缓存键
  const request = new Request(dataUrl);
  // 缓存不存在，重新获取远程资源
  const response = await fetch(request);
  const json = await response.json();

  let result;
    let cursor;
    do {
        result = await guardlog_kv.list();
        cursor = result.cursor;
        for (let index = 0; index < result.keys.length; index++) {
            const keyname = result.keys[index].key;
            await guardlog_kv.delete(keyname);
        }
    } while (result && !result.complete);

  for (const month in json) {
    for (let index = 0; index < json[month].length; index++) {
        const day = json[month][index];
        await guardlog_kv.put(`clendar_${day.date}`, JSON.stringify(day))
    }
  }


  return new Response(JSON.stringify(json));
}