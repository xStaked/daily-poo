import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs to access current state in PanResponder callbacks
  const credentialsRef = useRef({ username: '', password: '' });
  credentialsRef.current = { username, password };

  // Animations
  const flushY = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Crumple & Flush Animations
  const crumpleScale = useRef(new Animated.Value(1)).current;
  const crumpleRotate = useRef(new Animated.Value(0)).current;
  const crumpleY = useRef(new Animated.Value(0)).current;

  // Water/Swirl Animations
  const waterOpacity = useRef(new Animated.Value(0)).current;
  const waterRotate = useRef(new Animated.Value(0)).current;
  const waterScale = useRef(new Animated.Value(0.5)).current;

  // Idle bounce animation
  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 10,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, [bounceAnim]);

  // Flush Handle Pan Responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0 && gestureState.dy < 150) {
          flushY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: async (_, gestureState) => {
        if (gestureState.dy > 80) {
          handleFlush();
        } else {
          Animated.spring(flushY, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleFlush = async () => {
    if (isLoading) return;

    const { username: currentUsername, password: currentPassword } = credentialsRef.current;

    if (!currentUsername.trim() || !currentPassword.trim()) {
      setError('Please fill the tank (enter credentials)!');
      Animated.spring(flushY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      return;
    }

    setIsLoading(true);
    setError('');

    // Animate flush handle down
    Animated.sequence([
      Animated.timing(flushY, {
        toValue: 120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flushY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await login(currentUsername.trim(), currentPassword.trim());
      triggerCrumpleAndFlush();
    } catch {
      setError('Clogged! Invalid credentials.');
      setIsLoading(false);
    }
  };

  const triggerCrumpleAndFlush = () => {
    // 1. Swirl Animation Loop
    Animated.loop(
      Animated.timing(waterRotate, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Parallel Execution (Water grows while Paper falls)
    Animated.parallel([
      // Step A: Water appears & grows
      Animated.parallel([
        Animated.timing(waterOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(waterScale, {
          toValue: 2.5, // Expand to cover screen slowly
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      // Step B: Crumple Form (Starts immediately)
      Animated.parallel([
        Animated.timing(crumpleScale, {
          toValue: 0.1,
          duration: 800,
          easing: Easing.in(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(crumpleRotate, {
          toValue: 1, // 360 deg * 2
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(crumpleY, {
          toValue: height, // Fall off screen
          duration: 800,
          easing: Easing.in(Easing.back(1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. Navigation Delay (2 seconds total show)
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);
  };

  // Interpolations
  const spin = crumpleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const swirlSpin = waterRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'], // Counter-clockwise for flushing effect
  });

  const getPoopMask = () => '💩'.repeat(password.length);
  const handleTranslateY = Animated.add(flushY, bounceAnim);
  const pullTextOpacity = flushY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* 🌀 Background Water Swirl (Initially Hidden) */}
      <Animated.View style={[
        styles.waterBackground,
        { opacity: waterOpacity }
      ]}>
        <Animated.Text style={[
          styles.swirlEmoji,
          {
            transform: [
              { rotate: swirlSpin },
              { scale: waterScale }
            ]
          }
        ]}>
          🌀
        </Animated.Text>
      </Animated.View>

      {/* Main Content (The Form/Paper) */}
      <Animated.View
        style={[
          styles.stallDoor,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom,
            transform: [
              { scale: crumpleScale },
              { rotate: spin },
              { translateY: crumpleY }
            ],
          },
        ]}
      >
        <View style={{ width: '100%', alignItems: 'center', height: '100%' }}>
          <View style={styles.doorHeader}>
            <Text style={styles.doorSign}>OCCUPIED</Text>
            <View style={styles.lockIcon} />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Who&apos;s there?</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#A67C52"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Secret Code</Text>
              <View style={styles.passwordContainer}>
                {/* Hidden real input */}
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.hiddenInput}
                  autoCapitalize="none"
                />
                {/* Visual Poop Mask */}
                <View style={styles.maskContainer} pointerEvents="none">
                  {password.length === 0 ? (
                    <Text style={styles.placeholderText}>Password</Text>
                  ) : (
                    <Text style={styles.poopText}>{getPoopMask()}</Text>
                  )}
                </View>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Spacer to push flush handle to bottom */}
          <View style={{ flex: 1 }} />

          {/* Flush Mechanism Container */}
          <View style={styles.flushMechanismContainer}>
            {/* Chain Background - absolute to sit behind handle */}
            <View style={styles.chainLine} />

            <View style={styles.flushContainer}>
              <Animated.Text style={[styles.flushLabel, { opacity: pullTextOpacity }]}>
                {isLoading ? 'FLUSHING...' : '↓ PULL TO ENTER ↓'}
              </Animated.Text>

              <View style={styles.handleTrack}>
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.handleBall,
                    { transform: [{ translateY: handleTranslateY }] },
                  ]}
                >
                  <View style={styles.handleChainLink} />
                  <View style={styles.handleKnobOuter}>
                    <View style={styles.handleKnobInner} />
                  </View>
                </Animated.View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              Need a pass? Register here
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Porcelain white for toilet bowl background
    overflow: 'hidden',
  },
  waterBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E0F2FE', // Light blue water color
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  swirlEmoji: {
    fontSize: 200,
  },
  stallDoor: {
    flex: 1,
    backgroundColor: '#D4A574',
    alignItems: 'center',
    borderRightWidth: 10,
    borderRightColor: '#8B4513',
    // Removed shadows for paper effect during crumple? Keeping for door look.
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1,
  },
  // ... Keep existing styles ...
  doorHeader: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  doorSign: {
    fontSize: 28,
    fontWeight: '900',
    color: '#DC2626',
    borderWidth: 4,
    borderColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{ rotate: '-5deg' }],
  },
  lockIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C0C0C0', // Silver lock
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#808080',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 30,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
  },
  input: {
    backgroundColor: '#F5E6D3',
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    color: '#5D4037',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  passwordContainer: {
    position: 'relative',
    height: 60,
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B4513',
    justifyContent: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0, // Hide but keep interactive
    zIndex: 2,
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#A67C52',
  },
  poopText: {
    fontSize: 24, // Bigger font for emojis
    letterSpacing: 2,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  flushMechanismContainer: {
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
    height: 200, // Enough space for chain and movement
    justifyContent: 'flex-start',
    position: 'relative',
  },
  chainLine: {
    position: 'absolute',
    top: -50, // Start higher up to look connected to 'tank'
    bottom: 100,
    width: 4,
    backgroundColor: '#C0C0C0', // Chain color
    zIndex: 0,
    // Dashed effect for chain look 
    borderStyle: 'dotted',
    borderWidth: 2,
    borderColor: '#808080',
    borderRadius: 2,
  },
  flushContainer: {
    alignItems: 'center',
    zIndex: 1,
    marginTop: 20,
  },
  flushLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#8B4513',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  handleTrack: {
    // Invisible track area for touch
    width: 120,
    height: 150,
    alignItems: 'center',
  },
  handleBall: {
    alignItems: 'center',
  },
  handleChainLink: {
    width: 6,
    height: 40,
    backgroundColor: '#C0C0C0',
    borderWidth: 1,
    borderColor: '#808080',
    marginBottom: -5,
    zIndex: 1,
  },
  handleKnobOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626', // Red handle
    borderWidth: 3,
    borderColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  handleKnobInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EF4444', // Lighter red for gradient effect
  },
  registerLink: {
    marginBottom: 30,
    padding: 16,
  },
  registerText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
