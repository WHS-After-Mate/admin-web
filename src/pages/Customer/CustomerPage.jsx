import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentBrandColor } from '../../utils/getBrandColor';
import './CustomerPage.css';

/**
 * careRecords에서 최근 관리명/날짜를 추출하는 유틸
 */
function getLatestCareFromRecords(careRecords) {
  if (!Array.isArray(careRecords) || careRecords.length === 0) {
    return { latestCareName: null, latestCareDate: null };
  }
  // 날짜 최신순 정렬
  const sorted = [...careRecords].sort((a, b) => {
    const dateA = a.careDate || a.care_date || '';
    const dateB = b.careDate || b.care_date || '';
    return dateB.localeCompare(dateA);
  });
  const latest = sorted[0];
  return {
    latestCareName: latest.careName || latest.care_name || latest.treatmentName || null,
    latestCareDate: latest.careDate || latest.care_date || null,
  };
}

export default function CustomerPage({
  onOpenModal,        // 관리 등록 모달 열기 함수
  onOpenCustomerModal, // 신규 고객 등록 모달 열기 함수
  onOpenDetailModal,  // 고객 상세 모달 열기 함수
  refreshTrigger,     // 외부 데이터 갱신 트리거 (App 레벨)
}) {
  const navigate = useNavigate();

  // 1. 상태 관리 (고객 목록, 검색어, 로딩, 에러)
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL ?? '';

  // 2. 백엔드 API 데이터 페칭 함수 (통합 및 정규화 버전)
  const fetchCustomers = useCallback(async (query = '') => {
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
      const normalizedList = rawList.map((c) => {
        // careRecords fallback: latestCareName이 없으면 careRecords에서 추출
        const careRecords = Array.isArray(c.careRecords) ? c.careRecords : (c.care_records || []);
        const reservations = Array.isArray(c.reservations) ? c.reservations : [];
        const { latestCareName, latestCareDate } = getLatestCareFromRecords(careRecords);

        // 최근 관리명: 백엔드 직접 필드 또는 careRecords에서 추출
        const resolvedCareName = c.latestCareName || c.latest_care_name || c.lastTreatment || c.last_treatment || latestCareName || '';
        const lastTreatment = resolvedCareName || '관리 내역 없음';
        const lastDate = c.lastDate || c.last_date || c.latestCareDate || c.latest_care_date || latestCareDate || '-';

        // 관리 이력 건수: 백엔드 count 필드 → 배열 길이 → latestCareName 존재 여부로 판단
        const totalFromArrays = careRecords.length + reservations.length;
        let historyCount = c.historyCount ?? c.history_count ?? c.total_care_count ?? c.totalCareCount ?? c.care_count ?? null;
        if (historyCount === null || historyCount === undefined) {
          historyCount = totalFromArrays > 0 ? totalFromArrays : (resolvedCareName ? 1 : 0);
        }

        return {
          id: c.id || c.customer_id,
          name: c.name || '이름 없음',
          phone: c.phone || c.phone_number || '-',
          email: c.email || '-',
          patientNo: c.patientNo || c.patient_no || '-',
          clinic: c.clinic || c.clinic_name || '림프드 클리닉',
          memo: c.notes || c.memo || c.note || '',
          lastTreatment,
          lastDate,
          historyCount,
          careRecords,
          reservations,
        };
      });

      setCustomers(normalizedList);

      // 각 고객의 상세 API를 비동기로 호출하여 정확한 관리 이력 건수 업데이트
      normalizedList.forEach(async (customer) => {
        if (!customer.id) return;
        try {
          const detailRes = await fetch(`${baseUrl}/api/v1/patients/${customer.id}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          if (!detailRes.ok) return;
          const detailData = await detailRes.json();

          // 응답 구조 정규화: careRecords가 상위/하위 어디에 있든 추출
          let detail;
          if (detailData.data) {
            detail = detailData.data;
          } else if (detailData.patient) {
            detail = {
              ...detailData.patient,
              careRecords: detailData.patient.careRecords || detailData.careRecords || detailData.care_records || [],
              reservations: detailData.patient.reservations || detailData.reservations || [],
            };
          } else {
            detail = detailData;
          }

          const records = Array.isArray(detail.careRecords) ? detail.careRecords : (detail.care_records || []);
          const reservs = Array.isArray(detail.reservations) ? detail.reservations : [];
          const actualCount = records.length + reservs.length;

          // 항상 업데이트 (0건도 포함 — 이전 fallback '1' 값을 덮어씀)
          setCustomers((prev) =>
            prev.map((c) => c.id === customer.id ? { ...c, historyCount: actualCount, careRecords: records, reservations: reservs } : c)
          );
        } catch (e) {
          // 개별 실패는 무시
        }
      });
    } catch (err) {
      console.error('고객 목록 불러오기 실패:', err);
      setError('고객 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // 마운트 시 데이터 로드
  // 마운트 시 및 외부 refreshTrigger 변경 시 데이터 로드
  useEffect(() => {
    fetchCustomers(searchTerm);
  }, [fetchCustomers, refreshTrigger]);

  // Re-fetch 콜백 (TreatmentModal/CustomerDetailModal에서 호출용)
  const handleRefreshData = useCallback(() => {
    fetchCustomers(searchTerm);
  }, [fetchCustomers, searchTerm]);

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

      const response = await fetch(`${baseUrl}/api/v1/patients/${customer.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        // 응답 구조 정규화
        let fullCustomerData;
        if (result.data) {
          fullCustomerData = result.data;
        } else if (result.patient) {
          fullCustomerData = {
            ...result.patient,
            careRecords: result.patient.careRecords || result.careRecords || result.care_records || [],
            reservations: result.patient.reservations || result.reservations || [],
          };
        } else {
          fullCustomerData = result;
        }

        // notes를 모든 가능한 위치에서 추출
        if (!fullCustomerData.notes && !fullCustomerData.memo) {
          fullCustomerData.notes = result.notes || result.memo || result.patient?.notes || result.patient?.memo || customer.notes || customer.memo || '';
        }
        onOpenDetailModal(fullCustomerData, handleRefreshData);
      } else {
        console.warn(`상세 조회 실패 (Status: ${response.status})`);
        onOpenDetailModal({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          patientNo: customer.patientNo,
          birth: '-',
          memo: '',
          careRecords: [],
        }, handleRefreshData);
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
        careRecords: [],
      }, handleRefreshData);
    }
  };
  
  return (
    <div className="customer-container">
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
                  <span className={`clinic-badge${customer.historyCount > 0 ? ' clinic-badge--active' : ''}`}>
                    <span
                      className="dot"
                      style={{ backgroundColor: getCurrentBrandColor() }}
                    ></span>
                    {customer.historyCount > 0 ? `${customer.historyCount}건의 관리 이력` : '관리 이력 없음'}
                  </span>
                </div>

                {/* 최근 관리 정보 */}
                <div className="treatment-info">
                  <span className="label">최근 관리</span>
                  <span className="value">{customer.lastTreatment}</span>
                  <span className="date">{customer.lastDate !== '-' ? customer.lastDate : ''}</span>
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
                      if (onOpenModal) onOpenModal(customer, handleRefreshData);
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
