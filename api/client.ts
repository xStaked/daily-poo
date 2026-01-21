import { API_URL } from '@/constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Inject Bearer token
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('pooty_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle 401 (unauthorized)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear auth data
            await AsyncStorage.multiRemove(['pooty_user', 'pooty_token']);
            // The AuthContext will detect the missing user and redirect to login
        }
        return Promise.reject(error);
    }
);

export default apiClient;
