import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { color, layout, radius } from '@/design/tokens';

import { Icon } from './Icon';
import { Screen } from './Screen';
import { Text } from './Text';

// 아직 구현하지 않은 화면의 자리표시. 어느 단계(Phase)에서 무엇을 만드는지 적어 둔다.
// 구현할 때 이 컴포넌트를 지우고 실제 화면으로 바꾼다.
export function Placeholder({ title, phase, items, mock, back = false, bottomInset = 0 }: {
  title: string; phase: string; items: string[]; mock?: string; back?: boolean; bottomInset?: number;
}) {
  return (
    <Screen bottomInset={bottomInset}>
      {back && (
        <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} hitSlop={12} style={{ marginLeft: -8, height: 40, width: 40, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="back" />
        </Pressable>
      )}
      <Text variant="title" style={{ marginTop: 8 }}>{title}</Text>
      <Text variant="caption" color={color.textMuted} style={{ marginTop: 6 }}>{phase}</Text>
      <ScrollView contentContainerStyle={{ paddingTop: 20, gap: 10, paddingBottom: layout.listBottomInset }}>
        <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 16, gap: 10 }}>
          {items.map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: 8 }}>
              <Text variant="body" color={color.textMuted}>•</Text>
              <Text variant="body" color={color.textSub} style={{ flex: 1 }}>{t}</Text>
            </View>
          ))}
        </View>
        {mock && <Text variant="caption" color={color.textDim}>디자인: {mock}</Text>}
      </ScrollView>
    </Screen>
  );
}
