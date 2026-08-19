import React, { useState } from 'react';
import logoWhite from '../../assets/logo_white.png';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  // 1. email -> username으로 변경
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 에러 메시지 상태 관리
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 로그인 요청 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // 에러 상태 초기화
    setUsernameError('');
    setPasswordError('');

    let hasError = false;

    // 1. 아이디 입력 검사 (단순 필수값 체크)
    if (!username.trim()) {
      setUsernameError('아이디를 입력하시오.');
      hasError = true;
    }

    // 2. 비밀번호 입력 검사
    if (!password) {
      setPasswordError('비밀번호를 입력하시오.');
      hasError = true;
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';

      // 백엔드 로그인 API 호출
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 백엔드 명세에 맞추어 { username, password } 전송
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // 백엔드 에러 응답 처리 (401 INVALID_CREDENTIALS 등)
        if (response.status === 401 || data.error?.code === 'INVALID_CREDENTIALS') {
          setPasswordError('아이디 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setPasswordError(data.error?.message || '로그인에 실패했습니다.');
        }
        return;
      }

      // 로그인 성공 시 — 필수 필드 유효성 검증
      if (!data.token || !data.brand) {
        setPasswordError('올바르지 않은 클리닉 계정 정보입니다. 관리자에게 문의하세요.');
        localStorage.clear();
        return;
      }

      // 이전 세션 데이터를 완전히 초기화 (모든 키 제거)
      localStorage.clear();

      // 새 세션 인증 데이터 저장
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('brand', data.brand);
      localStorage.setItem('isLoggedIn', 'true');

      // 대시보드로 이동
      navigate('/dashboard');
    } catch (err) {
      console.error('로그인 요청 중 오류 발생:', err);
      setPasswordError('서버와의 통신에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      {/* 왼쪽 브랜딩 영역 */}
      <div className="login-left">
        <div className="brand-logo">
          <img src={logoWhite} alt="WHS AFTER MATE 로고" />
        </div>

        <div className="brand-content">
          <h1>
            관리 이후까지 <br />
            연결되는 운영 시스템
          </h1>
          <p>
            사업장 관리 완료 정보가 등록되면 고객 앱의 최근 관리, My Care 캐린더, 이<br />
            용권과 AI 사후관리 가이드가 즉시 업데이트되는 흐름을 재현합니다.
          </p>
        </div>

        <div className="brand-footer">CLINIC ADMIN DEMO</div>
      </div>

      {/* 오른쪽 로그인 폼 영역 */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h2 className="login-title">관리자 로그인</h2>
          <p className="login-subtitle">엠레드 클리닉 데모 계정으로 시작합니다.</p>

          <form onSubmit={handleLogin} className="login-form" noValidate>
            {/* 아이디 입력 그룹 */}
            <div className="input-group">
              <label htmlFor="username">아이디</label>
              <input
                id="username"
                type="text"
                placeholder="관리자 아이디를 입력하세요"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError('');
                }}
                disabled={isSubmitting}
              />
              {usernameError && <span className="error-message">{usernameError}</span>}
            </div>

            {/* 비밀번호 입력 그룹 */}
            <div className="input-group">
              <label htmlFor="password">비밀번호</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="비밀번호 토글"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#0A0A0B" />
                  ) : (
                    <Eye size={20} color="#0A0A0B" />
                  )}
                </button>
              </div>
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>

            {/* 로그인 제출 버튼 */}
            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
