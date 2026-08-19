/**
 * API Fetch Wrapper
 * 
 * 모든 API 요청에서 최신 Bearer token을 자동으로 헤더에 포함합니다.
 * localStorage에서 즉시 읽으므로 로그인 직후에도 새 토큰이 적용됩니다.
 */

const getBaseUrl = () => import.meta.env.VITE_API_URL ?? '';

/**
 * 인증 헤더가 포함된 fetch 요청
 * @param {string} endpoint - API 경로 (예: '/api/v1/patients')
 * @param {RequestInit} options - fetch 옵션 (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
    const baseUrl = getBaseUrl();
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * 세션 초기화 — 모든 인증 관련 데이터 제거
 */
export function clearSession() {
    localStorage.clear();
}

/**
 * 현재 세션 정보 조회
 */
export function getSession() {
    return {
        token: localStorage.getItem('token'),
        username: localStorage.getItem('username'),
        brand: localStorage.getItem('brand'),
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    };
}

export default apiFetch;
