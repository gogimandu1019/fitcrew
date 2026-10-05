// 로그인·초기 설정·그룹 소속 상태를 하나로 모아 화면 이동(Gate)에 쓴다.
//   preview         백엔드 환경 변수가 없는 미리보기 모드 (모든 화면 접근 가능)
//   signedOut       로그인 전
//   needsOnboarding 로그인했지만 초기 설정(프로필) 전
//   needsGroup      프로필은 있지만 아직 어떤 크루에도 속하지 않음 → 참여/만들기로
//   ready           홈으로
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { hasBackend } from './env';
import { supabase } from './supabase';

export type SessionState =
  | { status: 'loading' }
  | { status: 'preview' }
  | { status: 'signedOut' }
  | { status: 'needsOnboarding'; session: Session }
  | { status: 'needsGroup'; session: Session }
  | { status: 'ready'; session: Session };

type Ctx = {
  state: SessionState;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  // 그룹을 만든 직후 '만들어졌어요' 화면을 보여 주는 동안 true. 이때는 멤버십이 생겨 상태가 ready가 되어도 홈으로 보내지 않는다.
  holdOnboarding: boolean;
  setHoldOnboarding: (hold: boolean) => void;
};
const SessionContext = createContext<Ctx | null>(null);

async function resolve(session: Session | null): Promise<SessionState> {
  if (!supabase) return { status: 'preview' };
  if (!session) return { status: 'signedOut' };

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
  if (!profile) return { status: 'needsOnboarding', session };

  const { count } = await supabase
    .from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', session.user.id);
  return (count ?? 0) > 0 ? { status: 'ready', session } : { status: 'needsGroup', session };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: hasBackend ? 'loading' : 'preview' });
  const [holdOnboarding, setHoldOnboarding] = useState(false);
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setState(await resolve(data.session));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    // 구독 직후 INITIAL_SESSION 이벤트가 한 번 오므로 첫 상태도 여기서 정해진다.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // 콜백 안에서 바로 supabase를 부르면 교착될 수 있어 다음 틱으로 미룬다.
      setTimeout(async () => setState(await resolve(session)), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    // 이 기기에서만 로그아웃한다. 계정을 지운 직후에는 서버에 세션이 없어 전체 로그아웃이 실패할 수 있다.
    await supabase?.auth.signOut({ scope: 'local' });
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ state, refresh, signOut, holdOnboarding, setHoldOnboarding }),
    [state, refresh, signOut, holdOnboarding],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Ctx {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('SessionProvider 안에서만 사용할 수 있어요.');
  return ctx;
}
