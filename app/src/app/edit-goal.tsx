import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { GoalPicker } from '@/components/GoalPicker';
import { Icon } from '@/components/Icon';
import { BackHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color } from '@/design/tokens';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useMyPrivate } from '@/lib/queries';
import { LIMITS } from '@/lib/validation';

export default function EditGoal() {
  const priv = useMyPrivate();
  if (!priv.data) return <FormScreen header={<BackHeader />} title="주간 목표" footer={null}><Text variant="caption" color={color.textMuted}>불러오는 중…</Text></FormScreen>;
  return <GoalForm initial={priv.data.weekly_goal_min ?? LIMITS.goalMin.default} />;
}

// 주간 목표는 그룹과 상관없이 개인 하나다.
function GoalForm({ initial }: { initial: number }) {
  const qc = useQueryClient();
  const [goal, setGoal] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.updateWeeklyGoal(goal);
      await qc.invalidateQueries(); // 홈 주간 카드의 목표 시간도 바뀐다
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <FormScreen header={<BackHeader />} title="주간 목표" subtitle="시간으로 정해요. 이번 주부터 바로 적용돼요."
      footer={
        <>
          {error && (
            <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingBottom: 6 }}>
              <Icon name="warn" size={14} color={color.danger} />
              <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
            </View>
          )}
          <Button label={busy ? '저장 중…' : '저장'} disabled={busy || goal === initial} onPress={save} />
        </>
      }>
      <GoalPicker value={goal} onChange={setGoal} />
    </FormScreen>
  );
}
