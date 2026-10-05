import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/barlow-condensed';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Text } from '@/components/Text';
import { color } from '@/design/tokens';
import { CurrentGroupProvider } from '@/lib/currentGroup';
import { startNetworkWatch } from '@/lib/network';
import { queryClient } from '@/lib/query';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();
startNetworkWatch();

// 화면 안에서 예상 못 한 오류가 나면 흰 화면 대신 이 화면을 보여 준다. (expo-router가 이름으로 찾는다)
export function ErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View accessibilityRole="alert" style={{ flex: 1, backgroundColor: color.night, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
      <Text variant="headline">문제가 생겼어요</Text>
      <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center' }}>잠시 후 다시 시도해 주세요. 계속되면 앱을 다시 열어 주세요.</Text>
      <Button label="다시 시도" onPress={retry} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="light" />
          <CurrentGroupProvider>
            <Gate />
            <OfflineBanner />
          </CurrentGroupProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// 로그인·초기 설정·그룹 소속 상태에 따라 볼 수 있는 화면 묶음이 정해진다.
// 미리보기 모드(백엔드 없음)에서는 모두 열어 둔다.
function Gate() {
  const { state, holdOnboarding } = useSession();
  const status = state.status;

  useEffect(() => {
    if (status === 'signedOut') router.replace('/login');
    else if (status === 'needsOnboarding') router.replace('/profile');
    else if (status === 'needsGroup') router.replace('/join');
    else if (status === 'ready' && !holdOnboarding) router.replace('/');
  }, [status, holdOnboarding]);

  if (status === 'loading') return null;
  const preview = status === 'preview';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night } }}>
      {/* 약관·방침은 로그인 전에도 볼 수 있다 */}
      <Stack.Screen name="legal" />
      <Stack.Protected guard={status === 'signedOut' || preview}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsOnboarding' || preview}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsGroup' || status === 'ready' || holdOnboarding || preview}>
        <Stack.Screen name="(crew)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'ready' || preview}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="record" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="edit-goal" />
        <Stack.Screen name="my-sports" />
        <Stack.Screen name="manage-group" />
        <Stack.Screen name="delete-account" />
        <Stack.Screen name="groups" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
      </Stack.Protected>
    </Stack>
  );
}
