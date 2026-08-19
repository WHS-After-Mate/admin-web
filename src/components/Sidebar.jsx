// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentBrandColor } from '../utils/getBrandColor';
import './Sidebar.css';

// 계정 ID → 한글 브랜드명 매핑
const BRAND_NAME_MAP = {
  derna: '더나 클리닉',
  amred: '엠레드 클리닉',
  wim: '윔 클리닉',
};

function getBrandDisplayName(brandOrUsername) {
  const key = (brandOrUsername || '').toLowerCase().trim();
  if (key.includes('derna') || key.includes('더나')) return BRAND_NAME_MAP.derna;
  if (key.includes('amred') || key.includes('엠레드')) return BRAND_NAME_MAP.amred;
  if (key.includes('wim') || key.includes('윔')) return BRAND_NAME_MAP.wim;
  return brandOrUsername || '클리닉';
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. 백엔드 인증 정보 및 로그인 사용자 상태 관리
  const [userInfo, setUserInfo] = useState({
    clinicName: '클리닉',
    userName: '관리자',
    role: 'ADMIN',
  });

  // 컴포넌트 마운트 시 저장된 토큰/사용자 정보 로드
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const brand = localStorage.getItem('brand');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const brandKey = brand || parsed.brand || parsed.username || parsed.clinicName || '';
        setUserInfo({
          clinicName: getBrandDisplayName(brandKey),
          userName: parsed.userName || parsed.name || parsed.username || '관리자',
          role: parsed.role || 'ADMIN',
        });
      } catch (err) {
        console.error('사용자 정보 파싱 실패:', err);
      }
    } else if (brand) {
      setUserInfo((prev) => ({ ...prev, clinicName: getBrandDisplayName(brand) }));
    }
  }, []);

  // 2. 백엔드 로그아웃 핸들러
  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;

    // confirm 닫힌 후 잔여 포커스 해제
    if (document.activeElement) {
      document.activeElement.blur();
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';
      const token = localStorage.getItem('token');

      if (token) {
        await fetch(`${baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => { });
      }
    } finally {
      // 모든 세션 데이터 제거
      localStorage.clear();

      // DOM 렌더링 완료 후 안전하게 페이지 이동
      await new Promise((resolve) => requestAnimationFrame(resolve));
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
            <span className="status-dot" style={{ backgroundColor: getCurrentBrandColor() }}></span>
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
