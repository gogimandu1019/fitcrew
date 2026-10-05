import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { BackHeader } from '@/components/StepHeader';
import { Text } from '@/components/Text';
import { color } from '@/design/tokens';
import { LEGAL_DOCS, type LegalKey } from '@/lib/legal';

// 개인정보 처리방침·이용약관. 로그인 전에도 볼 수 있어야 해서 로그인 상태와 무관한 경로에 둔다.
export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const data = LEGAL_DOCS[(doc === 'terms' ? 'terms' : 'privacy') as LegalKey];

  return (
    <Screen>
      <BackHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 22 }}>
        <View style={{ gap: 6, marginTop: 12 }}>
          <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>{data.title}</Text>
          <Text variant="caption" color={color.textMuted}>시행일 {data.updated}</Text>
        </View>
        <Text variant="body" color={color.textSub} style={{ lineHeight: 22 }}>{data.intro}</Text>
        {data.sections.map((s) => (
          <View key={s.heading} style={{ gap: 8 }}>
            <Text accessibilityRole="header" variant="itemSm">{s.heading}</Text>
            {s.body.map((b) => (
              <Text key={b} variant="body" color={color.textSub} style={{ lineHeight: 22 }}>{b}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
