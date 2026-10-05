import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { ColorPalette } from '@/components/ColorPalette';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { SportChip } from '@/components/SportChip';
import { StepHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color, defaultSports, radius, sportPalette } from '@/design/tokens';
import { api, type SportColorKey } from '@/lib/api';
import { track } from '@/lib/analytics';
import { errorMessage } from '@/lib/errors';
import { useOnboardingDraft } from '@/lib/onboarding';
import { useSession } from '@/lib/session';
import {
  addSport, checkAge, checkHeight, checkWeight, LIMITS, nextUnusedColor, sportKey, type DraftSport,
} from '@/lib/validation';
import { noOutline } from '@/design/web';

type Item = DraftSport & { selected: boolean };

const hexOf = (key: string) => sportPalette.find((c) => c.key === key)?.hex ?? '#FFFFFF';
const PALETTE_KEYS = sportPalette.map((c) => c.key);

// 초기 설정 3/3: 관심 종목. 종목은 자유 입력, 색은 8색 팔레트에서 고른다.
// 완료하면 1~3단계에서 입력한 값을 한 번에 저장한다.
export default function SportsStep() {
  const { draft } = useOnboardingDraft();
  const { refresh } = useSession();
  const [items, setItems] = useState<Item[]>(defaultSports.map((s) => ({ name: s.name, color: s.color, selected: false })));
  const [active, setActive] = useState<string | null>(null); // 팔레트가 가리키는 종목
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeItem = items.find((i) => i.name === active && i.selected) ?? null;

  const toggle = (name: string) => {
    const target = items.find((i) => i.name === name)!;
    setItems(items.map((i) => (i.name === name ? { ...i, selected: !i.selected } : i)));
    setActive(target.selected ? (active === name ? null : active) : name);
  };

  const recolor = (key: string) => {
    if (!activeItem) return;
    setItems(items.map((i) => (i.name === activeItem.name ? { ...i, color: key } : i)));
  };

  const addCustom = () => {
    const used = items.map((i) => i.color); // 아직 고르지 않은 추천 종목의 색과도 겹치지 않게
    const next = addSport(items, newName, nextUnusedColor(used, PALETTE_KEYS));
    if (!next) {
      const dup = items.some((i) => sportKey(i.name) === sportKey(newName));
      setError(dup ? '이미 있는 종목이에요.' : `종목 이름은 1~${LIMITS.sportName.max}자로 입력해 주세요.`);
      return;
    }
    const added = next[next.length - 1];
    setItems([...items, { ...added, selected: true }]);
    setActive(added.name);
    setNewName('');
    setAdding(false);
    setError(null);
  };

  // skipSports: '나중에 할게요' — 종목 없이 저장한다 (기록할 때 추가할 수 있다)
  const submit = async (skipSports = false) => {
    const age = checkAge(draft.age), height = checkHeight(draft.heightCm), weight = checkWeight(draft.weightKg);
    if (!draft.gender || !age.ok || !height.ok || !weight.ok) {
      // 새로고침 등으로 앞 단계의 임시 값이 사라진 경우: 처음 단계로 돌려보낸다.
      router.replace('/profile');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.completeOnboarding({
        nickname: draft.nickname.trim(), gender: draft.gender, age: age.value, heightCm: height.value, weightKg: weight.value,
        weeklyGoalMin: draft.weeklyGoalMin,
        sports: (skipSports ? [] : items.filter((i) => i.selected)).map((i) => ({ name: i.name.trim(), color: i.color as SportColorKey })),
      });
      track({ name: 'signup_complete', props: { sports: skipSports ? 0 : items.filter((i) => i.selected).length } });
      await refresh(); // 프로필이 생겼으니 다음 화면(그룹 참여)으로 Gate가 보낸다
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <FormScreen
      header={<StepHeader step={3} />}
      title={'자주 하는 운동을\n골라 주세요'}
      subtitle="여러 개 골라도 되고, 직접 추가해도 돼요."
      footer={
        <>
          {error && (
            <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingBottom: 6 }}>
              <Icon name="warn" size={14} color={color.danger} />
              <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
            </View>
          )}
          <Button label={busy ? '저장 중…' : '완료'} disabled={busy} onPress={() => submit()} />
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => submit(true)}
            style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="body" color={color.textMuted} style={{ textDecorationLine: 'underline' }}>나중에 할게요</Text>
          </Pressable>
        </>
      }>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {items.map((i) => (
          <SportChip key={i.name} name={i.name} hex={hexOf(i.color)} selected={i.selected} onPress={() => toggle(i.name)} />
        ))}
        {!adding && (
          <Pressable accessibilityRole="button" onPress={() => { setAdding(true); setError(null); }}
            style={{ height: 46, paddingHorizontal: 16, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.line }}>
            <Icon name="plus" size={16} color={color.textMuted} />
            <Text variant="body" color={color.textMuted}>직접 추가</Text>
          </Pressable>
        )}
      </View>

      {adding && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, height: 46, borderRadius: 999, backgroundColor: color.card, borderWidth: 2, borderColor: color.lime, paddingHorizontal: 16, justifyContent: 'center' }}>
            <TextInput autoFocus value={newName} onChangeText={setNewName} onSubmitEditing={addCustom} maxLength={LIMITS.sportName.max}
              placeholder="종목 이름 (예: 클라이밍)" placeholderTextColor={color.textDim} accessibilityLabel="새 종목 이름"
              selectionColor={color.lime} returnKeyType="done" style={{ color: color.text, fontSize: 16, ...noOutline }} />
          </View>
          <Pressable accessibilityRole="button" onPress={addCustom} style={{ height: 46, paddingHorizontal: 18, borderRadius: 999, backgroundColor: color.lime, justifyContent: 'center' }}>
            <Text variant="itemSm" color={color.night}>추가</Text>
          </Pressable>
        </View>
      )}

      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 16, gap: 14 }}>
        {activeItem ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" color={color.textMuted}><Text variant="caption" style={{ fontWeight: '700' }}>{activeItem.name}</Text> 색</Text>
              <Text variant="caption" color={color.textMuted}>크루원 피드에 이 색으로 보여요</Text>
            </View>
            <ColorPalette value={activeItem.color} onChange={recolor} />
          </>
        ) : (
          <Text variant="caption" color={color.textMuted}>종목을 고르면 색을 정할 수 있어요.</Text>
        )}
      </View>
    </FormScreen>
  );
}
