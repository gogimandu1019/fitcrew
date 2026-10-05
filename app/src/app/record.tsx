import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { ColorPalette } from '@/components/ColorPalette';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { Segmented } from '@/components/Segmented';
import { SportChip } from '@/components/SportChip';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { color, radius, sportPalette } from '@/design/tokens';
import { api, type Intensity, type SportColorKey, type WorkoutRow } from '@/lib/api';
import { track } from '@/lib/analytics';
import { hasBackend } from '@/lib/env';
import { errorMessage } from '@/lib/errors';
import { setHours, setMinutes, splitHm, stepHours, stepMinutes } from '@/lib/duration';
import { useMyGroups, useMySports, useRefreshAfterWorkout } from '@/lib/queries';
import { addDays, fitDay, formatClockInput, instantFor, INTENSITY_LABEL, isTooFarInFuture, kstClock, parseClock } from '@/lib/time';
import { isValidName, LIMITS, nextUnusedColor, sportKey } from '@/lib/validation';
import { noOutline } from '@/design/web';

const PALETTE_KEYS = sportPalette.map((c) => c.key);
const hexOf = (key: string) => sportPalette.find((c) => c.key === key)?.hex ?? '#FFFFFF';
const DURATION_CHIPS = [15, 30, 45, 60, 90, 120];
const DAY_CHOICES = [{ value: '0', label: '오늘' }, { value: '1', label: '어제' }, { value: '2', label: '그제' }] as const;
const INTENSITIES = (Object.keys(INTENSITY_LABEL) as Intensity[]).map((v) => ({ value: v, label: INTENSITY_LABEL[v] }));

// 시작 시각의 기본값: 지금 기준 30분 전(5분 단위로 내림). 운동을 마치고 기록하는 흐름이 가장 흔하다.
function defaultStart(): Date {
  const t = Date.now() - 30 * 60_000;
  return new Date(Math.floor(t / (5 * 60_000)) * 5 * 60_000);
}

type Initial = {
  sportName: string; minutes: number; dayOffset: number; clock: string; intensity: Intensity; memo: string;
};

function initialFrom(w: WorkoutRow | null, sportName: string): Initial {
  const start = w ? new Date(w.started_at) : defaultStart();
  const offset = Math.round((Date.parse(fitDay(new Date())) - Date.parse(fitDay(start))) / 86400_000);
  return {
    sportName: w ? sportName : '', minutes: w?.duration_min ?? 30, dayOffset: Math.max(0, offset),
    clock: kstClock(start), intensity: w?.intensity ?? 'normal', memo: w?.memo ?? '',
  };
}

// 운동 기록: 새로 쓰기(/record) 또는 내 기록 수정(/record?id=...)
export default function Record() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const sports = useMySports();
  const workout = useQuery({ queryKey: ['workout', id], enabled: !!id && hasBackend, queryFn: () => api.getWorkout(id!) });

  if (!sports.data || (id && hasBackend && !workout.data)) {
    return <FormScreen footer={null}><Text variant="caption" color={color.textMuted}>불러오는 중…</Text></FormScreen>;
  }
  const w = workout.data ?? null;
  const sportName = w ? sports.data.find((s) => s.id === w.sport_id)?.name ?? '' : '';
  return <RecordForm key={w?.id ?? 'new'} editId={w ? id : undefined} initial={initialFrom(w, sportName)} />;
}

function RecordForm({ editId, initial }: { editId?: string; initial: Initial }) {
  const sports = useMySports().data ?? [];
  const groups = useMyGroups().data ?? [];
  const refreshAll = useRefreshAfterWorkout();

  const [sportName, setSportName] = useState(initial.sportName);
  const [newColor, setNewColor] = useState<string>(nextUnusedColor(sports.map((s) => s.color), PALETTE_KEYS));
  const [minutes, setMinutes_] = useState(initial.minutes);
  const [dayOffset, setDayOffset] = useState(String(initial.dayOffset));
  const [clock, setClock] = useState(initial.clock);
  const [intensity, setIntensity] = useState<Intensity>(initial.intensity);
  const [memo, setMemo] = useState(initial.memo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const existing = sports.find((s) => sportKey(s.name) === sportKey(sportName)) ?? null;
  const isNewSport = !existing && sportName.trim().length > 0;
  const time = parseClock(clock);
  const valid = isValidName(sportName, LIMITS.sportName) && time !== null && minutes >= 1;

  const { h: hours, m: mins } = splitHm(minutes);
  const setMinutesTotal = (t: number) => { setMinutes_(t); setError(null); };

  const submit = async () => {
    if (!time) return;
    setBusy(true);
    setError(null);
    try {
      const today = fitDay(new Date());
      const startedAt = instantFor(addDays(today, -Number(dayOffset)), time.hh, time.mm);
      if (isTooFarInFuture(startedAt)) throw new Error('future_not_allowed');

      let sportId = existing?.id;
      if (!sportId) sportId = (await api.createSport(sportName, newColor as SportColorKey)).id;

      const payload = {
        sportId, durationMin: minutes, startedAt: startedAt.toISOString(), intensity, memo: memo.trim() || undefined,
      };
      if (editId) await api.updateWorkout(editId, payload);
      else await api.logWorkout(payload);
      track({ name: 'workout_logged', props: { duration_min: minutes, edited: !!editId } });
      await refreshAll(); // 홈 피드·주간 누적·랭킹·오늘 멤버가 바로 바뀐다
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editId) return;
    setBusy(true);
    try {
      await api.deleteWorkout(editId);
      await refreshAll();
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const hex = existing ? hexOf(existing.color) : hexOf(newColor);

  return (
    <FormScreen
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" hitSlop={12} onPress={() => router.back()}
            style={{ width: 40, height: 40, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" />
          </Pressable>
          <Text variant="item">{editId ? '기록 수정' : '운동 기록'}</Text>
          <View style={{ width: 32 }} />
        </View>
      }
      footer={
        <>
          {error && (
            <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingBottom: 6 }}>
              <Icon name="warn" size={14} color={color.danger} />
              <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
            </View>
          )}
          {groups.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', paddingBottom: 6 }}>
              <Icon name="users" size={16} color={color.textMuted} />
              <Text variant="caption" color={color.textMuted}>
                <Text variant="caption" color={color.textSub} style={{ fontWeight: '700' }}>{groups.length}개 크루</Text>에 함께 반영돼요
              </Text>
            </View>
          )}
          <Button label={busy ? '저장 중…' : editId ? '저장' : '기록하기'} disabled={!valid || busy} onPress={submit} />
          {editId && (confirmDelete ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingTop: 6 }}>
              <Text variant="caption" color={color.textSub} style={{ flex: 1 }}>이 기록을 삭제할까요? 되돌릴 수 없어요.</Text>
              <Button label="취소" variant="ghost" style={{ height: 44, width: 72 }} onPress={() => setConfirmDelete(false)} />
              <Button label="삭제" variant="danger" style={{ height: 44, width: 72 }} onPress={remove} />
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="body" color={color.danger}>이 기록 삭제</Text>
            </Pressable>
          ))}
        </>
      }>
      <View style={{ gap: 10 }}>
        <TextField label="종목" value={sportName} onChangeText={(t) => { setSportName(t); setError(null); }}
          maxLength={LIMITS.sportName.max} placeholder="직접 입력하거나 아래에서 고르세요" autoCorrect={false} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {sports.map((s) => (
            <SportChip key={s.id} small name={s.name} hex={hexOf(s.color)} selected={existing?.id === s.id} onPress={() => setSportName(s.name)} />
          ))}
        </View>
        {isNewSport && (
          <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" color={color.textMuted}><Text variant="caption" style={{ fontWeight: '700' }}>{sportName.trim()}</Text> 새 종목 · 색</Text>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: hex }} />
            </View>
            <ColorPalette value={newColor} onChange={setNewColor} />
          </View>
        )}
      </View>

      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 14, gap: 12 }}>
        <Text variant="caption" color={color.textMuted}>운동 시간</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Spinner label="시간" unit="시간" value={hours} max={2}
            onStep={(d) => setMinutesTotal(stepHours(minutes, d))} onType={(t) => setMinutesTotal(setHours(minutes, t))} />
          <Spinner label="분" unit="분" value={mins} max={2}
            onStep={(d) => setMinutesTotal(stepMinutes(minutes, d))} onType={(t) => setMinutesTotal(setMinutes(minutes, t))} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {DURATION_CHIPS.map((m) => (
            <Pressable key={m} accessibilityRole="button" accessibilityLabel={`${m}분`} onPress={() => setMinutesTotal(m)}
              style={{ flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', backgroundColor: minutes === m ? color.text : color.field }}>
              <Text variant="numSmall" color={minutes === m ? color.night : color.textSub} style={{ fontSize: 15 }}>{m}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 14, gap: 12 }}>
        <Text variant="caption" color={color.textMuted}>시작 시각</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Segmented label="날짜" options={DAY_CHOICES as unknown as { value: string; label: string }[]} value={dayOffset} onChange={setDayOffset} />
          </View>
          <TextInput accessibilityLabel="시작 시각 (시분 네 자리)" value={clock} onChangeText={(t) => setClock(formatClockInput(t))}
            keyboardType="number-pad" maxLength={5} placeholder="06:10" placeholderTextColor={color.textDim} selectionColor={color.lime}
            style={{
              width: 96, height: 48, borderRadius: radius.button, backgroundColor: color.field, textAlign: 'center', ...noOutline,
              fontFamily: 'BarlowCondensed_700Bold', fontSize: 28, color: time ? color.text : color.danger,
              borderWidth: 1, borderColor: time ? 'transparent' : color.danger,
            }} />
        </View>
      </View>

      <View style={{ gap: 7 }}>
        <Text variant="caption" color={color.textMuted}>강도</Text>
        <Segmented label="강도" options={INTENSITIES} value={intensity} onChange={setIntensity} />
      </View>

      <TextField label="메모 (선택)" counter={`${memo.length}/100`} value={memo} onChangeText={setMemo} maxLength={100} placeholder="예: 한강 5km, 가볍게" />
    </FormScreen>
  );
}

// 숫자 스핀 박스: − [값] + . 값은 직접 입력도 되고, 버튼은 접근성 이름이 붙어 있다.
function Spinner({ label, unit, value, max, onStep, onType }: {
  label: string; unit: string; value: number; max: number; onStep: (dir: 1 | -1) => void; onType: (text: string) => void;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <SpinButton icon="minus" label={`${label} 줄이기`} onPress={() => onStep(-1)} />
        <TextInput accessibilityLabel={label} value={String(value)} onChangeText={onType} keyboardType="number-pad" maxLength={max}
          selectTextOnFocus selectionColor={color.lime}
          style={{ width: 54, textAlign: 'center', color: color.text, fontFamily: 'BarlowCondensed_800ExtraBold', fontSize: 48, lineHeight: 54, padding: 0, ...noOutline }} />
        <SpinButton icon="plus" label={`${label} 늘리기`} onPress={() => onStep(1)} />
      </View>
      <Text variant="caption" color={color.textMuted}>{unit}</Text>
    </View>
  );
}

function SpinButton({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 17, backgroundColor: color.field, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={18} />
    </Pressable>
  );
}
