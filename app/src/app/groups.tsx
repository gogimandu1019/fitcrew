import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { avatarPalette, color, radius } from '@/design/tokens';
import { useCurrentGroup } from '@/lib/currentGroup';

// 그룹 전환 시트 (시안 03): 소속 그룹과 그룹별 오늘 운동한 인원. 그룹 참여·만들기로 바로 들어간다.
export default function GroupSheet() {
  const insets = useSafeAreaInsets();
  const { groups, current, setCurrentId } = useCurrentGroup();

  const pick = (id: string) => {
    setCurrentId(id);
    router.back();
  };
  // 시트를 닫으면서 화면을 바꾸면 뒤로 가기가 홈으로 돌아온다
  const go = (path: '/join' | '/create-group') => router.replace(path);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable accessibilityLabel="닫기" onPress={() => router.back()} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.55)' }} />
      <View style={{
        backgroundColor: color.card, borderTopLeftRadius: radius.hero, borderTopRightRadius: radius.hero,
        paddingTop: 12, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) + 16, gap: 16,
      }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: color.line, alignSelf: 'center' }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <Text variant="title" style={{ fontSize: 20 }}>내 크루</Text>
          <Text variant="caption" color={color.textMuted} style={{ flexShrink: 1, textAlign: 'right' }}>운동 기록은 모든 크루에 함께 반영돼요</Text>
        </View>

        <View style={{ gap: 10 }}>
          {groups.map((g, i) => {
            const selected = g.group_id === current?.group_id;
            // 선택된 크루는 라임, 나머지는 크루마다 고정된 색 (라임 제외 팔레트)
            const tint = selected ? color.lime : avatarPalette[(i + 1) % avatarPalette.length];
            return (
              <Pressable key={g.group_id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => pick(g.group_id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.card,
                  backgroundColor: selected ? color.limeTint : color.field, borderWidth: 2, borderColor: selected ? color.lime : 'transparent',
                }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800' }} color={color.night}>{Array.from(g.name)[0]}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="item" numberOfLines={1} style={{ fontSize: 16 }}>{g.name}</Text>
                  <Text variant="caption" color={selected ? color.textSub : color.textMuted}>오늘 {g.active_today} / {g.member_count}명 운동</Text>
                </View>
                {selected && <Icon name="check" size={22} color={color.lime} strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="그룹 참여" variant="ghost" style={{ flex: 1, height: 52 }} onPress={() => go('/join')} />
          <Button label="그룹 만들기" style={{ flex: 1, height: 52 }} onPress={() => go('/create-group')} />
        </View>
      </View>
    </View>
  );
}
