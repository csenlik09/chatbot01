export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 2000).replace(/\0/g, '');
}

export function isValidMessage(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.length > 0 && trimmed.length <= 2000;
}
