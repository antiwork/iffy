export function isProtectedRoute(pathname: string, patterns: RegExp[] = [/^\/dashboard\/.+$/]): boolean {
  return patterns.some((pattern) => pattern.test(pathname));
}
