<<<<<<< HEAD
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import './CustomerModal.css';

export default function CustomerModal({ isOpen, onClose, onAddCustomer }) {
=======
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import './CustomerModal.css';

export default function CustomerModal({ isOpen, onClose, onAddCustomer, onRefreshData }) {
>>>>>>> feature/login
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        birthdate: '',
        memo: '',
    });
<<<<<<< HEAD

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
=======
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 모달이 열리거나 닫힐 때 상태 리셋
    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
        } else {
            // 모달이 닫힐 때 폼 초기화
            setFormData({ name: '', phone: '', birthdate: '', memo: '' });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // 전화번호 자동 포맷팅 함수 (숫자만 추출 후 010-0000-0000 형태로 변환)
    const formatPhoneNumber = (value) => {
        if (!value) return '';
        const raw = value.replace(/[^0-9]/g, ''); // 숫자 이외 제거

        if (raw.length <= 3) {
            return raw;
        } else if (raw.length <= 7) {
            return `${raw.slice(0, 3)}-${raw.slice(3)}`;
        } else {
            return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            // 전화번호 입력 시 자동으로 하이픈(-) 포맷 적용
            const formattedPhone = formatPhoneNumber(value);
            setFormData((prev) => ({ ...prev, phone: formattedPhone }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 중복 제출 방지
        if (isSubmitting) return;

>>>>>>> feature/login
        if (!formData.name.trim()) {
            alert('이름을 입력해 주세요.');
            return;
        }

<<<<<<< HEAD
        if (onAddCustomer) {
            onAddCustomer(formData);
        }

        alert('신규 고객이 등록되었습니다.');
        setFormData({ name: '', phone: '', birthdate: '', memo: '' });
        onClose();
=======
        if (!formData.phone.trim()) {
            alert('전화번호를 입력해 주세요.');
            return;
        }

        if (!formData.birthdate) {
            alert('생년월일을 선택해 주세요.');
            return;
        }

        try {
            setIsSubmitting(true); // 입력칸 비활성화 시작

            // 1. 백엔드 URL 및 인증 토큰 준비
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4100';
            const token = localStorage.getItem('token');

            // 2. 백엔드 API 명세(POST /api/v1/patients) 규격에 맞게 Payload 생성
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.replace(/[^0-9]/g, ''),
                birthDate: formData.birthdate, // 'YYYY-MM-DD'
                memo: formData.memo.trim() || undefined,
            };

            // 3. API 호출
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

            // 폼 초기화 및 모달 닫기
            setFormData({ name: '', phone: '', birthdate: '', memo: '' });

            if (onRefreshData) {
                await onRefreshData(); // 목록 새로고침
            }

            onClose();
        } catch (error) {
            console.error('고객 등록 실패:', error);
            alert(`고객 등록에 실패했습니다: ${error.message}`);
        } finally {
            // 성공/실패 여부와 관계없이 제출 상태 해제
            setIsSubmitting(false);
        }
>>>>>>> feature/login
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="신규 고객 등록"
            subtitle="고객 기본 정보만 간단히 등록합니다."
        >
            <form onSubmit={handleSubmit}>
                <div className="form-group">
<<<<<<< HEAD
                    <label className="form-label">이름</label>
=======
                    <label className="form-label">이름 *</label>
>>>>>>> feature/login
                    <input
                        type="text"
                        name="name"
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-input"
                        required
<<<<<<< HEAD
=======
                        disabled={isSubmitting}
>>>>>>> feature/login
                    />
                </div>

                <div className="form-group">
<<<<<<< HEAD
                    <label className="form-label">전화번호</label>
=======
                    <label className="form-label">전화번호 *</label>
>>>>>>> feature/login
                    <input
                        type="tel"
                        name="phone"
                        placeholder="010-0000-0000"
                        value={formData.phone}
                        onChange={handleChange}
<<<<<<< HEAD
                        className="form-input"
=======
                        maxLength={13} // 010-1234-5678 (최대 13자)
                        className="form-input"
                        required
                        disabled={isSubmitting}
>>>>>>> feature/login
                    />
                </div>

                <div className="form-group">
<<<<<<< HEAD
                    <label className="form-label">생일</label>
=======
                    <label className="form-label">생일 *</label>
>>>>>>> feature/login
                    <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                        className="form-input date-input"
<<<<<<< HEAD
=======
                        required
                        disabled={isSubmitting}
>>>>>>> feature/login
                    />
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
<<<<<<< HEAD
=======
                        disabled={isSubmitting}
>>>>>>> feature/login
                    />
                </div>

                <div className="modal-footer">
<<<<<<< HEAD
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        취소
                    </button>
                    <button type="submit" className="btn-submit">
                        등록하기
=======
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
>>>>>>> feature/login
                    </button>
                </div>
            </form>
        </Modal>
    );
}