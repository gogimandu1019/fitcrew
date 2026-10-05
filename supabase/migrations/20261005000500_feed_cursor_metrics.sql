-- Phase 4
-- 1) 피드 이어 읽기: started_at이 같은 기록이 페이지 경계에 걸리면 빠지던 문제를 (started_at, id) 커서로 고친다.
-- 2) 베타 지표 뷰: PRD 5절 지표를 SQL로 바로 본다. 앱 사용자에게는 열지 않고 SQL Editor(관리자)에서만 조회한다.

drop function public.group_feed(uuid, timestamptz, integer);

create function public.group_feed(
  p_group_id uuid,
  p_before timestamptz default null,
  p_limit integer default 30,
  p_before_id uuid default null
)
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
  where p_before is null
     or w.started_at < p_before
     or (p_before_id is not null and w.started_at = p_before and w.id < p_before_id)
  order by w.started_at desc, w.id desc
  limit least(greatest(p_limit, 1), 100);
end;
$$;

revoke execute on function public.group_feed(uuid, timestamptz, integer, uuid) from public, anon, authenticated;
grant execute on function public.group_feed(uuid, timestamptz, integer, uuid) to authenticated;

-- ---------------------------------------------------------------
-- 베타 지표 (PRD 5절). RLS를 우회하는 집계라서 anon/authenticated에는 권한을 주지 않는다.
-- ---------------------------------------------------------------

-- 크루 합류율: 가입을 마친 사용자 중 크루에 들어간 비율
create view public.metrics_crew_join_rate as
select
  count(*) as signups,
  count(*) filter (where exists (select 1 from public.group_members gm where gm.user_id = p.id)) as joined,
  round(100.0 * count(*) filter (where exists (select 1 from public.group_members gm where gm.user_id = p.id))
        / nullif(count(*), 0), 1) as join_rate_pct
from public.profiles p;

-- 주간 기록 사용자: 주(KST 03:00 월요일 기준)별로 기록한 사람 수
create view public.metrics_weekly_active as
select public.fit_week_start(started_at)::date as week_start,
       count(distinct user_id) as active_users,
       count(*) as workouts,
       sum(duration_min) as total_min
from public.workouts
group by 1
order by 1 desc;

-- 목표 달성률: 주별로 (그 주 누적 ≥ 현재 주간 목표)인 사용자 비율. 목표는 변경 이력이 없어 현재 값을 쓴다.
create view public.metrics_goal_achievement as
with weekly as (
  select public.fit_week_start(w.started_at) as week_start, w.user_id, sum(w.duration_min) as total_min
  from public.workouts w
  group by 1, 2
)
select weekly.week_start::date as week_start,
       count(*) as active_users,
       count(*) filter (where weekly.total_min >= pp.weekly_goal_min) as achieved,
       round(100.0 * count(*) filter (where weekly.total_min >= pp.weekly_goal_min) / count(*), 1) as achieved_pct
from weekly
join public.profile_private pp on pp.user_id = weekly.user_id
group by 1
order by 1 desc;

-- 일간 참여율: 크루별·하루(03:00 기준)별 기록한 멤버 / 전체 멤버 (지금 멤버 기준)
create view public.metrics_daily_participation as
select gm.group_id,
       g.name as group_name,
       public.fit_day(w.started_at) as day,
       count(distinct w.user_id) as active_members,
       (select count(*) from public.group_members x where x.group_id = gm.group_id) as members,
       round(100.0 * count(distinct w.user_id)
             / (select count(*) from public.group_members x where x.group_id = gm.group_id), 1) as participation_pct
from public.workouts w
join public.group_members gm on gm.user_id = w.user_id
join public.groups g on g.id = gm.group_id
group by gm.group_id, g.name, public.fit_day(w.started_at)
order by day desc, group_name;

-- 리텐션: 가입 주(코호트)별로, 가입 후 N주차(0=가입한 주)에 기록한 사용자 수
create view public.metrics_retention as
with cohort as (
  select id as user_id, public.fit_week_start(created_at) as cohort_week from public.profiles
),
activity as (
  select distinct c.cohort_week, c.user_id,
         ((public.fit_week_start(w.started_at)::date - c.cohort_week::date) / 7) as week_no
  from cohort c
  join public.workouts w on w.user_id = c.user_id
  where w.started_at >= c.cohort_week
)
select c.cohort_week::date as cohort_week,
       count(distinct c.user_id) as cohort_size,
       count(distinct a.user_id) filter (where a.week_no = 0) as w0,
       count(distinct a.user_id) filter (where a.week_no = 1) as w1,
       count(distinct a.user_id) filter (where a.week_no = 2) as w2,
       count(distinct a.user_id) filter (where a.week_no = 3) as w3,
       count(distinct a.user_id) filter (where a.week_no = 4) as w4
from cohort c
left join activity a on a.user_id = c.user_id
group by c.cohort_week
order by c.cohort_week desc;

revoke all on
  public.metrics_crew_join_rate, public.metrics_weekly_active, public.metrics_goal_achievement,
  public.metrics_daily_participation, public.metrics_retention
from public, anon, authenticated;
