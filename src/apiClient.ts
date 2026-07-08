/**
 * Hassala Gold & Saving App - API Client Helper
 * Helper to dynamically resolve API endpoints based on application host context (root vs subdirectory)
 */

export function getApiUrl(endpoint: string): string {
  const pathname = window.location.pathname;
  let basePath = '/';
  
  if (pathname.endsWith('/')) {
    basePath = pathname;
  } else {
    const lastSlash = pathname.lastIndexOf('/');
    if (lastSlash >= 0) {
      basePath = pathname.substring(0, lastSlash + 1);
    }
  }
  
  // Ensure endpoint doesn't start with a slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Return the resolved path
  return `${basePath}${cleanEndpoint}`;
}
