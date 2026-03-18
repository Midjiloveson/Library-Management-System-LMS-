/**
 * CameraScreen.tsx
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   The primary UI screen for capturing a book page.
 *   This component is intentionally "thin" — it delegates:
 *     • Permission logic  →  useCameraPermission()
 *     • Image processing  →  cameraUtils.ts
 *     • OCR triggering    →  navigation to OcrScreen (next module)
 *
 * FLOW:
 *   1. Check / request camera permission
 *   2. Show live camera preview via <Camera>
 *   3. User taps Capture → takePhoto() → normalise → navigate to OCR
 * ─────────────────────────────────────────────────────────────
 */

import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';

// ─── Internal module imports ──────────────────────────────────
import { useCameraPermission } from './useCameraPermission';
import {
  normaliseCapturedPhoto,
  isUsableImage,
  CapturedImage,
} from './cameraUtils';

// ─── Component ────────────────────────────────────────────────
export default function CameraScreen() {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // ── Permission ──────────────────────────────────────────────
  const { permissionStatus, requestPermission } = useCameraPermission();

  // ── Camera device & format ──────────────────────────────────
  // Prefer the back camera — it has the best resolution for scanning
  const device = useCameraDevice('back');

  // Request the highest available photo resolution
  const format = useCameraFormat(device, [
    { photoResolution: 'max' },
  ]);

  // ── Handlers ────────────────────────────────────────────────

  /**
   * handleCapture
   * Core action: take photo → validate → navigate to OCR module.
   * We wrap in try/catch so a hardware error never crashes the app.
   */
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);
    try {
      // takePhoto returns a PhotoFile (path, width, height, etc.)
      const photo = await cameraRef.current.takePhoto({
        flash: 'off', // auto flash can wash out text — keep off initially
      });

      // Normalise to our internal shape (decouples us from VisionCamera types)
      const capturedImage: CapturedImage = normaliseCapturedPhoto(photo);

      // Guard: reject images that are too small to OCR reliably
      if (!isUsableImage(capturedImage)) {
        Alert.alert('Image too small', 'Please move closer to the page.');
        return;
      }

      // Hand off to OCR module via navigation, passing the image as a param
      navigation.navigate('OcrScreen', { image: capturedImage });

    } catch (error) {
      console.error('[CameraScreen] Capture failed:', error);
      Alert.alert('Capture failed', 'Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // ── Permission gate ─────────────────────────────────────────
  if (permissionStatus !== 'granted') {
    return (
      <View style={styles.centred}>
        <Text style={styles.permissionText}>Camera access is required.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── No device found (simulator, etc.) ──────────────────────
  if (!device) {
    return (
      <View style={styles.centred}>
        <Text style={styles.permissionText}>No camera device found.</Text>
      </View>
    );
  }

  // ── Main render ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Live camera preview — fills the screen */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={true}
        photo={true} // enable photo-taking capability
      />

      {/* Capture button — positioned at the bottom center */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureBtn, isCapturing && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          {isCapturing
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.captureIcon}>📷</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centred: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureIcon: {
    fontSize: 30,
  },
});
