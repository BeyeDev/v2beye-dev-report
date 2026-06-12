import crypto from 'crypto';

const getEncryptionKey = () => {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key || key === 'your-32-character-secure-key-here' || key.length !== 32) {
    throw new Error('Invalid or missing DATA_ENCRYPTION_KEY. Must be exactly 32 characters.');
  }
  return key;
};

const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  const ENCRYPTION_KEY = getEncryptionKey();
  const key = Buffer.concat([Buffer.from(ENCRYPTION_KEY)], 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text || !text.includes(':')) {
    throw new Error('Invalid encrypted text format');
  }
  const ENCRYPTION_KEY = getEncryptionKey();
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift() || '', 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const key = Buffer.concat([Buffer.from(ENCRYPTION_KEY)], 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
