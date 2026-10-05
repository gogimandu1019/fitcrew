import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { BackHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color } from '@/design/tokens';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { errorMessage } from '@/lib/errors';
import { useCurrentGroup } from '@/lib/currentGroup';
import { useSession } from '@/lib/session';
import { isCompleteCode, normalizeCode } from '@/lib/validation';

// 베타에서만 데모 코드 안내를 보여 준다: EXPO_PUBLIC_DEMO_CODE 가 있을 때만 노출.
const DEMO_CODE = normalizeCode(process.env.EXPO_PUBLIC_DEMO_CODE ?? '');

// 그룹 참여: 6자리 코드 입력. 초대 링크(/join?code=XXXXXX)로 들어오면 코드가 미리 채워진다.
export default function JoinGroup() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { refresh } = useSession();
  const { setCurrentId } = useCurrentGroup();
  const qc = useQueryClient();
  const [code, setCode] = useState(normalizeCode(params.code ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profile = useQuery({ queryKey: ['myProfile'], queryFn: api.myProfile, retry: false });
  const nickname = profile.data?.nickname ?? '';

  const onChange = (v: string) => { setCode(v); setError(null); };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const group = await api.joinGroup(code);
      track({ name: 'group_join' });
      setCurrentId(group.id); // 방금 들어간 크루를 바로 보여 준다
      await qc.invalidateQueries();
      await refresh();
      router.replace('/'); // 첫 크루든 추가든 홈으로
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <FormScreen
      header={router.canGoBack() ? <BackHeader /> : undefined}
      titleSize={36}
      title={nickname ? `${nickname} 님,\n환영해요` : '환영해요'}
      subtitle="크루장에게 받은 6자리 코드를 입력해 주세요."
      footer={
        <>
          <Button label={busy ? '참여 중…' : '참여하기'} disabled={!isCompleteCode(code) || busy} onPress={submit} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: color.cardBorder }} />
            <Text variant="caption" color={color.textDim}>크루가 아직 없나요?</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: color.cardBorder }} />
          </View>
          <Button label="새 크루 만들기" variant="ghost" style={{ height: 52 }} onPress={() => router.push('/create-group')} />
        </>
      }>
      <View style={{ gap: 7 }}>
        <Text variant="caption" color={color.textMuted}>초대 코드</Text>
        <CodeInput value={code} onChange={onChange} error={!!error} autoFocus={!params.code} />
        {error && (
          <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}>
            <Icon name="warn" size={14} color={color.danger} />
            <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
          </View>
        )}
      </View>
      <Text variant="caption" color={color.textMuted}>초대 링크로 들어오면 코드가 자동으로 채워져요.</Text>
      {DEMO_CODE.length === 6 && (
        <Pressable accessibilityRole="button" onPress={() => onChange(DEMO_CODE)}
          style={{ alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: color.field }}>
          <Text variant="caption" color={color.textSub}>베타 데모 코드 <Text variant="numSmall" style={{ letterSpacing: 1 }}>{DEMO_CODE}</Text></Text>
        </Pressable>
      )}
    </FormScreen>
  );
}
