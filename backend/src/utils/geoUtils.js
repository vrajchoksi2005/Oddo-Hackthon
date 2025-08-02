const { DEFAULT_SEARCH_RADIUS, MAX_SEARCH_RADIUS } = require('../config/constants');

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Validate coordinates
const validateCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }
  
  const [lng, lat] = coordinates;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

// Build MongoDB geo query using aggregation pipeline
const buildGeoQuery = (lat, lng, distance = DEFAULT_SEARCH_RADIUS) => {
  // Ensure distance is within limits
  const maxDistance = Math.min(distance, MAX_SEARCH_RADIUS);
  
  return {
    location: {
      $geoWithin: {
        $centerSphere: [
          [parseFloat(lng), parseFloat(lat)], 
          maxDistance / 6378100 // Convert meters to radians (Earth radius in meters)
        ]
      }
    }
  };
};

// Alternative: Build aggregation pipeline for $geoNear
const buildGeoAggregation = (lat, lng, distance = DEFAULT_SEARCH_RADIUS) => {
  const maxDistance = Math.min(distance, MAX_SEARCH_RADIUS);
  
  return [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true
      }
    }
  ];
};

// Generate bounding box for approximate area filtering
const getBoundingBox = (lat, lng, radiusInMeters) => {
  const earthRadius = 6371000; // Earth's radius in meters
  const latDelta = radiusInMeters / earthRadius * (180 / Math.PI);
  const lngDelta = radiusInMeters / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
};

// Convert address to coordinates (placeholder for geocoding service)
const geocodeAddress = async (address) => {
  // This is a placeholder. In production, you would use a service like:
  // - Google Maps Geocoding API
  // - OpenStreetMap Nominatim
  // - MapBox Geocoding API
  
  throw new Error('Geocoding service not implemented. Please provide coordinates.');
};

// Reverse geocode coordinates to address (placeholder)
const reverseGeocode = async (lat, lng) => {
  // This is a placeholder. In production, you would use a reverse geocoding service
  return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

module.exports = {
  calculateDistance,
  validateCoordinates,
  buildGeoQuery,
  buildGeoAggregation,
  getBoundingBox,
  geocodeAddress,
  reverseGeocode
};
