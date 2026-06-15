const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export const fetchNearbyGyms = async (latitude: number, longitude: number) => {
  const query = `[out:json][timeout:10];node["leisure"="fitness_centre"](around:5000,${latitude},${longitude});out;`;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const response = await fetch(mirror, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `data=${encodeURIComponent(query)}`,
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('json')) continue;

      const data = await response.json();
      return data.elements.map((item: any) => ({
        id: item.id.toString(),
        name: item.tags?.name || 'Gym',
        latitude: item.lat,
        longitude: item.lon,
      }));
    } catch (_) {
      continue;
    }
  }

  console.warn('All Overpass mirrors failed');
  return [];
};