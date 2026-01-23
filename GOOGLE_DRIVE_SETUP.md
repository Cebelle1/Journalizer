# Google Drive Cloud Sync Setup Guide

## 🎯 Important: This is ONE-TIME DEVELOPER SETUP ONLY!

**The developer will need to do this setup ONCE. End users who install the APK don't need to do anything**

## Prerequisites

- A Google account (for Google Cloud Console)
- Expo development environment set up
- Android Studio (for Android) or Xcode (for iOS)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top and select **"New Project"**
3. Enter a project name (e.g., "Journalizer App")
4. Click **"Create"**

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, navigate to **"APIs & Services" > "Library"**
2. Search for **"Google Drive API"**
3. Click on it and press **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services" > "OAuth consent screen" > "Branding"** 
2. Select **"External"** user type and click **"Create"**
3. Fill in the required information:
   - App name: `Journalizer`
   - User support email: Your email
   - Developer contact information: Your email
4. Click **"Save and Continue"**
5. On the Scopes page, click **"Add or Remove Scopes"**
6. Find and select: `https://www.googleapis.com/auth/drive.file`
7. Click **"Update"** and then **"Save and Continue"**
8. Add test users (your email) and click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Credentials

### Create Web Client ID (Required):

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Select **"Web application"**
4. Fill in the following information:
   - **Name**: `Journalizer Web` (This name is only used to identify the client in the console and will not be shown to end users)
   - **Authorized JavaScript origins**: Leave empty (not needed for this setup)
   - **Authorized redirect URIs**: 
     - Add: `https://auth.expo.io/@cebelle/Journalizer`
     - ⚠️ Note: It may take 5 minutes to a few hours for settings to take effect
5. Click **"Create"**
6. **Save the Client ID** - this is your main client ID!

### For Android (Additional - Required for production builds):

After you build your app with EAS Build, you'll need to add the Android OAuth client:

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Select **"Android"** as application type
4. Enter a name (e.g., "Journalizer Android")
5. Get your package name from `android/app/build.gradle` (look for `applicationId`)
6. Get your SHA-1 certificate fingerprint from EAS:

```bash
# Get SHA-1 from EAS credentials
eas credentials
```

7. Copy the SHA-1 fingerprint and paste it
8. Click **"Create"**
9. This allows OAuth to work on installed APKs

## Step 5: Configure Your App

1. Open `src/services/googleDriveService.js`
2. Replace the placeholder with your Web Client ID:

```javascript
const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```

3. Update your `app.json` with the scheme:

```json
{
  "expo": {
    "scheme": "journalizer",
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## Step 7: Build and Distribute

1. Rebuild your app with the configured credentials:
```bash
expo prebuild
expo run:android
# or
expo run:ios
```

2. Test it yourself:
   - Navigate to the Cloud Sync screen
   - Click "Sign in with Google"
   - Complete the OAuth flow
   - Try creating a backup

3. Build your APK for distribution:
```bash
eas build --platform android
# or
expo build:android
```

4. **That's it!** Any user who installs your APK can now:
   - Open the app
   - Go to Cloud Sync
   - Click "Sign in with Google"
   - Use their own Google account to backup to their own Google Drive
   - No setup needed on their end!

## Troubleshooting

### "Authorization Error" or "Access Denied"

- Verify your OAuth client IDs are correctly configured
- Make sure the Google Drive API is enabled
- Check that you've added yourself as a test user in OAuth consent screen
- Ensure the redirect URI matches exactly

### "Invalid Client" Error

- Double-check your client IDs in `googleDriveService.js`
- Make sure you're using the Web Client ID as the main `GOOGLE_CLIENT_ID`
- Verify the package name matches your Android app

### SHA-1 Fingerprint Issues

- Make sure you're using the correct keystore
- For debug builds, use the debug keystore
- For release builds, you'll need the release keystore fingerprint

### OAuth Redirect Issues

- Ensure `expo-auth-session` and `expo-web-browser` are installed
- Check that the scheme in `app.json` matches the one in your code
- Try clearing the app data and reinstalling

## Security Notes

1. **Never commit your `google-services.json` to version control**
2. Add it to `.gitignore`:
```
# Google Services
google-services.json
GoogleService-Info.plist
```

3. Keep your Client IDs secure
4. Rotate credentials if they are ever exposed

## For End Users (No Setup Required!)

Once you've completed the developer setup above and distributed your APK, your users can:

1. Install the app
2. Open Cloud Sync screen
3. Click "Sign in with Google"
4. Log in with their Google account
5. Start backing up to their own Google Drive!

Each user's backups go to their own personal Google Drive - they don't need developer credentials or any setup.

## Features

Once set up, users can:

- ✅ **Backup**: Create timestamped backups of all journal entries
- ✅ **Restore**: Restore from any previous backup
- ✅ **Manage**: View, download, and delete backups
- ✅ **Auto-sync**: Backups are stored in your Google Drive

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console logs for detailed error messages
3. Verify all credentials are correctly configured
4. Ensure all required packages are installed

## Future Enhancements

Possible improvements:
- Auto-backup on schedule
- Selective restore (individual entries)
- Conflict resolution for multiple device sync
- Other cloud providers (Dropbox, OneDrive, iCloud)
