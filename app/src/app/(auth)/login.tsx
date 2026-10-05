import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { color, font, layout, sportPalette } from '@/design/tokens';
import { signInWithGoogle } from '@/lib/auth';
import { hasBackend } from '@/lib/env';
import { errorMessage } from '@/lib/errors';

// 시안 01 시작하기. 종목명은 종목 색으로 강조한다 (러닝은 라임이 아니라 민트 — 라임은 "했다" 신호 전용).
// 지금은 웹 개발용으로 Google 로그인 하나만 둔다. 카카오·Apple·이메일은 모바일 출시 전에 다시 넣는다.
const sky = sportPalette.find((c) => c.key === 'sky')!.hex;
const mint = sportPalette.find((c) => c.key === 'mint')!.hex;

export default function Login() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(); // 성공하면 Google 창으로 이동한다
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <View style={{
      flex: 1, backgroundColor: color.night, paddingHorizontal: 24,
      paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 16) + 16, justifyContent: 'space-between',
    }}>
      <Text style={{ fontFamily: font.numeric[800], fontSize: 26, letterSpacing: 3 }} color={color.lime}>FITCREW</Text>

      <View style={{ gap: 24 }}>
        <Text style={{ fontSize: 40, lineHeight: 48, fontWeight: '800', letterSpacing: -1 }}>
          너는 <Text style={{ fontSize: 40, fontWeight: '800' }} color={sky}>수영</Text> 1시간{'\n'}
          쟤는 <Text style={{ fontSize: 40, fontWeight: '800' }} color={mint}>러닝</Text> 30분{'\n'}
          나는 오늘은?
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar nickname="핏핏" colorIndex={0} size={layout.avatar.md} state="on" />
          <Avatar nickname="크크" colorIndex={1} size={layout.avatar.md} state="on" />
          <Avatar nickname="나" colorIndex={4} size={layout.avatar.md} state="off" />
          <Text variant="caption" color={color.textMuted}>내 불을 켤 차례예요</Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {error && (
          <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="warn" size={16} color={color.danger} />
            <Text variant="caption" color={color.danger} style={{ flex: 1 }}>{error}</Text>
          </View>
        )}
        <Button label={busy ? '이동 중…' : 'Google로 계속하기'} variant="google" disabled={busy || !hasBackend} onPress={onGoogle} />
        <Text variant="caption" color={color.textMuted} style={{ textAlign: 'center', lineHeight: 20 }}>
          계속하면{' '}
          <Text variant="caption" color={color.textSub} accessibilityRole="link" style={{ textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}>이용약관</Text>
          과{' '}
          <Text variant="caption" color={color.textSub} accessibilityRole="link" style={{ textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}>개인정보 처리방침</Text>
          에 동의하는 것으로 봅니다.
        </Text>
        {!hasBackend && (
          <Link href="/profile" style={{ color: color.textMuted, textAlign: 'center', paddingTop: 8 }}>
            미리보기: 화면 둘러보기 (서버 미연결)
          </Link>
        )}
      </View>
    </View>
  );
}
