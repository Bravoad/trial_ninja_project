export function stripTrailingSlash(s: string) {
  return s.replace(/\/+$/, '');
}
export function getServerApiBase() {
  const base = process.env.SERVER_API_BASE;
  if (!base) throw new Error("SERVER_API_BASE is not set");
  return base.replace(/\/+$/, "");
}

export function getBrowserApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is not set");
  return base.replace(/\/+$/, "");
}