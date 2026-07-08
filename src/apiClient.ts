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
  
  // Transform 'api/xxx' to 'api.php?route=xxx' to directly hit the api.php file
  // This completely bypasses any mod_rewrite/Apache .htaccess rules or subdirectory problems on Hostinger!
  if (cleanEndpoint.startsWith('api/')) {
    const apiPart = cleanEndpoint.substring(4); // remove 'api/'
    const questionMarkIndex = apiPart.indexOf('?');
    if (questionMarkIndex >= 0) {
      const route = apiPart.substring(0, questionMarkIndex);
      const query = apiPart.substring(questionMarkIndex + 1);
      return `${basePath}api.php?route=${route}&${query}`;
    } else {
      return `${basePath}api.php?route=${apiPart}`;
    }
  }
  
  // Return the resolved path
  return `${basePath}${cleanEndpoint}`;
}
