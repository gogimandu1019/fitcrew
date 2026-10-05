-- 크루 관리 화면용: 활동 현황에 역할(role)과 아바타 색(avatar_color)을 함께 돌려준다.
-- 반환 컬럼이 늘어나므로 함수를 지우고 다시 만든다. kick_member는 이 함수를 이름으로만 부르므로 영향 없다.
drop function public.group_member_activity(uuid);

create function public.group_member_activity(p_group_id uuid)
returns table (
  user_id uuid, nickname text, avatar_color smallint, role text,
  joined_at timestamptz, last_workout_at timestamptz, is_inactive boolean
)
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
  select gm.user_id, p.nickname, p.avatar_color, gm.role, gm.joined_at,
         (select max(w.started_at) from public.workouts w where w.user_id = gm.user_id),
         gm.role <> 'owner'
           and gm.joined_at <= now() - interval '30 days'
           and not exists (
             select 1 from public.workouts w
             where w.user_id = gm.user_id and w.started_at >= now() - interval '30 days'
           )
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id
  order by (gm.role = 'owner') desc, gm.joined_at;
end;
$$;

revoke execute on function public.group_member_activity(uuid) from public, anon, authenticated;
grant execute on function public.group_member_activity(uuid) to authenticated;
