import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export interface GMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  zoom?: number;
  interactive?: boolean;
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  style?: ViewStyle;
}

export const GMap: React.FC<GMapProps> = ({
  latitude = 19.0760, // Mumbai default
  longitude = 72.8777,
  title = 'Spare Part Location',
  zoom = 13,
  interactive = false,
  onLocationSelect,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #0F172A;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: #0B1220;
            color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            border-radius: 8px;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .custom-popup .leaflet-popup-tip {
            background: #0B1220;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const lat = ${latitude};
          const lng = ${longitude};
          const isInteractive = ${interactive ? 'true' : 'false'};

          const map = L.map('map', {
            zoomControl: isInteractive,
            dragging: isInteractive,
            touchZoom: isInteractive,
            scrollWheelZoom: false,
            doubleClickZoom: isInteractive,
          }).setView([lat, lng], ${zoom});

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          let marker = L.marker([lat, lng], { draggable: isInteractive }).addTo(map);
          marker.bindPopup("${title.replace(/"/g, '\\"')}", { className: 'custom-popup' }).openPopup();

          if (isInteractive) {
            marker.on('dragend', function(e) {
              const position = marker.getLatLng();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOCATION_CHANGED',
                  latitude: position.lat,
                  longitude: position.lng
                }));
              }
            });

            map.on('click', function(e) {
              marker.setLatLng(e.latlng);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOCATION_SELECTED',
                  latitude: e.latlng.lat,
                  longitude: e.latlng.lng
                }));
              }
            });
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && (data.type === 'LOCATION_CHANGED' || data.type === 'LOCATION_SELECTED')) {
        if (onLocationSelect) {
          onLocationSelect({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      }
    } catch (e) {
      console.warn('[GMap] Error parsing WebView message:', e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1565FF" />
            <Text style={styles.loadingText}>Loading Map...</Text>
          </View>
        )}
      />
    </View>
  );
};

export default GMap;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
});
