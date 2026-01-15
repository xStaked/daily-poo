import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
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
import { usePoops } from '../hooks/usePoops';
import { PoopLog } from '../types';

const { width, height } = Dimensions.get('window');

export default function MapPage() {
  const { logs } = usePoops();
  const insets = useSafeAreaInsets();
  const [selectedPoop, setSelectedPoop] = useState<PoopLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filtrar logs que tengan coordenadas
  const logsWithLocation = useMemo(
    () => logs.filter((log) => log.latitude && log.longitude),
    [logs]
  );

  // Generar HTML con Leaflet (open source, no requiere API key)
  const mapHTML = useMemo(() => {
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
              const map = L.map('map').setView([-34.6037, -58.3816], 12);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
              }).addTo(map);
            </script>
          </body>
        </html>
      `;
    }

    const markers = logsWithLocation.map((log, index) => ({
      id: log.id,
      lat: log.latitude!,
      lng: log.longitude!,
      title: log.locationName || `Poop #${index + 1}`,
      info: log.notes || format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm'),
    }));

    // Calcular centro y zoom
    const latitudes = markers.map((m) => m.lat);
    const longitudes = markers.map((m) => m.lng);
    const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
    const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
    const latDelta = Math.max(...latitudes) - Math.min(...latitudes);
    const lngDelta = Math.max(...longitudes) - Math.min(...longitudes);
    const maxDelta = Math.max(latDelta, lngDelta);
    const zoom = maxDelta > 0.1 ? 10 : maxDelta > 0.05 ? 12 : 14;

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
            .custom-marker { background-color: #8B4513; border: 3px solid #FFFFFF; border-radius: 50%; width: 20px; height: 20px; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const markers = ${markersJSON};
            
            const map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            markers.forEach((markerData) => {
              const customIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div style="width: 20px; height: 20px; background-color: #8B4513; border: 3px solid #FFFFFF; border-radius: 50%;"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              const marker = L.marker([markerData.lat, markerData.lng], { icon: customIcon })
                .addTo(map)
                .bindPopup('<strong>' + markerData.title + '</strong><br>' + markerData.info);

              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', id: markerData.id }));
              });
            });
          </script>
        </body>
      </html>
    `;
  }, [logsWithLocation]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const log = logsWithLocation.find((l) => l.id === data.id);
        if (log) {
          handleMarkerPress(log);
        }
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  };

  const handleMarkerPress = (log: PoopLog) => {
    setSelectedPoop(log);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPoop(null);
  };

  const openInGoogleMaps = (log: PoopLog) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`;
    Linking.openURL(url);
  };

  if (logsWithLocation.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="map" size={64} color="#A67C52" />
          <Text style={styles.emptyTitle}>No hay poops con ubicación</Text>
          <Text style={styles.emptyText}>
            Registra tus poops con ubicación para verlos en el mapa
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WebView
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {/* Badge con cantidad de poops */}
      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <MaterialIcons name="wc" size={16} color="#FFFFFF" />
          <Text style={styles.badgeText}>{logsWithLocation.length}</Text>
        </View>
      </View>

      {/* Modal con detalles del poop */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Poop 💩</Text>
              <TouchableOpacity onPress={handleCloseDetails} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>

            {selectedPoop && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Fecha y hora */}
                <View style={styles.detailRow}>
                  <MaterialIcons name="access-time" size={20} color="#A67C52" />
                  <Text style={styles.detailText}>
                    {format(new Date(selectedPoop.timestamp), 'dd/MM/yyyy HH:mm')}
                  </Text>
                </View>

                {/* Ubicación */}
                {selectedPoop.locationName && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="location-on" size={20} color="#A67C52" />
                    <Text style={styles.detailText}>{selectedPoop.locationName}</Text>
                  </View>
                )}

                {/* Coordenadas */}
                {selectedPoop.latitude && selectedPoop.longitude && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="map" size={20} color="#A67C52" />
                    <Text style={styles.detailText}>
                      {selectedPoop.latitude.toFixed(6)}, {selectedPoop.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}

                {/* Botón para abrir en Google Maps */}
                {selectedPoop.latitude && selectedPoop.longitude && (
                  <TouchableOpacity
                    style={styles.openMapsButton}
                    onPress={() => openInGoogleMaps(selectedPoop)}
                  >
                    <MaterialIcons name="open-in-new" size={20} color="#FFFFFF" />
                    <Text style={styles.openMapsButtonText}>Abrir en Google Maps</Text>
                  </TouchableOpacity>
                )}

                {/* Notas */}
                {selectedPoop.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Notas</Text>
                    <Text style={styles.detailNotes}>&quot;{selectedPoop.notes}&quot;</Text>
                  </View>
                )}

                {/* Rating */}
                {selectedPoop.rating && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Calificación</Text>
                    <View style={styles.ratingContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialIcons
                          key={star}
                          name={star <= selectedPoop.rating! ? 'star' : 'star-border'}
                          size={24}
                          color={star <= selectedPoop.rating! ? '#EAB308' : '#D1D5DB'}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Duración */}
                {selectedPoop.durationMinutes && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="timer" size={20} color="#A67C52" />
                    <Text style={styles.detailText}>{selectedPoop.durationMinutes} minutos</Text>
                  </View>
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
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: width,
    height: height,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A67C52',
    textAlign: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: '#6B4423',
    flex: 1,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A67C52',
    marginBottom: 8,
  },
  detailNotes: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#8B4513',
    lineHeight: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  openMapsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
