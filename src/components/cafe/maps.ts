/** A maps search on the cafe's public pin (no street address, PRD section 2). */
export const mapsUrl = (c: { mapLat: number; mapLng: number }) =>
  `https://www.google.com/maps/search/?api=1&query=${c.mapLat},${c.mapLng}`;
