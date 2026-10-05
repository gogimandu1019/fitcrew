import type { TextStyle } from 'react-native';

// 웹에서 입력칸에 생기는 브라우저 기본 포커스 사각형을 없앤다. 포커스는 라임 테두리로 따로 보여 준다.
// react-native-web은 outlineStyle: 'none'을 받지만 RN 타입에는 없어서 단언한다.
export const noOutline = { outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle;
