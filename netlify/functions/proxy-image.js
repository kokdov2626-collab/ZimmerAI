// netlify/functions/proxy-image.js
// מקבל ?url=<כתובת תמונה חיצונית>, מוריד אותה בשרת, ומגיש אותה הלאה מהדומיין שלנו -
// כך הדפדפן אף פעם לא פונה ישירות לאתר החיצוני, ולא רלוונטי אם הוא חוסם hotlinking או לא.
exports.handler = async (event) => {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) {
    return { statusCode: 400, body: 'missing url' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': url
      }
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { statusCode: 502, body: 'upstream error' };
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800'
      },
      body: buf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 502, body: 'proxy error' };
  }
};
