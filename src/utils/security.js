/**
 * Security utilities for table URL signature generation and verification.
 * This prevents users from manually changing table numbers in the URL to order for other tables.
 */

export const generateTableSignature = (tableNumber) => {
  // Use salt from environment variables or a default fallback
  const salt = import.meta.env?.VITE_TABLE_SECRET_SALT || 'rcp_cafe_secret_salt_2026';
  const str = `${tableNumber}:${salt}`;
  
  // A simple but effective hash function (FNV-1a / polynomial hash variant)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Return a clean, URL-safe alphanumeric string
  return Math.abs(hash).toString(36);
};

export const verifyTableSignature = (tableNumber, token) => {
  if (!tableNumber || !token) return false;
  const expectedToken = generateTableSignature(tableNumber);
  return expectedToken === token;
};
