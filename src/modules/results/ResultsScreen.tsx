/**
 * ResultsScreen.tsx
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   Receives a CapturedImage from navigation params, runs OCR
 *   via useOcr(), and displays the extracted text.
 *
 * This is Module 3 — the end of the current workflow.
 * Future additions: copy to clipboard, export as .txt / PDF, etc.
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CapturedImage } from '../camera/cameraUtils';
import { useOcr } from '../ocr/useOcr';

export default function ResultsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();

  // Image passed from CameraScreen via navigation params
  const image: CapturedImage = route.params?.image;

  const { result, isLoading, runOcr } = useOcr();

  // Auto-run OCR as soon as the screen mounts with a valid image
  useEffect(() => {
    if (image?.uri) {
      runOcr(image.uri);
    }
  }, [image?.uri]);

  const handleCopy = () => {
    if (result?.text) {
      Share.share({ message: result.text });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Extracted Text</Text>

      {/* ── Loading state ── */}
      {isLoading && (
        <View style={styles.centred}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.loadingText}>Reading page…</Text>
        </View>
      )}

      {/* ── Error state ── */}
      {!isLoading && result?.error && (
        <View style={styles.centred}>
          <Text style={styles.errorText}>{result.error}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Success state ── */}
      {!isLoading && result?.text ? (
        <>
          <ScrollView style={styles.textBox}>
            <Text style={styles.extractedText}>{result.text}</Text>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={handleCopy}>
              <Text style={styles.btnText}>Copy Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>Scan Another Page</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F', padding: 16 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#aaa', marginTop: 12 },
  errorText: { color: '#FF6B6B', textAlign: 'center', marginBottom: 16 },
  textBox: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 10, padding: 16 },
  extractedText: { color: '#E8E8E8', fontSize: 15, lineHeight: 24 },
  actions: { marginTop: 16, gap: 10 },
  btn: {
    backgroundColor: '#4A90D9',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondary: { backgroundColor: '#333' },
  btnText: { color: '#fff', fontWeight: '600' },
});
