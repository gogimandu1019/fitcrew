import Svg, { Circle, Path, Rect } from 'react-native-svg';

// 디자인 목업(design/screens-new.html)에서 쓴 아이콘. 시안의 하단 탭 아이콘 경로를 그대로 쓴다.
const ICONS = {
  back: <Path d="M15 5l-7 7 7 7" />,
  x: <Path d="M6 6l12 12M18 6L6 18" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  check: <Path d="M5 12l5 5 9-10" />,
  chevron: <Path d="M9 6l6 6-6 6" />,
  lock: (
    <>
      <Rect x="5" y="11" width="14" height="9" rx="2" />
      <Path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  warn: (
    <>
      <Path d="M12 4l9 16H3z" />
      <Path d="M12 10v4M12 17v.5" />
    </>
  ),
  copy: (
    <>
      <Rect x="9" y="9" width="11" height="11" rx="2" />
      <Path d="M5 15V6a2 2 0 012-2h9" />
    </>
  ),
  users: (
    <>
      <Circle cx="9" cy="9" r="3" />
      <Path d="M3 19c0-3 3-5 6-5s6 2 6 5M16 6a3 3 0 010 6M18 14c2 .6 3 2.4 3 5" />
    </>
  ),
  home: <Path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  rank: <Path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />,
  me: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, color = '#F2F4EF', strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </Svg>
  );
}
