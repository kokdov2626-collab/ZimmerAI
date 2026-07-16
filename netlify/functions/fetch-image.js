// netlify/functions/fetch-image.js
// מקבל ?url=<כתובת הנכס באתר המקור> ומחזיר {image: "..."} עם תמונת ה-og:image שלו (או null אם אין).
async function readHeadHtml(res, maxChars) {
  if (!res.body || !res.body.getReader) {
    // סביבה בלי תמיכה בזרימת קריאה - נופלים חזרה לקריאה מלאה
    return await res.text();
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let html = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
    if (html.length >= maxChars || /<\/head>/i.test(html)) break;
  }
  try { reader.cancel(); } catch (e) {}
  return html;
}

exports.handler = async (event) => {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'missing url' }) };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (!res.ok) {
      clearTimeout(timeout);
      return { statusCode: 200, body: JSON.stringify({ image: null }) };
    }
    // קוראים רק את חלק ה-head של העמוד (שם תגיות og:image תמיד נמצאות) - כך שעמודים
    // גדולים מאוד (למשל עם עשרות חוות דעת) לא גורמים לפסק זמן לפני שמצאנו את מה שצריך
    const html = await readHeadHtml(res, 250000);
    clearTimeout(timeout);
    let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
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
