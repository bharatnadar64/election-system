// Environment variables can be defined in a .env file at the project root
// using VITE_API_BASE_URL and VITE_WS_BASE_URL.
// We provide fallback defaults for local development.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws';
