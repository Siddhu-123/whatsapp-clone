import { get, set, del } from 'idb-keyval';

const SECURITY_CONFIG_KEY = 'wa_security_config_v1';
const AUTH_VERIFICATION_PAYLOAD = 'WHATSAPP_CLONE_SECURE_AUTH_V1';
const PBKDF2_ITERATIONS = 150000;

export interface SecurityConfig {
  isConfigured: boolean;
  salt: string; // Base64 salt for PBKDF2
  iv: string;   // Base64 IV for AES-GCM
  encryptedVerification: string; // Base64 ciphertext of verification token
  autoLockMinutes: number;
}

let activeSessionKey: CryptoKey | null = null;
let lastActivityTimestamp = Date.now();

export function uint8ToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

export function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM 256 key from password
async function deriveAesGcmKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function getSecurityConfig(): Promise<SecurityConfig | null> {
  try {
    const config = await get<SecurityConfig>(SECURITY_CONFIG_KEY);
    return config || null;
  } catch (err) {
    console.error('Failed to get security config from storage:', err);
    return null;
  }
}

export async function saveSecurityConfig(config: SecurityConfig): Promise<void> {
  await set(SECURITY_CONFIG_KEY, config);
}

export async function resetSecurityConfig(): Promise<void> {
  await del(SECURITY_CONFIG_KEY);
  activeSessionKey = null;
}

// Setup encryption with the password generated from the user's extension
export async function setupSecurity(
  password: string,
  autoLockMinutes: number = 15
): Promise<SecurityConfig> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveAesGcmKey(password, salt);

  const enc = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    enc.encode(AUTH_VERIFICATION_PAYLOAD)
  );

  const config: SecurityConfig = {
    isConfigured: true,
    salt: uint8ToBase64(salt),
    iv: uint8ToBase64(iv),
    encryptedVerification: uint8ToBase64(new Uint8Array(ciphertextBuffer)),
    autoLockMinutes
  };

  await saveSecurityConfig(config);
  activeSessionKey = key;
  updateActivity();
  return config;
}

// Verify password against stored config
export async function authenticate(password: string): Promise<boolean> {
  const config = await getSecurityConfig();
  if (!config || !config.isConfigured) {
    return true;
  }

  const salt = base64ToUint8(config.salt);
  const iv = base64ToUint8(config.iv);
  const encrypted = base64ToUint8(config.encryptedVerification);

  try {
    const key = await deriveAesGcmKey(password, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      encrypted as any
    );
    const dec = new TextDecoder();
    const decryptedText = dec.decode(decryptedBuffer);

    if (decryptedText === AUTH_VERIFICATION_PAYLOAD) {
      activeSessionKey = key;
      updateActivity();
      return true;
    }
  } catch {
    // Decryption failed = invalid password
  }
  return false;
}

export function isSessionUnlocked(): boolean {
  return activeSessionKey !== null;
}

export function lockSession(): void {
  activeSessionKey = null;
}

export function updateActivity(): void {
  lastActivityTimestamp = Date.now();
}

export function checkAutoLock(autoLockMinutes: number): boolean {
  if (autoLockMinutes <= 0) return false;
  const elapsed = (Date.now() - lastActivityTimestamp) / 1000 / 60;
  if (elapsed >= autoLockMinutes) {
    lockSession();
    return true;
  }
  return false;
}
