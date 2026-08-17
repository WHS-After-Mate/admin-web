import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import './CustomerModal.css';

export default function CustomerModal({ isOpen, onClose, onAddCustomer }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        birthdate: '',
        memo: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('이름을 입력해 주세요.');
            return;
        }

        if (onAddCustomer) {
            onAddCustomer(formData);
        }

        alert('신규 고객이 등록되었습니다.');
        setFormData({ name: '', phone: '', birthdate: '', memo: '' });
        onClose();
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
                    <label className="form-label">이름</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">전화번호</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="010-0000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">생일</label>
                    <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                        className="form-input date-input"
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
                    />
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        취소
                    </button>
                    <button type="submit" className="btn-submit">
                        등록하기
                    </button>
                </div>
            </form>
        </Modal>
    );
}