# 📔 Journalizer

A privacy-focused journaling app for Android that keeps your thoughts secure and organized.

## 💡 Why Journalizer?

In an age where everything is cloud-synced automatically, Journalizer takes a different approach. Your journal is personal, and you should have complete control over where it lives and who can access it. That's why I built Journalizer with local storage first, giving you the option to backup only when you choose to, and only the entries you want to backup.

## ✨ Features

### 🔒 Privacy First
- **Local Storage by Default** - All your journal entries are stored locally on your device, ensuring your private thoughts stay private
- **Optional Cloud Sync** - Sync only when you choose to, maintaining full control over your data
- **Selective Backup** - Choose which entries to backup to Google Drive instead of syncing everything automatically

### 📝 Journaling
- **Rich Text Entries** - Write detailed journal entries with timestamps
- **Multi-Selection Mode** - Long-press to select multiple entries for batch operations
- **Search Functionality** - Quickly find entries with powerful search
- **Date Organization** - Entries organized chronologically for easy browsing

### 🏷️ Organization
- **Custom Tags** - Create and assign tags to categorize your entries
- **Tag Management** - Add, edit, and delete tags with ease
- **Tag Filtering** - Filter entries by tags to find related thoughts
- **Color-Coded Tags** - Visual organization with customizable tag colors

### ☁️ Cloud Backup (Optional)
- **Google Drive Integration** - Optionally backup entries to Google Drive
- **Individual Entry Backup** - Backup selected entries or all entries at once
- **Easy Restore** - Restore from a specific backup or restore from the latest backup
- **Merge-Friendly** - Restored entries merge with local data, keeping local-only entries intact
- **End-to-End Encrypted** - Files encrypted on cloud with AES-256 encryption before upload

### 🎨 User Experience
- **Clean Interface** - Beautiful gradient themes with intuitive navigation
- **Dark Theme Support** - Easy on the eyes for night journaling
- **Smooth Navigation** - Drawer navigation for quick access to all features
- **Offline First** - Works perfectly without internet connection
- **Customizable Font Size** - Adjust text size (Small, Medium, Large) directly from Settings
- **Live Preview** - See font size changes in real-time before applying

## 🔐 Privacy & Security

Journalizer prioritizes your privacy:

- **Local-first approach** - All entries stored locally on your device
- **You control syncing** - Decide when and what to backup; no automatic syncing
- **No tracking** - No analytics or user data collection
- **Open source** - Full transparency in code and data handling

### 🔒 Password Protection & Encryption

#### App Password
- **Optional Password Protection** - Set up an app password in Settings to protect your journal entries from unauthorized access
- **Strong Password Requirements** - Passwords must meet security standards:
  - Minimum 8 characters, maximum 128 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **PBKDF2 Hashing** - Passwords are hashed using PBKDF2 with 1,000 iterations for fast mobile processing while maintaining reasonable security against offline brute force attacks
- **Secure Storage** - Password hashes are stored securely in the device's secure storage (Secure Enclave on iOS, KeyStore on Android)
- **Salt Generation** - Each password is salted with a cryptographically secure 32-byte random salt

#### Cloud Backup Encryption
- **End-to-End Encryption** - When you backup entries to Google Drive, they are encrypted before upload
- **Deterministic Encryption Key** - The encryption key is derived from your app password combined with a unique salt, allowing you to restore backups across multiple devices
- **AES-256 Encryption** - Backups use AES-256 bit encryption in CBC mode for maximum security
- **Random IV** - Each backup uses a cryptographically random 128-bit Initialization Vector (IV) to ensure identical data produces different ciphertexts
- **Cloud-Stored Salt** - The encryption salt is stored on Google Drive, allowing secure restoration on new devices (salt alone cannot decrypt data without your password)

#### Security Best Practices
- Your password is never transmitted to external servers
- Only encrypted backups are uploaded to Google Drive
- The encryption key is derived locally from your password
- Password changes generate a new salt and re-encrypt future backups
- All cryptographic operations use industry-standard libraries (CryptoJS)

## 🚀 Getting Started

### Prerequisites
- Android device (API 21+)
- (Optional) Google account for cloud backup feature

### Installation
1. Download the APK from the releases page
2. Install on your Android device
3. Start journaling!

### Cloud Sync Setup (Optional)
If you want to use the Google Drive backup feature:
1. Open the app and navigate to Settings > Cloud Sync
2. Tap "Connect to Google Drive"
3. Sign in with your Google account
4. Grant permissions
5. You can now selectively backup entries

## 📱 How to Use

### Creating an Entry
1. Tap the "+" button on the Journal screen
2. Write your entry
3. Add tags (optional)
4. Save

### Multi-Selection Mode
1. Long-press any journal entry
2. Tap other entries to select multiple
3. Use the action buttons to:
   - Delete selected entries
   - Backup selected entries to Google Drive
   - Cancel selection mode

### Backing Up Entries
1. Select entries using multi-selection mode, OR
2. Go to Cloud Sync screen and tap "Create Backup" to backup all
3. Your entries are saved as individual files with titles and timestamps

### Restoring Entries
1. Go to Cloud Sync screen
2. View your backup files
3. Tap the restore icon on any backup to restore it
4. Or tap "Restore Latest" to restore latest backup at once

## 🛠️ Built With

- React Native & Expo
- SQLite for local storage
- Google Drive API (optional integration)
- React Navigation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.


---

Made with ❤️ for privacy-conscious journalers
