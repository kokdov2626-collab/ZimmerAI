// netlify/functions/fetch-image.js
// מקבל ?url=<כתובת הנכס באתר המקור> ומחזיר {image: "..."} עם תמונה אמיתית של הנכס (או null אם אין).
// קודם מנסים תגית og:image / twitter:image (התקן הרגיל). אם האתר לא מגדיר אותן בכלל
// (כמו rrr.co.il, שיש לו תמונות אמיתיות בעמוד אך בלי meta tags) - נופלים חזרה לתמונת
// התוכן הראשונה שנראית אמיתית (לא לוגו/אייקון/פיקסל מעקב) בגוף העמוד עצמו.

function extractImage(html) {
  let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (m) return m[1];

  if (!/<\/head>/i.test(html)) return null; // עדיין לא הגענו לגוף העמוד - אין טעם לחפש כבר

  const imgs = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  if (!imgs) return null;
  for (const tag of imgs) {
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) continue;
    const src = srcMatch[1];
    if (!/^https?:\/\//i.test(src)) continue; // מתעלמים מנתיבים יחסיים, פשוט יותר ובטוח יותר
    if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)) continue;
    if (/logo|icon|sprite|pixel|blank|favicon|1x1|loader|placeholder|doubleclick|googletagmanager|star\.png|phone1?\.png/i.test(src)) continue;
    return src;
  }
  return null;
}

async function readSmartHtml(res, maxChars) {
  if (!res.body || !res.body.getReader) {
    return await res.text();
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let html = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
    if (html.length >= maxChars) break;
    if (extractImage(html)) break;
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
    const html = await readSmartHtml(res, 400000);
    clearTimeout(timeout);
    const image = extractImage(html);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
      body: JSON.stringify({ image })
    };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ image: null }) };
  }
};
