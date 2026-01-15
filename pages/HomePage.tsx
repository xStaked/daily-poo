import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, isToday } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
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

export default function HomePage() {
  const { user } = useAuth();
  const { stats, logPoop, logs } = usePoops();
  const insets = useSafeAreaInsets();
  const [isLogging, setIsLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  
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

  const todayLogs = (logs || []).filter((log) => isToday(new Date(log.timestamp)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Hey, {user?.displayName || 'Pooper'}! 👋
          </Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {/* Main Log Button */}
        <View style={styles.logButtonContainer}>
          <TouchableOpacity
            onPress={handleOpenModal}
            disabled={isLogging}
            style={[
              styles.logButton,
              showSuccess && styles.logButtonSuccess,
              isLogging && styles.logButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.logButtonContent,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              {showSuccess ? (
                <View style={styles.successContent}>
                  <Text style={styles.successEmoji}>💩</Text>
                  <Text style={styles.successText}>Nice!</Text>
                </View>
              ) : (
                <View style={styles.logButtonInner}>
                  <MaterialIcons name="add" size={64} color="#FFFFFF" />
                  <Text style={styles.logButtonText}>Log Poop</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Today's Count */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today&apos;s Count</Text>
          <View style={styles.countContainer}>
            <Text style={styles.countNumber}>{stats?.today || 0}</Text>
            <Text style={styles.countEmoji}>💩</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="local-fire-department" size={20} color="#F97316" />
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <Text style={styles.statValue}>
              {stats?.currentStreak || 0}
              <Text style={styles.statUnit}> days</Text>
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="emoji-events" size={20} color="#EAB308" />
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <Text style={styles.statValue}>
              {stats?.longestStreak || 0}
              <Text style={styles.statUnit}> days</Text>
            </Text>
          </View>
        </View>

        {/* Today's Logs */}
        {todayLogs.length > 0 && (
          <View style={styles.logsContainer}>
            {todayLogs.map((log, index) => {
              const logDate = new Date(log.timestamp);
              const dayNumber = format(logDate, 'd');
              const time = format(logDate, 'HH:mm');
              
              return (
                <View key={log.id} style={styles.logCard}>
                  {/* Header con fecha */}
                  <View style={styles.logCardHeader}>
                    <View style={styles.dateContainer}>
                      <MaterialIcons name="calendar-today" size={18} color="#8B4513" />
                      <Text style={styles.dayNumber}>{dayNumber}</Text>
                    </View>
                    <Text style={styles.todayLabel}>Hoy</Text>
                  </View>

                  {/* Contenido del log */}
                  <View style={styles.logCardContent}>
                    <View style={styles.logMainContent}>
                      <Text style={styles.logEmoji}>💩</Text>
                      <View style={styles.logDetails}>
                        <Text style={styles.logTime}>{time}</Text>
                        {log.notes && (
                          <Text style={styles.logNotes}>&quot;{log.notes}&quot;</Text>
                        )}
                        {log.locationName && (
                          <View style={styles.logLocation}>
                            <MaterialIcons name="location-on" size={14} color="#A67C52" />
                            <Text style={styles.logLocationText}>{log.locationName}</Text>
                          </View>
                        )}
                        {log.durationMinutes && (
                          <Text style={styles.logDuration}>
                            {log.durationMinutes} min
                          </Text>
                        )}
                      </View>
                    </View>
                    {/* Rating con estrellas */}
                    {log.rating && (
                      <View style={styles.logRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MaterialIcons
                            key={star}
                            name={star <= log.rating! ? 'star' : 'star-border'}
                            size={20}
                            color={star <= log.rating! ? '#EAB308' : '#D1D5DB'}
                          />
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Foto si existe */}
                  {log.photoUrl && (
                    <View style={styles.logPhotoContainer}>
                      <Image source={{ uri: log.photoUrl }} style={styles.logPhoto} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Encouragement */}
        {stats?.currentStreak && stats.currentStreak >= 3 && (
          <View style={styles.encouragementCard}>
            <View style={styles.encouragementContent}>
              <Text style={styles.encouragementEmoji}>🔥</Text>
              <View style={styles.encouragementText}>
                <Text style={styles.encouragementTitle}>You&apos;re on fire!</Text>
                <Text style={styles.encouragementSubtitle}>
                  {stats.currentStreak} day streak! Keep it up! 💪
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

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
              <Text style={styles.modalTitle}>Registrar Poop 💩</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Notas */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notas (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe tu experiencia..."
                  placeholderTextColor="#A67C52"
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Rating */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Calificación (opcional)</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star === rating ? undefined : star)}
                      style={styles.starButton}
                    >
                      <MaterialIcons
                        name={star <= (rating || 0) ? 'star' : 'star-border'}
                        size={32}
                        color={star <= (rating || 0) ? '#EAB308' : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duración */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Duración en minutos (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: 12"
                  placeholderTextColor="#A67C52"
                  keyboardType="number-pad"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
              </View>

              {/* Ubicación */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ubicación (opcional)</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  <MaterialIcons
                    name="location-on"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>
                    {isGettingLocation
                      ? 'Obteniendo ubicación...'
                      : latitude && longitude
                      ? 'Ubicación obtenida ✓'
                      : 'Obtener ubicación'}
                  </Text>
                </TouchableOpacity>
                {locationName && (
                  <Text style={styles.locationText}>{locationName}</Text>
                )}
              </View>

              {/* Foto */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Foto (opcional)</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handlePickImage}
                  disabled={isPickingImage}
                >
                  <MaterialIcons
                    name="photo-camera"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>
                    {isPickingImage
                      ? 'Seleccionando...'
                      : photoUrl
                      ? 'Foto seleccionada ✓'
                      : 'Seleccionar foto'}
                  </Text>
                </TouchableOpacity>
                {photoUrl && (
                  <Image source={{ uri: photoUrl }} style={styles.previewImage} />
                )}
              </View>

              {/* Botón de guardar */}
              <TouchableOpacity
                style={[styles.saveButton, isLogging && styles.saveButtonDisabled]}
                onPress={handleLog}
                disabled={isLogging}
              >
                <Text style={styles.saveButtonText}>
                  {isLogging ? 'Guardando...' : 'Guardar Poop'}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B4423',
  },
  date: {
    fontSize: 14,
    color: '#A67C52',
    marginTop: 4,
  },
  logButtonContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logButtonSuccess: {
    backgroundColor: '#8B4513',
  },
  logButtonDisabled: {
    opacity: 0.7,
  },
  logButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 8,
  },
  successContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: {
    fontSize: 64,
  },
  successText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A67C52',
    marginBottom: 8,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#8B4513',
  },
  countEmoji: {
    fontSize: 36,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6B4423',
  },
  statUnit: {
    fontSize: 18,
    fontWeight: '400',
  },
  logsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B4423',
  },
  logCardContent: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  logEmoji: {
    fontSize: 28,
  },
  logDetails: {
    flex: 1,
    gap: 4,
  },
  logTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4423',
  },
  logNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#8B4513',
    marginTop: 4,
  },
  logLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  logLocationText: {
    fontSize: 12,
    color: '#A67C52',
  },
  logDuration: {
    fontSize: 12,
    color: '#A67C52',
    marginTop: 2,
  },
  logRating: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  logPhotoContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logPhoto: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  encouragementCard: {
    marginTop: 24,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  encouragementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  encouragementEmoji: {
    fontSize: 32,
  },
  encouragementText: {
    flex: 1,
  },
  encouragementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C2410C',
  },
  encouragementSubtitle: {
    fontSize: 14,
    color: '#EA580C',
    marginTop: 4,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5E6D3',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#F5E6D3',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#6B4423',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationText: {
    marginTop: 8,
    fontSize: 14,
    color: '#A67C52',
    fontStyle: 'italic',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    resizeMode: 'cover',
  },
  saveButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

