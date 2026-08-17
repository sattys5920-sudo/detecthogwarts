# 아르카눔 마법학교

마법학교를 배경으로 한 모바일 웹앱입니다. React + TypeScript + Vite + Firestore로 만들었습니다.

## 시작하기

```bash
npm install
cp .env.example .env   # Firebase 콘솔 값 채우기 (아래 참고)
npm run dev
```

## Firebase 연결하기

1. [Firebase 콘솔](https://console.firebase.google.com/) > 프로젝트 설정 > 일반 > 내 앱(웹 앱)에서 `firebaseConfig` 값을 확인합니다.
2. `.env.example`을 `.env`로 복사한 뒤, 아래 값을 채웁니다.

   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_MEASUREMENT_ID=
   ```

3. Firestore 데이터베이스를 아직 만들지 않았다면 콘솔에서 생성합니다.
4. `firestore.rules`를 Firebase 콘솔의 Firestore 규칙 탭에 붙여넣거나, Firebase CLI로 배포합니다.

   ```bash
   firebase deploy --only firestore:rules
   ```

`.env`가 없어도 앱은 정상적으로 실행됩니다 — 이 경우 리더보드 기록이 Firestore 대신 브라우저 `localStorage`에 저장되는 데모 모드로 동작합니다. `.env`를 채우면 자동으로 Firestore 연동으로 전환됩니다.

## 구조

- `src/pages/LoadingPage.tsx` — 시작 화면 (이름 입력 후 입장)
- `src/pages/{Main,House,Hall,Explore,Profile}Page.tsx` — 하단 탭 5개 화면
- `src/components/AppShell.tsx`, `BottomTabBar.tsx` — 탭 화면 레이아웃 + 하단 탭바
- `src/components/SceneBanner.tsx` — 탭별 상단 배너
- `src/data/school.ts` — 학교/기숙사 데이터
- `src/context/GameContext.tsx` — 플레이어 상태 (이름, 기숙사, localStorage에 저장)
- `src/firebase/` — Firebase 초기화 및 리더보드 read/write (아직 어느 탭에도 연결 안 됨)
- `firestore.rules` — 리더보드 컬렉션 보안 규칙

각 탭의 실제 콘텐츠(메인 소식, 강당 랭킹, 탐험 콘텐츠 등)는 아직 자리만 잡아둔 상태이며 앞으로 하나씩 채워나갈 예정입니다.

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 타입체크 + 프로덕션 빌드
- `npm run lint` — oxlint
- `npm run preview` — 빌드 결과 미리보기
