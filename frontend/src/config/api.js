const BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
    BASE_URL,
    LOGIN: `${BASE_URL}/api/auth/login`,
    REGISTER: `${BASE_URL}/api/auth/register`,
    ADMIN_LOGIN: `${BASE_URL}/api/auth/admin/login`,
    POSTS: `${BASE_URL}/api/posts`,
    FRIENDS: `${BASE_URL}/api/friends`
};
