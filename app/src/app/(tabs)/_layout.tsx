import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { color, layout, radius } from '@/design/tokens';

// 하단 탭 3개(홈 · 랭킹 · 내 정보) + '내 정보' 탭 바로 위에 띄운 기록 버튼.
// 디자인: design/screens-new.html, 규칙: design/DESIGN-SYSTEM.md
const TAB_CONTENT_HEIGHT = layout.tabBarHeight - 12;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barHeight = TAB_CONTENT_HEIGHT + Math.max(insets.bottom, 12);

  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="운동 기록하기"
        onPress={() => router.push('/record')}
        style={({ pressed }) => ({
          position: 'absolute',
          // '내 정보' 탭 중심에 맞춘다: 탭 바 좌우 패딩 12 + 3등분한 마지막 칸의 중심 - 버튼 폭/2
          right: width / 6 - layout.fab.width / 2 + 8,
          bottom: barHeight + layout.fab.gapAboveTabBar,
          width: layout.fab.width, height: layout.fab.height, borderRadius: layout.fab.radius,
          backgroundColor: color.lime, alignItems: 'center', justifyContent: 'center', gap: 1,
          opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }],
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.55)',
        })}>
        <Icon name="plus" size={22} color={color.night} strokeWidth={2.6} />
        <Text variant="micro" color={color.night} style={{ fontWeight: '700', fontSize: 11 }}>기록</Text>
      </Pressable>

      <TabList
        style={{
          height: barHeight, paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: color.tabBar, borderTopWidth: 1, borderTopColor: color.cardBorder,
          flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        }}>
        <TabTrigger name="index" href="/" asChild><TabButton label="홈" icon="home" /></TabTrigger>
        <TabTrigger name="ranking" href="/ranking" asChild><TabButton label="랭킹" icon="rank" /></TabTrigger>
        <TabTrigger name="me" href="/me" asChild><TabButton label="내 정보" icon="me" /></TabTrigger>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: IconName };

const TabButton = forwardRef<View, TabButtonProps>(function TabButton({ label, icon, isFocused, ...props }, ref) {
  const tint = isFocused ? color.text : color.textDisabled;
  return (
    <Pressable ref={ref} {...props} style={{ width: 64, alignItems: 'center', gap: 4, borderRadius: radius.button }}>
      <Icon name={icon} color={tint} />
      <Text variant="micro" color={tint} style={{ fontSize: 11, fontWeight: isFocused ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );
});
