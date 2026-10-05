import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { hasBackend, SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

// Expo Router가 Node에서 화면을 미리 렌더링할 때는 window가 없어 브라우저 저장소를 쓸 수 없다.
// 그 경우에는 세션을 저장·갱신하지 않는다 (네이티브의 Hermes에는 window가 있으므로 영향 없음).
const isServer = typeof window === 'undefined';

export const supabase = hasBackend
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: isServer ? undefined : AsyncStorage,
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        // 웹: Google에서 돌아온 주소(?code=...)를 읽어 로그인을 마친다. 네이티브에는 주소창이 없다.
        detectSessionInUrl: Platform.OS === 'web' && !isServer,
        flowType: 'pkce',
      },
    })
  : null;
