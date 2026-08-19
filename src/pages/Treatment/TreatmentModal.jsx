import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/common/Modal';
import './TreatmentModal.css';

/* ─────────────────────────────────────────────
   Custom Select (관리 시간, 횟수 등 단일 선택용)
   ───────────────────────────────────────────── */
function CustomSelect({ value, options, onChange, disabled, placeholder }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find((o) => o.value === value)?.label || placeholder || '';

    return (
        <div className="custom-select-wrapper" ref={ref}>
            <button
                type="button"
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                disabled={disabled}
            >
                <span className={`custom-select-text ${!value && placeholder ? 'placeholder' : ''}`}>
                    {selectedLabel}
                </span>
                <svg className="custom-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {isOpen && (
                <ul className="custom-select-dropdown">
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
                            onMouseDown={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   TreatmentModal (메인 모달)
   ───────────────────────────────────────────── */
export default function TreatmentModal({
    isOpen,
    onClose,
    customer,
    onSubmitTreatment,
    onRefreshData,
}) {
    // customer가 null/undefined일 때 빈 객체로 안전하게 폴백
    const safeCustomer = customer || {};

    const baseUrl = import.meta.env.VITE_API_URL ?? '';

    // 오늘 날짜 및 기본 시간
    const today = new Date().toISOString().split('T')[0];
    const currentHour = String(new Date().getHours()).padStart(2, '0');
    const currentMinute = String(Math.floor(new Date().getMinutes() / 5) * 5).padStart(2, '0');

    const [date, setDate] = useState(today);
    const [hour, setHour] = useState(currentHour);
    const [minute, setMinute] = useState(currentMinute);
    const [memo, setMemo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 카탈로그 & 부위 & 의료진 API 데이터
    const [catalog, setCatalog] = useState([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(false);
    const [bodyParts, setBodyParts] = useState([]);
    const [doctors, setDoctors] = useState([]);

    // 동적 관리 항목 배열
    const [treatmentItems, setTreatmentItems] = useState([
        { id: Date.now(), careName: '', partOfBody: [], totalSessions: 1, practitioner: '' },
    ]);

    // 모달이 열릴 때 폼 초기화 및 API 데이터 로드
    useEffect(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setHour(String(new Date().getHours()).padStart(2, '0'));
            setMinute(String(Math.floor(new Date().getMinutes() / 5) * 5).padStart(2, '0'));
            setMemo('');
            setTreatmentItems([
                { id: Date.now(), careName: '', partOfBody: [], totalSessions: 1, practitioner: '' },
            ]);
            fetchCatalog();
            fetchBodyParts();
            fetchDoctors();
        }
    }, [isOpen]);

    const fetchCatalog = async () => {
        try {
            setIsCatalogLoading(true);
            const token = localStorage.getItem('token');
            const brand = localStorage.getItem('brand') || '';

            // treatment-catalog API 호출 (Bearer token 포함)
            const response = await fetch(`${baseUrl}/api/v1/treatment-catalog`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });
            if (!response.ok) throw new Error(`카탈로그 조회 실패: ${response.status}`);
            const data = await response.json();

            // 응답 구조 추출
            let list;
            if (Array.isArray(data)) {
                list = data;
            } else if (Array.isArray(data.data)) {
                list = data.data;
            } else if (Array.isArray(data.catalog)) {
                list = data.catalog;
            } else if (Array.isArray(data.items)) {
                list = data.items;
            } else if (Array.isArray(data.treatments)) {
                list = data.treatments;
            } else if (Array.isArray(data.treatmentCatalog)) {
                list = data.treatmentCatalog;
            } else if (Array.isArray(data.treatment_catalog)) {
                list = data.treatment_catalog;
            } else {
                list = Object.values(data).find((v) => Array.isArray(v)) || [];
            }

            // brand별 필터링: 각 항목에서 brand 관련 필드를 찾아 현재 로그인 brand와 매칭
            if (brand && list.length > 1) {
                const brandLower = brand.toLowerCase();
                const filtered = list.filter((item) => {
                    // 가능한 모든 brand 관련 필드 탐색
                    const candidates = [
                        item.brand, item.clinic, item.clinicName, item.clinic_name,
                        item.brandId, item.brand_id, item.admin_id, item.adminId,
                        item.owner, item.created_by, item.createdBy,
                    ];
                    const itemBrand = candidates.find((v) => v)?.toString().toLowerCase() || '';
                    if (!itemBrand) return true; // 필드 자체가 없으면 통과 (필터 불가)
                    return itemBrand === brandLower || itemBrand.includes(brandLower) || brandLower.includes(itemBrand);
                });
                // 필터링으로 줄어들었으면 적용 (brand 필드가 있는 데이터)
                if (filtered.length > 0 && filtered.length < list.length) {
                    list = filtered;
                }
            }

            setCatalog(list);
        } catch (err) {
            console.error('treatment-catalog 로드 실패:', err);
            setCatalog([]);
        } finally {
            setIsCatalogLoading(false);
        }
    };

    const fetchBodyParts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/api/v1/body-parts`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });
            if (!response.ok) throw new Error('부위 목록 조회 실패');
            const data = await response.json();
            const list = Array.isArray(data) ? data : data.bodyParts || data.body_parts || [];
            setBodyParts(list);
        } catch (err) {
            console.error('body-parts 로드 실패:', err);
        }
    };

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${baseUrl}/api/v1/clinic-info`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });
            if (!response.ok) throw new Error('의료진 목록 조회 실패');
            const data = await response.json();
            const list = Array.isArray(data.doctors) ? data.doctors : (data.practitioners || data.data?.doctors || []);
            setDoctors(list);
        } catch (err) {
            console.error('clinic-info(doctors) 로드 실패:', err);
            setDoctors([]);
        }
    };

    // "+ 관리 추가" 버튼 핸들러
    const handleAddItem = () => {
        setTreatmentItems((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), careName: '', partOfBody: [], totalSessions: 1, practitioner: '' },
        ]);
    };

    // 항목 삭제 핸들러
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
                if (item.id !== id) return item;
                return { ...item, [field]: value };
            })
        );
    };

    // 카탈로그 선택 시 추천 bodyParts 자동 매핑
    const handleCatalogSelect = (id, catalogItem) => {
        setTreatmentItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    careName: catalogItem.care_name || catalogItem.careName || catalogItem.name || catalogItem.treatmentName || catalogItem.treatment_name || '',
                };
            })
        );
    };

    // 부위 다중 선택 토글
    const handleToggleBodyPart = (id, partValue) => {
        setTreatmentItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const current = item.partOfBody || [];
                const exists = current.includes(partValue);
                return {
                    ...item,
                    partOfBody: exists
                        ? current.filter((p) => p !== partValue)
                        : [...current, partValue],
                };
            })
        );
    };

    // 백엔드 제출 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 유효성 검사
        const isInvalid = treatmentItems.some(
            (item) => !item.careName.trim() || item.partOfBody.length === 0
        );
        if (isInvalid) {
            alert('모든 관리 항목의 관리명과 관리 부위를 선택해 주세요.');
            return;
        }

        const patientId = safeCustomer.id || safeCustomer.customer_id || safeCustomer.patientId || safeCustomer.patient_id;
        if (!patientId) {
            alert('고객 정보(ID)를 찾을 수 없습니다.');
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');

            // careDate: 백엔드 규격 "YYYY-MM-DD" (10자리, 시간 제외)
            const careDate = date || new Date().toISOString().split('T')[0];

            // Promise.all로 N개의 care-records 병렬 등록
            const requests = treatmentItems.map((item) => {
                const payload = {
                    careName: item.careName.trim(),
                    careDate: careDate,
                    partOfBody: item.partOfBody || [],
                    ...(item.practitioner && { practitioner: item.practitioner }),
                    ...(memo.trim() && { memo: memo.trim() }),
                };

                // membershipId와 totalSessions는 상호 배타적 — 정확히 하나만 전송
                if (item.membershipId) {
                    payload.membershipId = item.membershipId;
                } else {
                    payload.totalSessions = item.totalSessions || 1;
                }

                return fetch(`${baseUrl}/api/v1/patients/${patientId}/care-records`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify(payload),
                });
            });

            const responses = await Promise.all(requests);

            // 에러 체크
            const errors = [];
            for (let i = 0; i < responses.length; i++) {
                if (!responses[i].ok) {
                    const errorData = await responses[i].json().catch(() => ({}));
                    errors.push(
                        errorData.error?.message || errorData.message || `항목 ${i + 1} 등록 실패 (${responses[i].status})`
                    );
                }
            }

            if (errors.length > 0) {
                throw new Error(errors.join('\n'));
            }

            if (onSubmitTreatment) {
                onSubmitTreatment();
            }

            alert('관리가 성공적으로 등록되었습니다.');

            if (onRefreshData) {
                await onRefreshData();
            }

            onClose();
        } catch (error) {
            console.error('관리 등록 실패:', error);
            alert(`관리 등록 중 오류가 발생했습니다:\n${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const customerName = safeCustomer.name || '고객';

    // 시/분 옵션 생성
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const h = String(i).padStart(2, '0');
        return { value: h, label: `${h}시` };
    });

    const minuteOptions = Array.from({ length: 12 }, (_, i) => {
        const m = String(i * 5).padStart(2, '0');
        return { value: m, label: `${m}분` };
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="관리 등록"
            subtitle={`"${customerName}"의 새로운 관리 내역을 등록합니다.`}
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
                            onClick={(e) => { if (e.target.showPicker) e.target.showPicker(); }}
                            min={new Date().toISOString().split('T')[0]}
                            className="form-input date-input"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">관리 시간</label>
                        <div className="time-select-group">
                            <CustomSelect
                                value={hour}
                                options={hourOptions}
                                onChange={setHour}
                                disabled={isSubmitting}
                            />
                            <CustomSelect
                                value={minute}
                                options={minuteOptions}
                                onChange={setMinute}
                                disabled={isSubmitting}
                            />
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

                    <div className="treatment-list-box">
                        {treatmentItems.map((item) => (
                            <TreatmentItemRow
                                key={item.id}
                                item={item}
                                catalog={catalog}
                                isCatalogLoading={isCatalogLoading}
                                bodyParts={bodyParts}
                                doctors={doctors}
                                isSubmitting={isSubmitting}
                                onItemChange={handleItemChange}
                                onCatalogSelect={handleCatalogSelect}
                                onToggleBodyPart={handleToggleBodyPart}
                                onRemove={handleRemoveItem}
                            />
                        ))}

                        {/* "+ 관리 추가" 버튼 */}
                        <button
                            type="button"
                            className="add-item-btn"
                            onClick={handleAddItem}
                            disabled={isSubmitting}
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
                        disabled={isSubmitting}
                    />
                </div>

                {/* 하단 버튼 */}
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
                        {isSubmitting ? '등록 중...' : '관리 등록'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────────────────────────────
   TreatmentItemRow (개별 관리 항목 행)
   - 관리명 Combobox (검색 + 드롭다운 + 자유입력)
   - 관리 부위 Multi-select Dropdown
   - 관리 횟수 Custom Select
   - 삭제 버튼
   ───────────────────────────────────────────── */
function TreatmentItemRow({
    item,
    catalog,
    isCatalogLoading,
    bodyParts,
    doctors,
    isSubmitting,
    onItemChange,
    onCatalogSelect,
    onToggleBodyPart,
    onRemove,
}) {
    const [nameQuery, setNameQuery] = useState(item.careName || '');
    const [showNameDropdown, setShowNameDropdown] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // 사용자가 직접 타이핑 중인지 구분
    const [showBodyDropdown, setShowBodyDropdown] = useState(false);

    const nameRef = useRef(null);
    const bodyRef = useRef(null);
    const nameInputRef = useRef(null);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (nameRef.current && !nameRef.current.contains(e.target)) {
                setShowNameDropdown(false);
            }
            if (bodyRef.current && !bodyRef.current.contains(e.target)) {
                setShowBodyDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 부모 상태와 로컬 query 동기화
    useEffect(() => {
        setNameQuery(item.careName || '');
    }, [item.careName]);

    // 카탈로그 항목에서 관리명 추출 헬퍼
    const getCatalogName = (c) => c.care_name || c.careName || c.name || c.treatmentName || c.treatment_name || '';

    // 카탈로그 필터링: 사용자가 타이핑 중일 때만 필터, 그 외에는 전체 목록
    const filteredCatalog = (!isTyping || nameQuery.trim() === '')
        ? catalog
        : catalog.filter((c) => {
            const name = getCatalogName(c);
            return name.toLowerCase().includes(nameQuery.toLowerCase());
        });

    // 관리명 입력 변경 핸들러
    const handleNameInputChange = (e) => {
        const value = e.target.value;
        setNameQuery(value);
        setIsTyping(true); // 사용자가 직접 타이핑 중
        onItemChange(item.id, 'careName', value);
        setShowNameDropdown(true);
    };

    // 드롭다운 화살표 클릭 핸들러
    const handleArrowClick = () => {
        if (isSubmitting) return;
        setIsTyping(false); // 화살표 클릭 시 전체 목록 표시
        setShowNameDropdown((prev) => !prev);
        // 드롭다운 열면서 input에 포커스
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
    };

    // 카탈로그 항목 선택
    const handleSelectCatalogItem = (catalogItem) => {
        onCatalogSelect(item.id, catalogItem);
        setNameQuery(getCatalogName(catalogItem));
        setIsTyping(false); // 선택 완료 — 다음에 드롭다운 열면 전체 목록 표시
        setShowNameDropdown(false);
    };

    // 부위 표시 텍스트
    const bodyPartLabel = () => {
        if (!item.partOfBody || item.partOfBody.length === 0) return '';
        if (item.partOfBody.length <= 2) return item.partOfBody.join(', ');
        return `${item.partOfBody[0]}, ${item.partOfBody[1]} 외 ${item.partOfBody.length - 2}개`;
    };

    // 횟수 옵션
    const sessionOptions = Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}회`,
    }));

    return (
        <div className="treatment-item-row">
            {/* 1. 관리명 Combobox */}
            <div className="form-group flex-2" ref={nameRef}>
                <label className="sub-label">관리명</label>
                <div className="combobox-wrapper">
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={nameQuery}
                        onChange={handleNameInputChange}
                        onFocus={() => { setIsTyping(false); setShowNameDropdown(true); }}
                        placeholder="관리명을 입력하거나 선택하세요"
                        className="form-input combobox-input"
                        disabled={isSubmitting}
                        autoComplete="off"
                    />
                    <button
                        type="button"
                        className="combobox-arrow-btn"
                        onClick={handleArrowClick}
                        tabIndex={-1}
                        disabled={isSubmitting}
                        aria-label="관리명 목록 열기"
                    >
                        <svg className="combobox-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                    {showNameDropdown && (
                        <ul className="combobox-dropdown">
                            {isCatalogLoading ? (
                                <li className="combobox-option combobox-empty">
                                    관리 항목을 불러오는 중...
                                </li>
                            ) : filteredCatalog.length > 0 ? (
                                filteredCatalog.map((c, idx) => (
                                    <li
                                        key={c.id || idx}
                                        className="combobox-option"
                                        onMouseDown={() => handleSelectCatalogItem(c)}
                                    >
                                        {getCatalogName(c)}
                                    </li>
                                ))
                            ) : (
                                <li className="combobox-option combobox-empty">
                                    {nameQuery.trim()
                                        ? '검색 결과가 없습니다. 직접 입력 가능합니다.'
                                        : '등록된 관리 항목이 없습니다.'}
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* 2. 관리 부위 Multi-select Dropdown */}
            <div className="form-group flex-2" ref={bodyRef}>
                <label className="sub-label">관리 부위</label>
                <div className="multiselect-wrapper">
                    <button
                        type="button"
                        className={`multiselect-trigger ${showBodyDropdown ? 'open' : ''}`}
                        onClick={() => setShowBodyDropdown((prev) => !prev)}
                        disabled={isSubmitting}
                    >
                        <span className={`multiselect-text ${item.partOfBody.length === 0 ? 'placeholder' : ''}`}>
                            {item.partOfBody.length > 0 ? bodyPartLabel() : '부위를 선택하세요'}
                        </span>
                        <svg className="multiselect-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                    {showBodyDropdown && (
                        <ul className="multiselect-dropdown">
                            {bodyParts.map((bp, idx) => {
                                const partValue = typeof bp === 'string' ? bp : (bp.name || bp.label || bp.body_part || '');
                                const isSelected = (item.partOfBody || []).includes(partValue);
                                return (
                                    <li
                                        key={bp.id || idx}
                                        className={`multiselect-option ${isSelected ? 'selected' : ''}`}
                                        onMouseDown={() => onToggleBodyPart(item.id, partValue)}
                                    >
                                        <span className="multiselect-check">{isSelected ? '✓' : ''}</span>
                                        {partValue}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* 3. 관리 횟수 Custom Select */}
            <div className="form-group flex-1">
                <label className="sub-label">횟수</label>
                <CustomSelect
                    value={item.totalSessions}
                    options={sessionOptions}
                    onChange={(val) => onItemChange(item.id, 'totalSessions', Number(val))}
                    disabled={isSubmitting}
                />
            </div>

            {/* 4. 담당 의사 Custom Select */}
            <div className="form-group flex-1">
                <label className="sub-label">담당의</label>
                <CustomSelect
                    value={item.practitioner || ''}
                    options={
                        doctors.length > 0
                            ? doctors.map((doc) => ({
                                value: typeof doc === 'string' ? doc : (doc.name || doc.doctorName || doc.id || ''),
                                label: typeof doc === 'string' ? doc : (doc.name || doc.doctorName || doc.label || ''),
                            }))
                            : [{ value: '', label: '의사 정보 없음' }]
                    }
                    onChange={(val) => onItemChange(item.id, 'practitioner', val)}
                    disabled={isSubmitting}
                    placeholder="선택"
                />
            </div>

            {/* 5. 항목 삭제 버튼 */}
            <button
                type="button"
                className="remove-item-btn"
                onClick={() => onRemove(item.id)}
                title="관리 삭제"
                disabled={isSubmitting}
            >
                ✕
            </button>
        </div>
    );
}
