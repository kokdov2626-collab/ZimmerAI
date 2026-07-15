// netlify/functions/fetch-image.js
// מקבל ?url=<כתובת הנכס באתר המקור> ומחזיר {image: "..."} עם תמונת ה-og:image שלו (או null אם אין).
exports.handler = async (event) => {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'missing url' }) };
  }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZimmerAI-ImageBot/1.0)' }
    });
    if (!res.ok) {
      return { statusCode: 200, body: JSON.stringify({ image: null }) };
    }
    const html = await res.text();
    let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    const image = m ? m[1] : null;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
      body: JSON.stringify({ image })
    };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ image: null }) };
  }
};
