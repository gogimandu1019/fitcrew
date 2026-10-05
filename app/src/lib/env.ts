const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();

// 대시보드에서 복사할 때 `/rest/v1/` 같은 경로가 붙어 와도 도메인까지만 쓴다.
function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

export const SUPABASE_URL = originOf(rawUrl);
export const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// 환경 변수가 없으면 백엔드 없이 화면만 둘러보는 "미리보기 모드"로 동작한다.
export const hasBackend = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
