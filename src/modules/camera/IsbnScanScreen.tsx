import React, { useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCameraPermission } from './useCameraPermission';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'IsbnScanScreen'>;

/** Accept 10 or 13 digit barcodes (ISBN-10 / ISBN-13). */
function isLikelyIsbn(value: string): boolean {
  return /^\d{10}$/.test(value) || /^\d{13}$/.test(value);
}

export default function IsbnScanScreen() {
  const navigation = useNavigation<Nav>();
  const hasScannedRef = useRef(false);

  const { permissionStatus, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [{ photoResolution: 'max' }]);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'upc-a'],
    onCodeScanned: (codes) => {
      if (hasScannedRef.current) return;
      for (const code of codes) {
        const value = code.value?.trim();
        if (value && isLikelyIsbn(value)) {
          hasScannedRef.current = true;
          navigation.navigate('ResultsScreen', { isbn: value });
          return;
        }
      }
    },
  });

  // Reset scan guard when the screen regains focus (e.g. after "Scan Another Book")
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      hasScannedRef.current = false;
    });
    return unsubscribe;
  }, [navigation]);

  if (permissionStatus !== 'granted') {
    return (
      <View style={styles.centred}>
        <Text style={styles.msg}>Camera access is required.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centred}>
        <Text style={styles.msg}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={true}
        codeScanner={codeScanner}
      />

      <View style={styles.hint}>
        <Text style={styles.hintText}>Point at the ISBN barcode</Text>
      </View>

      <View style={styles.reticleWrap} pointerEvents="none">
        <View style={styles.reticle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centred: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111',
  },
  msg: { color: '#fff', fontSize: 16, marginBottom: 16, textAlign: 'center' },
  hint: { position: 'absolute', top: 20, width: '100%', alignItems: 'center' },
  hintText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
  },
  reticleWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 280,
    height: 140,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  btn: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
