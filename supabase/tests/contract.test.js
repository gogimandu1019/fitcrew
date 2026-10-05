// 앱(app/src/lib/api.ts)이 부르는 RPC의 이름과 인자 이름이 실제 DB 함수와 일치하는지 검사한다.
// 이름이 한 글자만 달라도 서버에서야 "함수를 찾을 수 없음"으로 드러나므로, 여기서 미리 막는다.
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb } from './helpers.js';

const apiSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app', 'src', 'lib', 'api.ts'), 'utf8');

function appRpcCalls() {
  const calls = [];
  for (const m of apiSource.matchAll(/rpc<[^>]*>\(\s*'(\w+)'(?:\s*,\s*\{([^}]*)\})?/g)) {
    calls.push({ fn: m[1], args: [...(m[2] ?? '').matchAll(/\b(p_\w+)\s*:/g)].map((a) => a[1]) });
  }
  return calls;
}

describe('앱 ↔ DB 계약', () => {
  let db;
  before(async () => { db = await newDb(); });

  test('api.ts에서 RPC 호출을 찾아낸다 (추출이 깨지면 이 테스트가 먼저 알려 준다)', () => {
    assert.ok(appRpcCalls().length >= 12, `찾은 호출 수: ${appRpcCalls().length}`);
  });

  test('모든 RPC가 DB에 있고, 넘기는 인자 이름이 함수의 인자 이름과 같다', async () => {
    for (const { fn, args } of appRpcCalls()) {
      const { rows } = await db.query(
        `select proargnames from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1`, [fn]);
      assert.equal(rows.length, 1, `DB에 함수 ${fn} 이(가) 없음`);
      const names = rows[0].proargnames ?? [];
      for (const a of args) assert.ok(names.includes(a), `${fn}: 인자 ${a} 없음 (DB: ${names.join(', ') || '없음'})`);
    }
  });

  test('로그인한 사용자에게 실행 권한이 있다', async () => {
    for (const { fn } of appRpcCalls()) {
      const { rows } = await db.query(
        `select has_function_privilege('authenticated', p.oid, 'execute') as ok from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=$1`, [fn]);
      assert.equal(rows[0].ok, true, `${fn} 실행 권한 없음`);
    }
  });
});
