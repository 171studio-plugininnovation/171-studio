/**
 * Universal asset resolver for 171 Studio.
 * Handles subpath deployments like GitHub Pages (/171-studio/),
 * root deployments like Vercel & Netlify, and local dev environments.
 */
export function getAssetUrl(path?: string | null): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // Remove leading slash or dot-slash
  let clean = path.trim();
  if (clean.startsWith('./')) {
    clean = clean.slice(2);
  } else if (clean.startsWith('/')) {
    clean = clean.slice(1);
  }

  const rawBase = import.meta.env.BASE_URL || './';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${base}${clean}`;
}
