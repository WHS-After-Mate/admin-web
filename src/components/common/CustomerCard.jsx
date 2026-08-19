import React from 'react';
import { getCurrentBrandColor } from '../../utils/getBrandColor';
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
 * 담당자별 색상 점 컬러 맵
 * 미리 정의된 담당자명이 있으면 해당 색상을 반환하고,
 * 없으면 이름 해시값 기반으로 팔레트에서 동적 매핑
 */
const PRACTITIONER_COLOR_MAP = {
    admin: '#8b5cf6',      // 보라
    admin1: '#8b5cf6',     // 보라
    admin2: '#10b981',     // 초록
    admin3: '#f59e0b',     // 앰버
};

const COLOR_PALETTE = [
    '#6366f1', // 인디고
    '#8b5cf6', // 보라
    '#10b981', // 에메랄드
    '#f59e0b', // 앰버
    '#ef4444', // 레드
    '#06b6d4', // 시안
    '#ec4899', // 핑크
    '#14b8a6', // 틸
];

export function getPractitionerColor(practitioner) {
    if (!practitioner) return '#8da4f7'; // 기본 파랑

    const key = String(practitioner).toLowerCase().trim();

    // 미리 정의된 매핑 확인
    if (PRACTITIONER_COLOR_MAP[key]) {
        return PRACTITIONER_COLOR_MAP[key];
    }

    // 문자열 해시 기반 팔레트 매핑
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0; // 32bit int
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
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
 * 관리 이력 건수 계산
 */
function getCareCount(customer) {
    const records = Array.isArray(customer.careRecords) ? customer.careRecords : (customer.care_records || customer.treatments || customer.history || []);
    return customer.totalCareCount || customer.total_care_count || customer.historyCount || customer.history_count || records.length || 0;
}

/**
 * 담당 관리자/의료진 추출
 */
function getPractitioner(customer) {
    return customer.practitioner || customer.doctor || customer.doctorName || customer.doctor_name || customer.admin || customer.assignedTo || customer.assigned_to || null;
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

    const historyCount = getCareCount(customer);
    const { careName, careDate } = getLatestCare(customer);
    const brandColor = getCurrentBrandColor();

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
                <span
                    className={`cc-badge ${historyCount > 0 ? 'cc-badge--active' : ''}`}
                    style={historyCount > 0 ? { backgroundColor: `${brandColor}22` } : undefined}
                >
                    <span
                        className="cc-badge-dot"
                        style={{ backgroundColor: brandColor }}
                    ></span>
                    {historyCount > 0 ? `${historyCount}건의 관리` : '관리 이력 없음'}
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
