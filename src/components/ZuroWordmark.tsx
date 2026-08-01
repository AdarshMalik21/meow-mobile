import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';

export function ZuroWordmark({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.name}>zuro</Text>
      <Text style={styles.tagline}>RIDE TOGETHER</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.white,
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  tagline: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.brandTagline,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
