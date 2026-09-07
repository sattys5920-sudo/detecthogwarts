# Windows '89 모니터 앱 시안

1989년식 CRT 모니터로 보는 것 같은 느낌의 앱 화면 시안.

- `Main.dc.html` — 파일 관리자
- `Paint.dc.html` — 그림판
- `Calculator.dc.html` — 계산기
- `Terminal.dc.html` — BBS 통신 (모노크롬 그린 스크린)
- `MediaPlayer.dc.html` — 미디어 재생기
- `Desktop.dc.html` — 바탕화면 아이콘 (프로필 · 채팅 · 검색 · 내 폴더 · 인터넷, 하단에 시작 표시줄). **클릭 가능한 프로토타입**: 아이콘을 누르면 해당 화면이 열리고, 타이틀바의 ✕를 누르면 바탕화면으로 돌아갑니다.
- `canvas.json` — 캔버스에서 6개 시안을 한 줄로 배치하는 레이아웃

Claude Design 캔버스로 발행한 시안: https://claude.ai/code/artifact/7cfb09ab-052e-4039-a923-6d5232c78d5d

베이지색 플라스틱 CRT 본체, 스캔라인, 비네트 효과로 통일하고 화면 안쪽은 클래식 Windows GUI(진한 남색 타이틀바, 3D 베벨 버튼, 회색 크롬)를 그대로 재현했습니다. BBS 통신 화면만 모노크롬 그린 포스포 스크린으로 차별화했습니다.
