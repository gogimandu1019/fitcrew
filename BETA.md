# 베타 운영 가이드

## 지금 가능한 베타 방식: 웹
로그인이 웹 Google 로그인만 구현돼 있어, 앱스토어 베타(TestFlight)는 네이티브 로그인 전에는 열 수 없다.
지인 크루 3~5팀 베타는 웹 주소로 먼저 연다. (휴대폰 브라우저에서 "홈 화면에 추가")

### 배포
```bash
cd app && npx expo export -p web      # dist/ 가 만들어진다 (약 1.8MB 번들)
```
- `dist/` 를 정적 호스팅(Netlify, Vercel, Cloudflare Pages 등)에 올린다. ⚠ 단일 페이지 앱이라 모든 경로를 `index.html`로 돌려주는 설정(SPA rewrite)이 필요하다.
- 빌드 환경변수: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_DEMO_CODE=RUN24K`, `EXPO_PUBLIC_CONTACT_EMAIL`, 선택 `EXPO_PUBLIC_OPERATOR_NAME`, `EXPO_PUBLIC_PRIVACY_URL`. (secret·service_role 키는 절대 넣지 않는다.)
- Supabase > Authentication > URL Configuration 의 Redirect URLs 에 배포 주소를 추가한다. Google Cloud OAuth 클라이언트의 "승인된 JavaScript 원본"에도 배포 주소를 추가한다.

### 데모 크루
`supabase/ops/demo_group.sql` 참고.

### 지표 보기
`supabase/ops/metrics.sql` 을 Supabase SQL Editor에서 실행한다. 목표치는 베타 데이터로 기준선을 잡은 뒤 정한다.

## 앱스토어/구글플레이 출시 전 막힌 일
1. **네이티브 로그인**: Google(네이티브), Apple 로그인(iOS 필수 — 심사 지침 4.8), 카카오(선택). 지금은 `native_not_supported` 로 막혀 있다.
2. 개발자 계정: Apple Developer Program, Google Play Console. ⚠ 계정 명의·결제는 직접 해야 한다.
3. `legal/` 문서에 운영자·연락처를 채우고 웹에 게시, 법률 검토.
4. 스토어 자료: `store/listing.md`.
5. 신고·차단 기능: 심사에서 요구할 수 있다(사용자 생성 콘텐츠).
6. EAS 빌드: `app/eas.json` 준비됨. 로그인 구현 후 `npx eas-cli build --profile preview`.
