const shopLocation = { latitude: 26.0992797, longitude: 83.2317422 };

const deliveryRadiusKm = 4;
const earthRadiusKm = 6371.0088;

export type Coordinates = { latitude: number; longitude: number };

export class DeliveryZoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryZoneError";
  }
}

export function distanceInKm(start: Coordinates, end: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(end.latitude - start.latitude);
  const longitudeDelta = radians(end.longitude - start.longitude);
  const startLatitude = radians(start.latitude);
  const endLatitude = radians(end.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function assertWithinDeliveryZone(location: Coordinates) {
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) ||
    location.latitude < -90 || location.latitude > 90 ||
    location.longitude < -180 || location.longitude > 180) {
    throw new DeliveryZoneError("Confirm your delivery location to continue.");
  }

  const distance = distanceInKm(shopLocation, location);
  if (distance > deliveryRadiusKm) {
    throw new DeliveryZoneError("Delivery is currently available only within 4 km of our shop.");
  }
}