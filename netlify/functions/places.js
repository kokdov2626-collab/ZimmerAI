exports.handler = async (event) => {
  const params = event.queryStringParameters;
  const GKEY = process.env.GOOGLE_API_KEY;

  if (!GKEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing API key' }) };
  }

  let url;
  if (params.pagetoken) {
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${params.pagetoken}&key=${GKEY}`;
  } else {
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
      + `?location=${params.location}`
      + `&radius=${params.radius}`
      + `&keyword=${encodeURIComponent(params.keyword)}`
      + `&language=iw&key=${GKEY}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
