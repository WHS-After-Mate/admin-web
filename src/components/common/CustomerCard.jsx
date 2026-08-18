import React from 'react';
import './CustomerCard.css';

/**
 * 전화번호 하이픈 포맷팅
 */
function formatPhone(phone) {
    if (!phone) return '-';
    const raw = phone.replace(/[^0-9]/g, '');
    if (raw.length === 11) return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    if (raw.length === 10) return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
    return phone;
}

/**
 * careRecords에서 최근 관리명/날짜 추출
 */
function getLatestCare(customer) {
    const records = Array.isArray(customer.careRecords) ? customer.careRecords : (customer.care_records || customer.treatments || customer.history || []);

    // 1순위: API에서 직접 내려오는 필드
    const directName = customer.latestCareName || customer.latest_care_name || customer.lastTreatment || customer.last_treatment;
    const directDate = customer.latestCareDate || customer.latest_care_date || customer.lastDate || customer.last_date;

    if (directName) {
        return { careName: directName, careDate: directDate || '-' };
    }

    // 2순위: careRecords에서 추출
    if (Array.isArray(records) && records.length > 0) {
        const sorted = [...records].sort((a, b) => {
            const dateA = a.careDate || a.care_date || '';
            const dateB = b.careDate || b.care_date || '';
            return dateB.localeCompare(dateA);
        });
        const latest = sorted[0];
        return {
            careName: latest.careName || latest.care_name || latest.treatmentName || latest.treatment_name || '관리 이력 있음',
            careDate: latest.careDate || latest.care_date || '-',
        };
    }

    return { careName: '관리 이력 없음', careDate: '-' };
}

/**
 * 공통 고객 카드 컴포넌트
 *
 * Props:
 * - customer: 고객 데이터 객체
 * - onOpenDetailModal: (customer) => void, 상세 보기 클릭 시 호출
 * - onRefreshData?: () => void, 상세 모달에 전달할 리프레시 콜백
 */
export default function CustomerCard({ customer, onOpenDetailModal, onRefreshData }) {
    const name = customer.name || '이름 없음';
    const phone = formatPhone(customer.phone || customer.phone_number || '');
    const patientNo = customer.patientNo || customer.patient_no || '-';
    const brand = customer.brand || customer.clinic || '-';

    const records = Array.isArray(customer.careRecords) ? customer.careRecords : (customer.care_records || customer.treatments || customer.history || []);
    const historyCount = customer.historyCount || customer.history_count || records.length || 0;
    const { careName, careDate } = getLatestCare(customer);

    const handleDetailClick = () => {
        if (onOpenDetailModal) {
            onOpenDetailModal(customer, onRefreshData);
        }
    };

    return (
        <div className="customer-card-common">
            {/* 고객 기본 정보 */}
            <div className="cc-personal">
                <h3 className="cc-name">{name}</h3>
                <p className="cc-phone">{phone}</p>
                <p className="cc-patient-no">{patientNo}</p>
            </div>

            {/* 관리 이력 배지 */}
            <div className="cc-badge-area">
                <span className="cc-badge">
                    <span className="cc-badge-dot"></span>
                    {historyCount > 0 ? `${historyCount}건의 관리 이력` : '관리 이력 없음'}
                </span>
            </div>

            {/* 최근 관리 정보 */}
            <div className="cc-treatment">
                <span className="cc-treatment-label">최근 관리</span>
                <strong className="cc-treatment-name">{careName}</strong>
                <span className="cc-treatment-date">{careDate}</span>
            </div>

            {/* 상세 보기 버튼 */}
            <div className="cc-action">
                <button
                    type="button"
                    className="cc-detail-btn"
                    onClick={handleDetailClick}
                >
                    상세 보기 →
                </button>
            </div>
        </div>
    );
}
