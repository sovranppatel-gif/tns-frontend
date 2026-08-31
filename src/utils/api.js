// src/utils/api.js

const isLoopbackHostname = (host) =>
  host === "localhost" || host === "127.0.0.1";

const isIPv4Host = (host) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

/** True if URL string points at this machine only (wrong for phones on LAN). */
const envPointsAtLoopback = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const { hostname } = new URL(url.trim());
    return isLoopbackHostname(hostname);
  } catch {
    return false;
  }
};

const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // http: or https:

  const envApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  // Vite dev: talk to the same origin so /api and /uploads go through the proxy
  // (avoids Windows firewall / CORS / IPv6 localhost misses on port 3000).
  if (import.meta.env.DEV) {
    if (envApiUrl && !envPointsAtLoopback(envApiUrl)) {
      console.log("Using remote VITE_API_BASE_URL in dev:", envApiUrl);
      return envApiUrl;
    }
    console.log("Vite dev: using same-origin proxy for API");
    return "";
  }

  // Opening the Vite dev URL from another device (e.g. http://10.x.x.x:5174):
  // .env often has http://localhost:3000 — on the phone, "localhost" is the phone, not your PC.
  if (envApiUrl && envPointsAtLoopback(envApiUrl) && !isLoopbackHostname(hostname)) {
    const apiUrl = `${protocol}//${hostname}:3001`;
    console.log("LAN dev: backend on same host as frontend:", apiUrl);
    return apiUrl;
  }

  // 1️⃣ Highest priority: .env variable (production or explicit dev URL)
  if (envApiUrl) {
    console.log("Using VITE_API_BASE_URL from .env:", envApiUrl);
    return envApiUrl;
  }

  // 2️⃣ This machine only — backend on port 3000
  if (isLoopbackHostname(hostname)) {
    const apiUrl = "http://localhost:3001";
    console.log("Local development detected, using backend URL:", apiUrl);
    console.log("Frontend dev server port:", window.location.port);
    return apiUrl;
  }

  // Dev server opened by LAN IP; no .env — same host, backend port 3000
  if (isIPv4Host(hostname)) {
    const apiUrl = `${protocol}//${hostname}:3001`;
    console.log("LAN IP detected, using backend URL:", apiUrl);
    return apiUrl;
  }

  // Production / Hostinger deployment
  // Try subdomain first (api.example.com)
  if (hostname.startsWith("www.")) {
    const domain = hostname.replace("www.", "");
    return `${protocol}//api.${domain}`;
  }
  
  // If already on subdomain, use same subdomain
  if (hostname.includes(".") && !hostname.startsWith("api.")) {
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const domain = parts.slice(-2).join("."); // Get main domain
      return `${protocol}//api.${domain}`;
    }
  }

  // Fallback: same domain (if backend is on same domain)
  return `${protocol}//${hostname}`;
};

export const API_URL = getApiUrl();

// Debug logs (safe to keep during development)
console.log("API URL:", API_URL);
console.log("Current hostname:", window.location.hostname);

// Helper function to get token from localStorage
const getTokenFromStorage = () => {
  const TOKEN_KEY = "__bz_token__";
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    // Clean token if it has quotes or extra whitespace
    const cleanToken = token.trim().replace(/^["']|["']$/g, '');
    return cleanToken || null;
  }
  return null;
};

// Helper function to clean a token (removes quotes and trims whitespace)
export const cleanToken = (token) => {
  if (!token) return null;
  if (typeof token !== 'string') return token;
  const cleaned = token.trim().replace(/^["']|["']$/g, '');
  return cleaned || null;
};

// Helper function to create authenticated fetch options
export const getAuthHeaders = (token = null) => {
  const authToken = token || getTokenFromStorage();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

// Helper function for authenticated fetch requests
export const authenticatedFetch = async (url, options = {}) => {
  const token = getTokenFromStorage();
  
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }
  
  const headers = {
    ...getAuthHeaders(token),
    ...(options.headers || {}),
  };
  
  // Don't override Content-Type if it's already set (e.g., for FormData)
  if (options.headers && options.headers['Content-Type'] === undefined) {
    delete headers['Content-Type'];
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 errors - token expired or invalid
  if (response.status === 401) {
    // Clear auth data
    localStorage.removeItem('__bz_auth__');
    localStorage.removeItem('__bz_token__');
    // Redirect to login if we're not already there
    if (window.location.pathname !== '/master-admin') {
      window.location.href = '/master-admin';
    }
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
};