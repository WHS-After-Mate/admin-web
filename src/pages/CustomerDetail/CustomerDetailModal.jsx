import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import TreatmentModal from '../Treatment/TreatmentModal';
import './CustomerDetailModal.css';

/**
 * 전화번호 하이픈 포맷팅 유틸
 * "01012345678" → "010-1234-5678"
 */
function formatPhone(phone) {
    if (!phone) return '-';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    // 이미 하이픈이 포함되어 있거나 예외 케이스
    return phone;
}

export default function CustomerDetailModal({
    isOpen,
    onClose,
    customerData,
    onOpenTreatmentModal,
    onRefreshData,
}) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';

    const [patient, setPatient] = useState(null);
    const [patientDetail, setPatientDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [canceledReservations, setCanceledReservations] = useState({});

    // TreatmentModal 내부 관리
    const [showTreatmentModal, setShowTreatmentModal] = useState(false);

    // 모달이 열릴 때 API 호출로 최신 데이터 로드
    useEffect(() => {
        if (isOpen && customerData) {
            // 즉시 Props 데이터로 표시 (API 응답 대기 중에도 기본 정보 노출)
            setPatient(customerData);
            setPatientDetail(null);
            const patientId = customerData.id || customerData.patient_id || customerData.patientId;
            if (patientId) {
                fetchPatientDetail(patientId);
            }
            setCanceledReservations({});
        }
        if (!isOpen) {
            setPatient(null);
            setPatientDetail(null);
        }
    }, [isOpen, customerData]);

    const fetchPatientDetail = async (patientId) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/api/v1/patients/${patientId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                throw new Error(`환자 상세 조회 실패: ${response.status}`);
            }

            const data = await response.json();
            // 응답 구조 정규화:
            // Case 1: { data: { ...patient, careRecords: [...] } }
            // Case 2: { patient: { ... }, careRecords: [...] }
            // Case 3: { ...patient, careRecords: [...] } (플랫 구조)
            let resolved;
            if (data.data) {
                // data.data에 환자 정보가 래핑된 경우
                resolved = data.data;
            } else if (data.patient) {
                // 환자 기본 정보가 patient 키에 분리된 경우 — 상위 레벨의 careRecords/reservations 병합
                resolved = {
                    ...data.patient,
                    careRecords: data.patient.careRecords || data.careRecords || data.care_records || [],
                    reservations: data.patient.reservations || data.reservations || [],
                };
            } else {
                // 플랫 구조 (모든 필드가 최상위에 위치)
                resolved = data;
            }
            setPatient(resolved);
            setPatientDetail(resolved);
        } catch (error) {
            console.error('환자 상세 조회 오류:', error);
            // Fallback: customerData 그대로 유지 (이미 setPatient(customerData) 된 상태)
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // ─────────────────────────────────────────────
    // 데이터 매핑
    // ─────────────────────────────────────────────
    const detailData = patientDetail || customerData || {};

    const patientNo = detailData.patient_no || detailData.patientNo || '-';
    const name = detailData.name || '정보 없음';
    const phone = formatPhone(detailData.phone || detailData.phone_number || '');
    const birthDate = detailData.birth_date || detailData.birthDate || detailData.birth || '-';
    const memo = detailData.memo || '';
    const patientId = detailData.id || detailData.patient_id || detailData.patientId || '';

    // 백엔드 명세: careRecords (완료된 시술 기록)
    const careRecords = Array.isArray(detailData.careRecords)
        ? detailData.careRecords
        : (Array.isArray(detailData.care_records) ? detailData.care_records : (detailData.history || []));

    // 백엔드 명세: reservations (신규/예정 예약)
    const reservations = Array.isArray(detailData.reservations)
        ? detailData.reservations
        : [];

    // 날짜 문자열에서 YYYY-MM-DD (앞 10자리)만 안전하게 추출하는 헬퍼
    // "2026-08-19T14:30:00+09:00", "2026-08-19 14:30", "2026-08-19" 등 모든 포맷 대응
    const toDateOnly = (dateValue) => {
        if (!dateValue) return '';
        const str = String(dateValue).trim();
        // 앞 10자리가 YYYY-MM-DD 패턴이면 그대로 사용
        if (str.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(str)) {
            return str.slice(0, 10);
        }
        return str;
    };

    // KST(한국 시간) 기준 오늘 날짜 (YYYY-MM-DD)
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
    const today = `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-${String(kstTime.getDate()).padStart(2, '0')}`;

    // careRecords 중 오늘 이전(포함) 기록만 관리 내역으로 표시
    const history = careRecords
        .filter((rec) => {
            const careDate = toDateOnly(rec.careDate || rec.care_date || rec.performedAt || rec.performed_at);
            return careDate !== '' && careDate <= today;
        })
        .sort((a, b) => {
            const dateA = toDateOnly(a.careDate || a.care_date || a.performedAt || a.performed_at);
            const dateB = toDateOnly(b.careDate || b.care_date || b.performedAt || b.performed_at);
            return dateB.localeCompare(dateA); // 최신순
        });

    // reservations가 별도 배열이 없는 경우, careRecords에서 미래 날짜를 예약으로 분류 (폴백)
    const futureFromCareRecords = careRecords
        .filter((rec) => {
            const careDate = toDateOnly(rec.careDate || rec.care_date || rec.performedAt || rec.performed_at);
            return careDate !== '' && careDate > today;
        })
        .sort((a, b) => {
            const dateA = toDateOnly(a.careDate || a.care_date || a.performedAt || a.performed_at);
            const dateB = toDateOnly(b.careDate || b.care_date || b.performedAt || b.performed_at);
            return dateA.localeCompare(dateB);
        });

    // 최종 예약 목록: 백엔드에서 별도 reservations가 있으면 우선, 없으면 careRecords에서 미래분 활용
    const effectiveReservations = reservations.length > 0 ? reservations : futureFromCareRecords;

    // ─────────────────────────────────────────────
    // 회차 계산: 동일 careName 기준 누적 횟수 (날짜순 정렬 후 index 기반)
    // ─────────────────────────────────────────────
    const computeSessionIndex = (record, allRecords) => {
        const targetName = (record.careName || record.care_name || record.treatmentName || '').toLowerCase();
        if (!targetName) return { currentSession: 0, totalSessions: 0 };

        // 동일 careName의 레코드들을 날짜순(오래된 순)으로 정렬
        const sameName = allRecords
            .filter((r) => {
                const rName = (r.careName || r.care_name || r.treatmentName || '').toLowerCase();
                return rName === targetName;
            })
            .sort((a, b) => {
                const dateA = a.careDate || a.care_date || a.performedAt || a.performed_at || '';
                const dateB = b.careDate || b.care_date || b.performedAt || b.performed_at || '';
                return dateA.localeCompare(dateB);
            });

        const recordId = record.id || record.care_record_id || record.careRecordId;
        const idx = sameName.findIndex((r) => (r.id || r.care_record_id || r.careRecordId) === recordId);
        const totalSessions = record.totalSessions || record.total_sessions || sameName.length;

        return {
            currentSession: idx >= 0 ? idx + 1 : 1,
            totalSessions,
        };
    };

    // ─────────────────────────────────────────────
    // 예약 취소
    // ─────────────────────────────────────────────
    const handleCancel = async (recordId) => {
        if (!window.confirm('해당 예약을 정말 취소하시겠습니까?')) return;

        try {
            setIsDeleting(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`${baseUrl}/api/v1/care-records/${recordId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }

            setCanceledReservations((prev) => ({ ...prev, [recordId]: true }));
            alert('예약이 성공적으로 취소되었습니다.');

            if (onRefreshData) {
                await onRefreshData();
            }
            // 상세 데이터 다시 로드
            if (patientId) {
                fetchPatientDetail(patientId);
            }
        } catch (error) {
            console.error('예약 취소 중 오류 발생:', error);
            alert('예약 취소 처리에 실패했습니다. 백엔드 서버 상태를 확인해 주세요.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ─────────────────────────────────────────────
    // 관리 등록 모달 열기/닫기
    // ─────────────────────────────────────────────
    const handleOpenTreatment = () => {
        if (onOpenTreatmentModal) {
            // 외부에서 제어하는 방식 (부모가 TreatmentModal을 관리)
            onOpenTreatmentModal({ id: patientId, name });
        } else {
            // 내부에서 자체적으로 TreatmentModal을 열기
            setShowTreatmentModal(true);
        }
    };

    const handleTreatmentClose = () => {
        setShowTreatmentModal(false);
    };

    const handleTreatmentSubmit = () => {
        // 등록 후 상세 데이터 리프레시
        if (patientId) {
            fetchPatientDetail(patientId);
        }
        if (onRefreshData) {
            onRefreshData();
        }
    };

    // ─────────────────────────────────────────────
    // 카드 렌더링 헬퍼
    // ─────────────────────────────────────────────
    const renderCareCard = (rec) => {
        const careName = rec.careName || rec.care_name || rec.treatmentName || rec.treatment_name || '관리 항목';
        const careDate = rec.careDate || rec.care_date || rec.performedAt || rec.performed_at || rec.reservedAt || rec.reserved_at || rec.date || '-';
        const partOfBody = rec.partOfBody || rec.part_of_body || rec.bodyParts || rec.bodyPart || [];
        const bodyText = Array.isArray(partOfBody) ? partOfBody.join(', ') : (partOfBody || '-');
        const totalSessions = rec.totalSessions || rec.total_sessions || 0;
        const usedSessions = rec.usedSessions || rec.used_sessions || rec.currentSession || rec.current_session || 0;

        return { careName, careDate, bodyText, totalSessions, usedSessions };
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="고객 상세"
                subtitle={`"${name}" 고객의 기본 정보와 지금까지의 관리 내역을 확인합니다.`}
                size="xlarge"
            >
                {isLoading ? (
                    <div className="loading-state">데이터를 불러오는 중...</div>
                ) : (
                    <div className="customer-detail-container">
                        {/* 1. 기본 정보 영역 */}
                        <div className="info-grid-2">
                            <div className="form-group">
                                <label className="form-label">고유 번호</label>
                                <input
                                    type="text"
                                    value={patientNo}
                                    readOnly
                                    className="form-input disabled-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">이름</label>
                                <input
                                    type="text"
                                    value={name}
                                    readOnly
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="info-grid-2">
                            <div className="form-group">
                                <label className="form-label">전화번호</label>
                                <input
                                    type="text"
                                    value={phone}
                                    readOnly
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">생년월일</label>
                                <input
                                    type="text"
                                    value={birthDate}
                                    readOnly
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">기타 메모</label>
                            <textarea
                                value={memo || '등록된 메모가 없습니다.'}
                                readOnly
                                rows="2"
                                className="form-textarea"
                            />
                        </div>

                        {/* 2. 예약 내역 Section */}
                        <section className="detail-section">
                            <h3 className="section-title">예약 내역</h3>
                            {effectiveReservations.length > 0 ? (
                                effectiveReservations.map((rec) => {
                                    const recordId = rec.id || rec.care_record_id || rec.careRecordId;
                                    const isCanceled = canceledReservations[recordId];
                                    const { careName, careDate, bodyText, totalSessions } = renderCareCard(rec);

                                    return (
                                        <div key={recordId} className="detail-card reservation-card">
                                            <div className="card-info">
                                                <h4 className="card-title">{careName}</h4>
                                                <p className="card-subtext">{careDate}</p>
                                                <p className="card-subtext">{bodyText}</p>
                                                {totalSessions > 0 && (
                                                    <p className="card-subtext">{totalSessions}회</p>
                                                )}
                                            </div>
                                            {isCanceled ? (
                                                <button type="button" className="btn-cancel-reservation" disabled>
                                                    예약 취소됨
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn-cancel-reservation"
                                                    onClick={() => handleCancel(recordId)}
                                                    disabled={isDeleting}
                                                >
                                                    예약 취소
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="empty-card">예약된 내역이 없습니다.</div>
                            )}
                        </section>

                        {/* 3. 관리 내역 Section (완료된 시술) */}
                        <section className="detail-section">
                            <div className="section-header">
                                <h3 className="section-title">관리 내역</h3>
                                <button
                                    type="button"
                                    className="btn-add-treatment"
                                    onClick={handleOpenTreatment}
                                >
                                    + 관리 등록
                                </button>
                            </div>

                            <div className="history-list">
                                {history.length > 0 ? (
                                    history.map((rec) => {
                                        const recordId = rec.id || rec.care_record_id || rec.careRecordId;
                                        const { careName, careDate, bodyText } = renderCareCard(rec);
                                        const { currentSession, totalSessions } = computeSessionIndex(rec, careRecords);

                                        return (
                                            <div key={recordId} className="detail-card history-card">
                                                <div className="card-info">
                                                    <h4 className="card-title">{careName}</h4>
                                                    <p className="card-subtext">{careDate}</p>
                                                    <p className="card-subtext">{bodyText}</p>
                                                </div>
                                                {totalSessions > 0 && (
                                                    <div className="count-badge">
                                                        {currentSession}/{totalSessions}회
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-card">이전 관리 내역이 없습니다.</div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </Modal>

            {/* 내부에서 직접 TreatmentModal 관리 (onOpenTreatmentModal이 없을 때) */}
            {!onOpenTreatmentModal && (
                <TreatmentModal
                    isOpen={showTreatmentModal}
                    onClose={handleTreatmentClose}
                    customer={{ id: patientId, name }}
                    onSubmitTreatment={handleTreatmentSubmit}
                    onRefreshData={onRefreshData}
                />
            )}
        </>
    );
}
