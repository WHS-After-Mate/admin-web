import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import './CustomerDetailModal.css';

// 기본 데이터 구조 (API 데이터 로딩 전/실패 시 Fallback)
const DEFAULT_CUSTOMER_DATA = {
    id: '-',
    name: '정보 없음',
    phone: '-',
    birth: '-',
    memo: '',
    reservations: [],
    history: [],
};

export default function CustomerDetailModal({
    isOpen,
    onClose,
    customerData,
    onOpenTreatmentModal,
    onRefreshData, // API 변경 성공 후 대시보드/목록 최신화를 위해 부모가 전달하는 콜백
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    // 예약 상태를 관리하기 위한 로컬 state (예약 ID별 취소 여부 저장)
    const [canceledReservations, setCanceledReservations] = useState({});

    // 모달이 열릴 때마다 취소 상태 초기화
    useEffect(() => {
        setCanceledReservations({});
    }, [customerData]);

    if (!isOpen) return null;

    // 1. 백엔드 API 응답 데이터 파싱 (스네이크 케이스 & 카멜 케이스 모두 완벽 방어)
    const rawCustomer = customerData || DEFAULT_CUSTOMER_DATA;

    const customer = {
        id: rawCustomer.id || rawCustomer.customer_id || '-',
        name: rawCustomer.name || '정보 없음',
        phone: rawCustomer.phone || rawCustomer.phone_number || '-',
        birth: rawCustomer.birth || rawCustomer.birth_date || '-',
        memo: rawCustomer.memo || '',
        reservations: (rawCustomer.reservations || []).map((res) => ({
            id: res.id || res.reservation_id,
            title: res.title || res.service_name || '예약 항목',
            area: res.area || res.clinic_area || '클리닉',
            dateTime: res.dateTime || res.date_time || res.reservation_time || '-',
        })),
        history: (rawCustomer.history || rawCustomer.treatment_history || []).map((his) => ({
            id: his.id || his.history_id,
            title: his.title || his.treatment_name || '관리 항목',
            area: his.area || his.clinic_area || '클리닉',
            dateTime: his.dateTime || his.date_time || his.created_at || '-',
            expireDate: his.expireDate || his.expire_date || '-',
            usedCount: his.usedCount ?? his.used_count ?? 0,
            totalCount: his.totalCount ?? his.total_count ?? 0,
        })),
    };

    // 2. 실제 백엔드 API를 통한 예약 취소 로직
    const handleCancel = async (resId) => {
        if (!window.confirm('해당 예약을 정말 취소하시겠습니까?')) return;

        try {
            setIsDeleting(true);

            // CustomerPage.jsx와 동일한 포트(4100) 및 토큰 적용
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';
            const token = localStorage.getItem('token');

            // API 엔드포인트에 v1 추가 (/api/v1/reservations/...)
            const response = await fetch(`${baseUrl}/api/v1/reservations/${resId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }

            // 성공 시 로컬 state에 해당 예약 취소 반영
            setCanceledReservations((prev) => ({ ...prev, [resId]: true }));
            alert('예약이 성공적으로 취소되었습니다.');
            alert('예약이 성공적으로 취소되었습니다.');

            // 데이터 새로고침 및 모달 닫기 처리
            if (onRefreshData) {
                await onRefreshData();
            }
            onClose();
        } catch (error) {
            console.error('예약 취소 중 오류 발생:', error);
            alert('예약 취소 처리에 실패했습니다. 백엔드 서버 상태를 확인해 주세요.');
        } finally {
            setIsDeleting(false);
        }
    };

    // 3. "+ 관리 등록" 버튼 클릭 시 현재 고객 정보를 담아 관리 등록 모달 호출
    const handleOpenTreatment = () => {
        if (onOpenTreatmentModal) {
            // 현재 상세 화면에 있는 고객 객체(id, name 등)를 통째로 전달
            onOpenTreatmentModal(customer);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="고객 상세"
            subtitle="고객 기본 정보와 지금까지의 관리 내역을 확인합니다."
            size="xlarge"
        >
            <div className="customer-detail-container">
                {/* 1. 기본 정보 영역 */}
                <div className="info-grid-2">
                    <div className="form-group">
                        <label className="form-label">고유 번호</label>
                        <input
                            type="text"
                            value={customer.id}
                            disabled
                            className="form-input disabled-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">이름</label>
                        <input
                            type="text"
                            value={customer.name}
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
                            value={customer.phone}
                            readOnly
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">생년월일</label>
                        <input
                            type="text"
                            value={customer.birth}
                            readOnly
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">기타 메모</label>
                    <textarea
                        value={customer.memo}
                        readOnly
                        rows="2"
                        className="form-textarea"
                    />
                </div>

                {/* 2. 예약 내역 Section */}
                <section className="detail-section">
                    <h3 className="section-title">예약 내역</h3>
                    {customer.reservations.length > 0 ? (
                        customer.reservations.map((res) => {
                            const isCanceled = canceledReservations[res.id];
                            return (
                                <div key={res.id} className="detail-card reservation-card">
                                    <div className="card-info">
                                        <h4 className="card-title">{res.title}</h4>
                                        <p className="card-subtext">
                                            {res.area} • {res.dateTime}
                                        </p>
                                    </div>
                                    {isCanceled ? (
                                        <button type="button" className="btn-cancel-reservation" disabled>
                                            예약 취소됨
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-cancel-reservation"
                                            onClick={() => handleCancel(res.id)}
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

                {/* 3. 관리 내역 Section */}
                <section className="detail-section">
                    <div className="section-header">
                        <h3 className="section-title">관리 내역</h3>
                        {onOpenTreatmentModal && (
                            <button
                                type="button"
                                className="btn-add-treatment"
                                onClick={handleOpenTreatment}
                            >
                                + 관리 등록
                            </button>
                        )}
                    </div>

                    <div className="history-list">
                        {customer.history.length > 0 ? (
                            customer.history.map((his) => (
                                <div key={his.id} className="detail-card history-card">
                                    <div className="card-info">
                                        <h4 className="card-title">{his.title}</h4>
                                        <p className="card-subtext">{his.area}</p>
                                        <p className="card-subtext">{his.dateTime}</p>
                                        <p className="card-subtext date-gray">
                                            이용권 만료일 {his.expireDate}
                                        </p>
                                    </div>
                                    <div className="count-badge">
                                        {his.usedCount}/{his.totalCount}회
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-card">이전 관리 내역이 없습니다.</div>
                        )}
                    </div>
                </section>
            </div>
        </Modal>
    );
}