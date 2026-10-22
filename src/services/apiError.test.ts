import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { apiErrorMessage, isServerUnavailableError } from "./apiError";

describe("apiErrorMessage", () => {
  it("shows a safe recovery message for server errors without exposing response details", () => {
    const error = new AxiosError("Request failed with status code 503");
    Object.defineProperty(error, "response", {
      value: { status: 503, data: { message: "Internal database detail" } },
    });

    expect(isServerUnavailableError(error)).toBe(true);
    expect(apiErrorMessage(error, "Fallback")).toMatch(
      /trouble connecting to our server/i,
    );
    expect(apiErrorMessage(error, "Fallback")).not.toContain(
      "Internal database detail",
    );
  });

  it("keeps application errors such as not-found responses specific", () => {
    const error = new AxiosError("Request failed with status code 404");
    Object.defineProperty(error, "response", {
      value: { status: 404, data: { message: "Product not found." } },
    });

    expect(isServerUnavailableError(error)).toBe(false);
    expect(apiErrorMessage(error, "Fallback")).toBe("Product not found.");
  });
});
