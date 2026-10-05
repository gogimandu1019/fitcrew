import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { GoalPicker } from '@/components/GoalPicker';
import { StepHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color } from '@/design/tokens';
import { useOnboardingDraft } from '@/lib/onboarding';

// 초기 설정 2/3: 주간 목표
export default function GoalStep() {
  const { draft, update } = useOnboardingDraft();
  return (
    <FormScreen
      header={<StepHeader step={2} />}
      title={'일주일에 얼마나\n운동해 볼까요?'}
      subtitle="시간으로 정해요. 어떤 운동이든 괜찮아요."
      footer={<Button label="다음" onPress={() => router.push('/sports')} />}>
      <GoalPicker value={draft.weeklyGoalMin} onChange={(m) => update({ weeklyGoalMin: m })} />
      <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center', marginTop: -10 }}>
        나중에 내 정보에서 언제든 바꿀 수 있어요.
      </Text>
    </FormScreen>
  );
}
