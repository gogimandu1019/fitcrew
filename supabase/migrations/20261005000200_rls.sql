-- 권한 (RLS)
-- 원칙: 화면에서 숨기는 것만으로는 부족하다. 모든 권한 검사는 여기서 한다.
--   · 같은 그룹 멤버만 서로의 이름·기록을 볼 수 있다.
--   · 신체 정보(profile_private)는 본인만 본다.
--   · 그룹 가입·탈퇴·강퇴·생성은 직접 INSERT/DELETE를 막고 RPC로만 한다.

-- RLS 정책 안에서 group_members를 다시 조회하면 재귀가 생기므로 security definer 함수로 묶는다.
create function public.is_group_member(p_group_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  )
$$;

create function public.shares_group_with(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p_user_id = auth.uid()
      or exists (
        select 1
        from public.group_members me
        join public.group_members other on other.group_id = me.group_id
        where me.user_id = auth.uid() and other.user_id = p_user_id
      )
$$;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.user_sports enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.workouts enable row level security;

-- profiles: 본인 + 같은 그룹 멤버. 생성은 complete_onboarding RPC로만.
create policy profiles_select on public.profiles
  for select to authenticated using (public.shares_group_with(id));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- profile_private: 본인만
create policy private_all_own on public.profile_private
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- user_sports: 본인 + 같은 그룹 멤버가 읽기 (피드에 종목명·색이 보임). 쓰기는 본인만.
create policy sports_select on public.user_sports
  for select to authenticated using (public.shares_group_with(user_id));
create policy sports_insert_own on public.user_sports
  for insert to authenticated with check (user_id = auth.uid());
create policy sports_update_own on public.user_sports
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- 삭제는 열지 않는다: 기록이 있는 종목은 archived_at으로 보관한다.

-- groups: 멤버만 읽기. 이름 변경은 크루장만. 생성·삭제는 RPC로만.
create policy groups_select on public.groups
  for select to authenticated using (public.is_group_member(id));
create policy groups_update_owner on public.groups
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- group_members: 같은 그룹 멤버만 읽기. 변경은 전부 RPC로만.
create policy members_select on public.group_members
  for select to authenticated using (public.is_group_member(group_id));

-- workouts: 본인 + 같은 그룹 멤버가 읽기. 쓰기는 본인만.
create policy workouts_select on public.workouts
  for select to authenticated using (public.shares_group_with(user_id));
create policy workouts_insert_own on public.workouts
  for insert to authenticated with check (user_id = auth.uid());
create policy workouts_update_own on public.workouts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy workouts_delete_own on public.workouts
  for delete to authenticated using (user_id = auth.uid());

-- 테이블 권한: 로그인하지 않은 사용자(anon)에게는 아무것도 주지 않는다.
revoke all on all tables in schema public from anon;
grant select, update (nickname) on public.profiles to authenticated;
grant select, insert, update, delete on public.profile_private to authenticated;
grant select, insert, update on public.user_sports to authenticated;
grant select, update (name) on public.groups to authenticated;
grant select on public.group_members to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
