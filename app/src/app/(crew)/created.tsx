import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { color, radius } from '@/design/tokens';
import { useSession } from '@/lib/session';

// 그룹 만들기 완료: 코드 확인 + 초대 링크 공유. 초대 링크로 들어오면 코드가 자동으로 입력된다.
export default function Created() {
  const { name = '', code = '' } = useLocalSearchParams<{ name?: string; code?: string }>();
  const { refresh, setHoldOnboarding } = useSession();
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const link = Linking.createURL('/join', { queryParams: { code } });
  const say = (text: string) => {
    setNotice(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 2200);
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    say('코드를 복사했어요.');
  };

  const shareLink = async () => {
    try {
      // 웹에서 공유 창이 없으면 링크를 복사하는 쪽으로 대신한다.
      await Share.share({ message: `${name} 크루에 함께해요! 초대 코드 ${code}\n${link}` });
    } catch {
      await Clipboard.setStringAsync(link);
      say('초대 링크를 복사했어요.');
    }
  };

  const goHome = async () => {
    await refresh(); // 소속이 반영된 상태(ready)를 먼저 확인한 뒤
    setHoldOnboarding(false);
    router.replace('/');
  };

  if (!code) return null; // 새로고침 등으로 값이 사라지면 Gate가 알아서 홈/참여 화면으로 보낸다

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 14, marginTop: 56 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: color.lime, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 30, fontWeight: '800' }} color={color.night}>{Array.from(name)[0] ?? ''}</Text>
        </View>
        <Text variant="title" style={{ fontSize: 28 }}>크루가 만들어졌어요</Text>
        <Text variant="item">{name} <Text variant="numInline" color={color.textMuted} style={{ fontSize: 18 }}> 1 / 30</Text></Text>
      </View>

      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 20, gap: 14, marginTop: 36 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" color={color.textMuted}>초대 코드</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="코드 복사" onPress={copyCode} hitSlop={10}
            style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Icon name="copy" size={16} color={color.textSub} />
            <Text variant="caption" color={color.textSub} style={{ fontWeight: '700' }}>복사</Text>
          </Pressable>
        </View>
        <View accessibilityLabel={`초대 코드 ${code.split('').join(' ')}`} style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 60, borderRadius: radius.cell, backgroundColor: color.card, borderWidth: 1, borderColor: color.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="numRank" style={{ fontSize: 32 }}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </View>
        <Text variant="caption" color={color.textMuted}>링크로 들어오면 코드가 자동으로 입력돼요.</Text>
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ gap: 6 }}>
        {notice && <Text accessibilityLiveRegion="polite" variant="caption" color={color.textSub} style={{ textAlign: 'center', paddingBottom: 4 }}>{notice}</Text>}
        <Button label="초대 링크 보내기" onPress={shareLink} />
        <Pressable accessibilityRole="button" onPress={goHome} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="body" color={color.textMuted} style={{ textDecorationLine: 'underline' }}>나중에 보내고 홈으로</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
