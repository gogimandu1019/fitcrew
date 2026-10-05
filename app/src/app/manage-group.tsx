import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { BackHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color, radius } from '@/design/tokens';
import { api } from '@/lib/api';
import { useCurrentGroup } from '@/lib/currentGroup';
import { errorMessage } from '@/lib/errors';
import { useMemberActivity } from '@/lib/queries';
import { daysSince, lastWorkoutLabel } from '@/lib/time';

// 크루 관리 (크루장 전용): 크루원 활동 현황과 30일 미활동 내보내기.
// 일반 크루원에게는 이 화면으로 가는 메뉴도, 미활동 표시도 보이지 않는다. 서버도 크루장이 아니면 거부한다.
export default function ManageGroup() {
  const qc = useQueryClient();
  const { current } = useCurrentGroup();
  const isOwner = current?.role === 'owner';
  const activity = useMemberActivity(current?.group_id, isOwner);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) {
    return <FormScreen header={<BackHeader />} title="크루 관리" footer={null}><Text variant="body" color={color.textMuted}>크루장만 볼 수 있어요.</Text></FormScreen>;
  }

  const kick = async (userId: string) => {
    if (!current) return;
    setBusyId(userId);
    setError(null);
    try {
      await api.kickMember(current.group_id, userId);
      await qc.invalidateQueries();
      setConfirmId(null);
    } catch (e) {
      setError(errorMessage(e));
    }
    setBusyId(null);
  };

  const members = activity.data ?? [];
  const inactive = members.filter((m) => m.is_inactive).length;

  return (
    <FormScreen header={<BackHeader />} title="크루 관리" subtitle={`${current?.name} · ${members.length}명`} footer={null}>
      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 16, gap: 6 }}>
        <Text variant="itemSm">미활동 <Text variant="itemSm" color={inactive > 0 ? color.danger : color.textSub}>{inactive}명</Text></Text>
        <Text variant="caption" color={color.textMuted} style={{ lineHeight: 19 }}>
          30일 동안 기록이 없고 가입한 지 30일이 넘은 크루원이에요. 이 표시는 크루장에게만 보여요.
        </Text>
      </View>

      {error && (
        <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="warn" size={14} color={color.danger} />
          <Text variant="micro" color={color.danger} style={{ flex: 1 }}>{error}</Text>
        </View>
      )}

      <View style={{ gap: 10 }}>
        {activity.isLoading && <Text variant="caption" color={color.textMuted}>불러오는 중…</Text>}
        {members.map((m) => {
          return (
            <View key={m.user_id} style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar nickname={m.nickname} colorIndex={m.avatar_color} size={40} state={m.is_inactive ? 'off' : 'plain'} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="itemSm">{m.nickname}{m.role === 'owner' ? '  (크루장)' : ''}</Text>
                  <Text variant="caption" color={color.textMuted}>{lastWorkoutLabel(m.last_workout_at)} · 가입 {daysSince(m.joined_at)}일째</Text>
                </View>
                {m.is_inactive && (
                  <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#2E1A1A' }}>
                    <Text variant="micro" color={color.danger} style={{ fontWeight: '700' }}>30일 미활동</Text>
                  </View>
                )}
              </View>
              {m.is_inactive && (confirmId === m.user_id ? (
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Text variant="caption" color={color.textSub} style={{ flex: 1 }}>{m.nickname} 님을 내보낼까요?</Text>
                  <Button label="취소" variant="ghost" style={{ height: 44, width: 72 }} onPress={() => setConfirmId(null)} />
                  <Button label={busyId === m.user_id ? '…' : '내보내기'} variant="danger" disabled={busyId !== null} style={{ height: 44, width: 96 }} onPress={() => kick(m.user_id)} />
                </View>
              ) : (
                <Button label="내보내기" variant="danger" style={{ height: 44 }} onPress={() => { setConfirmId(m.user_id); setError(null); }} />
              ))}
            </View>
          );
        })}
      </View>
    </FormScreen>
  );
}
