// API URL from environment variable
// In development: set EXPO_PUBLIC_API_URL in .env file
// In production: set the environment variable in your build/hosting service

const getApiUrl = (): string => {
  let url = process.env.EXPO_PUBLIC_API_URL || 'https://api.ganasuperfacil.com/api';

  // Ensure it ends with /api (without double slashes)
  if (!url.endsWith('/api') && !url.endsWith('/api/')) {
    url = url.endsWith('/') ? `${url}api` : `${url}/api`;
  }

  return url;
};

export const API_URL = getApiUrl();
