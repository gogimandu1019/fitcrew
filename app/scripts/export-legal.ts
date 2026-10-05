// 앱 안 약관·방침(src/lib/legal.ts)을 공개용 마크다운으로 내보낸다: npm run legal
// 스토어 제출·웹 게시용 URL의 원본이 된다.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRIVACY, TERMS, toMarkdown } from '../src/lib/legal.ts';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'legal');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'privacy-policy.md'), toMarkdown(PRIVACY));
writeFileSync(join(out, 'terms-of-service.md'), toMarkdown(TERMS));
console.log('legal/privacy-policy.md, legal/terms-of-service.md 를 만들었어요.');
