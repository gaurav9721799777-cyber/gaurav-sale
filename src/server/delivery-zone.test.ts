import { describe, expect, it } from "vitest";
import { assertWithinDeliveryZone, DeliveryZoneError, distanceInKm } from "./delivery-zone";

const shop = { latitude: 26.06201, longitude: 83.17904 };

describe("delivery distance", () => {
  it("returns zero for the same location", () => {
    expect(distanceInKm(shop, shop)).toBe(0);
  });

  it("measures a one-degree latitude change at about 111 km", () => {
    const distance = distanceInKm(
      { latitude: 26, longitude: 83 },
      { latitude: 27, longitude: 83 },
    );
    expect(distance).toBeGreaterThan(110);
    expect(distance).toBeLessThan(112);
  });

  it("accepts a location inside the 4 km radius", () => {
    expect(() => assertWithinDeliveryZone({ latitude: 26.05, longitude: 83.17 })).not.toThrow();
  });

  it("rejects a location outside 4 km", () => {
    expect(() => assertWithinDeliveryZone({ latitude: 26.1, longitude: 83.17 }))
      .toThrow(DeliveryZoneError);
  });

  it("rejects invalid coordinates", () => {
    expect(() => assertWithinDeliveryZone({ latitude: Number.NaN, longitude: 83.17 }))
      .toThrow("Confirm your delivery location");
  });
});