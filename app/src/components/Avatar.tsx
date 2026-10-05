import { View } from 'react-native';

import { avatarPalette, color, layout } from '@/design/tokens';

import { Text } from './Text';

// 이름 두 글자 + 멤버별 고정 배경색.
//   on     오늘 운동을 마친 멤버: 멤버 색 + 라임 링
//   off    아직 안 한 멤버: 회색으로 어두워질 뿐 지워지지 않음
//   plain  피드·랭킹: 멤버 색만
export function Avatar({ nickname, colorIndex, size = layout.avatar.lg, state = 'plain' }: {
  nickname: string; colorIndex: number; size?: number; state?: 'on' | 'off' | 'plain';
}) {
  const initials = Array.from(nickname.trim()).slice(0, 2).join('');
  const off = state === 'off';
  const disc = (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: off ? color.off : avatarPalette[((colorIndex % 8) + 8) % 8],
      }}>
      <Text variant="itemSm" color={off ? color.avatarOffText : color.night} style={{ fontSize: Math.round(size * 0.33) }}>
        {initials}
      </Text>
    </View>
  );
  if (state !== 'on') return disc;
  const { gap, width } = layout.ring;
  return (
    <View
      style={{
        padding: gap, borderWidth: width, borderColor: color.lime,
        borderRadius: (size + (gap + width) * 2) / 2,
      }}>
      {disc}
    </View>
  );
}
