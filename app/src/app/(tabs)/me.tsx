import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { ScrollView, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { sportHex } from '@/components/FeedItem';
import { SettingsCard, SettingsRow } from '@/components/Settings';
import { Text } from '@/components/Text';
import { color, layout, radius } from '@/design/tokens';
import { useCurrentGroup } from '@/lib/currentGroup';
import { formatHm } from '@/lib/format';
import { useMemberActivity, useMyPrivate, useMyProfile, useMySports } from '@/lib/queries';
import { useSession } from '@/lib/session';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? '';
const PROVIDER_LABEL: Record<string, string> = { google: 'Google', kakao: '카카오', apple: 'Apple', email: '이메일' };

// 내 정보: 프로필·신체 정보, 주간 목표, 내 종목, (크루장만) 크루 관리, 로그아웃, 계정 삭제
export default function Me() {
  const insets = useSafeAreaInsets();
  const { state, signOut } = useSession();
  const { current } = useCurrentGroup();
  const profile = useMyProfile().data;
  const priv = useMyPrivate().data;
  const sports = useMySports().data ?? [];

  // 크루장일 때만 크루 관리 행과 미활동 인원을 보여 준다. (서버도 크루장이 아니면 거부한다)
  const isOwner = current?.role === 'owner';
  const activity = useMemberActivity(current?.group_id, isOwner).data;
  const inactiveCount = activity?.filter((m) => m.is_inactive).length ?? 0;

  const provider = state.status === 'ready' ? state.session.user.app_metadata?.provider : undefined;
  const providerLabel = provider ? `${PROVIDER_LABEL[provider] ?? provider} 계정으로 로그인` : '미리보기 모드';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.night }}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: layout.screenPadX, paddingBottom: layout.listBottomInset, gap: 14 }}>
      <Text variant="title" style={{ fontSize: 26 }}>내 정보</Text>

      <Pressable accessibilityRole="button" accessibilityLabel="프로필 수정" onPress={() => router.push('/edit-profile')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.card, borderRadius: radius.card, padding: 16 }}>
        <Avatar nickname={profile?.nickname ?? '나'} colorIndex={profile?.avatar_color ?? 0} size={60} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="item" style={{ fontSize: 19, fontWeight: '800' }}>{profile?.nickname ?? ''}</Text>
          <Text variant="caption" color={color.textMuted}>{providerLabel}</Text>
        </View>
        <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: color.field }}>
          <Text variant="caption" color={color.textSub} style={{ fontSize: 14 }}>수정</Text>
        </View>
      </Pressable>

      <SettingsCard>
        <SettingsRow label="주간 목표" onPress={() => router.push('/edit-goal')}
          right={<Text variant="numInline" style={{ fontSize: 20 }}>{formatHm(priv?.weekly_goal_min ?? 240)}</Text>} />
        <SettingsRow label="신체 정보" onPress={() => router.push('/edit-profile')} right={<Text variant="caption" color={color.textMuted} style={{ fontSize: 14 }}>비공개</Text>} />
        <SettingsRow label="내 종목과 색" last={!isOwner} onPress={() => router.push('/my-sports')}
          right={
            <View style={{ flexDirection: 'row' }}>
              {sports.slice(0, 4).map((s, i) => (
                <View key={s.id} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: sportHex(s.color), marginLeft: i === 0 ? 0 : -3, borderWidth: 2, borderColor: color.card, boxSizing: 'content-box' }} />
              ))}
            </View>
          } />
        {isOwner && (
          <SettingsRow label="크루 관리" last onPress={() => router.push('/manage-group')}
            right={inactiveCount > 0
              ? <Text variant="caption" color={color.danger} style={{ fontSize: 14 }}>미활동 {inactiveCount}명</Text>
              : <Text variant="caption" color={color.textMuted} style={{ fontSize: 14 }} numberOfLines={1}>{current?.name}</Text>} />
        )}
      </SettingsCard>

      <SettingsCard>
        <SettingsRow label="개인정보 처리방침"
          onPress={PRIVACY_URL ? () => Linking.openURL(PRIVACY_URL) : () => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
        <SettingsRow label="이용약관" onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} />
        <SettingsRow label="로그아웃" onPress={signOut} />
        <SettingsRow label="계정 삭제" danger last onPress={() => router.push('/delete-account')} />
      </SettingsCard>
    </ScrollView>
  );
}
