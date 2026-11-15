#!/usr/bin/env node
// One-off collection of real Barcelona restaurants from OpenStreetMap.
// Usage: node scripts/fetch-osm.mjs > osm-raw.json
// The app never calls this at runtime. It reads src/data/restaurants.barcelona.json.
const query = `
[out:json][timeout:60];
node["amenity"="restaurant"]["name"]["cuisine"](41.370,2.140,41.412,2.200);
out body;`

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'course-prototype-data-collection' },
  body: 'data=' + encodeURIComponent(query),
})
if (!res.ok) throw new Error(`Overpass answered ${res.status}`)
const { elements } = await res.json()
const rows = elements.map((e) => ({
  osmId: e.id,
  name: e.tags.name,
  cuisine: e.tags.cuisine,
  lat: e.lat,
  lng: e.lon,
  street: e.tags['addr:street'] ?? null,
  vegetarian: e.tags['diet:vegetarian'] ?? null,
  vegan: e.tags['diet:vegan'] ?? null,
  glutenFree: e.tags['diet:gluten_free'] ?? null,
  website: e.tags.website ?? e.tags['contact:website'] ?? null,
}))
process.stdout.write(JSON.stringify(rows, null, 1))
