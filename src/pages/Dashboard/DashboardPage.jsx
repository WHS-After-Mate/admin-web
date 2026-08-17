import React from 'react';
import './DashboardPage.css';

import { initialDashboardData } from '../../api/mockData';

export default function DashboardPage({
  onOpenCustomerModal,  // 신규 고객 등록 모달 열기
  onOpenDetailModal,    // 고객 상세 모달 열기
  onNavigateToCustomer, // 고객 관리 전체 페이지 이동
}) {
  const dashboardData = initialDashboardData || {};
  const recentCustomers = dashboardData.recentCustomers || [];

  return (
    <div className="dashboard-content">
      {/* 1. 최상단 영역: Breadcrumb 및 관리자 상태 */}
      <div className="dashboard-top-bar">
        <span className="breadcrumb">대시보드</span>
        <div className="user-status">
          관리자 <span className="status-dot"></span>
        </div>
      </div>

      {/* 2. 메인 헤더 영역: 신규 고객 등록 버튼으로 문구 변경 */}
      <div className="dashboard-header">
        <div>
          <h1 className="main-title">오늘의 운영 현황</h1>
          <p className="sub-title">
            고객 등록과 앱 반영 상태를 한눈에 확인합니다.
          </p>
        </div>
        <button
          type="button"
          className="add-btn"
          onClick={onOpenCustomerModal}
        >
          + 신규 고객 등록  {/* 👈 문구 수정 완료 */}
        </button>
      </div>

      {/* 3. 통계 요약 카드 3개 영역 (전날/금일/익일) */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="card-label">전날 방문 고객</span>
          <h2 className="card-value">{dashboardData.yesterdayCount ?? 12}</h2>
        </div>
        <div className="stat-card">
          <span className="card-label">금일 방문 고객</span>
          <h2 className="card-value">{dashboardData.todayCount ?? 7}</h2>
        </div>
        <div className="stat-card">
          <span className="card-label">익일 예약 고객</span>
          <h2 className="card-value">{dashboardData.tomorrowCount ?? 8}</h2>
        </div>
      </div>

      {/* 4. 최근 고객 목록 섹션 */}
      <div className="recent-section">
        <div className="recent-header">
          <h2 className="section-title">최근 고객</h2>
          <button
            type="button"
            className="view-all-btn"
            onClick={onNavigateToCustomer}
          >
            전체 보기 →
          </button>
        </div>

        <div className="customer-card-list">
          {recentCustomers.length > 0 ? (
            recentCustomers.map((customer) => (
              <div key={customer.id} className="customer-row-card">
                <div className="cust-personal">
                  <h3 className="cust-name">{customer.name}</h3>
                  <p className="cust-phone">{customer.phone}</p>
                  <p className="cust-email">{customer.email}</p>
                </div>

                <div className="cust-badge-area">
                  <span className="clinic-badge">
                    <span className="badge-dot"></span>
                    {customer.clinic || 'AMRED CLINIC'}
                  </span>
                </div>

                <div className="cust-treatment">
                  <span className="treatment-label">최근 관리</span>
                  <strong className="treatment-name">
                    {customer.lastTreatment || '울쎄라 리프팅'}
                  </strong>
                  <span className="treatment-date">
                    {customer.lastDate || '2026-08-02'}
                  </span>
                </div>

                <div className="cust-action">
                  <button
                    type="button"
                    className="detail-btn"
                    onClick={() => onOpenDetailModal && onOpenDetailModal(customer)}
                  >
                    상세 보기 →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-card">최근 등록된 고객이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}