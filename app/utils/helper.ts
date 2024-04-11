export function escapeFilterString (text: string) {
  return text.replace(/[%_]/g, (match: string) => `\\${match}`);
}
