// Sanitize URLs to handle accidental trailing comments and protocol mismatch
const sanitizeUrl = (rawUrl, fallback) => {
  if (!rawUrl) return fallback;
  // Remove any trailing inline comments (e.g. " // comment" or " # comment")
  let url = rawUrl.replace(/\s+(\/\/|#).*$/, '').trim();
  if (!url) return fallback;

  // If connecting to localhost, ensure unencrypted ws:// or http:// is used
  if (url.startsWith('wss://localhost') || url.startsWith('wss://127.0.0.1')) {
    url = url.replace('wss://', 'ws://');
  } else if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
    url = url.replace('https://', 'http://');
  }
  return url;
};

export const API_BASE_URL = sanitizeUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8080/api');
export const WS_BASE_URL = sanitizeUrl(import.meta.env.VITE_WS_BASE_URL, 'ws://localhost:8080/ws');
