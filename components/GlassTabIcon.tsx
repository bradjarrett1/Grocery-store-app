import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GlassTabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}

export function GlassTabIcon({ name, color, focused }: GlassTabIconProps) {
  return (
    <View style={styles.iconWrapper}>
      {focused && <View style={styles.focusedBackground} />}
      <Ionicons
        name={name}
        size={24}
        color={focused ? '#ffffff' : color}
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 40,
  },
  focusedBackground: {
    position: 'absolute',
    backgroundColor: '#10b981',
    width: 56,
    height: 36,
    borderRadius: 18,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    zIndex: 10,
  },
});
