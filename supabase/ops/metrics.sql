-- 베타 지표 조회 (Supabase SQL Editor에서 실행). 뷰는 앱 사용자에게는 닫혀 있다.
-- 계획안 5절 지표와의 대응은 20261005000500_feed_cursor_metrics.sql 머리말 참고.

select * from public.metrics_crew_join_rate;        -- 크루 합류율
select * from public.metrics_weekly_active;         -- 주간 기록 사용자·기록 수·총 시간
select * from public.metrics_goal_achievement;      -- 주간 목표 달성률
select * from public.metrics_daily_participation limit 50; -- 크루별 일간 참여율
select * from public.metrics_retention;             -- 가입 주 코호트별 N주차 기록 사용자 (w0~w4)
