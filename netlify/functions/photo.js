exports.handler = async (event) => {
  const { ref } = event.queryStringParameters;
  const GKEY = 'AIzaSyBEN934pP4ajrsTJnB1LcFQ26Fo6w1Ke-M';
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${GKEY}`;
  
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
