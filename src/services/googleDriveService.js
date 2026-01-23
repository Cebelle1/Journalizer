import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_WEB_CLIENT_ID = '1024390295547-kdio7p0ag1tpjmt6luno3f3nppf2n6pa.apps.googleusercontent.com';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';

// Storage keys
const STORAGE_KEY_ACCESS_TOKEN = '@journalizer_google_access_token';
const STORAGE_KEY_ID_TOKEN = '@journalizer_google_id_token';

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.idToken = null;
    this.userInfo = null;
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
      console.error('Error checking authentication:', error);
      return false;
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

  // Backup journal entries to Google Drive
  async backupJournal(entries) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      // Get or create backup folder
      const folderId = await this.getOrCreateBackupFolder();

      // Delete existing backups to keep only one backup
      try {
        const existingBackups = await this.listBackups();
        for (const backup of existingBackups) {
          await this.deleteBackup(backup.id);
        }
      } catch (error) {
        console.warn('Could not delete existing backups:', error.message);
      }

      // Create human-readable date format: YYYY-MM-DD_HH-mm-ss
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const timeStr = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
      const fileName = `Backup_${dateStr}_${timeStr}.json`;

      // Step 1: Create file with metadata only
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
        appProperties: {
          app: 'journalizer',
          type: 'backup',
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
      const fileContent = JSON.stringify(entries);
      const parsedContent = JSON.parse(fileContent);
      

      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
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

      // Get or create backup folder
      const folderId = await this.getOrCreateBackupFolder();
      const fileIds = [];


      // Backup each entry individually
      for (const entryData of selectedEntries) {
        try {
          const entryId = entryData.id;
          const entryTitle = entryData.title || `Entry`;

          // Create human-readable date format
          const now = new Date();
          const dateStr = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
          const timeStr = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
          const fileName = `Backup_${entryTitle.substring(0, 20) || 'Entry'}_${entryId}_${dateStr}_${timeStr}.json`;

          // Create file with metadata
          const metadata = {
            name: fileName,
            mimeType: 'application/json',
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

          // Upload content
          const fileContent = JSON.stringify(entryData);

          const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: fileContent,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload backup for entry ${entryId}`);
          }

          fileIds.push(fileId);
        } catch (entryError) {
          console.error(`Error backing up entry ${entryData.id}:`, entryError);
          // Continue with other entries
        }
      }

      return fileIds;
    } catch (error) {
      console.error('Error backing up selected entries:', error);
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

      // Search for backup files in the folder by name pattern
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name contains 'Backup_' and '${folderId}' in parents and trashed=false&spaces=drive&orderBy=createdTime desc`,
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
      
      // Parse the JSON directly
      const data = JSON.parse(text);
      return data;
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
