# 📔 Journalizer

A privacy-focused journaling app for Android that keeps your thoughts secure and organized.

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
- **Color-Coded Tags (To-do)** - Visual organization with customizable tag colors

### ☁️ Cloud Backup (Optional)
- **Google Drive Integration** - Optional backup to Google Drive
- **One Drive Integration (To-do)** - Optional backup to One Drive
- **Individual Entry Backup** - Backup selected entries as separate files
- **Easy Restore** - Restore individual backups or all at once
- **Merge-Friendly** - Restores merge with local data, keeping local-only entries

### 🎨 User Experience
- **Clean Interface** - Beautiful gradient themes with intuitive navigation
- **Dark Theme Support** - Easy on the eyes for night journaling
- **Smooth Navigation** - Drawer navigation for quick access to all features
- **Offline First** - Works perfectly without internet connection

## 🔐 Privacy & Security

Journalizer is built with your privacy in mind:

- **No automatic syncing** - You decide when and what to backup
- **Local-first approach** - Your data stays on your device unless you explicitly choose to backup
- **No analytics or tracking** - We don't collect any usage data
- **Open source** - Full transparency in how your data is handled

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
4. Or tap "Restore All" to restore all backups at once

## 🛠️ Built With

- React Native & Expo
- SQLite for local storage
- Google Drive API (optional integration)
- React Navigation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 💡 Why Journalizer?

In an age where everything is cloud-synced automatically, Journalizer takes a different approach. Your journal is personal, and you should have complete control over where it lives and who can access it. That's why we built Journalizer with local storage first, giving you the option to backup only when you choose to, and only the entries you want to backup.

---

Made with ❤️ for privacy-conscious journalers
