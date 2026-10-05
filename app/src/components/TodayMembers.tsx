import { ScrollView, View } from 'react-native';

import { color, layout } from '@/design/tokens';
import type { TodayMember } from '@/lib/api';

import { Avatar } from './Avatar';
import { Text } from './Text';

// 오늘 운동한 멤버: n / 전체 + 아바타 줄. 운동한 멤버는 라임 링, 아직인 멤버는 어두워질 뿐 지워지지 않는다.
export function TodayMembers({ members }: { members: TodayMember[] }) {
  const done = members.filter((m) => m.did_today).length;
  const size = layout.avatar.sm;
  const avatars = members.map((m) => (
    <Avatar key={m.user_id} nickname={m.nickname} colorIndex={m.avatar_color} size={size} state={m.did_today ? 'on' : 'off'} />
  ));
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="item">오늘 운동한 멤버</Text>
        <Text variant="numInline" color={color.lime} accessibilityLabel={`${members.length}명 중 ${done}명`}>
          {done} <Text variant="numInline" color={color.textDim}>/ {members.length}</Text>
        </Text>
      </View>
      {members.length <= 8 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>{avatars}</View>
      ) : (
        // 크루원이 많으면 옆으로 넘겨 본다 (최대 30명)
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 4, paddingVertical: 4 }}>
          {avatars}
        </ScrollView>
      )}
    </View>
  );
}
