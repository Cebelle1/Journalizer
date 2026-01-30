import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

const GOOGLE_WEB_CLIENT_ID = '1024390295547-kdio7p0ag1tpjmt6luno3f3nppf2n6pa.apps.googleusercontent.com';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';

// Storage keys
const STORAGE_KEY_ACCESS_TOKEN = '@journalizer_google_access_token';
const STORAGE_KEY_ID_TOKEN = '@journalizer_google_id_token';
const STORAGE_KEY_ENCRYPTION_KEY = '@journalizer_encryption_key';
const STORAGE_KEY_ENCRYPTION_SALT = '@journalizer_encryption_salt';

// Encryption constants
const PBKDF2_ITERATIONS = 10000; // Higher iterations for encryption key derivation
const ENCRYPTION_KEY_SIZE = 256 / 32; // 256-bit key = 8 words in CryptoJS

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.idToken = null;
    this.userInfo = null;
    this.encryptionKey = null;
    this.isAuthenticating = false;
    this.authPromise = null;
    this.initializeGoogleSignIn();
  }

  // Initialize Google Sign In
  initializeGoogleSignIn() {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        scopes: [GOOGLE_DRIVE_SCOPE],
        offlineAccess: true,
      });
    } catch (error) {
      console.warn('Warning configuring GoogleSignin (may be normal during first load):', error.message);
      // This can happen during initial app load - it's not critical
    }
  }

  // Initialize and check for existing tokens
  async initialize() {
    try {
      const accessToken = await AsyncStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
      const idToken = await AsyncStorage.getItem(STORAGE_KEY_ID_TOKEN);

      if (accessToken && idToken) {
        this.accessToken = accessToken;
        this.idToken = idToken;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Google Drive service:', error);
      return false;
    }
  }

  // Authenticate with Google using native sign-in
  async authenticate() {
    // If authentication is already in progress, return the existing promise
    if (this.authPromise) {
      return await this.authPromise;
    }

    this.authPromise = this._performAuthentication();
    try {
      const result = await this.authPromise;
      return result;
    } finally {
      this.authPromise = null;
    }
  }

  async _performAuthentication() {
    try {
      try {
        await GoogleSignin.hasPlayServices();
      } catch (error) {
        console.warn('Play Services not available:', error.message);
      }
      
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo) {
        throw new Error('No user info returned from Google Sign-In');
      }
      
      // Get tokens
      let tokens;
      try {
        tokens = await GoogleSignin.getTokens();
      } catch (tokenError) {
        console.warn('Error getting tokens:', tokenError.message);
        tokens = {};
      }
      
      if (!tokens.accessToken) {
        throw new Error('No access token received');
      }
      
      this.accessToken = tokens.accessToken;
      this.idToken = tokens.idToken || '';
      this.userInfo = userInfo;
      
      // Save tokens
      await this.saveTokens();
      
      return true;
    } catch (error) {
      console.error('Google authentication error:', error);
      this.authPromise = null;
      throw error;
    }
  }

  // Save tokens to storage
  async saveTokens() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, this.accessToken);
      await AsyncStorage.setItem(STORAGE_KEY_ID_TOKEN, this.idToken);
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  // Check if authenticated
  async isAuthenticated() {
    try {
      // If we already have valid access token, use it
      if (this.accessToken) {
        return true;
      }

      // Perform auth check without creating a shared promise
      const result = await this._performAuthCheck();
      return result;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async _performAuthCheck() {
    try {
      // Try to get current user
      try {
        const userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo) {
          this.userInfo = userInfo;
          // Get fresh tokens
          try {
            const tokens = await GoogleSignin.getTokens();
            this.accessToken = tokens.accessToken;
            this.idToken = tokens.idToken;
            return true;
          } catch (tokenError) {
            console.error('Error getting tokens:', tokenError);
            // Try initialize from storage
            return await this.initialize();
          }
        }
      } catch (userError) {
        // ignore
      }
      
      // Fallback: check stored tokens
      const initialized = await this.initialize();
      return initialized;
    } catch (error) {
      console.error('Error in auth check:', error);
      return false;
    }
  }

  // Initialize encryption key for cloud sync
  // REQUIRES app password to be set - this ensures deterministic encryption
  // that works across devices when user restores from cloud backup
  async initializeEncryptionKey() {
    try {
      // Import PasswordService dynamically to avoid circular dependencies
      const { getPasswordHashAndSalt } = await import('./PasswordService');
      const passwordData = await getPasswordHashAndSalt();
      
      if (!passwordData || !passwordData.hash) {
        // Password is REQUIRED for cloud sync
        throw new Error('App password must be set before using cloud backup. Please set up your password in Settings.');
      }
      
      // Derive encryption key from stored password hash
      const driveSalt = await this.getOrCreateEncryptionSalt();
      const key = await this.deriveKeyFromPasswordHash(passwordData.hash, driveSalt);
      this.encryptionKey = key;
      return key;
    } catch (error) {
      console.error('Error initializing encryption key:', error);
      throw error;
    }
  }

  // Generate a random encryption key
  async generateEncryptionKey() {
    // Generate a 256-bit key (32 bytes). Use Expo Crypto for secure random bytes.
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const wordArray = CryptoJS.lib.WordArray.create(randomBytes);
      return wordArray.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.warn('Secure random unavailable, falling back to non-crypto random:', error.message);
      // Fallback: Math.random-based generator (less secure but functional)
      let bytes = '';
      for (let i = 0; i < 32; i += 1) {
        const byte = Math.floor(Math.random() * 256);
        bytes += String.fromCharCode(byte);
      }
      return CryptoJS.enc.Latin1.parse(bytes).toString(CryptoJS.enc.Hex);
    }
  }

  // Derive encryption key from password hash using PBKDF2
  // Uses the stored password hash as input, combined with Drive-specific salt
  async deriveKeyFromPasswordHash(passwordHash, driveSalt) {
    return new Promise((resolve, reject) => {
      try {
        // Use setTimeout to prevent blocking the main thread
        setTimeout(() => {
          try {
            // Derive encryption key from password hash + drive salt
            // This ensures the encryption key is different from the password hash
            // but still deterministic based on user's password
            const key = CryptoJS.PBKDF2(passwordHash, driveSalt, {
              keySize: ENCRYPTION_KEY_SIZE,
              iterations: PBKDF2_ITERATIONS,
            });
            resolve(key.toString(CryptoJS.enc.Hex));
          } catch (innerError) {
            console.error('Error deriving key from password hash:', innerError);
            reject(innerError);
          }
        }, 0);
      } catch (error) {
        console.error('Error in deriveKeyFromPasswordHash:', error);
        reject(error);
      }
    });
  }

  // Get or create encryption salt (stored in Google Drive for cloud sync)
  async getOrCreateEncryptionSalt() {
    try {
      // First check local storage
      let salt = await AsyncStorage.getItem(STORAGE_KEY_ENCRYPTION_SALT);
      
      if (!salt) {
        // Try to download from Google Drive
        const authenticated = await this.isAuthenticated();
        if (authenticated) {
          try {
            salt = await this.downloadEncryptionSalt();
            if (salt) {
              // Store locally for next time
              await AsyncStorage.setItem(STORAGE_KEY_ENCRYPTION_SALT, salt);
            }
          } catch (error) {
            console.log('No salt found in Google Drive, will create new one');
          }
        }
        
        // If still no salt, generate a new one
        if (!salt) {
          salt = await this.generateEncryptionSalt();
          await AsyncStorage.setItem(STORAGE_KEY_ENCRYPTION_SALT, salt);
          
          // Upload to Google Drive if authenticated
          if (authenticated) {
            try {
              await this.uploadEncryptionSalt(salt);
            } catch (error) {
              console.error('Error uploading salt to Google Drive:', error);
            }
          }
        }
      }
      
      return salt;
    } catch (error) {
      console.error('Error getting encryption salt:', error);
      throw error;
    }
  }

  // Generate a secure random salt
  async generateEncryptionSalt() {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const wordArray = CryptoJS.lib.WordArray.create(randomBytes);
      return wordArray.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.warn('Secure random unavailable for salt, using fallback');
      // Fallback to timestamp + random
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  }

  // Encrypt data
  async encryptData(data) {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }
      
      const jsonString = JSON.stringify(data);
      const ivBytes = await Crypto.getRandomBytesAsync(16);
      const iv = CryptoJS.lib.WordArray.create(ivBytes);
      const key = CryptoJS.enc.Hex.parse(this.encryptionKey);

      const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return JSON.stringify({
        v: 1,
        iv: iv.toString(CryptoJS.enc.Base64),
        data: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      });
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  // Decrypt data
  async decryptData(encryptedData) {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }
      
      // New format: JSON string containing iv + data
      let parsedPayload = null;
      try {
        parsedPayload = JSON.parse(encryptedData);
      } catch {
        parsedPayload = null;
      }

      if (parsedPayload && parsedPayload.iv && parsedPayload.data) {
        const key = CryptoJS.enc.Hex.parse(this.encryptionKey);
        const iv = CryptoJS.enc.Base64.parse(parsedPayload.iv);
        const ciphertext = CryptoJS.enc.Base64.parse(parsedPayload.data);
        const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });
        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) {
          throw new Error('Decryption failed - invalid data or key');
        }
        return JSON.parse(decryptedString);
      }

      // Legacy format: AES with passphrase
      const legacyDecrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const legacyString = legacyDecrypted.toString(CryptoJS.enc.Utf8);
      if (!legacyString) {
        throw new Error('Decryption failed - invalid data or key');
      }
      return JSON.parse(legacyString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      await GoogleSignin.signOut();
      
      await AsyncStorage.multiRemove([
        STORAGE_KEY_ACCESS_TOKEN,
        STORAGE_KEY_ID_TOKEN,
      ]);

      this.accessToken = null;
      this.idToken = null;
      this.userInfo = null;
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }

  // Create backup folder in Google Drive
  async createBackupFolder() {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${GOOGLE_DRIVE_API}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Journalizer Backups',
          mimeType: 'application/vnd.google-apps.folder',
          properties: {
            app: 'journalizer',
            type: 'backup_folder',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create backup folder: ${response.status}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating backup folder:', error);
      throw error;
    }
  }

  // Find or create backup folder
  // Refresh access token
  async refreshAccessToken() {
    try {
      const tokens = await GoogleSignin.getTokens();
      this.accessToken = tokens.accessToken;
      this.idToken = tokens.idToken;
      await this.saveTokens();
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async getOrCreateBackupFolder() {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      // Search for existing backup folder
      const searchResponse = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name='Journalizer Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&pageSize=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (searchResponse.status === 401) {
        // Token expired, refresh and retry
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return await this.getOrCreateBackupFolder();
        } else {
          throw new Error('Failed to refresh token');
        }
      }

      if (!searchResponse.ok) {
        throw new Error(`Failed to search for backup folder: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Create new backup folder if not found
      return await this.createBackupFolder();
    } catch (error) {
      console.error('Error getting or creating backup folder:', error);
      throw error;
    }
  }

  async searchFiles(query) {
    try {
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=${encodeURIComponent(query)}&spaces=drive&pageSize=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return await this.searchFiles(query);
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to search files: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  // Backup journal entries to Google Drive
  async backupJournal(entries) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      // Ensure encryption key is initialized
      if (!this.encryptionKey) {
        await this.initializeEncryptionKey();
      }

      // Get or create backup folder
      const folderId = await this.getOrCreateBackupFolder();

      // Create filename with timestamp: Backup_YYYY-MM-DD_HH-MM-SS.json
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const fileName = `Backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;

      // Count entries in the backup
      const entryCount = entries.entries ? entries.entries.length : 0;

      // Step 1: Create file with metadata only
      const metadata = {
        name: fileName,
        mimeType: 'text/plain',
        parents: [folderId],
        appProperties: {
          app: 'journalizer',
          type: 'backup',
          timestamp: now.toISOString(),
          entryCount: String(entryCount),
        },
      };

      const createResponse = await fetch(`${GOOGLE_DRIVE_API}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Create file error:', errorText);
        throw new Error(`Failed to create backup file: ${createResponse.status}`);
      }

      const fileInfo = await createResponse.json();
      const fileId = fileInfo.id;

      // Step 2: Upload content to the dedicated upload endpoint
      // entries parameter already contains the full exported data structure
      
      // Encrypt the data before uploading
      const encryptedContent = await this.encryptData(entries);
      
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'text/plain',
        },
        body: encryptedContent,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload content error:', errorText);
        throw new Error(`Failed to upload backup content: ${uploadResponse.status}`);
      }

      return fileId;
    } catch (error) {
      console.error('Error backing up journal:', error);
      throw error;
    }
  }

  // Backup multiple selected entries (each as individual file)
  async backupSelectedEntries(selectedEntries) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      if (!selectedEntries || selectedEntries.length === 0) {
        throw new Error('No entries selected for backup');
      }

      // Ensure encryption key is initialized
      if (!this.encryptionKey) {
        await this.initializeEncryptionKey();
      }

      // Get or create backup folder
      const folderId = await this.getOrCreateBackupFolder();
      const fileIds = [];


      // Backup each entry individually
      for (const entryData of selectedEntries) {
        try {
          // Extract the actual entry from the backup structure
          const actualEntry = entryData.entries?.[0];
          if (!actualEntry) {
            console.error('Invalid entry data structure:', entryData);
            continue;
          }
          
          const entryId = actualEntry.id;
          const entryTitle = actualEntry.title?.trim() || 'Untitled';
          
          // Sanitize title for filename (remove special characters)
          const sanitizedTitle = entryTitle.substring(0, 50).replace(/[<>:"/\\|?*]/g, '_');

          // Use the journal entry's date for filename (YYYY-MM-DD)
          const entryDate = new Date(actualEntry.date);
          const dateStr = Number.isNaN(entryDate.getTime())
            ? new Date().toISOString().split('T')[0]
            : entryDate.toISOString().split('T')[0];
          const fileName = `${sanitizedTitle}_${dateStr}.json`;

          // Delete existing backup for this entry to overwrite
          try {
            const existingEntryBackups = await this.searchFiles(
              `'${folderId}' in parents and appProperties has { key='app' and value='journalizer' } and appProperties has { key='type' and value='backup-entry' } and appProperties has { key='entryId' and value='${String(entryId)}' } and trashed=false`
            );
            for (const existingBackup of existingEntryBackups) {
              await this.deleteBackup(existingBackup.id);
            }
          } catch (error) {
            console.warn(`Could not delete existing backup for entry ${entryId}:`, error.message);
          }

          // Create file with metadata
          const metadata = {
            name: fileName,
            mimeType: 'text/plain',
            parents: [folderId],
            appProperties: {
              app: 'journalizer',
              type: 'backup-entry',
              entryId: String(entryId),
            },
          };

          const createResponse = await fetch(`${GOOGLE_DRIVE_API}/files`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
          });

          if (!createResponse.ok) {
            throw new Error(`Failed to create backup file for entry ${entryId}`);
          }

          const fileInfo = await createResponse.json();
          const fileId = fileInfo.id;

          // Upload content - encrypt before uploading
          const encryptedContent = await this.encryptData(entryData);

          const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'text/plain',
            },
            body: encryptedContent,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload backup for entry ${entryId}`);
          }

          fileIds.push(fileId);
        } catch (entryError) {
          console.error(`Error backing up entry:`, entryError);
          // Continue with other entries
        }
      }

      return fileIds;
    } catch (error) {
      console.error('Error backing up selected entries:', error);
      throw error;
    }
  }

  // Upload encryption salt to Google Drive
  async uploadEncryptionSalt(salt) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      const folderId = await this.getOrCreateBackupFolder();
      
      // Check if salt file already exists
      const existingFiles = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name='encryption-salt.txt' and '${folderId}' in parents and trashed=false&spaces=drive`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!existingFiles.ok) {
        throw new Error('Failed to check for existing salt file');
      }

      const existingData = await existingFiles.json();
      const existingFile = existingData.files?.[0];

      if (existingFile) {
        // Update existing salt file
        const updateResponse = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'text/plain',
            },
            body: salt,
          }
        );

        if (!updateResponse.ok) {
          throw new Error('Failed to update salt file');
        }
      } else {
        // Create new salt file
        const metadata = {
          name: 'encryption-salt.txt',
          mimeType: 'text/plain',
          parents: [folderId],
        };

        const formData = new FormData();
        formData.append('metadata', JSON.stringify(metadata));
        formData.append('file', new Blob([salt], { type: 'text/plain' }));

        const createResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
            body: formData,
          }
        );

        if (!createResponse.ok) {
          throw new Error('Failed to create salt file');
        }
      }

      console.log('Encryption salt uploaded to Google Drive');
    } catch (error) {
      console.error('Error uploading encryption salt:', error);
      throw error;
    }
  }

  // Download encryption salt from Google Drive
  async downloadEncryptionSalt() {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      const folderId = await this.getOrCreateBackupFolder();
      
      // Search for salt file
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name='encryption-salt.txt' and '${folderId}' in parents and trashed=false&spaces=drive`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return await this.downloadEncryptionSalt();
        }
      }

      if (!response.ok) {
        throw new Error('Failed to search for salt file');
      }

      const data = await response.json();
      const saltFile = data.files?.[0];

      if (!saltFile) {
        return null; // No salt file found
      }

      // Download the salt content
      const downloadResponse = await fetch(
        `${GOOGLE_DRIVE_API}/files/${saltFile.id}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!downloadResponse.ok) {
        throw new Error('Failed to download salt file');
      }

      const salt = await downloadResponse.text();
      return salt;
    } catch (error) {
      console.error('Error downloading encryption salt:', error);
      throw error;
    }
  }

  // List all backups in Google Drive
  async listBackups() {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      // Get the backup folder first
      const folderId = await this.getOrCreateBackupFolder();

      // Search for backup files in the folder (all .json files)
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q='${folderId}' in parents and (mimeType='application/json' or mimeType='text/plain') and trashed=false&spaces=drive&orderBy=createdTime desc&fields=files(id,name,modifiedTime,size,appProperties)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return await this.listBackups();
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to list backups: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }

  // Download a backup file from Google Drive
  async downloadBackup(fileId) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      // Ensure encryption key is initialized
      if (!this.encryptionKey) {
        await this.initializeEncryptionKey();
      }

      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download backup: ${response.status}`);
      }

      const text = await response.text();
      
      // Try to parse as JSON first
      try {
        const data = JSON.parse(text);
        // If this looks like an encrypted payload, decrypt it
        if (data && data.iv && data.data) {
          return await this.decryptData(text);
        }
        return data;
      } catch (parseError) {
        // If JSON parsing fails, it's likely encrypted - try to decrypt
        try {
          const decryptedData = await this.decryptData(text);
          return decryptedData;
        } catch (decryptError) {
          console.error('Failed to decrypt backup:', decryptError.message);
          throw new Error('Failed to decrypt or parse backup file, likely due to incorrect encryption key.\n\nIncorrect app password may cause this issue.');
        }
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  }

  // Delete a backup from Google Drive
  async deleteBackup(fileId) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete backup: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  // Helper method to create multipart body for file upload
  createMultipartBody(metadata, fileContent) {
    const boundary = '===============1234567890==';
    let body = '';

    body += `--${boundary}\r\n`;
    body += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
    body += JSON.stringify(metadata);
    body += '\r\n';

    body += `--${boundary}\r\n`;
    body += 'Content-Type: application/json\r\n\r\n';
    body += fileContent;
    body += '\r\n';

    body += `--${boundary}--`;

    return body;
  }
}

export default new GoogleDriveService();
