function safeRedirectPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return "/restaurants";
  }
  return from;
}

export { safeRedirectPath };
