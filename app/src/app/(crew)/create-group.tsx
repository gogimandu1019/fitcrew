import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { BackHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { color, radius } from '@/design/tokens';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useCurrentGroup } from '@/lib/currentGroup';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { isValidName, LIMITS, trimmedLength } from '@/lib/validation';

// 그룹 만들기(크루장): 이름만 정하면 코드가 자동으로 만들어진다.
export default function CreateGroup() {
  const { setHoldOnboarding } = useSession();
  const { setCurrentId } = useCurrentGroup();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    // 만든 직후 '만들어졌어요' 화면을 보여 줘야 하므로, 소속이 생겨도 홈으로 넘어가지 않게 잡아 둔다.
    setHoldOnboarding(true);
    try {
      const group = await api.createGroup(name.trim());
      track({ name: 'group_create' });
      setCurrentId(group.id);
      await qc.invalidateQueries();
      router.replace({ pathname: '/created', params: { name: group.name, code: group.code } });
    } catch (e) {
      setHoldOnboarding(false);
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <FormScreen
      header={<BackHeader />}
      title={'크루 이름을\n정해 주세요'}
      subtitle="홈 화면 맨 위에 보여요."
      footer={
        <>
          {error && (
            <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingBottom: 6 }}>
              <Icon name="warn" size={14} color={color.danger} />
              <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
            </View>
          )}
          <Button label={busy ? '만드는 중…' : '크루 만들기'} disabled={!isValidName(name, LIMITS.groupName) || busy} onPress={submit} />
        </>
      }>
      <TextField label="크루 이름" counter={`${trimmedLength(name)}/${LIMITS.groupName.max}`} value={name} onChangeText={setName}
        maxLength={LIMITS.groupName.max} autoFocus placeholder="예: 새벽 러닝크루" returnKeyType="done" />
      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 16, gap: 10 }}>
        {[
          '최대 30명까지 함께할 수 있어요.',
          '6자리 초대 코드가 자동으로 만들어져요.',
          '내가 크루장이 돼요. 한 달 넘게 기록이 없는 크루원은 내보낼 수 있어요.',
        ].map((t) => (
          <View key={t} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ marginTop: 2 }}><Icon name="check" size={16} color={color.textMuted} /></View>
            <Text variant="caption" color={color.textMuted} style={{ flex: 1, lineHeight: 19 }}>{t}</Text>
          </View>
        ))}
      </View>
    </FormScreen>
  );
}
