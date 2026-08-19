# WHS After Mate - Admin Backend API Specification v0.7

## 1. 프로젝트 핵심 개요
- **시스템**: 클리닉 데스크용 가상 EMR 입력 도구 (서버: `server_admin`, 포트: `4100`)
- **Base URL**: `/api/v1`
- **인증 방식**: `Authorization: Bearer {token}` (유효기간 12시간, 만료/무효 시 공통 `401 UNAUTHORIZED`)
- **클리닉 계정**: 총 3개 브랜드 고정(`amred`, `derna`, `wim`). 로그인 시 발급되는 `brand`가 모든 데이터 격리의 기준.

## 2. 핵심 비즈니스 규칙

### ① 환자 데이터 및 마스킹 (Brand Isolation & Claiming)
- `claimed_user_id` / `claimed_at` 값은 서버에서 자동 마스킹되어 내려올 수 있음(다른 클리닉 자동 연결 케이스).
- **중요**: 프론트엔드는 응답의 `duplicate: true` 및 `message` 필드로 신규/기존 환자 매칭 상태를 분기 처리할 것.
- 타 클리닉 데이터 접근 시 서버가 `403`이 아닌 `404 PATIENT_NOT_FOUND`를 반환하므로, 프론트엔드 라우터 Guard 처리 시 404를 "권한 없음 또는 존재하지 않음" 통합 안내 메시지로 노출할 것.

### ② 시술기록(CareRecords) & 이용권(Memberships) 매핑
- **독립적인 이용권 추가/삭제 API는 존재하지 않음**. 이용권은 오직 시술기록 등록/삭제 시 묶여서 처리됨.
- 시술기록 등록 시 Payload 폼 규칙:
  - 기존 이용권 차감: `membershipId` 전달
  - 패키지 새 구매/이어쓰기: `totalSessions` 전달
  - `membershipId`와 `totalSessions` 중 **정확히 하나만** 전송해야 함 (둘 다 포함되거나 누락되면 `400 VALIDATION_ERROR`).
- **Data Source Handling (`source: 'emr' | 'app'`)**:
  - 회원가입 이전 환자는 `source: 'emr'`, 가입 완료 환자는 `source: 'app'`으로 응답됨.
  - 가입 완료 환자의 경우 회원가입 시점에 원본(emr)이 앱(app)으로 1회성 복사되므로 목록에 동일 시술이 2개(원본/복사본)로 보일 수 있음.
  - **UI 테이블 렌더링 시 이를 중복 버그로 판단해 필터링하지 말고 presentation 레이어에서 명확히 구분 및 정렬할 것**.

### ③ 카탈로그 및 참조 데이터
- `GET /care-types` (7종 고정) & `GET /body-parts` (23종 고정): 시술 등록 Select Box용.
- `GET /treatment-catalog`: 자동완성용 제안 데이터일 뿐, 시술기록 등록 시 강제 검증 대상이 아님.
- `GET /clinic-info`: 담당 의료진(`doctors`) 및 클리닉 채널 정보. 의료진 목록 역시 제안용 candidates 목록임.

## 3. 전체 API 엔드포인트

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | 로그인. Body: `{ username, password }`. Response: `{ token, username, brand }` |

### Reference Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/care-types` | 시술 유형 목록 (7종 고정) |
| GET | `/body-parts` | 시술 부위 목록 (23종 고정) |
| GET | `/treatment-catalog` | 시술 자동완성 제안 목록 |
| POST | `/treatment-catalog` | 시술 카탈로그 추가 |
| PATCH | `/treatment-catalog` | 시술 카탈로그 수정 |
| DELETE | `/treatment-catalog` | 시술 카탈로그 삭제 |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/patients` | 신규 환자 등록. Body: `{ name, phone, birthDate, memo? }` |
| GET | `/patients?search=` | 환자 목록 검색 |
| GET | `/patients/{patientId}` | 환자 상세 조회 |
| PATCH | `/patients/{patientId}` | 환자 정보 수정 |

### Care Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/patients/{patientId}/care-records` | 시술기록 등록 (이용권 생성/차감 포함) |
| DELETE | `/care-records/{careRecordId}` | 시술기록 삭제 |

### Stats & Reservation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/visit-stats` | 방문 통계 (전날/금일/익일) |
| GET | `/reservations?date=` | 특정 날짜 예약 목록 |
| GET | `/clinic-info` | 클리닉 정보 및 의료진 목록 |

## 4. Care Record 등록 Payload 규칙

```json
// 기존 이용권 차감 (membershipId 전달)
{
  "careTypeId": "string",
  "bodyPartId": "string",
  "treatmentName": "string",
  "doctorName": "string (optional)",
  "memo": "string (optional)",
  "performedAt": "ISO datetime",
  "membershipId": "string"  // ← 기존 이용권 ID
}

// 새 이용권 생성 (totalSessions 전달)
{
  "careTypeId": "string",
  "bodyPartId": "string",
  "treatmentName": "string",
  "doctorName": "string (optional)",
  "memo": "string (optional)",
  "performedAt": "ISO datetime",
  "totalSessions": 5  // ← 새 이용권 총 횟수
}
```

⚠️ `membershipId`와 `totalSessions`는 **상호 배타적** — 정확히 하나만 전송.

## 5. 에러 응답 공통 포맷

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 보여줄 메시지"
  }
}
```

주요 에러 코드:
- `401 UNAUTHORIZED` / `INVALID_CREDENTIALS`: 인증 실패
- `400 VALIDATION_ERROR`: 요청 데이터 유효성 실패
- `404 PATIENT_NOT_FOUND`: 환자 미존재 또는 타 브랜드 접근
- `409 DUPLICATE_PATIENT`: 동일 전화번호 환자 존재 시 (duplicate: true 플래그)
