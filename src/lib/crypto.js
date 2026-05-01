// AES-GCM encrypted export/import using Web Crypto. Outputs a single base64 string.

const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const deriveKey = async (password, salt) => {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptString = async (plaintext, password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  // Pack: [salt(16)] [iv(12)] [ct]
  const packed = new Uint8Array(salt.byteLength + iv.byteLength + ct.byteLength);
  packed.set(salt, 0);
  packed.set(iv, salt.byteLength);
  packed.set(new Uint8Array(ct), salt.byteLength + iv.byteLength);
  return 'DPv1.' + toB64(packed.buffer);
};

export const decryptString = async (blob, password) => {
  if (!blob.startsWith('DPv1.')) throw new Error('Not a Routinely encrypted blob');
  const packed = fromB64(blob.slice(5));
  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const ct = packed.slice(28);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return dec.decode(pt);
};
