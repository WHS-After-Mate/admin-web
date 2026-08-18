import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerPage.css';

export default function CustomerPage({
  onOpenModal,        // 관리 등록 모달 열기 함수
  onOpenCustomerModal, // 신규 고객 등록 모달 열기 함수
  onOpenDetailModal,  // 고객 상세 모달 열기 함수
}) {
  const navigate = useNavigate();

  // 1. 상태 관리 (고객 목록, 검색어, 로딩, 에러)
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';

  // 2. 백엔드 API 데이터 페칭 함수 (통합 및 정규화 버전)
  const fetchCustomers = async (query = '') => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // 검색어가 있는 경우와 없는 경우의 URL 처리 (API 명세 규격)
      const url = query
        ? `${baseUrl}/api/v1/patients?search=${encodeURIComponent(query)}`
        : `${baseUrl}/api/v1/patients`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const data = await response.json();

      // 백엔드 응답 필드명 정규화 (Snake Case & Camel Case 모두 안전하게 파싱)
      const rawList = Array.isArray(data) ? data : data.patients || data.customers || [];
      const normalizedList = rawList.map((c) => ({
        id: c.id || c.customer_id,
        name: c.name || '이름 없음',
        phone: c.phone || c.phone_number || '-',
        email: c.email || '-',
        patientNo: c.patientNo || c.patient_no || '-',
        clinic: c.clinic || c.clinic_name || '림프드 클리닉',
        lastTreatment: c.lastTreatment || c.last_treatment || '관리 내역 없음',
        lastDate: c.lastDate || c.last_date || '-',
      }));

      setCustomers(normalizedList);
    } catch (err) {
      console.error('고객 목록 불러오기 실패:', err);
      setError('고객 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 마운트 시 데이터 로드
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 4. 검색 입력 핸들러
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchCustomers(value);
  };

  // 5. 고객 상세 모달 오픈 핸들러
  const handleDetailClick = async (customer) => {
    try {
      const token = localStorage.getItem('token');

      // { ... } 대신 옵션 객체를 정확히 작성합니다.
      const response = await fetch(`${baseUrl}/api/v1/patients/${customer.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        const fullCustomerData = result.data || result.patient || result;
        onOpenDetailModal(fullCustomerData);
      } else {
        console.warn(`상세 조회 실패 (Status: ${response.status})`);
        onOpenDetailModal({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          patientNo: customer.patientNo,
          birth: '-',
          memo: '',
          reservations: [],
          history: [],
        });
      }
    } catch (err) {
      console.error('상세 데이터 조회 중 네트워크 에러:', err);
      onOpenDetailModal({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        patientNo: customer.patientNo,
        birth: '-',
        memo: '',
        reservations: [],
        history: [],
      });
    }
  };
  
  return (
    <div className="customer-container">
      {/* 상단 빵부스러기 (Breadcrumb) 영역 */}
      <div className="top-header">
        <span className="breadcrumb">고객 관리</span>
        <span className="admin-status">관리자 | 림프드 클리닉</span>
      </div>

      {/* 페이지 헤더 & 등록 버튼 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">고객 관리</h1>
          <p className="page-subtitle">
            고객을 검색하고 관리 이력과 이용권을 확인합니다.
          </p>
        </div>
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
          onChange={handleSearchChange}
        />
      </div>

      {/* 전체 고객 목록 섹션 */}
      <div className="list-section">
        <h2 className="list-count">
          전체 고객 <span>{customers.length}</span>명
        </h2>

        {/* 로딩 / 에러 / 데이터 목록 분기 처리 */}
        {isLoading ? (
          <div className="loading-state" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            고객 정보를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="error-state" style={{ padding: '40px', textAlign: 'center', color: '#ff4d4f' }}>
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            검색 결과에 해당하는 고객이 없습니다.
          </div>
        ) : (
          <div className="customer-list">
            {customers.map((customer) => (
              <div key={customer.id} className="customer-card">
                {/* 고객 기본 정보 */}
                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  <p className="phone">{customer.phone}</p>
                  <p className="patient-no">{customer.patientNo || customer.id}</p>
                </div>

                {/* 클리닉 태그 */}
                <div className="clinic-badge-wrapper">
                  <span className="clinic-badge">
                    <span className="dot"></span>
                    {/* 데이터에 historyCount가 있다면 사용하고, 없으면 기본값 처리 */}
                    {customer.historyCount ? `${customer.historyCount}건의 관리 이력` : '1건의 관리 이력'}
                  </span>
                </div>

                {/* 최근 관리 정보 */}
                <div className="treatment-info">
                  <span className="label">최근 관리</span>
                  <span className="value">{customer.lastTreatment}</span>
                  <span className="date">{customer.lastDate}</span>
                </div>

                {/* 작업 버튼 2개 영역 */}
                <div className="action-wrapper">
                  <button
                    className="detail-btn"
                    onClick={() => handleDetailClick(customer)}
                  >
                    상세 보기
                  </button>
                  <button
                    className="manage-btn"
                    onClick={() => {
                      if (onOpenModal) onOpenModal(customer);
                    }}
                  >
                    관리 등록
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}