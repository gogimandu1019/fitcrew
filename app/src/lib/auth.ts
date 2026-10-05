// 로그인 방식은 여기에만 둔다. 지금은 웹 + Google 하나.
// 카카오·Apple·이메일, 그리고 iOS·Android 네이티브 로그인은 모바일 출시 전에 추가한다 (개발 계획 Phase 1).
import { Platform } from 'react-native';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';
import { AppError } from './errors';
import { supabase } from './supabase';

// provider가 꺼져 있으면 signInWithOAuth는 오류 없이 Supabase의 JSON 오류 페이지로 보내 버린다.
// 이동하기 전에 설정을 조회해서 앱 안에서 안내한다. 조회가 실패하면 그냥 진행한다.
async function googleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } });
    if (!res.ok) return true;
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return settings.external?.google !== false;
  } catch {
    return true;
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new AppError('no_backend');
  // 웹의 OAuth 리다이렉트 방식은 네이티브 앱에서는 그대로 쓸 수 없다.
  if (Platform.OS !== 'web') throw new AppError('native_not_supported');
  if (!(await googleEnabled())) throw new AppError('provider_not_enabled');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new AppError(error.message);
  // 성공하면 브라우저가 Google 로그인 창으로 이동한다. 돌아오면 SessionProvider가 세션을 읽는다.
}
