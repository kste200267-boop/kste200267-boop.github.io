# 경북기계금속고 교사 업무 포털

## 파일 구조
```
portal/
├── index.html          ← 메인 (로그인 + 홈 대시보드)
├── manifest.json       ← PWA 설치용
├── css/
│   └── style.css       ← 전체 스타일
├── data/
│   ├── teachers.js     ← 교사 37명 시간표 원본
│   └── classes.js      ← 고1 6반 시간표
├── js/
│   ├── store.js        ← localStorage 관리 (인증, 교체기록, 할일 등)
│   ├── auth.js         ← 로그인/로그아웃/비밀번호 관리
│   ├── engine.js       ← 시간표 계산 엔진 (오버라이드 반영)
│   ├── router.js       ← SPA 라우터 (해시 기반)
│   └── toast.js        ← 알림
├── pages/
│   ├── home.js         ← 홈 대시보드 (요약 + 바로가기)
│   ├── my-timetable.js ← 내 시간표 (주차별)
│   ├── all-timetable.js← 전체 시간표 + 빈시간 교사
│   ├── swap.js         ← 수업 교체 + 기록 저장
│   ├── history.js      ← 교체 기록 조회
│   ├── weekly.js       ← 주간 업무 (구글캘린더)
│   ├── meal.js         ← 급식 (iframe)
│   ├── schedule.js     ← 학사일정 (iframe)
│   ├── tasks.js        ← 할 일 체크리스트
│   └── admin.js        ← 관리자 (계정관리, 교시설정, 백업)
└── weekly-plan.html    ← 주간업무 별도 페이지 (구글캘린더 연동)
```

## 인증 체계
- 관리자가 계정 ID/PW 변경 가능
- 모든 계정 정보 localStorage 저장

## 교체 기록 체계
- 교체 실행 → swap-history에 기록
- 주차별 오버라이드로 시간표 반영
- 취소 가능, 이력 영구 보존
```
