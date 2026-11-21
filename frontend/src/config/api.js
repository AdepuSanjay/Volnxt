// Dynamic API URL for Local Development & Vercel Deployment
export const API_BASE_URL = (() => {
  // 1. If explicit environment variable is set in Vercel or local .env
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // 2. Browser runtime environment detection
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // Localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Deployed production environment (Vercel)
    return 'https://volnxt-nbof.vercel.app';
  }

  return 'http://localhost:5000';
})();

export default API_BASE_URL;
