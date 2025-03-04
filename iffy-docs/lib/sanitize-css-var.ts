const PARENTHESIS_REGEX = /[()]/g;

/**
 * Sanitizes a variable name by removing parentheses `()`
 * while keeping the rest of the string unchanged.
 *
 * @param {string} varName - The variable name containing parentheses.
 * @returns {string} - A sanitized variable name without `()`.
 */
export function sanitizeCSSVar(varName: string): string {
  return varName.replace(PARENTHESIS_REGEX, "");
}
