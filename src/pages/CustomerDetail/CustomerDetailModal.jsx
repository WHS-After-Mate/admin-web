import React from 'react';
import Modal from '../../components/common/Modal';
import './CustomerDetailModal.css';

// 상단 선언
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
    onCancelReservation,
    onOpenTreatmentModal,
}) {
    if (!isOpen) return null;

    const customer = customerData || DEFAULT_CUSTOMER_DATA;

    const handleCancel = (resId) => {
        if (window.confirm('해당 예약을 취소하시겠습니까?')) {
            if (onCancelReservation) {
                onCancelReservation(resId);
            } else {
                alert('예약이 취소되었습니다.');
            }
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
                        <label className="form-label">고유번호</label>
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
                        <label className="form-label">생일</label>
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
                    {customer.reservations && customer.reservations.length > 0 ? (
                        customer.reservations.map((res) => (
                            <div key={res.id} className="detail-card reservation-card">
                                <div className="card-info">
                                    <h4 className="card-title">{res.title}</h4>
                                    <p className="card-subtext">
                                        {res.area} · {res.dateTime}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-cancel-reservation"
                                    onClick={() => handleCancel(res.id)}
                                >
                                    예약 취소
                                </button>
                            </div>
                        ))
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
                                onClick={onOpenTreatmentModal}
                            >
                                + 관리 등록
                            </button>
                        )}
                    </div>

                    <div className="history-list">
                        {customer.history && customer.history.length > 0 ? (
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