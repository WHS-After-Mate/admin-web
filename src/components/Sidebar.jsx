// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. 백엔드 인증 정보 및 로그인 사용자 상태 관리
  const [userInfo, setUserInfo] = useState({
    clinicName: '엠레드 클리닉',
    userName: '관리자',
    role: 'ADMIN',
  });

  // 컴포넌트 마운트 시 저장된 토큰/사용자 정보 로드
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserInfo({
          clinicName: parsed.clinicName || parsed.clinic_name || '엠레드 클리닉',
          userName: parsed.userName || parsed.name || '관리자',
          role: parsed.role || 'ADMIN',
        });
      } catch (err) {
        console.error('사용자 정보 파싱 실패:', err);
      }
    }
  }, []);

  // 2. 백엔드 로그아웃 핸들러
  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';
      const token = localStorage.getItem('token');

      // (선택) 백엔드 로그아웃 API 호출
      if (token) {
        await fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => { }); // 서버 로그아웃 실패하더라도 클라이언트 인증 정보 제거 진행
      }
    } finally {
      // 로컬 인증 토큰 및 정보 삭제 후 로그인 페이지 이동
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-title">
          WHS<br />AFTER MATE
          <span className="brand-sub">ADMIN DEMO</span>
        </div>
        <div>
          <ul className="nav-menu">
            <li>
              <Link
                to="/dashboard"
                className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                • 대시보드
              </Link>
            </li>
            <li>
              <Link
                to="/customer"
                className={`nav-item ${location.pathname === '/customer' ? 'active' : ''}`}
              >
                • 고객 관리
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 동적 사용자 프로필 영역 */}
      <div className="user-profile">
        <div className="user-info-wrap">
          <div className="user-name">
            <span className="status-dot"></span>
            {userInfo.clinicName}
          </div>
          <div className="user-role">
            {userInfo.userName} ({userInfo.role === 'ADMIN' ? '관리자 계정' : '일반 계정'})
          </div>
        </div>

        {/* 백엔드 연동 필수 요소: 로그아웃 버튼 */}
        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
          style={{
            marginTop: '12px',
            padding: '6px 12px',
            fontSize: '12px',
            color: '#888',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}