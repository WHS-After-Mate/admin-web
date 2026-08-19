import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import './CustomerModal.css';

export default function CustomerModal({ isOpen, onClose, onAddCustomer, onRefreshData }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        birthdate: '',
        memo: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 모달이 열리거나 닫힐 때 상태 리셋
    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            setErrors({});
        } else {
            setFormData({ name: '', phone: '', birthdate: '', memo: '' });
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // 전화번호 자동 포맷팅 함수
    const formatPhoneNumber = (value) => {
        if (!value) return '';
        const raw = value.replace(/[^0-9]/g, '');
        if (raw.length <= 3) return raw;
        if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
        return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // 입력 시 해당 필드의 에러 메시지 제거
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }

        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setFormData((prev) => ({ ...prev, phone: formattedPhone }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        // 사용자 지정 유효성 검사
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = '이름을 입력하세요.';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = '전화번호를 입력하세요.';
        }
        if (!formData.birthdate) {
            newErrors.birthdate = '생일을 입력하세요.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setIsSubmitting(true);

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';
            const token = localStorage.getItem('token');

            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.replace(/[^0-9]/g, ''),
                birthDate: formData.birthdate,
                memo: formData.memo.trim() || undefined,
            };

            const response = await fetch(`${baseUrl}/api/v1/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMsg = responseData.error?.message || responseData.message || `서버 오류 (${response.status})`;
                throw new Error(errorMsg);
            }

            alert('신규 고객이 성공적으로 등록되었습니다.');

            setFormData({ name: '', phone: '', birthdate: '', memo: '' });
            setErrors({});

            if (onRefreshData) {
                await onRefreshData();
            }

            onClose();
        } catch (error) {
            console.error('고객 등록 실패:', error);
            alert(`고객 등록에 실패했습니다: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="신규 고객 등록"
            subtitle="고객 기본 정보만 간단히 등록합니다."
        >
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label className="form-label">이름 *</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${errors.name ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                    />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">전화번호 *</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="010-0000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={13}
                        className={`form-input ${errors.phone ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                    />
                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">생일 *</label>
                    <input
                        type="text"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                        onFocus={(e) => { e.target.type = 'date'; }}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                        placeholder="YYYY-MM-DD"
                        className={`form-input date-input ${errors.birthdate ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                    />
                    {errors.birthdate && <span className="field-error">{errors.birthdate}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">기타 메모</label>
                    <textarea
                        name="memo"
                        rows="4"
                        placeholder="알레르기, 선호사항 등 필요한 메모를 입력하세요"
                        value={formData.memo}
                        onChange={handleChange}
                        className="form-textarea"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '등록 중...' : '등록하기'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
