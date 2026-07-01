exports.handler = async (event) => {
  const params = event.queryStringParameters;
  const GKEY = process.env.GOOGLE_API_KEY;

  if (!GKEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing API key' }) };
  }

  try {
    const location = params.location;
    const radius = params.radius || '25000';
    const [lat, lng] = location.split(',');

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GKEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos'
      },
      body: JSON.stringify({
        includedTypes: ['lodging'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: parseFloat(radius)
          }
        }
      })
    });

    const data = await res.json();
    const results = (data.places || []).map(p => ({
      place_id: p.id,
      name: p.displayName?.text || '',
      vicinity: p.formattedAddress || '',
      rating: p.rating,
      user_ratings_total: p.userRatingCount,
      photos: p.photos?.map(ph => ({ photo_reference: ph.name })) || []
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ results, status: 'OK' }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
