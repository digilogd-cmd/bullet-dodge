# 🍎 Bullet Dodge (총알 피하기) - 애플 앱스토어(iOS) 출시 인수인계서 (Handover Document)

> **[안내]** 새 채팅창에서 이 문서를 복사하여 Antigravity에게 전달하시면, 곧바로 애플 앱스토어(iOS) 빌드 및 제출 작업으로 원활하게 전환됩니다.

---

## 🎯 1. 프로젝트 핵심 정보 (Project Identity)

| 항목 | 정보 |
| :--- | :--- |
| **앱 이름 (App Title)** | `Bullet Dodge : 총알 피하기` (`Bullet Dodge`) |
| **개발자/회사명 (Developer)** | `아트고메` (`artgourmet`) |
| **번들 ID (Bundle ID)** | `com.retro.bulletdodge` |
| **웹 게임 엔진 경로** | `E:\안티그래비티\bullet-dodge` |
| **안드로이드 프로젝트 경로** | `E:\bullet_dodge_android` |
| **안드로이드 최신 버전** | `v1.0.15` (VersionCode `16`) |
| **스토어 라이브 URL** | [Google Play Store](https://play.google.com/store/apps/details?id=com.retro.bulletdodge) |

---

## 🕹️ 2. 게임 핵심 사양 및 검증 완료 항목 (Game Specs)

1. **캔버스 렌더링 엔진**:
   - 순수 HTML5 / CSS3 / Vanilla JS 캔버스 그래픽스 엔진 (`index.html`, `game.js`, `style.css`)
   - **60 FPS 수직 동기화(vsync)** 연동 렌더링으로 스마트폰에서 끊김 없는 스무스한 움직임 보장
2. **조작 및 UI**:
   - 모바일 터치/드래그, 온스크린 터치 패드, 반응형 가로/세로 비율 캔버스 대응
3. **난이도 및 보상 밸런스**:
   - 탄환 기본 이동 속도 `1.3` (입문자 친화적 피하기 난이도)
   - 최초 가입 이벤트 혜택: **`3,000 코인`** 초기 지급
4. **인앱 상점 (In-App Purchases)**:
   - `pack_starter` ($0.99 / ₩1,200 - 스타터 코인 팩)
   - `pack_booster` ($2.99 / ₩3,300 - 부스터 코인 팩)
5. **로그인 시스템**:
   - 구글 원클릭 계정 연동 (`Firebase Authentication`)

---

## 📢 3. Google AdMob 광고 유닛 ID 정보 (AdMob Production IDs)

- **AdMob App ID**: `ca-app-pub-7268585631038313~9627756184`
- **배너 광고 (Banner)**: `ca-app-pub-7268585631038313/1183296061`
- **전면 광고 (Interstitial)**: `ca-app-pub-7268585631038313/2096735165`
- **보상형 동영상 광고 (Rewarded)**: `ca-app-pub-7268585631038313/6748443916`

> 💡 **iOS AdMob 주의사항**: iOS용 AdMob App ID 및 Ad Unit ID는 구글 애드몹 콘솔에서 `iOS 앱 추가` 후 새로 발급받거나 통합 ID로 세팅해야 합니다.

---

## 🍏 4. 애플 앱스토어(iOS) 출시 준비 로드맵 (Apple Release Checklist)

### 1단계: 개발 환경 및 프레임워크 선택
- **Windows PC 기반 iOS 빌드 전략**:
  - `Capacitor` 또는 `Cordova`로 HTML5 웹앱을 iOS Xcode 프로젝트로 패키징.
  - **GitHub Actions (무료 macOS 파이프라인)** 또는 **Codemagic / Expo EA**를 활용하여 Mac 없이도 iOS `.ipa` 빌드 자동화 가능!

### 2단계: 애플 개발자 계정 준비
- [Apple Developer Program](https://developer.apple.com/programs/) 가입 ($99/연)
- App Store Connect 앱 생성 (`com.retro.bulletdodge`)

### 3단계: iOS 앱 에셋 준비
- **앱 아이콘**: `1024x1024` PNG (투명도 없는 사각형)
- **스크린샷**: iPhone 6.5인치/6.7인치 규격 스크린샷 3~4장
- **개인정보처리방침 (Privacy Policy URL)** 준비

---

## 💬 5. 새 채팅창 시작 시 전송할 첫 멘트 (Prompt Template)

```text
안녕 Antigravity! 
우리 'Bullet Dodge : 총알 피하기' 앱을 안드로이드 구글 플레이(v1.0.14)에 성공적으로 올렸어.
이제 애플 앱스토어(iOS)에 올리기 위한 작업을 시작하려고 해!

E:\안티그래비티\bullet-dodge\APPLE_RELEASE_HANDOVER.md 인수인계서를 바탕으로 
Windows 환경에서 iOS용 패키징(Capacitor/GitHub Actions 등) 및 앱스토어 제출 절차를 차근차근 이끌어줘!
```
