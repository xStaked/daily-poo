import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  const navItems: NavItem[] = [
    { id: 'home', iconName: 'home', label: 'Home' },
    { id: 'stats', iconName: 'bar-chart', label: 'Stats' },
    { id: 'friends', iconName: 'people', label: 'Friends' },
    { id: 'profile', iconName: 'person', label: 'Profile' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.navContent}>
        {navItems.map(({ id, iconName, label }) => {
          const isActive = currentPage === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onNavigate(id)}
              style={[styles.navButton, isActive && styles.navButtonActive]}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={iconName}
                size={24}
                color={isActive ? '#8B4513' : '#9CA3AF'}
                style={isActive ? styles.iconActive : undefined}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5E6D3',
    zIndex: 50,
  },
  navContent: {
    maxWidth: 448, // equivalente a max-w-md
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navButtonActive: {
    backgroundColor: '#FFF8F0',
  },
  iconActive: {
    // stroke más grueso simulado con opacity o tamaño
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  labelActive: {
    fontWeight: '600',
    color: '#8B4513',
  },
});

