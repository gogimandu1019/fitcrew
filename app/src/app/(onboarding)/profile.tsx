import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { parseProfile, ProfileFields } from '@/components/ProfileFields';
import { StepHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color } from '@/design/tokens';
import { useOnboardingDraft } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

// 초기 설정 1/3: 닉네임, 성별, 나이·키·몸무게. 디자인: design/screens-new.html
export default function ProfileStep() {
  const { draft, update } = useOnboardingDraft();
  const { signOut } = useSession();

  return (
    <FormScreen
      header={
        <StepHeader step={1} right={
          <Pressable accessibilityRole="button" onPress={signOut} hitSlop={10}>
            <Text variant="caption" color={color.textMuted} style={{ textDecorationLine: 'underline' }}>로그아웃</Text>
          </Pressable>
        } />
      }
      title={'나를 소개해\n주세요'}
      subtitle="닉네임은 크루원에게 보여요."
      footer={<Button label="다음" disabled={parseProfile(draft) === null} onPress={() => router.push('/goal')} />}>
      <ProfileFields value={draft} onChange={update} />
    </FormScreen>
  );
}
