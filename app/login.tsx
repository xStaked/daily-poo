import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [floatAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    // Animación flotante para el emoji
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await login(username.trim());
      router.replace('/(tabs)');
    } catch {
      setError('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <Text style={styles.emoji}>💩</Text>
          </Animated.View>
          <Text style={styles.title}>Pooty Tracker</Text>
          <Text style={styles.subtitle}>Track your daily visits!</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor="#D4A574"
              style={styles.input}
              autoCapitalize="none"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!username.trim() || isLoading}
            style={[styles.submitButton, (!username.trim() || isLoading) && styles.submitButtonDisabled]}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Loading...</Text>
              </>
            ) : (
              <Text style={styles.submitButtonText}>Let&apos;s Go! 🚀</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={styles.registerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.registerButtonText}>
              Don&apos;t have an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Your data stays private. Share stats only with friends you approve.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 96,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6B4423',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A67C52',
    marginTop: 8,
  },
  form: {
    width: '100%',
    maxWidth: 384,
    gap: 16,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F5E6D3',
    fontSize: 16,
    fontWeight: '500',
    color: '#6B4423',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#A67C52',
    marginTop: 32,
    maxWidth: 320,
  },
});

