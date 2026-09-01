export function getHostEmails(): string[] {
  const raw = process.env.HOST_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isHostEmail(email: string): boolean {
  return getHostEmails().includes(email.trim().toLowerCase());
}
