import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Text } from './Text';
import { Screen } from './Screen';

// 초기 설정·그룹 참여/만들기 공통 틀: 헤더 + 큰 제목 + 본문(스크롤) + 하단 고정 버튼 영역.
export function FormScreen({ header, title, subtitle, children, footer, titleSize = 30 }: {
  header?: ReactNode; title?: string; subtitle?: string; children: ReactNode; footer: ReactNode; titleSize?: number;
}) {
  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {header}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }} style={{ flex: 1 }}>
          {title ? <Text style={{ fontSize: titleSize, lineHeight: titleSize * 1.28, fontWeight: '800', letterSpacing: -0.8, marginTop: 20 }}>{title}</Text> : null}
          {subtitle ? <Text variant="body" color="#9AA096" style={{ marginTop: 8, lineHeight: 22 }}>{subtitle}</Text> : null}
          <View style={{ gap: 18, marginTop: title ? 26 : 12 }}>{children}</View>
        </ScrollView>
        <View style={{ gap: 6, paddingTop: 8 }}>{footer}</View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
