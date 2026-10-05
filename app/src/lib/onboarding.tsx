// 초기 설정 1/3~3/3에서 입력한 값을 3단계(완료)에서 한 번에 저장하기 위한 임시 보관소.
// 서버에는 마지막에 api.completeOnboarding 으로 한 번만 보낸다. 중간에 나가면 처음부터 다시 시작한다.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Gender } from './api';
import { LIMITS } from './validation';

export type OnboardingDraft = {
  nickname: string;
  gender: Gender | null;
  age: string;
  heightCm: string;
  weightKg: string;
  weeklyGoalMin: number;
};

const INITIAL: OnboardingDraft = {
  nickname: '', gender: null, age: '', heightCm: '', weightKg: '', weeklyGoalMin: LIMITS.goalMin.default,
};

type Ctx = { draft: OnboardingDraft; update: (patch: Partial<OnboardingDraft>) => void };
const DraftContext = createContext<Ctx | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(INITIAL);
  const value = useMemo<Ctx>(() => ({ draft, update: (patch) => setDraft((d) => ({ ...d, ...patch })) }), [draft]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useOnboardingDraft(): Ctx {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('OnboardingDraftProvider 안에서만 사용할 수 있어요.');
  return ctx;
}
