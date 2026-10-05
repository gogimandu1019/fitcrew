import { useState } from 'react';
import { View } from 'react-native';

import { color } from '@/design/tokens';
import type { Gender } from '@/lib/api';
import {
  checkAge, checkHeight, checkWeight, digitsOnly, isValidName, LIMITS, trimmedLength,
} from '@/lib/validation';

import { Icon } from './Icon';
import { Segmented } from './Segmented';
import { Text } from './Text';
import { TextField } from './TextField';

export type ProfileValues = { nickname: string; gender: Gender | null; age: string; heightCm: string; weightKg: string };

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'undisclosed', label: '선택 안 함' },
];

// 입력값이 모두 유효하면 파싱된 값을 돌려준다. 초기 설정과 내 정보 수정이 같이 쓴다.
export function parseProfile(v: ProfileValues) {
  const age = checkAge(v.age), height = checkHeight(v.heightCm), weight = checkWeight(v.weightKg);
  if (!isValidName(v.nickname, LIMITS.nickname) || v.gender === null || !age.ok || !height.ok || !weight.ok) return null;
  return { nickname: v.nickname.trim(), gender: v.gender, age: age.value, heightCm: height.value, weightKg: weight.value };
}

// 닉네임, 성별, 나이·키·몸무게. 입력 중에는 조용히 두고 칸을 벗어나면 오류를 보여 준다 (나이는 두 자리가 되면 바로).
export function ProfileFields({ value, onChange }: { value: ProfileValues; onChange: (patch: Partial<ProfileValues>) => void }) {
  const [blurred, setBlurred] = useState({ nickname: false, age: false, height: false, weight: false });
  const touch = (k: keyof typeof blurred) => setBlurred((b) => ({ ...b, [k]: true }));

  const age = checkAge(value.age), height = checkHeight(value.heightCm), weight = checkWeight(value.weightKg);
  const nicknameOk = isValidName(value.nickname, LIMITS.nickname);

  const ageError = !age.ok && age.error !== 'empty' && (blurred.age || value.age.length >= 2)
    ? age.error === 'under_age' ? '만 14세 이상부터 가입할 수 있어요.' : '나이를 다시 확인해 주세요.' : null;
  const heightError = !height.ok && blurred.height && height.error !== 'empty' ? `${LIMITS.heightCm.min}~${LIMITS.heightCm.max}cm 사이로 입력해 주세요.` : null;
  const weightError = !weight.ok && blurred.weight && weight.error !== 'empty' ? `${LIMITS.weightKg.min}~${LIMITS.weightKg.max}kg 사이로 입력해 주세요.` : null;
  const nicknameError = blurred.nickname && value.nickname.length > 0 && !nicknameOk ? '1~10자로 입력해 주세요.' : null;

  return (
    <>
      <TextField label="닉네임" counter={`${trimmedLength(value.nickname)}/${LIMITS.nickname.max}`}
        value={value.nickname} onChangeText={(t) => onChange({ nickname: t })} onBlur={() => touch('nickname')}
        maxLength={LIMITS.nickname.max} autoCapitalize="none" autoCorrect={false} placeholder="크루에게 보이는 이름" error={nicknameError} />

      <View style={{ gap: 7 }}>
        <Text variant="caption" color={color.textMuted}>성별</Text>
        <Segmented label="성별" options={GENDERS} value={value.gender} onChange={(g) => onChange({ gender: g })} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <TextField label="나이" unit="세" numeric keyboardType="number-pad" maxLength={3} value={value.age}
          onChangeText={(t) => onChange({ age: digitsOnly(t) })} onBlur={() => touch('age')} error={ageError} />
        <TextField label="키" unit="cm" numeric keyboardType="decimal-pad" maxLength={5} value={value.heightCm}
          onChangeText={(t) => onChange({ heightCm: digitsOnly(t, true) })} onBlur={() => touch('height')} error={heightError} />
        <TextField label="몸무게" unit="kg" numeric keyboardType="decimal-pad" maxLength={5} value={value.weightKg}
          onChangeText={(t) => onChange({ weightKg: digitsOnly(t, true) })} onBlur={() => touch('weight')} error={weightError} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ marginTop: 2 }}><Icon name="lock" size={16} color={color.textMuted} /></View>
        <Text variant="caption" color={color.textMuted} style={{ flex: 1, lineHeight: 19 }}>
          신체 정보는 운동량 추천에만 쓰이고 크루에게 공개되지 않아요.
        </Text>
      </View>
    </>
  );
}
