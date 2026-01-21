import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, isToday } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePoops } from '../hooks/usePoops';
import { CreatePoopData } from '../types';

interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
}

// Celebration modal for new achievements
function CelebrationModal({
  visible,
  achievement,
  onClose
}: {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Main content animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Confetti animations
      confettiAnims.forEach((anim, index) => {
        const delay = index * 50;
        const randomX = (Math.random() - 0.5) * 200;
        const randomDuration = 1500 + Math.random() * 1000;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.y, {
              toValue: 300,
              duration: randomDuration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, {
              toValue: randomX,
              duration: randomDuration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
              duration: randomDuration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: randomDuration,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      confettiAnims.forEach(anim => {
        anim.y.setValue(0);
        anim.x.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });
    }
  }, [visible]);

  const confettiEmojis = ['🎉', '🎊', '✨', '⭐', '💫', '🌟', '💩', '🔥', '👑', '🏆', '💪', '🚀'];

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={celebrationStyles.overlay}>
        {/* Confetti */}
        {confettiAnims.map((anim, index) => (
          <Animated.Text
            key={index}
            style={[
              celebrationStyles.confetti,
              {
                left: `${10 + (index * 7) % 80}%`,
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.y },
                  { translateX: anim.x },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {confettiEmojis[index % confettiEmojis.length]}
          </Animated.Text>
        ))}

        <Animated.View
          style={[
            celebrationStyles.content,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={celebrationStyles.handle} />

          <Text style={celebrationStyles.title}>🎉 LOGRO DESBLOQUEADO 🎉</Text>

          <View style={celebrationStyles.badge}>
            <Text style={celebrationStyles.emoji}>{achievement.emoji}</Text>
          </View>

          <Text style={celebrationStyles.name}>{achievement.name}</Text>
          <Text style={celebrationStyles.desc}>{achievement.description}</Text>

          <TouchableOpacity
            style={celebrationStyles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={celebrationStyles.buttonText}>¡Genial!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const celebrationStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confetti: {
    position: 'absolute',
    top: '20%',
    fontSize: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 24,
    letterSpacing: 1,
  },
  badge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  emoji: {
    fontSize: 48,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#8B4513',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Achievement definitions
const getAchievements = (stats: { allTime?: number; longestStreak?: number } | null): Achievement[] => [
  {
    id: 'first',
    name: 'Bautizo',
    emoji: '🎉',
    description: 'Registra tu primera cagada',
    unlocked: (stats?.allTime || 0) >= 1,
  },
  {
    id: 'streak3',
    name: 'Volcán Activo',
    emoji: '🌋',
    description: 'Mantén una racha de 3 días',
    unlocked: (stats?.longestStreak || 0) >= 3,
  },
  {
    id: 'streak7',
    name: 'Máquina de Mierda',
    emoji: '⚙️',
    description: 'Mantén una racha de 7 días',
    unlocked: (stats?.longestStreak || 0) >= 7,
  },
  {
    id: 'streak30',
    name: 'Rey del Trono',
    emoji: '👑',
    description: 'Mantén una racha de 30 días',
    unlocked: (stats?.longestStreak || 0) >= 30,
  },
  {
    id: 'total10',
    name: 'Principiante',
    emoji: '🐣',
    description: 'Registra 10 en total',
    unlocked: (stats?.allTime || 0) >= 10,
  },
  {
    id: 'total50',
    name: 'Veterano del WC',
    emoji: '🎖️',
    description: 'Registra 50 en total',
    unlocked: (stats?.allTime || 0) >= 50,
  },
  {
    id: 'total100',
    name: 'Culo de Oro',
    emoji: '🏆',
    description: 'Registra 100 en total',
    unlocked: (stats?.allTime || 0) >= 100,
  },
  {
    id: 'total500',
    name: 'Leyenda Fecal',
    emoji: '🐐',
    description: 'Registra 500 en total',
    unlocked: (stats?.allTime || 0) >= 500,
  },
  {
    id: 'streak14',
    name: 'Intestino de Acero',
    emoji: '💪',
    description: 'Mantén una racha de 14 días',
    unlocked: (stats?.longestStreak || 0) >= 14,
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { stats, logPoop, logs } = usePoops();
  const insets = useSafeAreaInsets();
  const [isLogging, setIsLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Achievement celebration state
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);

  // Form state
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState<string | undefined>(undefined);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Reset form
    setNotes('');
    setRating(undefined);
    setDurationMinutes('');
    setPhotoUrl(undefined);
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationName(undefined);
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación para obtener la ubicación.');
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Try to get reverse geocoding
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const name = address.name ||
                      (address.street ? `${address.street}, ${address.city || address.region || ''}` :
                      address.city || address.region || 'Ubicación actual');
          setLocationName(name);
        }
      } catch (err) {
        console.error('Error getting location name:', err);
        setLocationName('Ubicación actual');
      }
    } catch (err) {
      console.error('Error getting location:', err);
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handlePickImage = async () => {
    setIsPickingImage(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a las fotos.');
        setIsPickingImage(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // En una app real, aquí subirías la imagen a un servicio de almacenamiento
        // Por ahora, usamos la URI local o una URL de ejemplo
        setPhotoUrl(result.assets[0].uri);
        Alert.alert('Nota', 'En producción, necesitarás subir la imagen a un servicio de almacenamiento (ej: Cloudinary, AWS S3) y usar la URL resultante.');
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    } finally {
      setIsPickingImage(false);
    }
  };

  // Check for new achievements after logging
  const checkNewAchievements = async (newStats: typeof stats) => {
    const storedUnlocked = await AsyncStorage.getItem('unlocked_achievements');
    const previousUnlocked: string[] = storedUnlocked ? JSON.parse(storedUnlocked) : [];

    const achievements = getAchievements(newStats);
    const currentlyUnlocked = achievements
      .filter(a => a.unlocked)
      .map(a => a.id);

    // Find newly unlocked
    const newlyUnlockedIds = currentlyUnlocked.filter(id => !previousUnlocked.includes(id));
    const newlyUnlocked = achievements.filter(a => newlyUnlockedIds.includes(a.id));

    if (newlyUnlocked.length > 0) {
      // Save updated unlocked list
      await AsyncStorage.setItem('unlocked_achievements', JSON.stringify(currentlyUnlocked));

      // Show first achievement, queue the rest
      setCelebratingAchievement(newlyUnlocked[0]);
      if (newlyUnlocked.length > 1) {
        setPendingAchievements(newlyUnlocked.slice(1));
      }
    }
  };

  const handleCelebrationClose = () => {
    setCelebratingAchievement(null);

    // Show next pending achievement if any
    if (pendingAchievements.length > 0) {
      setTimeout(() => {
        setCelebratingAchievement(pendingAchievements[0]);
        setPendingAchievements(prev => prev.slice(1));
      }, 300);
    }
  };

  const handleLog = async () => {
    if (!user) return;

    setIsLogging(true);

    const poopData: CreatePoopData = {
      userId: user.id,
      notes: notes.trim() || undefined,
      latitude,
      longitude,
      locationName,
      photoUrl,
      rating,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
    };

    const success = await logPoop(poopData);
    setIsLogging(false);

    if (success) {
      handleCloseModal();
      setShowSuccess(true);
      // Animación de bounce
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setShowSuccess(false);
        scaleAnim.setValue(1);
      }, 2000);
    } else {
      Alert.alert('Error', 'No se pudo registrar el poop. Inténtalo de nuevo.');
    }
  };

  // Check achievements when stats change (after logging)
  useEffect(() => {
    if (stats) {
      checkNewAchievements(stats);
    }
  }, [stats]);

  const todayLogs = (logs || []).filter((log) => isToday(new Date(log.timestamp)));

  const getRatingEmoji = (rating: number) => {
    const emojis = ['😫', '😕', '😐', '😊', '🤩'];
    return emojis[rating - 1] || '😐';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {format(new Date(), 'EEEE')}
            </Text>
            <Text style={styles.title}>
              {format(new Date(), 'MMMM d')}
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.displayName || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Hero Stats Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroMain}>
            <Text style={styles.heroEmoji}>💩</Text>
            <View style={styles.heroStats}>
              <Text style={styles.heroNumber}>{stats?.today || 0}</Text>
              <Text style={styles.heroLabel}>hoy</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroSecondary}>
            <View style={styles.heroSecondaryItem}>
              <View style={styles.streakIcon}>
                <Text style={styles.streakIconText}>🔥</Text>
              </View>
              <Text style={styles.heroSecondaryNumber}>{stats?.currentStreak || 0}</Text>
              <Text style={styles.heroSecondaryLabel}>racha</Text>
            </View>
            <View style={styles.heroSecondaryItem}>
              <View style={styles.trophyIcon}>
                <Text style={styles.trophyIconText}>🏆</Text>
              </View>
              <Text style={styles.heroSecondaryNumber}>{stats?.longestStreak || 0}</Text>
              <Text style={styles.heroSecondaryLabel}>mejor</Text>
            </View>
            <View style={styles.heroSecondaryItem}>
              <View style={styles.calendarIcon}>
                <Text style={styles.calendarIconText}>📅</Text>
              </View>
              <Text style={styles.heroSecondaryNumber}>{stats?.week || 0}</Text>
              <Text style={styles.heroSecondaryLabel}>semana</Text>
            </View>
          </View>
        </View>

        {/* Today's Logs */}
        {todayLogs.length > 0 && (
          <View style={styles.logsSection}>
            <Text style={styles.sectionTitle}>Historial de hoy</Text>
            <View style={styles.logsContainer}>
              {todayLogs.map((log) => {
                const time = format(new Date(log.timestamp), 'HH:mm');

                return (
                  <View key={log.id} style={styles.logItem}>
                    <View style={styles.logTimeContainer}>
                      <Text style={styles.logTime}>{time}</Text>
                    </View>
                    <View style={styles.logContent}>
                      <View style={styles.logHeader}>
                        {log.rating && (
                          <Text style={styles.logRatingEmoji}>{getRatingEmoji(log.rating)}</Text>
                        )}
                        {log.durationMinutes && (
                          <View style={styles.logDurationBadge}>
                            <MaterialIcons name="timer" size={12} color="#8B4513" />
                            <Text style={styles.logDurationText}>{log.durationMinutes}m</Text>
                          </View>
                        )}
                        {log.locationName && (
                          <View style={styles.logLocationBadge}>
                            <MaterialIcons name="location-on" size={12} color="#8B4513" />
                          </View>
                        )}
                        {log.photoUrl && (
                          <View style={styles.logPhotoBadge}>
                            <MaterialIcons name="photo" size={12} color="#8B4513" />
                          </View>
                        )}
                      </View>
                      {log.notes && (
                        <Text style={styles.logNotes} numberOfLines={2}>{log.notes}</Text>
                      )}
                      {log.locationName && (
                        <Text style={styles.logLocationText} numberOfLines={1}>{log.locationName}</Text>
                      )}
                    </View>
                    {log.photoUrl && (
                      <Image source={{ uri: log.photoUrl }} style={styles.logThumbnail} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {todayLogs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🚽</Text>
            <Text style={styles.emptyTitle}>Sin registros hoy</Text>
            <Text style={styles.emptySubtitle}>Toca + para registrar</Text>
          </View>
        )}

        {/* Streak Encouragement */}
        {stats?.currentStreak && stats.currentStreak >= 3 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakBannerEmoji}>🔥</Text>
            <Text style={styles.streakBannerText}>
              {stats.currentStreak} días seguidos!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, showSuccess && styles.fabSuccess]}
        onPress={handleOpenModal}
        disabled={isLogging}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {showSuccess ? (
            <Text style={styles.fabSuccessEmoji}>✓</Text>
          ) : (
            <MaterialIcons name="add" size={32} color="#FFFFFF" />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Achievement Celebration Modal */}
      <CelebrationModal
        visible={celebratingAchievement !== null}
        achievement={celebratingAchievement}
        onClose={handleCelebrationClose}
      />

      {/* Modal de formulario */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <MaterialIcons name="close" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Rating con emojis */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingQuestion}>¿Cómo estuvo?</Text>
                <View style={styles.emojiRatingContainer}>
                  {[
                    { value: 1, emoji: '😫', label: 'Mal' },
                    { value: 2, emoji: '😕', label: 'Meh' },
                    { value: 3, emoji: '😐', label: 'Normal' },
                    { value: 4, emoji: '😊', label: 'Bien' },
                    { value: 5, emoji: '🤩', label: 'Épico' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => setRating(item.value === rating ? undefined : item.value)}
                      style={[
                        styles.emojiButton,
                        rating === item.value && styles.emojiButtonSelected,
                      ]}
                    >
                      <Text style={styles.emojiText}>{item.emoji}</Text>
                      <Text style={[
                        styles.emojiLabel,
                        rating === item.value && styles.emojiLabelSelected,
                      ]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duración - Pill selector */}
              <View style={styles.durationSection}>
                <View style={styles.durationHeader}>
                  <MaterialIcons name="timer" size={20} color="#8B4513" />
                  <Text style={styles.modalSectionTitle}>Duración</Text>
                </View>
                <View style={styles.durationPills}>
                  {['2', '5', '10', '15', '20+'].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => setDurationMinutes(durationMinutes === mins ? '' : mins)}
                      style={[
                        styles.durationPill,
                        durationMinutes === mins && styles.durationPillSelected,
                      ]}
                    >
                      <Text style={[
                        styles.durationPillText,
                        durationMinutes === mins && styles.durationPillTextSelected,
                      ]}>{mins} min</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notas */}
              <View style={styles.notesSection}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Agregar nota..."
                  placeholderTextColor="#A67C52"
                  multiline
                  numberOfLines={2}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Quick actions row */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    latitude && longitude && styles.quickActionBtnActive,
                  ]}
                  onPress={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  <MaterialIcons
                    name="location-on"
                    size={22}
                    color={latitude && longitude ? '#FFFFFF' : '#8B4513'}
                  />
                  {locationName && (
                    <Text style={[
                      styles.quickActionText,
                      latitude && longitude && styles.quickActionTextActive,
                    ]} numberOfLines={1}>{locationName}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    photoUrl && styles.quickActionBtnActive,
                  ]}
                  onPress={handlePickImage}
                  disabled={isPickingImage}
                >
                  <MaterialIcons
                    name="photo-camera"
                    size={22}
                    color={photoUrl ? '#FFFFFF' : '#8B4513'}
                  />
                </TouchableOpacity>
              </View>

              {/* Preview de foto */}
              {photoUrl && (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoUrl }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotoUrl(undefined)}
                  >
                    <MaterialIcons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Botón de guardar */}
              <TouchableOpacity
                style={[styles.saveButton, isLogging && styles.saveButtonDisabled]}
                onPress={handleLog}
                disabled={isLogging}
              >
                <Text style={styles.saveButtonText}>
                  {isLogging ? 'Guardando...' : 'Registrar 💩'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  heroEmoji: {
    fontSize: 56,
  },
  heroStats: {
    alignItems: 'flex-start',
  },
  heroNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 68,
  },
  heroLabel: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
    marginTop: -4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  heroSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  heroSecondaryItem: {
    alignItems: 'center',
  },
  streakIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  streakIconText: {
    fontSize: 18,
  },
  trophyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trophyIconText: {
    fontSize: 18,
  },
  calendarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  calendarIconText: {
    fontSize: 18,
  },
  heroSecondaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  heroSecondaryLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginTop: 2,
  },
  logsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  logsContainer: {
    gap: 12,
  },
  logItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logTimeContainer: {
    marginRight: 16,
  },
  logTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B4513',
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logRatingEmoji: {
    fontSize: 20,
  },
  logDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logDurationText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  logLocationBadge: {
    backgroundColor: '#F5F5F5',
    padding: 6,
    borderRadius: 8,
  },
  logPhotoBadge: {
    backgroundColor: '#F5F5F5',
    padding: 6,
    borderRadius: 8,
  },
  logNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  logLocationText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  logThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  streakBannerEmoji: {
    fontSize: 20,
  },
  streakBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E65100',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabSuccess: {
    backgroundColor: '#4CAF50',
  },
  fabSuccessEmoji: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 8,
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4423',
    marginBottom: 16,
  },
  emojiRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  emojiButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 56,
  },
  emojiButtonSelected: {
    backgroundColor: '#FFF7ED',
  },
  emojiText: {
    fontSize: 28,
  },
  emojiLabel: {
    fontSize: 11,
    color: '#A67C52',
    marginTop: 4,
    fontWeight: '500',
  },
  emojiLabelSelected: {
    color: '#8B4513',
    fontWeight: '600',
  },
  durationSection: {
    marginBottom: 20,
  },
  durationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B4513',
  },
  durationPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  durationPillSelected: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  durationPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B4423',
  },
  durationPillTextSelected: {
    color: '#FFFFFF',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#6B4423',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flex: 0,
  },
  quickActionBtnActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  quickActionText: {
    fontSize: 13,
    color: '#6B4423',
    maxWidth: 120,
  },
  quickActionTextActive: {
    color: '#FFFFFF',
  },
  photoPreviewContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 6,
  },
  saveButton: {
    backgroundColor: '#8B4513',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
