// 백엔드 호출은 전부 이 파일을 거친다. 화면은 supabase를 직접 부르지 않는다.
// 함수 이름·인자·반환은 supabase/migrations/*_rpc.sql 과 1:1로 맞춘다.
import { AppError } from './errors';
import { supabase } from './supabase';

export type SportColorKey = 'sky' | 'coral' | 'violet' | 'amber' | 'mint' | 'pink' | 'orange' | 'white';
export type Intensity = 'light' | 'normal' | 'hard';
export type Gender = 'male' | 'female' | 'undisclosed';
export type RankPeriod = 'week' | 'month';

export type MyProfile = { id: string; nickname: string; avatar_color: number };
export type MySport = { id: string; name: string; color: SportColorKey; archived_at: string | null };
export type WorkoutRow = {
  id: string; sport_id: string; duration_min: number; started_at: string; intensity: Intensity; memo: string | null;
};
export type MyPrivate = { gender: Gender; age: number; height_cm: number; weight_kg: number; weekly_goal_min: number };
export type ProfileInput = { nickname: string; gender: Gender; age: number; heightCm: number; weightKg: number };
export type Group = { id: string; name: string; code: string; owner_id: string; max_members: number };
export type GroupOverview = {
  group_id: string; name: string; code: string; role: 'owner' | 'member'; member_count: number; active_today: number;
};
export type WeekSummary = { total_min: number; goal_min: number };
export type TodayMember = { user_id: string; nickname: string; avatar_color: number; did_today: boolean; is_me: boolean };
export type FeedItem = {
  workout_id: string; user_id: string; nickname: string; avatar_color: number; sport_name: string; sport_color: SportColorKey;
  duration_min: number; started_at: string; intensity: Intensity; memo: string | null; fit_day: string;
};
export type RankRow = {
  rank: number; user_id: string; nickname: string; avatar_color: number; total_min: number;
  top_sport_name: string | null; top_sport_color: SportColorKey | null; is_me: boolean;
};
export type MemberActivity = {
  user_id: string; nickname: string; avatar_color: number; role: 'owner' | 'member';
  joined_at: string; last_workout_at: string | null; is_inactive: boolean;
};
export type OnboardingInput = {
  nickname: string; gender: Gender; age: number; heightCm: number; weightKg: number; weeklyGoalMin: number;
  sports: { name: string; color: SportColorKey }[];
};
export type WorkoutInput = {
  sportId: string; durationMin: number; startedAt: string; intensity: Intensity; memo?: string;
};

function client() {
  if (!supabase) throw new AppError('no_backend');
  return supabase;
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().rpc(fn, args);
  if (error) throw new AppError(error.message);
  return data as T;
}

export const api = {
  completeOnboarding: (i: OnboardingInput) =>
    rpc<void>('complete_onboarding', {
      p_nickname: i.nickname, p_gender: i.gender, p_age: i.age, p_height_cm: i.heightCm, p_weight_kg: i.weightKg,
      p_weekly_goal_min: i.weeklyGoalMin, p_sports: i.sports,
    }),
  createGroup: (name: string) => rpc<Group>('create_group', { p_name: name }),
  joinGroup: (code: string) => rpc<Group>('join_group', { p_code: code }),
  leaveGroup: (groupId: string) => rpc<void>('leave_group', { p_group_id: groupId }),
  myGroups: () => rpc<GroupOverview[]>('my_groups_overview'),
  weekSummary: async () => (await rpc<WeekSummary[]>('my_week_summary'))[0],
  groupToday: (groupId: string) => rpc<TodayMember[]>('group_today', { p_group_id: groupId }),
  groupFeed: (groupId: string, cursor?: { started_at: string; workout_id: string }, limit = 30) =>
    rpc<FeedItem[]>('group_feed', {
      p_group_id: groupId, p_before: cursor?.started_at ?? null, p_limit: limit, p_before_id: cursor?.workout_id ?? null,
    }),
  groupRanking: (groupId: string, period: RankPeriod) =>
    rpc<RankRow[]>('group_ranking', { p_group_id: groupId, p_period: period }),
  memberActivity: (groupId: string) => rpc<MemberActivity[]>('group_member_activity', { p_group_id: groupId }),
  kickMember: (groupId: string, userId: string) =>
    rpc<void>('kick_member', { p_group_id: groupId, p_user_id: userId }),
  deleteMyAccount: () => rpc<void>('delete_my_account'),

  async myProfile(): Promise<MyProfile | null> {
    const { data: auth } = await client().auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await client().from('profiles').select('id, nickname, avatar_color').eq('id', auth.user.id).maybeSingle();
    if (error) throw new AppError(error.message);
    return data as MyProfile | null;
  },

  async mySports(): Promise<MySport[]> {
    // RLS는 같은 그룹 크루원의 종목도 읽게 해 주므로, 내 종목만 명시적으로 거른다.
    const { data: auth } = await client().auth.getUser();
    const { data, error } = await client().from('user_sports').select('id, name, color, archived_at')
      .eq('user_id', auth.user?.id ?? '').is('archived_at', null).order('created_at');
    if (error) throw new AppError(error.message);
    return data as MySport[];
  },

  // 새 종목 만들기. 이름만 다른 보관된 종목이 있으면 되살린다 (공백·대소문자만 다른 중복은 DB가 막는다).
  async createSport(name: string, color: SportColorKey): Promise<MySport> {
    const { data: auth } = await client().auth.getUser();
    const uid = auth.user?.id;
    const ins = await client().from('user_sports').insert({ user_id: uid, name: name.trim(), color })
      .select('id, name, color, archived_at').single();
    if (!ins.error) return ins.data as MySport;

    const existing = await client().from('user_sports').select('id, name, color, archived_at')
      .eq('user_id', uid ?? '').eq('name_key', name.trim().toLowerCase()).maybeSingle();
    if (existing.data) {
      if (!existing.data.archived_at) return existing.data as MySport;
      const upd = await client().from('user_sports').update({ archived_at: null, color }).eq('id', existing.data.id)
        .select('id, name, color, archived_at').single();
      if (!upd.error) return upd.data as MySport;
    }
    throw new AppError(ins.error.message);
  },

  async myPrivate(): Promise<MyPrivate | null> {
    const { data: auth } = await client().auth.getUser();
    const { data, error } = await client().from('profile_private')
      .select('gender, age, height_cm, weight_kg, weekly_goal_min').eq('user_id', auth.user?.id ?? '').maybeSingle();
    if (error) throw new AppError(error.message);
    return data as MyPrivate | null;
  },

  // 닉네임(크루에게 보임)과 신체 정보(본인만)를 함께 고친다.
  async updateProfile(p: ProfileInput) {
    const { data: auth } = await client().auth.getUser();
    const uid = auth.user?.id ?? '';
    const a = await client().from('profiles').update({ nickname: p.nickname.trim() }).eq('id', uid);
    if (a.error) throw new AppError(a.error.message);
    const b = await client().from('profile_private')
      .update({ gender: p.gender, age: p.age, height_cm: p.heightCm, weight_kg: p.weightKg, updated_at: new Date().toISOString() })
      .eq('user_id', uid);
    if (b.error) throw new AppError(b.error.message);
  },

  async updateWeeklyGoal(min: number) {
    const { data: auth } = await client().auth.getUser();
    const { error } = await client().from('profile_private')
      .update({ weekly_goal_min: min, updated_at: new Date().toISOString() }).eq('user_id', auth.user?.id ?? '');
    if (error) throw new AppError(error.message);
  },

  async updateSport(id: string, patch: { name?: string; color?: SportColorKey }) {
    const { error } = await client().from('user_sports').update(patch).eq('id', id);
    if (error) throw new AppError(error.message);
  },

  // 기록이 있는 종목은 지우지 않고 목록에서만 숨긴다 (지난 기록은 그대로 남는다).
  async archiveSport(id: string) {
    const { error } = await client().from('user_sports').update({ archived_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new AppError(error.message);
  },

  async getWorkout(id: string): Promise<WorkoutRow> {
    const { data, error } = await client().from('workouts')
      .select('id, sport_id, duration_min, started_at, intensity, memo').eq('id', id).single();
    if (error) throw new AppError(error.message);
    return data as WorkoutRow;
  },

  async updateWorkout(id: string, w: WorkoutInput) {
    const { error } = await client().from('workouts').update({
      sport_id: w.sportId, duration_min: w.durationMin, started_at: w.startedAt, intensity: w.intensity, memo: w.memo ?? null,
    }).eq('id', id);
    if (error) throw new AppError(error.message);
  },

  async deleteWorkout(id: string) {
    const { error } = await client().from('workouts').delete().eq('id', id);
    if (error) throw new AppError(error.message);
  },

  async logWorkout(w: WorkoutInput) {
    const { data: auth } = await client().auth.getUser();
    const { error } = await client().from('workouts').insert({
      user_id: auth.user?.id, sport_id: w.sportId, duration_min: w.durationMin, started_at: w.startedAt,
      intensity: w.intensity, memo: w.memo ?? null,
    });
    if (error) throw new AppError(error.message);
  },
};
