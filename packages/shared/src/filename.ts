/**
 * Sanitize a string for use as a filename across Windows, Unix, and HTTP
 * Content-Disposition headers. Replaces any character that is not
 * alphanumeric, underscore, or hyphen with an underscore, then falls back
 * to "diagram" if the result is empty.
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-]/gi, "_").replace(/^_+|_+$/g, "") || "diagram";
}
