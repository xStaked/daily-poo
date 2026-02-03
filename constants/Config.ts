// API URL from environment variable
// In development: set EXPO_PUBLIC_API_URL in .env file
// In production: set the environment variable in your build/hosting service

const getApiUrl = (): string => {
  // First check for environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback based on environment
  if (__DEV__) {
    return 'http://192.168.1.2:3001/api';
  }

  return 'https://api.ganasuperfacil.com/';
};

export const API_URL = getApiUrl();
