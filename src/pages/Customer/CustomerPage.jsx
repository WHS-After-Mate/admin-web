import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initialDashboardData } from '../../api/mockData';
import './CustomerPage.css';

export default function CustomerPage({
  onOpenModal,          // 관리 등록 모달 열기 함수
  onOpenCustomerModal,  // 신규 고객 등록 모달 열기 함수
  onOpenDetailModal,    // 고객 상세 모달 열기 함수
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // 1. mockData 안전하게 가져오기
  const customers = initialDashboardData?.recentCustomers || [];

  // 2. 검색어 필터링 (이메일 제외, 이름/전화번호/환자번호 기준)
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(term);
    const phoneMatch = c.phone?.includes(term);
    const patientNoMatch = c.patient_no?.toLowerCase().includes(term);

    return nameMatch || phoneMatch || patientNoMatch;
  });

  return (
    <div className="customer-container">
      {/* 상단 빵부스러기 (Breadcrumb) 영역 */}
      <div className="top-header">
        <span className="breadcrumb">고객 관리</span>
        <span className="admin-status">관리자 | 엠레드 클리닉</span>
      </div>

      {/* 페이지 헤더 & 등록 버튼 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">고객 관리</h1>
          <p className="page-subtitle">
            고객을 검색하고 관리 이력과 이용권을 확인합니다.
          </p>
        </div>
        {/* 신규 고객 등록 모달 열기 */}
        <button
          className="add-treatment-btn"
          onClick={onOpenCustomerModal}
        >
          + 신규 고객 등록
        </button>
      </div>

      {/* 검색 영역 */}
      <div className="search-wrapper">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="이름 또는 휴대폰 번호 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 전체 고객 목록 섹션 */}
      <div className="list-section">
        <h2 className="list-count">
          전체 고객 <span>{filteredCustomers.length}명</span>
        </h2>

        <div className="customer-list">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="customer-card">
              {/* 고객 기본 정보 */}
              <div className="customer-info">
                <h3>{customer.name}</h3>
                <p className="phone">{customer.phone}</p>
                <p className="email">{customer.email}</p>
              </div>

              {/* 클리닉 태그 */}
              <div className="clinic-badge-wrapper">
                <span className="clinic-badge">
                  <span className="dot">•</span>
                  {customer.clinic || '엠레드 클리닉'}
                </span>
              </div>

              {/* 최근 관리 정보 */}
              <div className="treatment-info">
                <span className="label">최근 관리</span>
                <span className="value">
                  {customer.lastTreatment || '울쎄라 리프팅'}
                </span>
                <span className="date">
                  {customer.lastDate || '2026-08-02 14시30분'}
                </span>
              </div>

              {/* 작업 버튼 2개 영역 */}
              <div className="action-wrapper">
                <button
                  className="detail-btn"
                  onClick={() => {
                    if (onOpenDetailModal) {
                      onOpenDetailModal(customer);
                    }
                  }}
                >
                  상세 보기
                </button>
                <button className="manage-btn" onClick={onOpenModal}>
                  관리 등록
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}