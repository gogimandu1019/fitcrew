// 서버가 연결되지 않은 "미리보기 모드"에서 화면을 둘러보기 위한 샘플 데이터 (시안의 값).
// 서버가 연결되면 쓰이지 않는다.
import { fitDay, addDays } from './time';
import type { FeedItem, GroupOverview, MemberActivity, MyPrivate, MyProfile, MySport, RankRow, TodayMember, WeekSummary } from './api';

const today = fitDay(new Date());
const at = (daysAgo: number, hhmm: string) => {
  const day = addDays(today, -daysAgo);
  return new Date(`${day}T${hhmm}:00+09:00`).toISOString();
};

export const SAMPLE_GROUPS: GroupOverview[] = [
  { group_id: 'g1', name: '새벽 러닝크루', code: 'RUN24K', role: 'owner', member_count: 8, active_today: 5 },
  { group_id: 'g2', name: '점심 헬스 모임', code: 'GYM7QH', role: 'member', member_count: 5, active_today: 2 },
  { group_id: 'g3', name: '주말 수영반', code: 'SWM9PA', role: 'member', member_count: 12, active_today: 0 },
];

export const SAMPLE_WEEK: WeekSummary = { total_min: 145, goal_min: 240 };

export const SAMPLE_SPORTS: MySport[] = [
  { id: 's1', name: '러닝', color: 'mint', archived_at: null },
  { id: 's2', name: '수영', color: 'sky', archived_at: null },
  { id: 's3', name: '헬스', color: 'coral', archived_at: null },
];

const names = ['민지', '지호', '서연', '도윤', '나', '하준', '유나', '태오'];
export const SAMPLE_TODAY: TodayMember[] = names.map((nickname, i) => ({
  user_id: `u${i}`, nickname, avatar_color: i, did_today: i < 5, is_me: nickname === '나',
}));

const item = (n: number, u: number, sport: string, color: FeedItem['sport_color'], min: number, when: string, intensity: FeedItem['intensity'], memo: string | null, daysAgo = 0): FeedItem => ({
  workout_id: `w${n}`, user_id: `u${u}`, nickname: names[u], avatar_color: u, sport_name: sport, sport_color: color,
  duration_min: min, started_at: at(daysAgo, when), intensity, memo, fit_day: addDays(today, -daysAgo),
});

export const SAMPLE_FEED: FeedItem[] = [
  item(1, 0, '러닝', 'mint', 30, '06:10', 'normal', '한강 5km, 가볍게'),
  item(2, 1, '수영', 'sky', 60, '07:20', 'hard', '자유형 1.5km'),
  item(3, 2, '헬스', 'coral', 40, '08:05', 'normal', '하체 데이'),
  item(4, 4, '러닝', 'mint', 45, '06:30', 'normal', null, 1),
  item(5, 3, '헬스', 'coral', 50, '19:10', 'hard', '등 운동', 1),
];

const rank = (r: number, u: number, min: number, sport: string, color: RankRow['top_sport_color']): RankRow => ({
  rank: r, user_id: `u${u}`, nickname: names[u], avatar_color: u, total_min: min, top_sport_name: sport, top_sport_color: color, is_me: names[u] === '나',
});

// 시안 04의 값: 1위 지호 5:40, 2위 민지 4:15, 3위 서연 3:05, 나 4위 2:25
export const SAMPLE_RANKING: RankRow[] = [
  rank(1, 1, 340, '수영', 'sky'), rank(2, 0, 255, '러닝', 'mint'), rank(3, 2, 185, '헬스', 'coral'),
  rank(4, 4, 145, '러닝', 'mint'), rank(5, 3, 110, '러닝', 'mint'), rank(6, 5, 80, '수영', 'sky'),
  rank(7, 6, 40, '요가', 'violet'), rank(8, 7, 0, '', null),
].map((r) => (r.top_sport_name === '' ? { ...r, top_sport_name: null } : r));

export const SAMPLE_PROFILE: MyProfile = { id: 'u4', nickname: '나', avatar_color: 4 };
export const SAMPLE_PRIVATE: MyPrivate = { gender: 'female', age: 28, height_cm: 165, weight_kg: 55, weekly_goal_min: 240 };

const joined = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString();
export const SAMPLE_ACTIVITY: MemberActivity[] = [
  { user_id: 'u4', nickname: '나', avatar_color: 4, role: 'owner', joined_at: joined(120), last_workout_at: at(0, '06:30'), is_inactive: false },
  { user_id: 'u0', nickname: '민지', avatar_color: 0, role: 'member', joined_at: joined(110), last_workout_at: at(0, '06:10'), is_inactive: false },
  { user_id: 'u5', nickname: '하준', avatar_color: 5, role: 'member', joined_at: joined(90), last_workout_at: joined(41), is_inactive: true },
  { user_id: 'u6', nickname: '유나', avatar_color: 6, role: 'member', joined_at: joined(80), last_workout_at: joined(5), is_inactive: false },
  { user_id: 'u7', nickname: '태오', avatar_color: 7, role: 'member', joined_at: joined(70), last_workout_at: null, is_inactive: true },
  { user_id: 'u8', nickname: '새싹', avatar_color: 1, role: 'member', joined_at: joined(6), last_workout_at: null, is_inactive: false },
];
