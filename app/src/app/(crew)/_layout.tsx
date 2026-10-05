import { Stack } from 'expo-router';

import { color } from '@/design/tokens';

// 크루 참여·만들기. 가입 직후(첫 크루)에도, 홈의 그룹 전환 시트에서도 쓴다.
export default function CrewLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night } }} />;
}
