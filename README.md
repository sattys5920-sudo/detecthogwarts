# 아르카눔 미스터리

마법학교를 배경으로 한 추리 게임 웹앱입니다. React + TypeScript + Vite + Firestore로 만들었습니다.

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

- `src/data/story.ts` — 스토리, 장소, 용의자, 단서, 정답 데이터 (샘플 콘텐츠, 추후 교체 예정)
- `src/context/GameContext.tsx` — 플레이어 진행 상태 (localStorage에 저장)
- `src/firebase/` — Firebase 초기화 및 리더보드 read/write
- `src/pages/` — 라우트별 화면
- `firestore.rules` — 리더보드 컬렉션 보안 규칙

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 타입체크 + 프로덕션 빌드
- `npm run lint` — oxlint
- `npm run preview` — 빌드 결과 미리보기
