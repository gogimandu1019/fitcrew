import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { newDb, addUser, asUser, asAnon, seed, sportId, pastDayAt, logWorkout, rejects } from './helpers.js';

const q1 = async (db, sql, params) => (await db.query(sql, params)).rows[0];

async function makeGroup(db, owner, name = '새벽 러닝크루') {
  return asUser(db, owner, async (q) => (await q(`select * from create_group($1)`, [name])).rows[0]);
}
async function join(db, uid, code) {
  return asUser(db, uid, async (q) => (await q(`select * from join_group($1)`, [code])).rows[0]);
}

describe('시간 규칙: 하루·주·월은 KST 03:00에 바뀐다', () => {
  let db;
  before(async () => { db = await newDb(); });
  const at = async (fn, ts) => (await q1(db, `select ${fn}($1::timestamptz) as v`, [ts])).v;

  test('주: 월요일 02:59는 지난주, 03:00부터 새 주', async () => {
    // 2026-10-05는 월요일
    assert.equal((await at('fit_week_start', '2026-10-05T02:59:00+09')).toISOString(), '2026-09-27T18:00:00.000Z'); // 9/28 03:00 KST
    assert.equal((await at('fit_week_start', '2026-10-05T03:00:00+09')).toISOString(), '2026-10-04T18:00:00.000Z'); // 10/5 03:00 KST
    assert.equal((await at('fit_week_start', '2026-10-11T23:59:00+09')).toISOString(), '2026-10-04T18:00:00.000Z'); // 일요일 밤도 같은 주
    assert.equal((await at('fit_week_start', '2026-10-12T02:59:00+09')).toISOString(), '2026-10-04T18:00:00.000Z'); // 다음 월요일 새벽 3시 전
  });
  test('하루: 02:59는 전날, 03:00부터 새 하루', async () => {
    assert.equal((await at('fit_day', '2026-10-06T02:59:00+09')).toISOString().slice(0, 10), '2026-10-05');
    assert.equal((await at('fit_day', '2026-10-06T03:00:00+09')).toISOString().slice(0, 10), '2026-10-06');
  });
  test('월: 1일 02:59는 지난달', async () => {
    assert.equal((await at('fit_month_start', '2026-11-01T02:59:00+09')).toISOString(), '2026-09-30T18:00:00.000Z'); // 10/1 03:00 KST
    assert.equal((await at('fit_month_start', '2026-11-01T03:00:00+09')).toISOString(), '2026-10-31T18:00:00.000Z'); // 11/1 03:00 KST
  });
});

describe('초기 설정', () => {
  let db;
  before(async () => { db = await newDb(); });

  test('만 14세 미만은 가입 차단', async () => {
    const u = await addUser(db, 'x', { onboard: false });
    await rejects(asUser(db, u, (q) => q(`select complete_onboarding('꼬마','male',13,150,40,240,'[]')`)), 'under_age');
  });
  test('프로필·신체 정보·종목이 저장되고, 공백·대소문자만 다른 종목은 한 번만 들어간다', async () => {
    const u = await addUser(db, 'x', { onboard: false });
    await asUser(db, u, (q) => q(`select complete_onboarding('민지','female',28,165,55,240,$1::jsonb)`, [
      JSON.stringify([{ name: '러닝', color: 'mint' }, { name: ' 러닝 ', color: 'sky' }, { name: 'Climbing', color: 'white' }, { name: 'climbing', color: 'pink' }]),
    ]));
    const sports = (await db.query(`select name, color from user_sports where user_id=$1 order by name`, [u])).rows;
    assert.deepEqual(sports.map((s) => s.color).sort(), ['mint', 'white']);
    assert.equal((await q1(db, `select count(*)::int c from profile_private where user_id=$1`, [u])).c, 1);
  });
  test('팔레트에 없는 색(라임 등)은 거부', async () => {
    const u = await addUser(db, 'x', { onboard: false });
    await assert.rejects(asUser(db, u, (q) => q(`select complete_onboarding('민지','female',28,165,55,240,$1::jsonb)`, [
      JSON.stringify([{ name: '러닝', color: 'lime' }]),
    ])));
  });
  test('로그인하지 않으면 호출 불가', async () => {
    await assert.rejects(asAnon(db, (q) => q(`select complete_onboarding('a','male',20,170,60,240,'[]')`)));
  });
});

describe('그룹 만들기·참여', () => {
  let db, owner;
  before(async () => { db = await newDb(); owner = await addUser(db, '크루장'); });

  test('코드는 영문+숫자 6자리(0/O/1/I 제외)이고 만든 사람이 크루장', async () => {
    for (let i = 0; i < 25; i++) {
      const g = await makeGroup(db, owner, `크루${i}`);
      assert.match(g.code, /^[A-HJ-NP-Z2-9]{6}$/);
      assert.equal(g.max_members, 30);
    }
    const role = await q1(db, `select role from group_members where user_id=$1 limit 1`, [owner]);
    assert.equal(role.role, 'owner');
  });
  test('코드로 참여(대소문자·공백 무시), 잘못된 코드·중복 참여는 오류', async () => {
    const g = await makeGroup(db, owner);
    const u = await addUser(db);
    const joined = await join(db, u, ` ${g.code.toLowerCase()} `);
    assert.equal(joined.id, g.id);
    await rejects(join(db, u, g.code), 'already_member');
    await rejects(join(db, await addUser(db), 'ZZZZZZ'), 'invalid_code');
  });
  test('정원이 차면 group_full', async () => {
    const g = await makeGroup(db, owner);
    await db.query(`update groups set max_members = 3 where id=$1`, [g.id]);
    await join(db, await addUser(db), g.code);
    await join(db, await addUser(db), g.code);
    await rejects(join(db, await addUser(db), g.code), 'group_full');
  });
  test('초기 설정 전에는 만들기·참여 불가', async () => {
    const u = await addUser(db, 'x', { onboard: false });
    await rejects(asUser(db, u, (q) => q(`select create_group('몰래')`)), 'forbidden');
  });
  test('직접 INSERT로 그룹·멤버를 만들 수 없다', async () => {
    const u = await addUser(db);
    await assert.rejects(asUser(db, u, (q) => q(`insert into groups (name, code, owner_id) values ('해킹','ABCDEF',$1)`, [u])));
    const g = await makeGroup(db, owner);
    await assert.rejects(asUser(db, u, (q) => q(`insert into group_members (group_id, user_id) values ($1,$2)`, [g.id, u])));
  });
});

describe('권한: 같은 그룹 멤버만 서로를 본다', () => {
  let db, a, b, outsider, group, at;
  before(async () => {
    db = await newDb();
    a = await addUser(db, '민지'); b = await addUser(db, '지호'); outsider = await addUser(db, '외부인');
    group = await makeGroup(db, a); await join(db, b, group.code);
    at = await pastDayAt(db, 2);
    await logWorkout(db, a, { at, min: 30, memo: '한강' });
  });

  test('멤버는 서로의 이름과 기록을 본다', async () => {
    const w = await asUser(db, b, (q) => q(`select * from workouts where user_id=$1`, [a]));
    assert.equal(w.rows.length, 1);
    const p = await asUser(db, b, (q) => q(`select nickname from profiles where id=$1`, [a]));
    assert.equal(p.rows[0].nickname, '민지');
  });
  test('외부인은 기록·프로필·종목·멤버·그룹을 볼 수 없다', async () => {
    const probes = {
      workouts: [`select 1 from workouts where user_id = any($1)`, [[a, b]]],
      profiles: [`select 1 from profiles where id = any($1)`, [[a, b]]],
      user_sports: [`select 1 from user_sports where user_id = any($1)`, [[a, b]]],
      group_members: [`select 1 from group_members where group_id = $1`, [group.id]],
      groups: [`select 1 from groups where id = $1`, [group.id]],
    };
    for (const [table, [sql, param]] of Object.entries(probes)) {
      const { rows } = await asUser(db, outsider, (q) => q(sql, [param]));
      assert.equal(rows.length, 0, `${table} 노출`);
    }
  });
  test('신체 정보는 같은 그룹 멤버에게도 비공개', async () => {
    const { rows } = await asUser(db, b, (q) => q(`select * from profile_private where user_id=$1`, [a]));
    assert.equal(rows.length, 0);
    const mine = await asUser(db, a, (q) => q(`select * from profile_private where user_id=$1`, [a]));
    assert.equal(mine.rows.length, 1);
  });
  test('피드·랭킹·오늘 멤버·활동 현황은 비멤버가 호출하면 forbidden', async () => {
    await rejects(asUser(db, outsider, (q) => q(`select * from group_feed($1)`, [group.id])), 'forbidden');
    await rejects(asUser(db, outsider, (q) => q(`select * from group_ranking($1,'week')`, [group.id])), 'forbidden');
    await rejects(asUser(db, outsider, (q) => q(`select * from group_today($1)`, [group.id])), 'forbidden');
    await rejects(asUser(db, outsider, (q) => q(`select * from group_member_activity($1)`, [group.id])), 'forbidden');
  });
  test('다른 사람 기록을 수정·삭제할 수 없다', async () => {
    const { rows } = await asUser(db, b, (q) => q(`update workouts set memo='변조' where user_id=$1 returning id`, [a]));
    assert.equal(rows.length, 0);
    const del = await asUser(db, b, (q) => q(`delete from workouts where user_id=$1 returning id`, [a]));
    assert.equal(del.rows.length, 0);
  });
  test('로그인하지 않은 사용자는 아무 테이블도 읽을 수 없다', async () => {
    await assert.rejects(asAnon(db, (q) => q(`select * from workouts`)));
    await assert.rejects(asAnon(db, (q) => q(`select * from group_feed($1)`, [group.id])));
  });
});

describe('운동 기록 검증', () => {
  let db, u, other;
  before(async () => { db = await newDb(); u = await addUser(db); other = await addUser(db); });

  test('하루 합계 24시간 초과는 거부, 정확히 24시간은 허용', async () => {
    const at = await pastDayAt(db, 3, 5);
    await logWorkout(db, u, { at, min: 1000 });
    await rejects(logWorkout(db, u, { at: await pastDayAt(db, 3, 20), min: 441 }), 'daily_limit_exceeded');
    await logWorkout(db, u, { at: await pastDayAt(db, 3, 20), min: 440 }); // 합계 1440
  });
  test('하루 경계(03:00)를 넘으면 다른 날로 계산', async () => {
    const day = await pastDayAt(db, 5, 1); // 그날 04:00
    await logWorkout(db, u, { at: day, min: 1440 });
    const next = await pastDayAt(db, 4, 1);
    await logWorkout(db, u, { at: next, min: 60 }); // 다음 날은 새로 시작
  });
  test('수정으로 24시간을 넘기는 것도 막는다', async () => {
    const at = await pastDayAt(db, 7, 5);
    const { rows } = await logWorkout(db, u, { at, min: 600 });
    await logWorkout(db, u, { at: await pastDayAt(db, 7, 18), min: 600 });
    await rejects(asUser(db, u, (q) => q(`update workouts set duration_min=900 where id=$1`, [rows[0].id])), 'daily_limit_exceeded');
  });
  test('미래 시각은 거부', async () => {
    const { t } = await q1(db, `select now() + interval '2 hours' as t`);
    await rejects(logWorkout(db, u, { at: t, min: 10 }), 'future_not_allowed');
  });
  test('남의 종목·보관 처리된 종목으로는 기록할 수 없다', async () => {
    const sid = await sportId(db, other, '러닝');
    const at = await pastDayAt(db, 9);
    await rejects(asUser(db, u, (q) => q(`insert into workouts (user_id, sport_id, duration_min, started_at, intensity) values ($1,$2,10,$3,'light')`, [u, sid, at])), 'invalid_sport');
    await db.query(`update user_sports set archived_at = now() where user_id=$1 and name='수영'`, [u]);
    await rejects(logWorkout(db, u, { sport: '수영', at, min: 10 }), 'invalid_sport');
  });
  test('다른 사람 명의로 기록할 수 없다 (RLS)', async () => {
    const sid = await sportId(db, u, '러닝');
    await assert.rejects(asUser(db, other, (q) => q(`insert into workouts (user_id, sport_id, duration_min, started_at, intensity) values ($1,$2,10,now(),'light')`, [u, sid])));
  });
  test('시간 0분·1441분·잘못된 강도는 거부', async () => {
    const at = await pastDayAt(db, 10);
    await assert.rejects(logWorkout(db, u, { at, min: 0 }));
    await assert.rejects(logWorkout(db, u, { at, min: 1441 }));
    await assert.rejects(logWorkout(db, u, { at, min: 10, intensity: 'extreme' }));
  });
});

describe('다중 그룹: 기록은 한 번만 저장하고 모든 그룹에 반영', () => {
  test('한 기록이 두 그룹 피드·랭킹·오늘 멤버에 모두 보이고 행은 하나뿐', async () => {
    const db = await newDb();
    const me = await addUser(db, '민지'), x = await addUser(db, '지호'), y = await addUser(db, '서연');
    const g1 = await makeGroup(db, x, '러닝'); const g2 = await makeGroup(db, y, '헬스');
    await join(db, me, g1.code); await join(db, me, g2.code);

    const at = await pastDayAt(db, 1, 8);
    await logWorkout(db, me, { at, min: 45 });
    assert.equal((await q1(db, `select count(*)::int c from workouts`)).c, 1);

    for (const g of [g1, g2]) {
      const feed = await asUser(db, x === g.owner_id ? x : y, (q) => q(`select * from group_feed($1)`, [g.id]));
      assert.equal(feed.rows.length, 1);
      assert.equal(feed.rows[0].nickname, '민지');
      assert.equal(feed.rows[0].sport_name, '러닝');
      const rk = await asUser(db, me, (q) => q(`select * from group_ranking($1,'week')`, [g.id]));
      assert.equal(rk.rows.length, 2);
    }
    const ov = await asUser(db, me, (q) => q(`select * from my_groups_overview()`));
    assert.equal(ov.rows.length, 2);
    assert.ok(ov.rows.every((r) => r.member_count === 2));
  });
  test('다른 그룹의 사람은 서로의 기록을 볼 수 없다', async () => {
    const db = await newDb();
    const me = await addUser(db), x = await addUser(db), y = await addUser(db);
    const g1 = await makeGroup(db, x); const g2 = await makeGroup(db, y);
    await join(db, me, g1.code);
    await logWorkout(db, me, { at: await pastDayAt(db, 1) });
    const seen = await asUser(db, y, (q) => q(`select * from workouts`));
    assert.equal(seen.rows.length, 0);
    await rejects(asUser(db, y, (q) => q(`select * from group_feed($1)`, [g1.id])), 'forbidden');
    assert.ok(g2.id);
  });
});

describe('랭킹·홈', () => {
  let db, a, b, c, g, weekStart;
  before(async () => {
    db = await newDb();
    a = await addUser(db, '민지'); b = await addUser(db, '지호'); c = await addUser(db, '서연');
    g = await makeGroup(db, a); await join(db, b, g.code); await join(db, c, g.code);
    weekStart = (await q1(db, `select fit_week_start(now()) t`)).t;
    // 이번 주: a 러닝 60+수영 90 (수영이 주 종목), b 러닝 150, c 기록 없음. 지난주 기록은 제외돼야 한다.
    await seed(db, async (q) => {
      const ins = async (u, sport, min, at) => q(`insert into workouts (user_id, sport_id, duration_min, started_at, intensity) values ($1,$2,$3,$4,'normal')`, [u, await sportId(db, u, sport), min, at]);
      const inWeek = new Date(weekStart.getTime() + 3600_000);
      await ins(a, '러닝', 60, inWeek); await ins(a, '수영', 90, inWeek);
      await ins(b, '러닝', 150, inWeek);
      await ins(c, '러닝', 500, new Date(weekStart.getTime() - 3600_000)); // 지난주
    });
  });

  test('시간 합계 순위, 기록 없는 멤버는 0분으로 포함, 지난주 기록은 제외', async () => {
    const { rows } = await asUser(db, a, (q) => q(`select * from group_ranking($1,'week')`, [g.id]));
    assert.deepEqual(rows.map((r) => [r.nickname, r.total_min, r.rank]), [['민지', 150, 1], ['지호', 150, 1], ['서연', 0, 3]]);
  });
  test('공동 1위는 같은 등수, 다음은 3위', async () => {
    const { rows } = await asUser(db, c, (q) => q(`select * from group_ranking($1,'week')`, [g.id]));
    assert.deepEqual(rows.map((r) => r.rank), [1, 1, 3]);
  });
  test('주 종목은 합계 시간이 가장 긴 종목(색 포함), 기록이 없으면 null', async () => {
    const { rows } = await asUser(db, a, (q) => q(`select * from group_ranking($1,'week')`, [g.id]));
    const me = rows.find((r) => r.nickname === '민지');
    assert.equal(me.top_sport_name, '수영'); assert.equal(me.top_sport_color, 'sky'); assert.equal(me.is_me, true);
    assert.equal(rows.find((r) => r.nickname === '서연').top_sport_name, null);
  });
  test('월 랭킹은 지난주 기록(같은 달이면)도 포함, 잘못된 기간은 오류', async () => {
    const inSameMonth = (await q1(db, `select fit_month_start(now()) <= $1::timestamptz ok`, [new Date(weekStart.getTime() - 3600_000)])).ok;
    const { rows } = await asUser(db, a, (q) => q(`select * from group_ranking($1,'month')`, [g.id]));
    const seo = rows.find((r) => r.nickname === '서연');
    assert.equal(seo.total_min, inSameMonth ? 500 : 0);
    await rejects(asUser(db, a, (q) => q(`select * from group_ranking($1,'year')`, [g.id])), 'invalid_period');
  });
  test('주간 카드: 내 누적 시간과 목표', async () => {
    const r = await asUser(db, a, async (q) => (await q(`select * from my_week_summary()`)).rows[0]);
    assert.deepEqual([r.total_min, r.goal_min], [150, 240]);
  });
  test('오늘 운동한 멤버는 03:00 기준 오늘의 기록만 센다', async () => {
    await logWorkout(db, b, { at: new Date(Date.now() - 60_000), min: 5 }); // 1분 전
    const { rows } = await asUser(db, a, (q) => q(`select * from group_today($1)`, [g.id]));
    const todayDay = (await q1(db, `select fit_day(now()) d`)).d;
    const jiho = rows.find((r) => r.nickname === '지호');
    const startedToday = (await q1(db, `select fit_day(now() - interval '1 minute') = fit_day(now()) ok`)).ok; // 03:00 정각 직후 실행 보호
    if (startedToday) assert.equal(jiho.did_today, true);
    assert.equal(rows[0].is_me, true); // 내가 맨 앞
    assert.ok(todayDay);
  });
  test('피드: 최신순, before로 이어 읽기', async () => {
    const { rows } = await asUser(db, a, (q) => q(`select * from group_feed($1, null, 2)`, [g.id]));
    assert.equal(rows.length, 2);
    assert.ok(rows[0].started_at >= rows[1].started_at);
    const next = await asUser(db, a, (q) => q(`select * from group_feed($1, $2, 10)`, [g.id, rows[1].started_at]));
    assert.ok(next.rows.every((r) => r.started_at < rows[1].started_at));
  });
});

describe('크루장 전용: 강퇴', () => {
  let db, owner, active, idleNew, idleOld, g;
  before(async () => {
    db = await newDb();
    owner = await addUser(db, '크루장'); active = await addUser(db, '활동중'); idleNew = await addUser(db, '신입'); idleOld = await addUser(db, '잠수');
    g = await makeGroup(db, owner);
    for (const u of [active, idleNew, idleOld]) await join(db, u, g.code);
    // 활동중·잠수는 가입한 지 60일, 신입은 방금 가입
    await db.query(`update group_members set joined_at = now() - interval '60 days' where user_id in ($1,$2)`, [active, idleOld]);
    await logWorkout(db, active, { at: await pastDayAt(db, 5) });
    await seed(db, async (q) => q(`insert into workouts (user_id, sport_id, duration_min, started_at, intensity) values ($1,$2,30,now() - interval '45 days','normal')`, [idleOld, await sportId(db, idleOld)]));
  });

  test('일반 크루원은 활동 현황도 강퇴도 못 한다 (서버 검사)', async () => {
    await rejects(asUser(db, active, (q) => q(`select * from group_member_activity($1)`, [g.id])), 'forbidden');
    await rejects(asUser(db, active, (q) => q(`select kick_member($1,$2)`, [g.id, idleOld])), 'forbidden');
    await assert.rejects(asUser(db, active, (q) => q(`delete from group_members where group_id=$1 and user_id=$2`, [g.id, idleOld])));
  });
  test('활동 현황: 30일 기록 없음 + 가입 30일 경과만 미활동', async () => {
    const { rows } = await asUser(db, owner, (q) => q(`select * from group_member_activity($1)`, [g.id]));
    const m = Object.fromEntries(rows.map((r) => [r.nickname, r.is_inactive]));
    assert.deepEqual(m, { 크루장: false, 활동중: false, 신입: false, 잠수: true });
  });
  test('활동 현황에는 역할과 아바타 색이 있고, 크루장은 맨 앞이며 미활동으로 잡히지 않는다', async () => {
    const { rows } = await asUser(db, owner, (q) => q(`select * from group_member_activity($1)`, [g.id]));
    assert.equal(rows[0].nickname, '크루장');
    assert.equal(rows[0].role, 'owner');
    assert.equal(rows[0].is_inactive, false);
    assert.ok(rows.every((r) => Number.isInteger(r.avatar_color) && r.avatar_color >= 0 && r.avatar_color < 8));
    assert.equal(rows.filter((r) => r.role === 'owner').length, 1);
  });
  test('활동 중인 멤버·방금 가입한 멤버·자기 자신은 내보낼 수 없다', async () => {
    await rejects(asUser(db, owner, (q) => q(`select kick_member($1,$2)`, [g.id, active])), 'not_inactive');
    await rejects(asUser(db, owner, (q) => q(`select kick_member($1,$2)`, [g.id, idleNew])), 'not_inactive');
    await rejects(asUser(db, owner, (q) => q(`select kick_member($1,$2)`, [g.id, owner])), 'forbidden');
  });
  test('크루장은 미활동 멤버를 내보낼 수 있다', async () => {
    await asUser(db, owner, (q) => q(`select kick_member($1,$2)`, [g.id, idleOld]));
    const left = await q1(db, `select count(*)::int c from group_members where group_id=$1 and user_id=$2`, [g.id, idleOld]);
    assert.equal(left.c, 0);
  });
});

describe('탈퇴와 크루장 위임', () => {
  test('크루장이 나가면 가장 오래된 활동 멤버가 크루장이 된다', async () => {
    const db = await newDb();
    const owner = await addUser(db), idleFirst = await addUser(db), activeLater = await addUser(db);
    const g = await makeGroup(db, owner);
    await join(db, idleFirst, g.code); await join(db, activeLater, g.code);
    await db.query(`update group_members set joined_at = now() - interval '90 days' where user_id=$1`, [idleFirst]);
    await db.query(`update group_members set joined_at = now() - interval '40 days' where user_id=$1`, [activeLater]);
    await logWorkout(db, activeLater, { at: await pastDayAt(db, 2) });
    await asUser(db, owner, (q) => q(`select leave_group($1)`, [g.id]));
    const grp = await q1(db, `select owner_id from groups where id=$1`, [g.id]);
    assert.equal(grp.owner_id, activeLater);
    const roles = (await db.query(`select user_id, role from group_members where group_id=$1`, [g.id])).rows;
    assert.deepEqual(roles.filter((r) => r.role === 'owner').map((r) => r.user_id), [activeLater]);
    assert.equal(roles.length, 2);
  });
  test('활동 중인 멤버가 없으면 가장 오래된 멤버에게 넘긴다', async () => {
    const db = await newDb();
    const owner = await addUser(db), first = await addUser(db), second = await addUser(db);
    const g = await makeGroup(db, owner);
    await join(db, first, g.code); await join(db, second, g.code);
    await db.query(`update group_members set joined_at = now() - interval '90 days' where user_id=$1`, [first]);
    await asUser(db, owner, (q) => q(`select leave_group($1)`, [g.id]));
    assert.equal((await q1(db, `select owner_id from groups where id=$1`, [g.id])).owner_id, first);
  });
  test('마지막 한 명이 나가면 그룹이 사라진다', async () => {
    const db = await newDb();
    const owner = await addUser(db);
    const g = await makeGroup(db, owner);
    await asUser(db, owner, (q) => q(`select leave_group($1)`, [g.id]));
    assert.equal((await q1(db, `select count(*)::int c from groups`)).c, 0);
  });
  test('일반 크루원은 그냥 나간다', async () => {
    const db = await newDb();
    const owner = await addUser(db), m = await addUser(db);
    const g = await makeGroup(db, owner); await join(db, m, g.code);
    await asUser(db, m, (q) => q(`select leave_group($1)`, [g.id]));
    assert.equal((await q1(db, `select count(*)::int c from group_members where group_id=$1`, [g.id])).c, 1);
    assert.equal((await q1(db, `select owner_id from groups where id=$1`, [g.id])).owner_id, owner);
  });
});

describe('계정 삭제', () => {
  test('기록·프로필·소속이 모두 지워지고, 크루장이면 위임되며, 남은 크루의 기록은 그대로', async () => {
    const db = await newDb();
    const me = await addUser(db, '민지'), friend = await addUser(db, '지호');
    const g = await makeGroup(db, me); await join(db, friend, g.code);
    await logWorkout(db, me, { at: await pastDayAt(db, 2) });
    await logWorkout(db, friend, { at: await pastDayAt(db, 2) });
    await asUser(db, me, (q) => q(`select delete_my_account()`));
    assert.equal((await q1(db, `select count(*)::int c from auth.users where id=$1`, [me])).c, 0);
    assert.equal((await q1(db, `select count(*)::int c from profiles where id=$1`, [me])).c, 0);
    assert.equal((await q1(db, `select count(*)::int c from workouts where user_id=$1`, [me])).c, 0);
    assert.equal((await q1(db, `select count(*)::int c from user_sports where user_id=$1`, [me])).c, 0);
    assert.equal((await q1(db, `select owner_id from groups where id=$1`, [g.id])).owner_id, friend);
    assert.equal((await q1(db, `select count(*)::int c from workouts where user_id=$1`, [friend])).c, 1);
  });
  test('혼자 만든 크루는 계정과 함께 사라진다', async () => {
    const db = await newDb();
    const me = await addUser(db);
    await makeGroup(db, me);
    await asUser(db, me, (q) => q(`select delete_my_account()`));
    assert.equal((await q1(db, `select count(*)::int c from groups`)).c, 0);
  });
  test('내부 함수는 직접 호출할 수 없다', async () => {
    const db = await newDb();
    const me = await addUser(db);
    await assert.rejects(asUser(db, me, (q) => q(`select _leave_group($1, gen_random_uuid())`, [me])));
  });
});

describe('경계 시각: 월요일 03:00 · 다중 그룹 · 같은 시각 기록', () => {
  let db, a, b, g1, g2, weekStart;
  before(async () => {
    db = await newDb();
    a = await addUser(db, '민지'); b = await addUser(db, '지호');
    g1 = await makeGroup(db, a, '러닝'); g2 = await makeGroup(db, b, '수영'); await join(db, a, g2.code);
    weekStart = (await q1(db, `select fit_week_start(now()) t`)).t;
    await seed(db, async (q) => {
      const ins = async (u, min, at) => q(`insert into workouts (user_id, sport_id, duration_min, started_at, intensity) values ($1,$2,$3,$4,'normal')`, [u, await sportId(db, u), min, at]);
      await ins(a, 100, new Date(weekStart.getTime() - 60_000)); // 월요일 02:59 → 지난주
      await ins(a, 30, weekStart);                               // 월요일 03:00 정각 → 이번 주
      await ins(a, 20, new Date(weekStart.getTime() + 60_000));  // 03:01 → 이번 주
    });
  });

  test('월요일 02:59 기록은 지난주, 03:00 정각부터 이번 주 (랭킹·주간 카드 모두)', async () => {
    const rank = await asUser(db, a, (q) => q(`select * from group_ranking($1,'week')`, [g1.id]));
    assert.equal(rank.rows.find((r) => r.is_me).total_min, 50);
    const sum = await asUser(db, a, async (q) => (await q(`select * from my_week_summary()`)).rows[0]);
    assert.equal(sum.total_min, 50);
  });

  test('두 그룹에 속한 사람의 주간 시간은 그룹마다 같은 값이고 합쳐서 두 번 세지 않는다', async () => {
    const r1 = await asUser(db, a, (q) => q(`select * from group_ranking($1,'week')`, [g1.id]));
    const r2 = await asUser(db, a, (q) => q(`select * from group_ranking($1,'week')`, [g2.id]));
    assert.equal(r1.rows.find((r) => r.is_me).total_min, 50);
    assert.equal(r2.rows.find((r) => r.is_me).total_min, 50);
    assert.equal((await q1(db, `select count(*)::int n from workouts where user_id = $1`, [a])).n, 3);
  });

  test('피드: started_at이 같은 기록이 페이지 경계에 걸려도 빠지거나 겹치지 않는다', async () => {
    const same = new Date(weekStart.getTime() - 5 * 3600_000);
    await seed(db, async (q) => {
      for (let i = 0; i < 5; i++) {
        await q(`insert into workouts (user_id, sport_id, duration_min, started_at, intensity) values ($1,$2,5,$3,'normal')`, [b, await sportId(db, b), same]);
      }
    });
    const all = (await asUser(db, b, (q) => q(`select * from group_feed($1, null, 100)`, [g2.id]))).rows;
    const seen = [];
    let cursor = null;
    for (let guard = 0; guard < 20; guard++) {
      const page = (await asUser(db, b, (q) =>
        q(`select * from group_feed($1, $2, 2, $3)`, [g2.id, cursor?.started_at ?? null, cursor?.workout_id ?? null]))).rows;
      if (page.length === 0) break;
      seen.push(...page.map((r) => r.workout_id));
      cursor = page[page.length - 1];
    }
    assert.equal(new Set(seen).size, seen.length, '같은 기록이 두 번 나옴');
    assert.deepEqual(seen, all.map((r) => r.workout_id));
    assert.ok(all.length >= 8);
  });
});

describe('베타 지표 뷰', () => {
  test('앱 사용자(로그인·비로그인)는 지표 뷰를 읽을 수 없고, 관리자는 읽는다', async () => {
    const db = await newDb();
    const a = await addUser(db, '민지'); await addUser(db, '지호');
    const g = await makeGroup(db, a); // 한 명만 크루에 들어감
    await logWorkout(db, a, { at: await pastDayAt(db, 1), min: 30 });
    for (const v of ['metrics_crew_join_rate', 'metrics_weekly_active', 'metrics_goal_achievement', 'metrics_daily_participation', 'metrics_retention']) {
      await assert.rejects(asUser(db, a, (q) => q(`select * from ${v}`)), /permission denied/, v);
      await assert.rejects(asAnon(db, (q) => q(`select * from ${v}`)), /permission denied/, v);
    }
    const join = await q1(db, `select * from metrics_crew_join_rate`);
    assert.deepEqual([Number(join.signups), Number(join.joined), Number(join.join_rate_pct)], [2, 1, 50]);
    const day = await q1(db, `select * from metrics_daily_participation where group_id = $1`, [g.id]);
    assert.deepEqual([Number(day.active_members), Number(day.members), Number(day.participation_pct)], [1, 1, 100]);
    const weekly = (await db.query(`select * from metrics_weekly_active`)).rows;
    assert.equal(Number(weekly.reduce((n, r) => n + Number(r.workouts), 0)), 1);
    assert.equal(Number((await q1(db, `select count(*) n from metrics_retention`)).n), 1);
    assert.ok((await db.query(`select * from metrics_goal_achievement`)).rows.length >= 1);
  });
});
