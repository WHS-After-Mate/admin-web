import React, { useState, useEffect, useCallback } from 'react';
import CustomerCard from '../../components/common/CustomerCard';
import './DashboardPage.css';

export default function DashboardPage({
  onOpenCustomerModal,  // 신규 고객 등록 모달 열기
  onOpenDetailModal,    // 고객 상세 모달 열기
  onNavigateToCustomer, // 고객 관리 전체 페이지 이동
  refreshTrigger,       // 외부 데이터 갱신 트리거 (App 레벨)
}) {
  const baseUrl = import.meta.env.VITE_API_URL ?? '';

  // 통계 카드 상태
  const [visitStats, setVisitStats] = useState({
    yesterdayCount: 0,
    todayCount: 0,
    tomorrowCount: 0,
  });

  // 최근 고객 목록 상태
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVisitStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      const response = await fetch(`${baseUrl}/api/v1/visit-stats`, { headers });
      if (!response.ok) throw new Error(`visit-stats 응답 오류: ${response.status}`);
      const data = await response.json();

      setVisitStats({
        yesterdayCount: data.yesterday?.count ?? data.yesterdayCount ?? 0,
        todayCount: data.today?.count ?? data.todayCount ?? 0,
        tomorrowCount: data.tomorrow?.count ?? data.tomorrowCount ?? 0,
      });
    } catch (err) {
      console.error('방문 통계 조회 실패:', err);
    }
  }, [baseUrl]);

  const fetchRecentPatients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      const response = await fetch(`${baseUrl}/api/v1/patients`, { headers });
      if (!response.ok) throw new Error(`patients 응답 오류: ${response.status}`);
      const data = await response.json();

      const rawList = Array.isArray(data) ? data : data.patients || [];

      // created_at 최신순 정렬 후 상위 2개만 슬라이싱
      const sorted = [...rawList].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });

      setRecentCustomers(sorted.slice(0, 5));
    } catch (err) {
      console.error('최근 고객 조회 실패:', err);
    }
  }, [baseUrl]);

  // API 데이터 페칭 (마운트 시 및 외부 refreshTrigger 변경 시)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchVisitStats(), fetchRecentPatients()]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchVisitStats, fetchRecentPatients, refreshTrigger]);

  // Re-fetch 콜백 (TreatmentModal/CustomerDetailModal에서 호출용)
  const handleRefreshData = useCallback(async () => {
    await Promise.all([fetchVisitStats(), fetchRecentPatients()]);
  }, [fetchVisitStats, fetchRecentPatients]);

  return (
    <div className="dashboard-content">
      {/* 메인 헤더 영역: 신규 고객 등록 버튼으로 문구 변경 */}
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
          + 신규 고객 등록 
        </button>
      </div>

      {/* 3. 통계 요약 카드 3개 영역 (전날/금일/익일) */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="card-label">전날 신규 고객 수</span>
          <h2 className="card-value">{visitStats.yesterdayCount}<span className="card-unit">명</span></h2>
        </div>
        <div className="stat-card">
          <span className="card-label">금일 신규 고객 수</span>
          <h2 className="card-value">{visitStats.todayCount}<span className="card-unit">명</span></h2>
        </div>
        <div className="stat-card">
          <span className="card-label">익일 예약자 수</span>
          <h2 className="card-value">{visitStats.tomorrowCount}<span className="card-unit">명</span></h2>
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
          {isLoading ? (
            <div className="empty-card">데이터를 불러오는 중입니다...</div>
          ) : recentCustomers.length > 0 ? (
            recentCustomers.map((patient) => (
              <CustomerCard
                key={patient.id}
                customer={patient}
                onOpenDetailModal={onOpenDetailModal}
                onRefreshData={handleRefreshData}
              />
            ))
          ) : (
            <div className="empty-card">최근 등록된 고객이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
