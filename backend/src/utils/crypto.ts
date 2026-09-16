import crypto from 'crypto';

// AES-256-GCM encryption for stored passwords.
// Key is derived from PASSWORD_ENCRYPTION_KEY (preferred) or JWT_SECRET.
const getKey = (): Buffer => {
  const secret = process.env.PASSWORD_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default_secret';
  return crypto.createHash('sha256').update(secret).digest();
};

export const encrypt = (plain: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
};

export const decrypt = (payload: string): string => {
  try {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
};
