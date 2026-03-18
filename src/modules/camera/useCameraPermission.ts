/**
 * useCameraPermission.ts
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   Encapsulates all camera permission logic in one reusable hook.
 *   Keeps CameraScreen.tsx clean — it never calls permission APIs directly.
 *
 * DEPENDENCIES:
 *   react-native-vision-camera  →  `npm install react-native-vision-camera`
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { Camera } from 'react-native-vision-camera';

// ─── Types ────────────────────────────────────────────────────
type PermissionStatus = 'granted' | 'denied' | 'not-determined';

interface UseCameraPermissionReturn {
  permissionStatus: PermissionStatus;
  requestPermission: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useCameraPermission(): UseCameraPermissionReturn {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('not-determined');

  // Check current permission status on mount
  useEffect(() => {
    (async () => {
      const status = await Camera.getCameraPermissionStatus();
      // Map library status strings → our simplified PermissionStatus type
      setPermissionStatus(status === 'granted' ? 'granted' : 'not-determined');
    })();
  }, []);

  // Called when user presses "Allow Camera" button in the UI
  const requestPermission = async () => {
    const result = await Camera.requestCameraPermission();
    setPermissionStatus(result === 'granted' ? 'granted' : 'denied');
  };

  return { permissionStatus, requestPermission };
}
