-- FitCrew 스키마 (MVP)
-- 규칙의 출처: FitCrew PRD, 개발 계획안 1절 결정 사항

-- ---------------------------------------------------------------
-- 시간 규칙: 하루와 한 주는 KST 03:00에 바뀐다.
--   · 주: 월요일 03:00 KST 초기화 (PRD 결정)
--   · 하루: 주 경계와 어긋나지 않도록 같은 03:00 기준 (가정 — 확정 필요)
-- 앱·랭킹·검증 모두 아래 함수만 쓴다. 날짜 계산을 다른 곳에서 하지 않는다.
-- ---------------------------------------------------------------

create function public.fit_day_start(ts timestamptz)
returns timestamptz
language sql stable
as $$
  select (date_trunc('day', (ts at time zone 'Asia/Seoul') - interval '3 hours') + interval '3 hours')
         at time zone 'Asia/Seoul'
$$;

create function public.fit_day(ts timestamptz)
returns date
language sql stable
as $$
  select ((ts at time zone 'Asia/Seoul') - interval '3 hours')::date
$$;

create function public.fit_week_start(ts timestamptz)
returns timestamptz
language sql stable
as $$
  select (date_trunc('week', (ts at time zone 'Asia/Seoul') - interval '3 hours') + interval '3 hours')
         at time zone 'Asia/Seoul'
$$;

create function public.fit_month_start(ts timestamptz)
returns timestamptz
language sql stable
as $$
  select (date_trunc('month', (ts at time zone 'Asia/Seoul') - interval '3 hours') + interval '3 hours')
         at time zone 'Asia/Seoul'
$$;

-- ---------------------------------------------------------------
-- 사용자
-- ---------------------------------------------------------------

-- 크루원에게 보이는 정보
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 10),
  avatar_color smallint not null default 0 check (avatar_color between 0 and 7), -- avatarPalette 인덱스
  created_at timestamptz not null default now()
);

-- 본인만 보는 정보 (신체 정보는 운동량 추천에만 쓰고 크루에게 공개하지 않는다)
create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  gender text not null default 'undisclosed' check (gender in ('male', 'female', 'undisclosed')),
  age smallint not null check (age between 14 and 120), -- 만 14세 미만 가입 차단
  height_cm numeric(4, 1) not null check (height_cm between 100 and 250),
  weight_kg numeric(4, 1) not null check (weight_kg between 20 and 300),
  weekly_goal_min integer not null default 240 check (weekly_goal_min between 30 and 2400), -- 개인 하나, 그룹과 무관
  updated_at timestamptz not null default now()
);

-- 종목은 자유 입력, 색은 기본 팔레트(tokens.ts sportPalette)에서 선택
create table public.user_sports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 20),
  name_key text generated always as (lower(btrim(name))) stored, -- 공백·대소문자만 다른 중복 방지
  color text not null check (color in ('sky', 'coral', 'violet', 'amber', 'mint', 'pink', 'orange', 'white')),
  archived_at timestamptz, -- 기록이 있는 종목은 지우지 않고 보관 처리
  created_at timestamptz not null default now(),
  unique (user_id, name_key)
);

-- ---------------------------------------------------------------
-- 그룹
-- ---------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 20),
  -- 영문+숫자 6자리, 헷갈리는 0/O, 1/I 제외
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  owner_id uuid not null references public.profiles (id),
  max_members smallint not null default 30,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);
-- 그룹당 크루장은 한 명
create unique index group_members_one_owner on public.group_members (group_id) where role = 'owner';

-- ---------------------------------------------------------------
-- 운동 기록: 한 번만 저장하고, 소속된 모든 그룹에 조인으로 반영한다.
-- ---------------------------------------------------------------

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sport_id uuid not null references public.user_sports (id),
  duration_min integer not null check (duration_min between 1 and 1440),
  started_at timestamptz not null,
  intensity text not null check (intensity in ('light', 'normal', 'hard')),
  memo text check (memo is null or char_length(memo) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workouts_user_started_idx on public.workouts (user_id, started_at desc);

-- 허위 기록 방지: 하루 합계 24시간 이하, 미래 시각 금지, 본인의 보관 안 된 종목만 사용
create function public.workouts_validate()
returns trigger
language plpgsql
as $$
declare
  v_day_start timestamptz;
  v_others integer;
begin
  if new.started_at > now() + interval '10 minutes' then
    raise exception 'future_not_allowed';
  end if;

  if not exists (
    select 1 from public.user_sports s
    where s.id = new.sport_id and s.user_id = new.user_id and s.archived_at is null
  ) then
    raise exception 'invalid_sport';
  end if;

  v_day_start := public.fit_day_start(new.started_at);
  select coalesce(sum(w.duration_min), 0) into v_others
  from public.workouts w
  where w.user_id = new.user_id
    and w.id <> new.id
    and w.started_at >= v_day_start
    and w.started_at < v_day_start + interval '1 day';

  if v_others + new.duration_min > 1440 then
    raise exception 'daily_limit_exceeded';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger workouts_validate_trg
  before insert or update on public.workouts
  for each row execute function public.workouts_validate();
