import axios from "axios";

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

export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = messageFrom(error.response?.data);
    if (serverMessage) return serverMessage;
    if (error.code === "ERR_NETWORK" || !error.response) return "Could not reach the server. Check your connection and try again.";
  }
  return messageFrom(error) ?? fallback;
};
