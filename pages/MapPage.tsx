import apiClient from '@/api/client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface FeedPoop {
  id: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
  };
  timestamp: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  photoUrl?: string;
  rating?: number;
  durationMinutes?: number;
}

type FilterType = 'all' | 'me' | 'friends';

export default function MapPage() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<FeedPoop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedPoop, setSelectedPoop] = useState<FeedPoop | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterParam = filter === 'all' ? '' : `?filter=${filter}`;
      const { data } = await apiClient.get(`/poops/feed${filterParam}`);

      // Mapear de snake_case a camelCase
      const logs = (data.logs || data.poops || []).map((log: any) => ({
        id: log.id,
        userId: log.user_id || log.userId,
        timestamp: log.timestamp,
        notes: log.notes,
        latitude: log.latitude ? parseFloat(log.latitude) : undefined,
        longitude: log.longitude ? parseFloat(log.longitude) : undefined,
        locationName: log.location_name || log.locationName,
        photoUrl: log.photo_url || log.photoUrl,
        rating: log.rating,
        durationMinutes: log.duration_minutes || log.durationMinutes,
        user: log.user,
      }));

      setFeed(logs);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setFeed([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Filtrar logs que tengan coordenadas
  const logsWithLocation = useMemo(
    () => feed.filter((log) => log.latitude && log.longitude),
    [feed]
  );

  const getRatingEmoji = (rating: number) => {
    const emojis = ['😫', '😕', '😐', '😊', '🤩'];
    return emojis[rating - 1] || '😐';
  };

  // Generar HTML con Leaflet
  const mapHTML = useMemo(() => {
    const defaultCenter = [-34.6037, -58.3816]; // Buenos Aires por defecto

    if (logsWithLocation.length === 0) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <style>
              body { margin: 0; padding: 0; }
              #map { width: 100%; height: 100vh; }
            </style>
          </head>
          <body>
            <div id="map"></div>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script>
              const map = L.map('map').setView([${defaultCenter[0]}, ${defaultCenter[1]}], 12);
              L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CartoDB'
              }).addTo(map);
            </script>
          </body>
        </html>
      `;
    }

    const markers = logsWithLocation.map((log) => ({
      id: log.id,
      lat: log.latitude!,
      lng: log.longitude!,
      title: log.user?.displayName || 'Tú',
      location: log.locationName || '',
      time: format(new Date(log.timestamp), 'HH:mm'),
      date: format(new Date(log.timestamp), 'dd/MM'),
      isOwn: log.userId === user?.id,
      rating: log.rating,
    }));

    // Calcular centro y zoom
    const latitudes = markers.map((m) => m.lat);
    const longitudes = markers.map((m) => m.lng);
    const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
    const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
    const latDelta = Math.max(...latitudes) - Math.min(...latitudes);
    const lngDelta = Math.max(...longitudes) - Math.min(...longitudes);
    const maxDelta = Math.max(latDelta, lngDelta);
    const zoom = maxDelta > 0.1 ? 11 : maxDelta > 0.05 ? 13 : 15;

    const markersJSON = JSON.stringify(markers);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .marker-own {
              background: #8B4513;
              border: 3px solid #FFFFFF;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .marker-friend {
              background: #3B82F6;
              border: 3px solid #FFFFFF;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .leaflet-popup-content-wrapper {
              border-radius: 12px;
              padding: 0;
            }
            .leaflet-popup-content {
              margin: 12px;
            }
            .popup-title {
              font-weight: 600;
              font-size: 14px;
              color: #1A1A1A;
              margin-bottom: 4px;
            }
            .popup-info {
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const markers = ${markersJSON};
            const userId = "${user?.id || ''}";

            const map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; OpenStreetMap &copy; CartoDB'
            }).addTo(map);

            markers.forEach((m) => {
              const markerClass = m.isOwn ? 'marker-own' : 'marker-friend';
              const emoji = m.isOwn ? '💩' : '💩';

              const customIcon = L.divIcon({
                className: '',
                html: '<div class="' + markerClass + '">' + emoji + '</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });

              const popupContent = '<div class="popup-title">' + m.title + '</div>' +
                '<div class="popup-info">' + m.date + ' ' + m.time + '</div>' +
                (m.location ? '<div class="popup-info">' + m.location + '</div>' : '');

              const marker = L.marker([m.lat, m.lng], { icon: customIcon })
                .addTo(map)
                .bindPopup(popupContent);

              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', id: m.id }));
              });
            });
          </script>
        </body>
      </html>
    `;
  }, [logsWithLocation, user?.id]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const log = logsWithLocation.find((l) => l.id === data.id);
        if (log) {
          setSelectedPoop(log);
          setShowDetails(true);
        }
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPoop(null);
  };

  const openInGoogleMaps = (log: FeedPoop) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`;
    Linking.openURL(url);
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'all': return 'Todos';
      case 'me': return 'Míos';
      case 'friends': return 'Amigos';
    }
  };

  const myCount = logsWithLocation.filter(l => l.userId === user?.id).length;
  const friendsCount = logsWithLocation.filter(l => l.userId !== user?.id).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      ) : (
        <WebView
          source={{ html: mapHTML }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}

      {/* Header con filtros */}
      <View style={[styles.header, { top: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#1A1A1A" />
          <Text style={styles.filterButtonText}>{getFilterLabel()}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {filter !== 'friends' && (
            <View style={styles.statBadge}>
              <View style={[styles.statDot, { backgroundColor: '#8B4513' }]} />
              <Text style={styles.statText}>{myCount}</Text>
            </View>
          )}
          {filter !== 'me' && (
            <View style={styles.statBadge}>
              <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statText}>{friendsCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Empty state */}
      {!isLoading && logsWithLocation.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>Sin ubicaciones</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'me'
                ? 'Registra poops con ubicación'
                : filter === 'friends'
                ? 'Tus amigos no tienen poops con ubicación'
                : 'No hay poops con ubicación'}
            </Text>
          </View>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <View style={[styles.filterModal, { top: insets.top + 70 }]}>
            {(['all', 'me', 'friends'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterOption, filter === f && styles.filterOptionActive]}
                onPress={() => {
                  setFilter(f);
                  setShowFilters(false);
                }}
              >
                <View style={styles.filterOptionContent}>
                  {f === 'all' && <Text style={styles.filterEmoji}>🌍</Text>}
                  {f === 'me' && <View style={[styles.filterDot, { backgroundColor: '#8B4513' }]} />}
                  {f === 'friends' && <View style={[styles.filterDot, { backgroundColor: '#3B82F6' }]} />}
                  <Text style={[styles.filterOptionText, filter === f && styles.filterOptionTextActive]}>
                    {f === 'all' ? 'Todos' : f === 'me' ? 'Solo míos' : 'Solo amigos'}
                  </Text>
                </View>
                {filter === f && <MaterialIcons name="check" size={20} color="#8B4513" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseDetails}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseDetails}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            {selectedPoop && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* User info */}
                <View style={styles.userSection}>
                  <View style={[
                    styles.userAvatar,
                    { backgroundColor: selectedPoop.userId === user?.id ? '#8B4513' : '#3B82F6' }
                  ]}>
                    <Text style={styles.userAvatarText}>
                      {(selectedPoop.user?.displayName || 'T').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {selectedPoop.userId === user?.id ? 'Tú' : selectedPoop.user?.displayName}
                    </Text>
                    <Text style={styles.userTime}>
                      {format(new Date(selectedPoop.timestamp), 'dd/MM/yyyy • HH:mm')}
                    </Text>
                  </View>
                  {selectedPoop.rating && (
                    <Text style={styles.ratingEmoji}>{getRatingEmoji(selectedPoop.rating)}</Text>
                  )}
                </View>

                {/* Location */}
                {selectedPoop.locationName && (
                  <View style={styles.locationSection}>
                    <MaterialIcons name="location-on" size={18} color="#999" />
                    <Text style={styles.locationText}>{selectedPoop.locationName}</Text>
                  </View>
                )}

                {/* Notes */}
                {selectedPoop.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesText}>"{selectedPoop.notes}"</Text>
                  </View>
                )}

                {/* Duration */}
                {selectedPoop.durationMinutes && (
                  <View style={styles.durationSection}>
                    <MaterialIcons name="timer" size={16} color="#999" />
                    <Text style={styles.durationText}>{selectedPoop.durationMinutes} min</Text>
                  </View>
                )}

                {/* Open in Maps */}
                {selectedPoop.latitude && selectedPoop.longitude && (
                  <TouchableOpacity
                    style={styles.mapsButton}
                    onPress={() => openInGoogleMaps(selectedPoop)}
                  >
                    <MaterialIcons name="open-in-new" size={18} color="#FFFFFF" />
                    <Text style={styles.mapsButtonText}>Abrir en Maps</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
    textAlign: 'center',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  filterModal: {
    position: 'absolute',
    left: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  filterOptionActive: {
    backgroundColor: '#FFF8F0',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterEmoji: {
    fontSize: 18,
  },
  filterDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  filterOptionText: {
    fontSize: 15,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  ratingEmoji: {
    fontSize: 32,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  durationText: {
    fontSize: 14,
    color: '#999',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  mapsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
