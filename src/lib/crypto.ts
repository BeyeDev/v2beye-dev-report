import crypto from 'crypto';

const getEncryptionKey = () => {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key || key === 'your-32-character-secure-key-here' || key.length !== 32) {
    throw new Error('Invalid or missing DATA_ENCRYPTION_KEY. Must be exactly 32 characters.');
  }
  return key;
};

const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  const ENCRYPTION_KEY = getEncryptionKey();
  const key = Buffer.from(ENCRYPTION_KEY, 'utf-8');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  if (!text || text.split(':').length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const ENCRYPTION_KEY = getEncryptionKey();
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const key = Buffer.from(ENCRYPTION_KEY, 'utf-8');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
