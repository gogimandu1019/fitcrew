import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
});

// 기록 저장·그룹 변경 후 한꺼번에 새로 고칠 키
export const keys = {
  myGroups: ['myGroups'] as const,
  weekSummary: ['weekSummary'] as const,
  today: (groupId: string) => ['today', groupId] as const,
  feed: (groupId: string) => ['feed', groupId] as const,
  ranking: (groupId: string, period: string) => ['ranking', groupId, period] as const,
};
