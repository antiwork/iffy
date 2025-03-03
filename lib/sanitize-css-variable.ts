/**
 * Sanitizes a variable name by removing parentheses `()`
 * while keeping the rest of the string unchanged.
 *
 * @param {string} varName - The variable name containing parentheses.
 * @returns {string} - A sanitized variable name without `()`.
 */

const PARENTHESIS_REGEX = /[()]/g;

export function sanitizeCSSVariable(varName: string): string {
  return varName.replace(PARENTHESIS_REGEX, "");
}
