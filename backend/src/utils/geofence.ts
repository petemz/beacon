

/**
 * Geofencing service
 * Resolves raw lat/lng into a human-readable landmark name
 * using a pre-compiled dictionary of bounding boxes.
 *
 * All coordinates are for RCCG Camp Ground, Mowe, Ogun State.
 * Replace bounding boxes with real survey data before deployment.
 */

interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    name: string;
  }
  
  // Pre-compiled landmark registry — edit coords to match real camp layout
  const LANDMARKS: BoundingBox[] = [
    {
      name: "Main Arena",
      minLat: 6.8801,
      maxLat: 6.8840,
      minLng: 3.7210,
      maxLng: 3.7260,
    },
    {
      name: "Youth Centre",
      minLat: 6.8841,
      maxLat: 6.8870,
      minLng: 3.7210,
      maxLng: 3.7250,
    },
    {
      name: "Children's Pavilion",
      minLat: 6.8771,
      maxLat: 6.8800,
      minLng: 3.7220,
      maxLng: 3.7255,
    },
    {
      name: "Car Park A",
      minLat: 6.8760,
      maxLat: 6.8775,
      minLng: 3.7200,
      maxLng: 3.7245,
    },
    {
      name: "Car Park B",
      minLat: 6.8760,
      maxLat: 6.8775,
      minLng: 3.7250,
      maxLng: 3.7295,
    },
    {
      name: "Medical Centre",
      minLat: 6.8855,
      maxLat: 6.8875,
      minLng: 3.7255,
      maxLng: 3.7280,
    },
    {
      name: "Food Court",
      minLat: 6.8845,
      maxLat: 6.8860,
      minLng: 3.7260,
      maxLng: 3.7295,
    },
    {
      name: "Registration Booth",
      minLat: 6.8795,
      maxLat: 6.8810,
      minLng: 3.7200,
      maxLng: 3.7220,
    },
    {
      name: "Old Auditorium",
      minLat: 6.8810,
      maxLat: 6.8840,
      minLng: 3.7260,
      maxLng: 3.7300,
    },
  ];
  
  export function resolveLandmark(lat: number, lng: number): string {
    for (const landmark of LANDMARKS) {
      if (
        lat >= landmark.minLat &&
        lat <= landmark.maxLat &&
        lng >= landmark.minLng &&
        lng <= landmark.maxLng
      ) {
        return landmark.name;
      }
    }
    return "Unknown area";
  }
  
  export function getAllLandmarks(): Pick<BoundingBox, "name">[] {
    return LANDMARKS.map(({ name }) => ({ name }));
  }
  