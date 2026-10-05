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
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';

const CONFIRM_WORD = '삭제';

// 계정 삭제 (앱스토어 심사 필수). 되돌릴 수 없으므로 확인 단어를 직접 입력해야 버튼이 켜진다.
export default function DeleteAccount() {
  const { signOut } = useSession();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteMyAccount();
      await signOut(); // 서버의 계정은 이미 지워졌으니 이 기기의 로그인 정보만 정리하면 로그인 화면으로 간다
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <FormScreen header={<BackHeader />} title="계정 삭제" subtitle="삭제하면 되돌릴 수 없어요."
      footer={
        <>
          {error && (
            <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingBottom: 6 }}>
              <Icon name="warn" size={14} color={color.danger} />
              <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
            </View>
          )}
          <Button label={busy ? '삭제 중…' : '계정 영구 삭제'} variant="danger" disabled={typed.trim() !== CONFIRM_WORD || busy} onPress={remove} />
        </>
      }>
      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 16, gap: 12 }}>
        {[
          '내 프로필, 신체 정보, 종목, 모든 운동 기록이 삭제돼요.',
          '내가 크루장인 크루는 다른 크루원에게 넘어가고, 나 혼자인 크루는 사라져요.',
          '다른 크루원의 기록에는 영향이 없어요.',
        ].map((t) => (
          <View key={t} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ marginTop: 2 }}><Icon name="warn" size={14} color={color.textMuted} /></View>
            <Text variant="caption" color={color.textSub} style={{ flex: 1, lineHeight: 19 }}>{t}</Text>
          </View>
        ))}
      </View>
      <TextField label={`계속하려면 "${CONFIRM_WORD}"를 입력하세요`} value={typed} onChangeText={setTyped} autoCorrect={false} autoCapitalize="none" placeholder={CONFIRM_WORD} />
    </FormScreen>
  );
}
