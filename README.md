# FitCrew

크루가 그룹 코드로 모여 매일의 운동을 기록·공유하고, 주간 운동 시간으로 서로 동기부여하는 모바일 앱.

```
FitCrew/
├─ app/            Expo(React Native) 앱 — Expo Router, TanStack Query, Supabase
├─ supabase/
│  ├─ migrations/  DB 스키마·권한(RLS)·함수(RPC)
│  └─ tests/       DB 규칙 테스트 (PGlite, Docker 불필요)
├─ design/         디자인 시스템 문서, HTML 목업 (토큰 원본은 app/src/design/tokens.ts)
└─ .github/        CI
```

개발 계획: `../FitCrew 개발 계획.md`

## 바로 해 보기

```bash
# DB 규칙 테스트
cd supabase/tests && npm install && npm test

# 앱 (서버 없이 "미리보기 모드"로 화면 둘러보기)
cd app && npm install && npm run web      # 또는 npm run ios / android
npm run typecheck && npx expo lint && npm test
```

## 서버 연결 (Supabase)

1. Supabase 프로젝트를 만들고 `supabase/migrations/*.sql`을 파일명 순서대로 SQL Editor에서 실행한다.
2. `app/.env.example`을 `app/.env`로 복사하고 URL과 anon key를 채운다. URL은 `https://<ref>.supabase.co`까지만 쓴다(뒤에 `/rest/v1/`이 붙어도 앱이 잘라 쓴다). 값이 없으면 앱은 미리보기 모드로 열린다.
3. 로그인 — **지금은 웹 + Google 하나만** 켠다.
   - Google Cloud Console: OAuth 동의 화면(테스트 사용자에 본인 계정 추가) → OAuth 클라이언트 ID(웹 애플리케이션) 생성. 승인된 JavaScript 원본 `http://localhost:8081`, 승인된 리디렉션 URI `https://<ref>.supabase.co/auth/v1/callback`
   - Supabase > Authentication > Providers > Google 켜고 클라이언트 ID·secret 입력
   - Supabase > Authentication > URL Configuration > Redirect URLs에 `http://localhost:8081/**` 추가
   - 카카오·Apple·이메일 로그인과 iOS·Android 네이티브 로그인은 모바일 출시 전에 추가한다. (Apple은 다른 소셜 로그인을 제공하면 앱스토어 심사에서 필수)

## 구조 메모

- **하루·주·월의 경계는 KST 03:00.** 날짜 계산은 `fit_day / fit_week_start / fit_month_start` 함수 한 곳에서만 한다.
- **운동 기록은 한 번만 저장**하고 소속된 모든 그룹에 조인으로 반영한다. 그룹마다 복사하지 않는다.
- **권한은 서버에서 검사한다.** 같은 그룹 멤버만 서로를 보고, 신체 정보는 본인만 보며, 그룹 가입·탈퇴·강퇴는 RPC로만 가능하다.
- 앱은 `supabase`를 화면에서 직접 부르지 않고 `app/src/lib/api.ts`만 거친다. DB가 던지는 오류 코드는 `app/src/lib/errors.ts`에서 문구로 바꾼다.

## 확정이 필요한 가정

PRD에 없어서 임의로 정한 값들이다. 바꾸려면 해당 위치만 고치면 된다.

| 가정 | 위치 |
|---|---|
| 하루 경계도 03:00 (주 경계와 같은 기준) | `migrations/..._schema.sql` fit_day_start |
| 미활동 판정은 30일 무기록 **+ 가입 30일 경과** (방금 가입한 사람을 바로 내보내지 못하게) | `group_member_activity` |
| 미래 시각 기록은 10분까지만 허용 | `workouts_validate` |
| 과거 기록 입력 기한 제한 없음 | (제한 없음) |
| 닉네임 1~10자·중복 허용, 크루 이름 1~20자, 메모 100자 | schema 의 check 제약 |
| 한 사용자가 속할 수 있는 그룹 수 제한 없음 | (제한 없음) |
| 초대 코드 대입 공격 제한 없음 (경우의 수 약 10억) | Phase 4 에서 속도 제한 검토 |
| 번들 ID `com.fitcrew.app` | `app/app.json` |

## Phase 4 추가 사항
- 마이그레이션 `20261005000500_feed_cursor_metrics.sql`: 피드 이어 읽기 커서 `(started_at, id)` + 베타 지표 뷰 `metrics_*` (관리자 전용)
- 약관·방침: `app/src/lib/legal.ts` 가 원본, `cd app && npm run legal` 로 `legal/*.md` 생성
- 베타 운영: [BETA.md](BETA.md), 스토어 자료: [store/listing.md](store/listing.md)
- 선택 환경변수: `EXPO_PUBLIC_DEMO_CODE`, `EXPO_PUBLIC_OPERATOR_NAME`, `EXPO_PUBLIC_CONTACT_EMAIL`, `EXPO_PUBLIC_PRIVACY_URL`
