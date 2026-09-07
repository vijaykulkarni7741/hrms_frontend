/**
 * Encryption / Decryption Utilities for Browser Session Storage
 * Encrypts strings prior to storing in sessionStorage to prevent plain-text exposure in devtools/DOM.
 */

const SECRET_KEY = 'hrms_secure_session_encryption_v1';

export function encryptStorageData(data: string): string {
  if (!data) return '';
  try {
    const textBytes = new TextEncoder().encode(data);
    const keyBytes = new TextEncoder().encode(SECRET_KEY);
    const encryptedBytes = textBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
    return 'enc_' + btoa(String.fromCharCode(...encryptedBytes));
  } catch {
    return data;
  }
}

export function decryptStorageData(encryptedData: string | null): string | null {
  if (!encryptedData) return null;
  if (!encryptedData.startsWith('enc_')) return encryptedData; // Fallback for unencrypted data
  try {
    const raw = atob(encryptedData.slice(4));
    const textBytes = Uint8Array.from(raw, c => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(SECRET_KEY);
    const decryptedBytes = textBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
    return new TextDecoder().decode(decryptedBytes);
  } catch {
    return null;
  }
}
