# CoupleInfo Schema Guide & UI 생성 프롬프트

이 문서는 `coupleInfo.model.ts` 스키마의 각 필드에 대한 상세 가이드와, 이 스키마를 기반으로 사용자 입력 UI(폼)를 생성하기 위한 프롬프트를 제공합니다.

---

## 1. Schema Field Guide

`CoupleInfo` 스키마는 모바일 청첩장을 구성하는 모든 정보를 담고 있습니다. 각 필드는 다음과 같은 역할을 합니다.

### 기본 정보 (Core Information)

| 필드 (Field)       | 타입 (Type) | 필수 | UI 제안 (Suggestion)                     | 설명                                      |
| ------------------ | ----------- | ---- | ---------------------------------------- | ----------------------------------------- |
| `weddingDate`      | `Date`      | O    | `DatePicker`와 `TimePicker`의 조합       | 결혼식 날짜 및 시간                       |
| `venue`            | `String`    | O    | `Input` (텍스트 입력)                    | 결혼식 장소명 (예: 더 채플 앳 웨스트)     |
| `address`          | `String`    | O    | `Input` + 주소 찾기(`DaumPostcode`) 버튼 | 결혼식 상세 주소                          |
| `subwayStation`    | `String`    | X    | `Input` (텍스트 입력)                    | 인근 지하철역 (예: 2호선 강남역 3번 출구) |
| `message`          | `String`    | O    | `Textarea` (여러 줄 텍스트 입력)         | 초대 문구                                 |
| `guestbookEnabled` | `Boolean`   | O    | `Switch` 또는 `Checkbox`                 | 방명록 기능 활성화 여부 (기본값: false)   |

### 신랑 & 신부 정보 (Groom & Bride Information)

각 필드는 `groom`과 `bride` 객체 아래에 동일하게 존재합니다.

| 필드 (Field)    | 타입 (Type) | 필수 | UI 제안 (Suggestion) | 설명     |
| --------------- | ----------- | ---- | -------------------- | -------- |
| `name`          | `String`    | O    | `Input`              | 이름     |
| `phone`         | `String`    | O    | `Input` (tel 타입)   | 연락처   |
| `accountNumber` | `String`    | O    | `Input`              | 계좌번호 |

### 혼주 정보 (Parents Information)

신랑, 신부 각각의 정보(`groom`, `bride` 객체) 아래에 `father`, `mother` 객체로 존재하며, 정보 입력 여부는 선택 사항입니다. `Accordion` 또는 `Collapsible` 컴포넌트로 UI를 구성하여 필요시에만 펼쳐보도록 하는 것이 좋습니다.

| 필드 (Field)           | 타입 (Type) | 필수 | UI 제안 (Suggestion) | 설명            |
| ---------------------- | ----------- | ---- | -------------------- | --------------- |
| `father.name`          | `String`    | X    | `Input`              | 아버님 성함     |
| `father.phone`         | `String`    | X    | `Input` (tel 타입)   | 아버님 연락처   |
| `father.accountNumber` | `String`    | X    | `Input`              | 아버님 계좌번호 |
| `mother.name`          | `String`    | X    | `Input`              | 어머님 성함     |
| `mother.phone`         | `String`    | X    | `Input` (tel 타입)   | 어머님 연락처   |
| `mother.accountNumber` | `String`    | X    | `Input`              | 어머님 계좌번호 |

### 이미지 정보 (Image Information)

| 필드 (Field)      | 타입 (Type)            | 필수 | UI 제안 (Suggestion)                                | 설명                                                     |
| ----------------- | ---------------------- | ---- | --------------------------------------------------- | -------------------------------------------------------- |
| `thumbnailImages` | `[String]` (URL 배열)  | X    | 다중 이미지 업로더 (`multi-file uploader`)          | 청첩장 메인에 표시될 썸네일 이미지 목록 (1~3개)          |
| `galleryImages`   | `[{ category, urls }]` | X    | 카테고리 입력 필드와 다중 이미지 업로더가 결합된 UI | 카테고리별로(예: 스튜디오, 본식) 여러 장의 이미지를 등록 |
