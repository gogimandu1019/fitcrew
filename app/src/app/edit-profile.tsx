import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { parseProfile, ProfileFields, type ProfileValues } from '@/components/ProfileFields';
import { BackHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color } from '@/design/tokens';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useMyPrivate, useMyProfile } from '@/lib/queries';

export default function EditProfile() {
  const profile = useMyProfile().data;
  const priv = useMyPrivate().data;
  if (!profile || !priv) return <FormScreen header={<BackHeader />} title="프로필 수정" footer={null}><Text variant="caption" color={color.textMuted}>불러오는 중…</Text></FormScreen>;
  return (
    <ProfileForm initial={{
      nickname: profile.nickname, gender: priv.gender, age: String(priv.age),
      heightCm: String(priv.height_cm), weightKg: String(priv.weight_kg),
    }} />
  );
}

function ProfileForm({ initial }: { initial: ProfileValues }) {
  const qc = useQueryClient();
  const [values, setValues] = useState<ProfileValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseProfile(values);
  const changed = JSON.stringify(values) !== JSON.stringify(initial);

  const save = async () => {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateProfile(parsed);
      await qc.invalidateQueries(); // 피드·랭킹의 닉네임도 바뀐다
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <FormScreen header={<BackHeader />} title="프로필 수정" subtitle="닉네임은 크루원에게 바로 바뀌어 보여요."
      footer={
        <>
          {error && (
            <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingBottom: 6 }}>
              <Icon name="warn" size={14} color={color.danger} />
              <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
            </View>
          )}
          <Button label={busy ? '저장 중…' : '저장'} disabled={!parsed || !changed || busy} onPress={save} />
        </>
      }>
      <ProfileFields value={values} onChange={(patch) => setValues((v) => ({ ...v, ...patch }))} />
    </FormScreen>
  );
}
