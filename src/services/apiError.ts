import axios from "axios";

const serverConnectionMessage =
  "We're having trouble connecting to our server right now. Please try again in a little while.";
const connectionFailurePattern =
  /ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND|ERR_NETWORK|NETWORK ERROR|FAILED TO FETCH|PROXY ERROR|CONNECTION REFUSED|SOCKET HANG UP|COULD NOT CONNECT|UNABLE TO CONNECT|SERVER NOT CONNECTED/i;

const messageFrom = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return undefined;
  const body = value as Record<string, unknown>;
  for (const key of ["message", "error", "detail", "title"]) {
    const message = messageFrom(body[key]);
    if (message) return message;
  }
  for (const key of ["errors", "fieldErrors", "violations"]) {
    const nested = body[key];
    if (Array.isArray(nested)) {
      const messages = nested.map(messageFrom).filter((item): item is string => !!item);
      if (messages.length) return messages.join(" ");
    }
    if (nested && typeof nested === "object") {
      const messages = Object.values(nested).map(messageFrom).filter((item): item is string => !!item);
      if (messages.length) return messages.join(" ");
    }
  }
  return undefined;
};

const isConnectionFailureMessage = (value: unknown): boolean =>
  typeof value === "string" && connectionFailurePattern.test(value);

const containsConnectionFailure = (value: unknown, seen = new Set<object>()): boolean => {
  if (isConnectionFailureMessage(value)) return true;
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some((nested) => containsConnectionFailure(nested, seen));
};

export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = messageFrom(error.response?.data);
    if (
      isConnectionFailureMessage(error.message) ||
      isConnectionFailureMessage(error.code) ||
      containsConnectionFailure(error.response?.data) ||
      error.code === "ECONNABORTED" ||
      !error.response
    ) {
      return serverConnectionMessage;
    }
    if (serverMessage) return serverMessage;
  }
  if (error instanceof Error && isConnectionFailureMessage(error.message)) {
    return serverConnectionMessage;
  }
  if (containsConnectionFailure(error)) return serverConnectionMessage;
  const message = messageFrom(error);
  return message ?? fallback;
};
