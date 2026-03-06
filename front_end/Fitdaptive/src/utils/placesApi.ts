export const fetchNearbyGyms = async (latitude: number, longitude: number) => {
  const query = `
    [out:json];
    node["leisure"="fitness_centre"]
    (around:5000,${latitude},${longitude});
    out;
  `;

  const response = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    }
  );

  const data = await response.json();

  return data.elements.map((item: any) => ({
    id: item.id.toString(),
    name: item.tags?.name || "Gym",
    latitude: item.lat,
    longitude: item.lon,
  }));
};