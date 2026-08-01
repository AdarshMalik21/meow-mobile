import { Image, ImageStyle, StyleProp } from 'react-native';

type Size = 'small' | 'large';

const SIZES: Record<Size, number> = {
  small: 88,
  large: 160,
};

export function ZuroLogo({
  size = 'small',
  style,
}: {
  size?: Size;
  style?: StyleProp<ImageStyle>;
}) {
  const dim = SIZES[size];
  return (
    <Image
      source={require('../../assets/zuro-logo-mark.png')}
      style={[{ width: dim, height: dim, resizeMode: 'contain' }, style]}
      accessibilityLabel="Zuro logo"
    />
  );
}
