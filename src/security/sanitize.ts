const secretPatterns = [
  /0x[a-fA-F0-9]{64}/g,
  /(?:api[_-]?key|api[_-]?secret|private[_-]?key)\s*[:=]\s*\S+/gi,
  /(?:seed phrase|mnemonic)\s*[:=]\s*.+/gi,
];

export function redactSecrets(value: string): string {
  return secretPatterns.reduce(
    (result, pattern) => result.replace(pattern, "[REDACTED]"),
    value,
  );
}

export function sanitizeUntrustedText(value: string, max = 20_000): string {
  return redactSecrets(
    value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .slice(0, max),
  );
}
