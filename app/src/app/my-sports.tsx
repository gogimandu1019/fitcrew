import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { ColorPalette } from '@/components/ColorPalette';
import { sportHex } from '@/components/FeedItem';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { BackHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { color, radius, sportPalette } from '@/design/tokens';
import { api, type SportColorKey } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useMySports } from '@/lib/queries';
import { isValidName, LIMITS, nextUnusedColor } from '@/lib/validation';

const PALETTE_KEYS = sportPalette.map((c) => c.key);

// 내 종목과 색: 이름·색 변경, 목록에서 숨기기, 새 종목 추가.
// 숨겨도 이미 한 기록은 그대로 남고, 같은 이름으로 다시 추가하면 되살아난다.
export default function MySports() {
  const qc = useQueryClient();
  const sports = useMySports().data ?? [];
  const [open, setOpen] = useState<string | null>(null); // 펼친 종목 id, 'new'는 새 종목
  const [error, setError] = useState<string | null>(null);

  const done = async () => {
    await qc.invalidateQueries(); // 피드의 종목 색·이름도 바뀐다
    setOpen(null);
    setError(null);
  };

  return (
    <FormScreen header={<BackHeader />} title="내 종목과 색" subtitle="크루원 피드에 이 이름과 색으로 보여요." footer={null}>
      <View style={{ gap: 10 }}>
        {sports.map((s) => (
          <View key={s.id} style={{ backgroundColor: color.card, borderRadius: radius.card, overflow: 'hidden' }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: open === s.id }} onPress={() => { setOpen(open === s.id ? null : s.id); setError(null); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: sportHex(s.color) }} />
              <Text variant="body" style={{ flex: 1, fontSize: 16 }}>{s.name}</Text>
              <View style={{ transform: [{ rotate: open === s.id ? '270deg' : '90deg' }] }}><Icon name="chevron" size={18} color={color.textMuted} /></View>
            </Pressable>
            {open === s.id && <Editor key={s.id} initial={{ name: s.name, color: s.color }} error={error} setError={setError}
              onSave={async (v) => { await api.updateSport(s.id, v); await done(); }}
              onArchive={async () => { await api.archiveSport(s.id); await done(); }} />}
          </View>
        ))}

        <View style={{ backgroundColor: color.card, borderRadius: radius.card, overflow: 'hidden', borderWidth: open === 'new' ? 0 : 1.5, borderStyle: 'dashed', borderColor: color.line }}>
          <Pressable accessibilityRole="button" onPress={() => { setOpen(open === 'new' ? null : 'new'); setError(null); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 56 }}>
            <Icon name="plus" size={18} color={color.textMuted} />
            <Text variant="body" color={color.textMuted} style={{ fontSize: 16 }}>종목 추가</Text>
          </Pressable>
          {open === 'new' && <Editor initial={{ name: '', color: nextUnusedColor(sports.map((s) => s.color), PALETTE_KEYS) }} error={error} setError={setError}
            onSave={async (v) => { await api.createSport(v.name ?? '', (v.color ?? 'sky') as SportColorKey); await done(); }} />}
        </View>
      </View>
    </FormScreen>
  );
}

function Editor({ initial, onSave, onArchive, error, setError }: {
  initial: { name: string; color: string };
  onSave: (v: { name?: string; color?: SportColorKey }) => Promise<void>;
  onArchive?: () => Promise<void>;
  error: string | null; setError: (m: string | null) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [hue, setHue] = useState(initial.color);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (e) { setError(errorMessage(e)); setBusy(false); }
  };
  const changed = name.trim() !== initial.name || hue !== initial.color;

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
      <TextField label="이름" value={name} onChangeText={(t) => { setName(t); setError(null); }} maxLength={LIMITS.sportName.max} autoCorrect={false} placeholder="예: 클라이밍" />
      <View style={{ gap: 10 }}>
        <Text variant="caption" color={color.textMuted}>색</Text>
        <ColorPalette value={hue} onChange={setHue} />
      </View>
      {error && (
        <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="warn" size={14} color={color.danger} />
          <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
        </View>
      )}
      <Button label={busy ? '저장 중…' : onArchive ? '저장' : '추가'} disabled={busy || !isValidName(name, LIMITS.sportName) || (!!onArchive && !changed)}
        onPress={() => run(() => onSave({ name: name.trim(), color: hue as SportColorKey }))} />
      {onArchive && (confirm ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Text variant="caption" color={color.textSub} style={{ flex: 1 }}>목록에서 숨길까요? 이미 한 기록은 그대로예요.</Text>
          <Button label="취소" variant="ghost" style={{ height: 44, width: 72 }} onPress={() => setConfirm(false)} />
          <Button label="숨기기" variant="danger" style={{ height: 44, width: 84 }} onPress={() => run(onArchive)} />
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="body" color={color.danger}>목록에서 숨기기</Text>
        </Pressable>
      ))}
    </View>
  );
}
