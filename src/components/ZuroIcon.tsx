import { ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

type Size = 'small' | 'large';

const SIZES: Record<Size, number> = {
  small: 88,
  large: 160,
};

export function ZuroIcon({
  size = 'small',
  style,
}: {
  size?: Size;
  style?: ViewStyle;
}) {
  const dim = SIZES[size];
  return (
    <Svg
      width={dim}
      height={dim}
      viewBox="0 0 200 200"
      style={style}
      accessibilityLabel="Zuro app icon"
    >
      <Rect width={200} height={200} rx={44} fill={colors.brandNavy} />
      <Path
        d="M40 55 L150 55 L150 78 L75 135 L150 135 L150 158 L40 158 L40 135 L115 78 L40 78 Z"
        fill={colors.white}
      />
      <Path
        d="M50 148 Q105 35 160 35"
        fill="none"
        stroke={colors.brandAccent}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.55}
      />
    </Svg>
  );
}
