import { Stack } from 'expo-router';

import { color } from '@/design/tokens';
import { OnboardingDraftProvider } from '@/lib/onboarding';

export default function OnboardingLayout() {
  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night } }} />
    </OnboardingDraftProvider>
  );
}
