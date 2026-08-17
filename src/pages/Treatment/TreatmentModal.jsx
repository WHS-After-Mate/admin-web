import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import './TreatmentModal.css';

// 💡 업로드해주신 표 이미지 분석을 통한 관리명-관리부위 1:N 데이터 정의
const TREATMENT_DATA = [
    {
        name: '울쎄라 리프팅',
        areas: ['얼굴 전체', '이중턱', '턱라인', '심부볼', '팔자'],
    },
    {
        name: '인모드 FX',
        areas: ['이중턱', '턱라인', '볼', '심부볼'],
    },
    {
        name: '리쥬란 스킨부스터',
        areas: ['얼굴 전체', '눈 밑', '볼', '이마', '목'],
    },
    {
        name: '쥬베룩 스킨부스터',
        areas: ['얼굴 전체', '볼', '팔자', '이마'],
    },
    {
        name: '입술 필러',
        areas: ['입술'],
    },
    {
        name: '보톡스',
        areas: ['미간', '이마', '눈가', '턱', '승모근'],
    },
    {
        name: 'LDM',
        areas: ['얼굴 전체', '볼', '턱라인'],
    },
];

export default function TreatmentModal({
    isOpen,
    onClose,
    customerName = '김지수',
    onSubmitTreatment,
}) {
    // 오늘 날짜 및 기본 시간(시, 분) 세팅
    const today = new Date().toISOString().split('T')[0];
    const currentHour = `${String(new Date().getHours()).padStart(2, '0')}시`;
    const currentMinute = `${String(Math.floor(new Date().getMinutes() / 5) * 5).padStart(2, '0')}분`;

    const [date, setDate] = useState(today);
    const [hour, setHour] = useState(currentHour);
    const [minute, setMinute] = useState(currentMinute);
    const [memo, setMemo] = useState('');

    // 동적 관리 항목 배열 (1:N 관계)
    const [treatmentItems, setTreatmentItems] = useState([
        { id: Date.now(), category: '', area: '', count: 1 },
    ]);

    // "+ 관리 추가" 버튼 핸들러
    const handleAddItem = () => {
        setTreatmentItems((prev) => [
            ...prev,
            { id: Date.now(), category: '', area: '', count: 1 },
        ]);
    };

    // 'x' 버튼 핸들러 (항목 삭제)
    const handleRemoveItem = (id) => {
        if (treatmentItems.length === 1) {
            alert('최소 1개 이상의 관리 항목이 필요합니다.');
            return;
        }
        setTreatmentItems((prev) => prev.filter((item) => item.id !== id));
    };

    // 관리 필드 값 변경 핸들러
    const handleItemChange = (id, field, value) => {
        setTreatmentItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    // 관리명이 바뀌면 기존에 선택되었던 부위를 초기화
                    if (field === 'category') {
                        updated.area = '';
                    }
                    return updated;
                }
                return item;
            })
        );
    };

    // 제출 처리
    const handleSubmit = (e) => {
        e.preventDefault();

        const isInvalid = treatmentItems.some((item) => !item.category || !item.area);
        if (isInvalid) {
            alert('모든 관리 항목의 관리명과 관리 부위를 선택해 주세요.');
            return;
        }

        const payload = {
            date,
            time: `${hour} ${minute}`,
            treatments: treatmentItems,
            memo,
        };

        if (onSubmitTreatment) {
            onSubmitTreatment(payload);
        }

        alert('관리가 성공적으로 등록되었습니다.');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="관리 등록"
            subtitle={`${customerName} 고객의 새로운 관리 내역을 등록합니다.`}
            size="xlarge"
        >
            <form onSubmit={handleSubmit} className="treatment-form">
                {/* 관리 날짜 & 관리 시간 */}
                <div className="form-row grid-2">
                    <div className="form-group">
                        <label className="form-label">관리 날짜</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="form-input date-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">관리 시간</label>
                        <div className="time-select-group">
                            <select
                                value={hour}
                                onChange={(e) => setHour(e.target.value)}
                                className="form-input select-input"
                            >
                                {Array.from({ length: 24 }, (_, i) => {
                                    const h = `${String(i).padStart(2, '0')}시`;
                                    return <option key={h} value={h}>{h}</option>;
                                })}
                            </select>

                            <select
                                value={minute}
                                onChange={(e) => setMinute(e.target.value)}
                                className="form-input select-input"
                            >
                                {Array.from({ length: 12 }, (_, i) => {
                                    const m = `${String(i * 5).padStart(2, '0')}분`;
                                    return <option key={m} value={m}>{m}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 관리 항목 (1:N 리스트 영역) */}
                <div className="treatment-section">
                    <div className="section-title-wrap">
                        <label className="form-label">관리 항목</label>
                        <p className="section-desc">
                            관리명을 검색해 선택하면 해당 관리에서 가능한 부위가 자동으로 연결됩니다. 여러 관리를 추가할 수 있습니다.
                        </p>
                    </div>

                    {/* datalist: 직접 입력(검색) + 선택이 동시에 가능한 HTML 표준 데이터리스트 */}
                    <datalist id="treatment-list-options">
                        {TREATMENT_DATA.map((data) => (
                            <option key={data.name} value={data.name} />
                        ))}
                    </datalist>

                    <div className="treatment-list-box">
                        {treatmentItems.map((item) => {
                            const selectedCategoryData = TREATMENT_DATA.find(
                                (data) => data.name === item.category
                            );
                            const availableAreas = selectedCategoryData
                                ? selectedCategoryData.areas
                                : [];

                            return (
                                <div key={item.id} className="treatment-item-row">
                                    {/* 1. 검색 + 클릭 선택이 모두 가능한 Input (datalist 연결) */}
                                    <div className="form-group flex-2">
                                        <label className="sub-label">관리 검색</label>
                                        <input
                                            type="text"
                                            list="treatment-list-options"
                                            value={item.category}
                                            onChange={(e) =>
                                                handleItemChange(item.id, 'category', e.target.value)
                                            }
                                            placeholder="관리명을 입력하거나 선택하세요"
                                            className="form-input search-input"
                                        />
                                    </div>

                                    {/* 2. 연동된 관리 부위 선택 */}
                                    <div className="form-group flex-2">
                                        <label className="sub-label">관리 부위</label>
                                        <select
                                            value={item.area}
                                            onChange={(e) =>
                                                handleItemChange(item.id, 'area', e.target.value)
                                            }
                                            className="form-input select-input"
                                            disabled={!selectedCategoryData}
                                        >
                                            <option value="">
                                                {selectedCategoryData ? '부위 선택' : '관리 선택 필요'}
                                            </option>
                                            {availableAreas.map((area) => (
                                                <option key={area} value={area}>
                                                    {area}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 3. 관리 횟수 */}
                                    <div className="form-group flex-1">
                                        <label className="sub-label">관리 횟수</label>
                                        <select
                                            value={item.count}
                                            onChange={(e) =>
                                                handleItemChange(item.id, 'count', Number(e.target.value))
                                            }
                                            className="form-input select-input"
                                        >
                                            {Array.from({ length: 10 }, (_, i) => i + 1).map((cnt) => (
                                                <option key={cnt} value={cnt}>
                                                    {cnt}회권
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 4. 항목 삭제 버튼 */}
                                    <button
                                        type="button"
                                        className="remove-item-btn"
                                        onClick={() => handleRemoveItem(item.id)}
                                        title="관리 삭제"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}

                        {/* "+ 관리 추가" 버튼 */}
                        <button
                            type="button"
                            className="add-item-btn"
                            onClick={handleAddItem}
                        >
                            + 관리 추가
                        </button>
                    </div>
                </div>

                {/* 관리 메모 */}
                <div className="form-group">
                    <label className="form-label">관리 메모</label>
                    <textarea
                        rows="3"
                        placeholder="선택 사항"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="form-textarea"
                    />
                </div>

                {/* 하단 버튼 */}
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        취소
                    </button>
                    <button type="submit" className="btn-submit">
                        관리 등록
                    </button>
                </div>
            </form>
        </Modal>
    );
}