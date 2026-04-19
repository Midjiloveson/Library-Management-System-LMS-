// frontend/src/components/BarcodeScanner.jsx

import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BarcodeScanner({ onScanSuccess }) {
  useEffect(() => {
    // Initialize the scanner targeting the div with id "reader"
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, // The scanning box overlay
        aspectRatio: 1.0,
      },
      false
    );

    // What to do when it successfully finds a barcode
    scanner.render(
      (decodedText) => {
        scanner.clear(); // Instantly turn off the camera after a successful read
        onScanSuccess(decodedText); // Pass the ISBN back to the Dashboard
      },
      (error) => {
        // It continuously throws errors when it *doesn't* see a barcode, so we just ignore them
      }
    );

    // Cleanup: Turn off the camera if the user closes the modal without scanning
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScanSuccess]);

  return <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>;
}