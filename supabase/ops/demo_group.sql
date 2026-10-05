-- 베타·심사용 데모 크루 코드(RUN24K) 만들기.
-- 1) 앱에서 크루를 하나 만든다 (운영자 계정으로).
-- 2) 그 크루의 코드를 아래에서 RUN24K로 바꾼다. Supabase SQL Editor(관리자 권한)에서 실행한다.
--    코드 규칙: 영문 대문자+숫자 6자리, 0/O/1/I 제외 — RUN24K는 규칙에 맞는다.
-- 3) app/.env 에 EXPO_PUBLIC_DEMO_CODE=RUN24K 를 넣으면 '크루 참여' 화면에 베타 데모 코드 안내가 나온다.

-- 바꿀 크루 확인 (이름으로 찾기)
select id, name, code, owner_id, created_at from public.groups order by created_at desc limit 10;

-- 실행: '<크루 id>' 자리에 위에서 찾은 id를 넣는다
-- update public.groups set code = 'RUN24K' where id = '<크루 id>';
