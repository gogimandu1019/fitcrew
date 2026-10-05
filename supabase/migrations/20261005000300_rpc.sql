-- 앱이 호출하는 함수 (RPC)
-- 오류는 `raise exception '<코드>'`로 던진다. 앱은 error.message를 코드로 보고 문구를 고른다.
--   invalid_code · group_full · already_member · forbidden · not_inactive · invalid_period
--   daily_limit_exceeded · future_not_allowed · invalid_sport · under_age · invalid_input

-- ---------------------------------------------------------------
-- 초기 설정 완료 (1/3 ~ 3/3을 한 번에 저장)
-- p_sports: [{"name":"러닝","color":"mint"}, ...]
-- ---------------------------------------------------------------
create function public.complete_onboarding(
  p_nickname text,
  p_gender text,
  p_age integer,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_weekly_goal_min integer,
  p_sports jsonb default '[]'
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  s jsonb;
begin
  if v_uid is null then raise exception 'forbidden'; end if;
  if p_age < 14 then raise exception 'under_age'; end if;

  insert into public.profiles (id, nickname, avatar_color)
  values (v_uid, btrim(p_nickname), abs(hashtext(v_uid::text)) % 8)
  on conflict (id) do update set nickname = excluded.nickname;

  insert into public.profile_private (user_id, gender, age, height_cm, weight_kg, weekly_goal_min)
  values (v_uid, p_gender, p_age, p_height_cm, p_weight_kg, p_weekly_goal_min)
  on conflict (user_id) do update
    set gender = excluded.gender, age = excluded.age, height_cm = excluded.height_cm,
        weight_kg = excluded.weight_kg, weekly_goal_min = excluded.weekly_goal_min,
        updated_at = now();

  for s in select * from jsonb_array_elements(coalesce(p_sports, '[]'::jsonb)) loop
    insert into public.user_sports (user_id, name, color)
    values (v_uid, s ->> 'name', s ->> 'color')
    on conflict (user_id, name_key) do nothing;
  end loop;
end;
$$;

-- ---------------------------------------------------------------
-- 그룹
-- ---------------------------------------------------------------

-- 그룹 만들기: 코드 생성(중복 시 재시도) + 크루장 등록
create function public.create_group(p_name text)
returns public.groups
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_group public.groups;
  v_try integer := 0;
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'forbidden';
  end if;

  loop
    v_try := v_try + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * 32)::int, 1);
    end loop;
    begin
      insert into public.groups (name, code, owner_id)
      values (btrim(p_name), v_code, v_uid)
      returning * into v_group;
      exit;
    exception when unique_violation then
      if v_try >= 10 then raise exception 'code_generation_failed'; end if;
    end;
  end loop;

  insert into public.group_members (group_id, user_id, role) values (v_group.id, v_uid, 'owner');
  return v_group;
end;
$$;

-- 코드로 참여
create function public.join_group(p_code text)
returns public.groups
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_group public.groups;
  v_count integer;
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'forbidden';
  end if;

  -- 정원 검사가 동시에 두 명이 들어와도 깨지지 않게 그룹 행을 잠근다.
  select * into v_group from public.groups
  where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'invalid_code'; end if;

  if exists (select 1 from public.group_members where group_id = v_group.id and user_id = v_uid) then
    raise exception 'already_member';
  end if;

  select count(*) into v_count from public.group_members where group_id = v_group.id;
  if v_count >= v_group.max_members then raise exception 'group_full'; end if;

  insert into public.group_members (group_id, user_id) values (v_group.id, v_uid);
  return v_group;
end;
$$;

-- 탈퇴 공통 로직(내부용). 크루장이 나가면 가장 오래된 '활동 중' 멤버에게 넘기고,
-- 활동 중인 멤버가 없으면 가장 오래된 멤버에게, 마지막 한 명이면 그룹을 없앤다.
create function public._leave_group(p_user_id uuid, p_group_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
  v_successor uuid;
begin
  select role into v_role from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
  if not found then return; end if;

  if v_role = 'owner' then
    select gm.user_id into v_successor
    from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id <> p_user_id
    order by
      exists (
        select 1 from public.workouts w
        where w.user_id = gm.user_id and w.started_at >= now() - interval '30 days'
      ) desc,
      gm.joined_at asc
    limit 1;

    if v_successor is null then
      delete from public.groups where id = p_group_id; -- 마지막 한 명: 그룹 해산 (멤버는 cascade)
      return;
    end if;

    update public.group_members set role = 'member' where group_id = p_group_id and user_id = p_user_id;
    update public.group_members set role = 'owner' where group_id = p_group_id and user_id = v_successor;
    update public.groups set owner_id = v_successor where id = p_group_id;
  end if;

  delete from public.group_members where group_id = p_group_id and user_id = p_user_id;
end;
$$;

create function public.leave_group(p_group_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'forbidden'; end if;
  perform public._leave_group(auth.uid(), p_group_id);
end;
$$;

-- 크루장 전용: 멤버 활동 현황 (일반 크루원이 호출하면 forbidden)
-- 미활동 = 30일간 운동 기록 없음. 방금 가입한 멤버를 바로 내보낼 수 없도록 가입 30일 경과도 요구한다(가정).
create function public.group_member_activity(p_group_id uuid)
returns table (user_id uuid, nickname text, joined_at timestamptz, last_workout_at timestamptz, is_inactive boolean)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'forbidden';
  end if;

  return query
  select gm.user_id, p.nickname, gm.joined_at,
         (select max(w.started_at) from public.workouts w where w.user_id = gm.user_id),
         gm.joined_at <= now() - interval '30 days'
           and not exists (
             select 1 from public.workouts w
             where w.user_id = gm.user_id and w.started_at >= now() - interval '30 days'
           )
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id
  order by gm.joined_at;
end;
$$;

-- 크루장 전용: 미활동 멤버 내보내기
create function public.kick_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'forbidden';
  end if;

  if p_user_id = auth.uid() then raise exception 'forbidden'; end if;

  if not exists (
    select 1 from public.group_member_activity(p_group_id) a
    where a.user_id = p_user_id and a.is_inactive
  ) then
    raise exception 'not_inactive';
  end if;

  delete from public.group_members where group_id = p_group_id and user_id = p_user_id;
end;
$$;

-- ---------------------------------------------------------------
-- 홈 · 그룹 전환 시트 · 랭킹
-- ---------------------------------------------------------------

-- 이번 주 내 운동 카드 (2:25 / 4:00 목표)
create function public.my_week_summary()
returns table (total_min integer, goal_min integer)
language sql stable security definer set search_path = public
as $$
  select
    coalesce((select sum(w.duration_min) from public.workouts w
              where w.user_id = auth.uid() and w.started_at >= public.fit_week_start(now())), 0)::int,
    coalesce((select pp.weekly_goal_min from public.profile_private pp where pp.user_id = auth.uid()), 240)
$$;

-- 그룹 전환 시트: 내 그룹과 그룹별 오늘 운동한 인원
create function public.my_groups_overview()
returns table (group_id uuid, name text, code text, role text, member_count integer, active_today integer)
language sql stable security definer set search_path = public
as $$
  select g.id, g.name, g.code, me.role,
         (select count(*) from public.group_members m where m.group_id = g.id)::int,
         (select count(distinct w.user_id)
            from public.group_members m
            join public.workouts w on w.user_id = m.user_id and w.started_at >= public.fit_day_start(now())
           where m.group_id = g.id)::int
  from public.group_members me
  join public.groups g on g.id = me.group_id
  where me.user_id = auth.uid()
  order by me.joined_at
$$;

-- 오늘 운동한 멤버 (아바타 줄: 운동한 멤버는 라임 링)
create function public.group_today(p_group_id uuid)
returns table (user_id uuid, nickname text, avatar_color smallint, did_today boolean, is_me boolean)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_group_member(p_group_id) then raise exception 'forbidden'; end if;
  return query
  select gm.user_id, p.nickname, p.avatar_color,
         exists (select 1 from public.workouts w
                 where w.user_id = gm.user_id and w.started_at >= public.fit_day_start(now())),
         gm.user_id = auth.uid()
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id
  order by (gm.user_id = auth.uid()) desc, gm.joined_at;
end;
$$;

-- 날짜별 피드 (최신순). p_before: 이 시각보다 이전 기록만 (무한 스크롤용)
create function public.group_feed(p_group_id uuid, p_before timestamptz default null, p_limit integer default 30)
returns table (
  workout_id uuid, user_id uuid, nickname text, avatar_color smallint,
  sport_name text, sport_color text, duration_min integer, started_at timestamptz,
  intensity text, memo text, fit_day date
)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_group_member(p_group_id) then raise exception 'forbidden'; end if;
  return query
  select w.id, w.user_id, p.nickname, p.avatar_color, s.name, s.color,
         w.duration_min, w.started_at, w.intensity, w.memo, public.fit_day(w.started_at)
  from public.workouts w
  join public.group_members gm on gm.user_id = w.user_id and gm.group_id = p_group_id
  join public.profiles p on p.id = w.user_id
  join public.user_sports s on s.id = w.sport_id
  where (p_before is null or w.started_at < p_before)
  order by w.started_at desc
  limit least(greatest(p_limit, 1), 100);
end;
$$;

-- 랭킹: 운동 시간 합계. 공동 순위는 같은 등수. 기록이 없는 멤버도 0분으로 포함.
-- 주 종목 = 기간 내 합계 시간이 가장 긴 종목
create function public.group_ranking(p_group_id uuid, p_period text)
returns table (
  rank integer, user_id uuid, nickname text, avatar_color smallint,
  total_min integer, top_sport_name text, top_sport_color text, is_me boolean
)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_from timestamptz;
begin
  if not public.is_group_member(p_group_id) then raise exception 'forbidden'; end if;
  if p_period = 'week' then v_from := public.fit_week_start(now());
  elsif p_period = 'month' then v_from := public.fit_month_start(now());
  else raise exception 'invalid_period';
  end if;

  return query
  with members as (
    select gm.user_id from public.group_members gm where gm.group_id = p_group_id
  ),
  per_sport as (
    select w.user_id, s.name, s.color, sum(w.duration_min)::int as minutes
    from public.workouts w
    join members m on m.user_id = w.user_id
    join public.user_sports s on s.id = w.sport_id
    where w.started_at >= v_from
    group by w.user_id, s.name, s.color
  ),
  totals as (
    select m.user_id, coalesce(sum(ps.minutes), 0)::int as total
    from members m left join per_sport ps on ps.user_id = m.user_id
    group by m.user_id
  ),
  top as (
    select distinct on (ps.user_id) ps.user_id, ps.name, ps.color
    from per_sport ps order by ps.user_id, ps.minutes desc, ps.name
  )
  select (rank() over (order by t.total desc))::int,
         t.user_id, p.nickname, p.avatar_color, t.total,
         tp.name, tp.color, t.user_id = auth.uid()
  from totals t
  join public.profiles p on p.id = t.user_id
  left join top tp on tp.user_id = t.user_id
  order by 1, p.nickname;
end;
$$;

-- ---------------------------------------------------------------
-- 계정 삭제 (앱스토어 심사 필수)
-- 크루장이면 위임·해산 규칙을 먼저 적용한 뒤 계정을 지운다. 기록은 cascade로 함께 삭제된다.
-- ---------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  g uuid;
begin
  if v_uid is null then raise exception 'forbidden'; end if;
  for g in select group_id from public.group_members where user_id = v_uid loop
    perform public._leave_group(v_uid, g);
  end loop;
  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------
-- 실행 권한: 로그인한 사용자만. 내부 함수는 아무도 직접 부르지 못하게 한다.
-- ---------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.complete_onboarding(text, text, integer, numeric, numeric, integer, jsonb),
  public.create_group(text),
  public.join_group(text),
  public.leave_group(uuid),
  public.group_member_activity(uuid),
  public.kick_member(uuid, uuid),
  public.my_week_summary(),
  public.my_groups_overview(),
  public.group_today(uuid),
  public.group_feed(uuid, timestamptz, integer),
  public.group_ranking(uuid, text),
  public.delete_my_account(),
  -- RLS 정책 안에서 쓰이는 함수
  public.is_group_member(uuid),
  public.shares_group_with(uuid)
to authenticated;
-- 시간 규칙 함수는 앱이 직접 써도 안전하다.
grant execute on function
  public.fit_day_start(timestamptz), public.fit_day(timestamptz),
  public.fit_week_start(timestamptz), public.fit_month_start(timestamptz)
to authenticated;
