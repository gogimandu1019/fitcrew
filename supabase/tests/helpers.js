// Docker·Supabase CLI 없이 마이그레이션을 검증하기 위한 하네스.
// PGlite(WASM 포스트그레스) 위에 Supabase의 최소 흉내(roles, auth 스키마, auth.uid())를 얹는다.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

export async function newDb() {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const f of readdirSync(migrationsDir).filter((n) => n.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(migrationsDir, f), 'utf8'));
  }
  return db;
}

let seq = 0;
// 사용자 만들기: auth.users에 넣고, 초기 설정(닉네임·종목)까지 마친 상태로 돌려준다.
export async function addUser(db, nickname = `유저${++seq}`, { onboard = true } = {}) {
  const { rows } = await db.query(`insert into auth.users (email) values ($1) returning id`, [`u${++seq}@test.dev`]);
  const id = rows[0].id;
  if (onboard) {
    await asUser(db, id, (q) =>
      q(`select complete_onboarding($1, 'female', 28, 165, 55, 240, $2::jsonb)`, [
        nickname,
        JSON.stringify([
          { name: '러닝', color: 'mint' },
          { name: '수영', color: 'sky' },
        ]),
      ]),
    );
  }
  return id;
}

// 해당 사용자로 로그인한 것처럼 실행 (RLS가 적용되는 authenticated 역할)
export async function asUser(db, uid, fn) {
  await db.exec(`set role authenticated`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid]);
  try {
    return await fn((sql, params) => db.query(sql, params));
  } finally {
    await db.exec(`reset role`);
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

export async function asAnon(db, fn) {
  await db.exec(`set role anon`);
  try {
    return await fn((sql, params) => db.query(sql, params));
  } finally {
    await db.exec(`reset role`);
  }
}

// 시드 데이터용: 트리거(미래·24시간 검증)를 건너뛰고 슈퍼유저로 넣는다.
export async function seed(db, fn) {
  await db.exec(`set session_replication_role = replica`);
  try {
    return await fn((sql, params) => db.query(sql, params));
  } finally {
    await db.exec(`set session_replication_role = origin`);
  }
}

export async function sportId(db, uid, name = '러닝') {
  const { rows } = await db.query(`select id from user_sports where user_id = $1 and name = $2`, [uid, name]);
  return rows[0].id;
}

// 어떤 시각이든 안전한 '오늘 안의 과거' 기준점: 며칠 전 하루의 10:00 (그날 03:00~다음날 03:00 안)
export async function pastDayAt(db, daysAgo, hoursIntoDay = 10) {
  const { rows } = await db.query(
    `select (fit_day_start(now() - ($1 || ' days')::interval) + ($2 || ' hours')::interval) as t`,
    [daysAgo, hoursIntoDay],
  );
  return rows[0].t;
}

export async function logWorkout(db, uid, { sport = '러닝', min = 30, at, intensity = 'normal', memo = null } = {}) {
  const sid = await sportId(db, uid, sport);
  return asUser(db, uid, (q) =>
    q(
      `insert into workouts (user_id, sport_id, duration_min, started_at, intensity, memo)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [uid, sid, min, at, intensity, memo],
    ),
  );
}

// 오류 코드(raise exception '<코드>') 검사
export async function rejects(promise, code) {
  await assert.rejects(promise, (e) => {
    assert.ok(String(e.message).includes(code), `기대한 오류 '${code}' 대신: ${e.message}`);
    return true;
  });
}
