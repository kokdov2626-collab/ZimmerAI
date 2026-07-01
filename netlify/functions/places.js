exports.handler = async (event) => {
  const params = event.queryStringParameters;
  const GKEY = 'AIzaSyBEN934pP4ajrsTJnB1LcFQ26Fo6w1Ke-M';
  
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
// Note: photo endpoint handled separately
