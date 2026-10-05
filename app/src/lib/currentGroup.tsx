// 지금 보고 있는 그룹. 마지막으로 본 그룹을 기억한다 (PRD: 마지막으로 본 그룹 기억).
// 기억한 그룹이 없어졌으면(탈퇴·강퇴 등) 첫 번째 그룹으로 돌아간다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { GroupOverview } from './api';
import { useMyGroups } from './queries';

const STORAGE_KEY = 'fitcrew.currentGroupId';

type Ctx = { groups: GroupOverview[]; current: GroupOverview | null; setCurrentId: (id: string) => void; loading: boolean };
const CurrentGroupContext = createContext<Ctx | null>(null);

export function CurrentGroupProvider({ children }: { children: ReactNode }) {
  const groupsQuery = useMyGroups();
  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => setStoredId(v)).catch(() => {});
  }, []);

  const setCurrentId = useCallback((id: string) => {
    setStoredId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const current = groups.find((g) => g.group_id === storedId) ?? groups[0] ?? null;

  const value = useMemo(
    () => ({ groups, current, setCurrentId, loading: groupsQuery.isLoading }),
    [groups, current, setCurrentId, groupsQuery.isLoading],
  );
  return <CurrentGroupContext.Provider value={value}>{children}</CurrentGroupContext.Provider>;
}

export function useCurrentGroup(): Ctx {
  const ctx = useContext(CurrentGroupContext);
  if (!ctx) throw new Error('CurrentGroupProvider 안에서만 사용할 수 있어요.');
  return ctx;
}
