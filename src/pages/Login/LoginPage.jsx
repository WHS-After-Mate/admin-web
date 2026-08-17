import React, { useState } from 'react';
import logoWhite from '../../assets/logo_white.png';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
// 1. 아이콘 라이브러리 import
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // 2. 비밀번호 보이기/숨기기 상태 추가 (기본값: false)
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // 비밀번호가 비어있는 경우
    if (!password) {
      setPasswordError('비밀번호를 입력하시오');
      return;
    } else {
      setPasswordError('');
    }

    // 로그인 성공 로직
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      {/* 왼쪽 검은색 영역 (원본 디자인 100% 동일) */}
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

      {/* 오른쪽 흰색 로그인 폼 영역 */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h2 className="login-title">관리자 로그인</h2>
          <p className="login-subtitle">앰레드 클리닉 데모 계정으로 시작합니다.</p>

          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="input-group">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                placeholder="admin@amredclinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">비밀번호</label>
              {/* 3. 비밀번호 input 영역을 wrapper로 감싸고 토글 버튼 추가 */}
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) {
                      setPasswordError('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="비밀번호 토글"
                >
                  {showPassword ? <EyeOff size={20} color="#0A0A0B" /> : <Eye size={20} color="#0A0A0B" />}
                </button>
              </div>
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>

            <button type="submit" className="login-btn">
              로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}