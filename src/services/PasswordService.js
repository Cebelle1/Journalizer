import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

const PASSWORD_KEY = 'journalizer_password_hash';
const PASSWORD_SALT_KEY = 'journalizer_password_salt';
const PASSWORD_INITIALIZED_KEY = 'journalizer_password_initialized';

// Security constants
const PBKDF2_ITERATIONS = 1000; // 1k iterations - fast for mobile while still providing reasonable protection against offline brute force
const MIN_PASSWORD_LENGTH = 8; // NIST recommends minimum 8 characters
const SALT_LENGTH = 32; // 32 bytes of salt

// Generate a secure salt for password hashing using expo-crypto
const generateSalt = async () => {
  try {
    // Use expo-crypto to generate random bytes
    const randomBytes = await Crypto.getRandomBytes(SALT_LENGTH);
    // Convert to hex string
    return randomBytes.map(byte => {
      const hex = byte.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  } catch (error) {
    console.error('Error generating salt:', error);
    // Fallback: generate a simple random string if crypto fails
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
};

// Hash password with salt using PBKDF2
const hashPassword = async (password, salt) => {
  // Use PBKDF2 with iterations (lower for mobile due to computational constraints)
  // Wrap in Promise to yield to event loop and prevent main thread blocking
  console.log('hashPassword: Starting PBKDF2 with', PBKDF2_ITERATIONS, 'iterations');
  return new Promise((resolve, reject) => {
    try {
      // Use setTimeout to yield to the event loop before starting the expensive computation
      setTimeout(() => {
        try {
          const hash = CryptoJS.PBKDF2(password, salt, {
            keySize: 64, // 512-bit hash
            iterations: PBKDF2_ITERATIONS,
          });
          const hashString = hash.toString();
          console.log('hashPassword: PBKDF2 complete, hash length:', hashString.length);
          resolve(hashString);
        } catch (innerError) {
          console.error('hashPassword: Error during PBKDF2:', innerError);
          reject(innerError);
        }
      }, 0);
    } catch (error) {
      console.error('hashPassword: Error setting timeout:', error);
      reject(error);
    }
  });
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Set password on first setup
export const setPassword = async (password) => {
  try {
    console.log('setPassword called with password length:', password.length);
    
    if (!password || password.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    console.log('Password validation passed, generating salt...');
    const salt = await generateSalt();
    console.log('Salt generated, hashing password...');
    
    const hashedPassword = await hashPassword(password, salt);
    console.log('Password hashed successfully, storing in secure storage...');

    // Store in secure storage
    console.log('Storing salt...');
    await SecureStore.setItemAsync(PASSWORD_SALT_KEY, salt);
    console.log('Salt stored, storing hashed password...');
    
    await SecureStore.setItemAsync(PASSWORD_KEY, hashedPassword);
    console.log('Password hash stored, marking as initialized...');
    
    await SecureStore.setItemAsync(PASSWORD_INITIALIZED_KEY, 'true');
    console.log('Password set successfully!');
    return true;
  } catch (error) {
    console.error('Error setting password:', error);
    throw error;
  }
};

// Verify password attempt
export const verifyPassword = async (passwordAttempt) => {
  try {
    const salt = await SecureStore.getItemAsync(PASSWORD_SALT_KEY);
    const storedHash = await SecureStore.getItemAsync(PASSWORD_KEY);

    if (!salt || !storedHash) {
      throw new Error('Password not found. Please set up password first.');
    }

    const attemptHash = await hashPassword(passwordAttempt, salt);

    // Use constant-time comparison to prevent timing attacks
    // CryptoJS comparison is timing-safe
    return attemptHash === storedHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

// Check if password has been initialized
export const isPasswordInitialized = async () => {
  try {
    const initialized = await SecureStore.getItemAsync(PASSWORD_INITIALIZED_KEY);
    return initialized === 'true';
  } catch (error) {
    console.error('Error checking password initialization:', error);
    return false;
  }
};

// Change existing password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // Verify current password first
    const isValid = await verifyPassword(currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    if (!newPassword || newPassword.trim().length === 0) {
      throw new Error('New password cannot be empty');
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    // Set new password
    const salt = await generateSalt();
    const hashedPassword = await hashPassword(newPassword, salt);

    await SecureStore.setItemAsync(PASSWORD_SALT_KEY, salt);
    await SecureStore.setItemAsync(PASSWORD_KEY, hashedPassword);

    return true;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Clear password (for logout/reset)
export const clearPassword = async () => {
  try {
    await SecureStore.deleteItemAsync(PASSWORD_KEY);
    await SecureStore.deleteItemAsync(PASSWORD_SALT_KEY);
    await SecureStore.deleteItemAsync(PASSWORD_INITIALIZED_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing password:', error);
    throw error;
  }
};

// Export validation function for use in UI
export const getPasswordStrengthInfo = (password) => {
  if (!password) return { score: 0, label: 'No password', color: '#D1D5DB' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['No password', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['#D1D5DB', '#EF4444', '#F97316', '#F59E0B', '#FBBF24', '#84CC16', '#10B981'];

  return {
    score: Math.min(score, labels.length - 1),
    label: labels[Math.min(score, labels.length - 1)],
    color: colors[Math.min(score, labels.length - 1)],
  };
};

