// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ onOpenTreatmentModal }) {
  const location = useLocation();

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
              <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                • 대시보드
              </Link>
            </li>
            <li>
              <Link to="/customer" className={`nav-item ${location.pathname === '/customer' ? 'active' : ''}`}>
                • 고객 관리
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="user-profile">
        <div className="user-name">
          <span className="status-dot"></span>
          엠레드 클리닉
        </div>
        <div className="user-role">관리자 계정</div>
      </div>
    </aside>
  );
}