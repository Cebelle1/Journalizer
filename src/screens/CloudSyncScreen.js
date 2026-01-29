import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import MaterialIcon from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemeBackground, themeStyle } from '../styles/theme';
import { exportAllData, exportSingleEntry, importAllData } from '../database/journalDB';
import GoogleDriveService from '../services/GoogleDriveService';
import { isPasswordInitialized } from '../services/PasswordService';
import { format } from 'date-fns';

export default function CloudSyncScreen() {
    const navigation = useNavigation();
    const [activeProvider, setActiveProvider] = useState('google');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [backupFiles, setBackupFiles] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBackupIds, setSelectedBackupIds] = useState([]);
    const selectionActive = selectedBackupIds.length > 0;

    useEffect(() => {
        checkAuthStatus();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            checkAuthStatus();
        }, [])
    );

    const checkAuthStatus = async () => {
        try {
            const authenticated = await GoogleDriveService.isAuthenticated();
            console.log('Authentication status:', authenticated);
            setIsAuthenticated(authenticated);
            if (authenticated) {
                await loadBackupFiles();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            // Even if there's an error, set to false for safety
            setIsAuthenticated(false);
        }
    };

    const handleSignIn = async () => {
        setIsLoading(true);
        
        try {
            console.log('Attempting Google Sign In...');
            const success = await GoogleDriveService.authenticate();
            if (success) {
                console.log('Sign in successful');
                setIsAuthenticated(true);
                await loadBackupFiles();
            } else {
                console.log('Sign in returned false');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            Alert.alert('✕ Sign In Failed', error.message || 'An error occurred during sign in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await GoogleDriveService.signOut();
                            setIsAuthenticated(false);
                            setBackupFiles([]);
                        } catch (error) {
                            console.error('Sign out error:', error);
                            Alert.alert('✕ Sign Out Failed', error.message || 'Could not sign out. Please try again.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const loadBackupFiles = async () => {
        try {
            const files = await GoogleDriveService.listBackups();
            setBackupFiles(files);
            setSelectedBackupIds((prev) => prev.filter((id) => files.some((file) => file.id === id)));
        } catch (error) {
            console.error('Error loading backup files:', error);
            // Silent fail - UI will show empty state
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            // Check if password is set
            const hasPassword = await isPasswordInitialized();
            if (!hasPassword) {
                setIsLoading(false);
                Alert.alert(
                    '🔐 Password Required',
                    'Set up an app password to encrypt your backups. This ensures your data is secure on Google Drive.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Set Password', onPress: () => navigation.navigate('Settings') },
                    ]
                );
                return;
            }

            // Initialize encryption key from stored password hash
            await GoogleDriveService.initializeEncryptionKey();

            // Export all data from database
            const allData = await exportAllData();
            
            if (!allData.entries || allData.entries.length === 0) {
                Alert.alert('📝 No Entries', 'Create some journal entries first before backing up.');
                setIsLoading(false);
                return;
            }

            // Export each entry individually for backup
            const backupDataList = [];
            for (const entry of allData.entries) {
                try {
                    const backupData = await exportSingleEntry(entry.id);
                    backupDataList.push(backupData);
                } catch (error) {
                    console.error(`Failed to export entry ${entry.id}:`, error);
                }
            }

            if (backupDataList.length === 0) {
                Alert.alert('✕ Backup Failed', 'Could not prepare your entries. Please try again.');
                setIsLoading(false);
                return;
            }

            // Backup each entry as individual file
            const fileIds = await GoogleDriveService.backupSelectedEntries(backupDataList);
            
            console.log(`Backed up ${fileIds.length} entries`);
            await loadBackupFiles();
        } catch (error) {
            console.error('Backup error:', error);
            Alert.alert('✕ Backup Failed', error.message || 'Could not complete backup. Check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreAll = async () => {
        if (backupFiles.length === 0) {
            Alert.alert('☁ No Backups', 'Create a backup first before you can restore.');
            return;
        }

        // Check if password is set
        const hasPassword = await isPasswordInitialized();
        if (!hasPassword) {
            Alert.alert(
                'Password Required',
                'You must set up an app password to restore backups.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Set Password', onPress: () => navigation.navigate('Settings') },
                ]
            );
            return;
        }

        Alert.alert(
            'Restore All Backups',
            `Restore all ${backupFiles.length} backups?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restore',
                    style: 'destructive',
                    onPress: () => restoreAllBackups(),
                },
            ]
        );
    };

    const restoreAllBackups = async () => {
        setIsLoading(true);
        let restoredCount = 0;
        try {
            // Initialize encryption key from stored password hash
            await GoogleDriveService.initializeEncryptionKey();

            for (const file of backupFiles) {
                try {
                    const backupData = await GoogleDriveService.downloadBackup(file.id);
                    await importAllData(backupData);
                    restoredCount += 1;
                } catch (error) {
                    console.error(`Restore failed for ${file.name}:`, error);
                }
            }

            Alert.alert('✓ Restore Complete', `Successfully restored ${restoredCount} backups. Your entries have been merged.`);
            await loadBackupFiles();
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert('✕ Restore Failed', error.message || 'Could not restore backups. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (fileId, fileName) => {
        // Check if password is set
        const hasPassword = await isPasswordInitialized();
        if (!hasPassword) {
            Alert.alert(
                '🔐 Password Required',
                'Set up an app password to restore this backup. Use the same password from when you created the backup.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Set Password', onPress: () => navigation.navigate('Settings') },
                ]
            );
            return;
        }

        Alert.alert(
            'Restore Backup',
            `Restore from "${fileName}"?`,
            `Are you sure you want to restore from "${fileName}"?\n\nThis will merge your local entries with the backup. Local entries not in the backup will be kept.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restore',
                    style: 'destructive',
                    onPress: () => restoreSingleBackup(fileId),
                },
            ]
        );
    };

    const restoreSingleBackup = async (fileId) => {
        setIsLoading(true);
        try {
            // Initialize encryption key from stored password hash
            await GoogleDriveService.initializeEncryptionKey();

            // Download file from Google Drive
            const backupData = await GoogleDriveService.downloadBackup(fileId);
            
            // Import into database - pass the entire backup object
            await importAllData(backupData);
            
            console.log('Backup restored successfully');
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert('✕ Restore Failed', error.message || 'Could not restore this backup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBackup = async (fileId, fileName) => {
        Alert.alert(
            'Delete Backup',
            `Are you sure you want to delete "${fileName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await GoogleDriveService.deleteBackup(fileId);
                            await loadBackupFiles();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('✕ Delete Failed', error.message || 'Could not delete the backup. Please try again.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const toggleSelectBackup = (fileId) => {
        setSelectedBackupIds((prev) => {
            if (prev.includes(fileId)) {
                return prev.filter((id) => id !== fileId);
            }
            return [...prev, fileId];
        });
    };

    const toggleSelectAllBackups = () => {
        if (selectedBackupIds.length === backupFiles.length) {
            setSelectedBackupIds([]);
            return;
        }
        setSelectedBackupIds(backupFiles.map((file) => file.id));
    };

    const handleDeleteSelected = async () => {
        if (selectedBackupIds.length === 0) {
            return;
        }

        Alert.alert(
            'Delete Backups',
            `Delete ${selectedBackupIds.length} selected backup(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteSelectedBackups(),
                },
            ]
        );
    };

    const deleteSelectedBackups = async () => {
        setIsLoading(true);
        let deletedCount = 0;
        try {
            for (const fileId of selectedBackupIds) {
                try {
                    await GoogleDriveService.deleteBackup(fileId);
                    deletedCount += 1;
                } catch (deleteError) {
                    console.error('Failed to delete backup:', deleteError);
                }
            }
            setSelectedBackupIds([]);
            await loadBackupFiles();
        } catch (error) {
            console.error('Bulk delete error:', error);
            Alert.alert('✕ Delete Failed', error.message || 'Could not delete some backups. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBackupFiles();
        setRefreshing(false);
    };

    const formatFileSize = (bytes) => {
        if (bytes === undefined || bytes === null) return null;
        const sizeNum = Number(bytes);
        if (!Number.isFinite(sizeNum)) return null;
        if (sizeNum === 0) return '0 KB';
        const kb = sizeNum / 1024;
        const mb = kb / 1024;
        if (mb >= 1) return `${mb.toFixed(2)} MB`;
        return `${kb.toFixed(2)} KB`;
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch {
            return dateString;
        }
    };

    if (!isAuthenticated) {
        return (
            <ThemeBackground>
                <ScrollView style={cloudSyncStyles.container}>
                    <View style={cloudSyncStyles.headerSection}>
                        <MaterialIcon name="cloud" size={48} color={themeStyle.darkPurple2} />
                        <Text style={cloudSyncStyles.mainTitle}>Cloud Sync</Text>
                        <Text style={cloudSyncStyles.mainSubtitle}>
                            Backup and restore your journal entries
                        </Text>
                    </View>

                    <View style={cloudSyncStyles.providersContainer}>
                        {/* Google Drive Card */}
                        <View style={cloudSyncStyles.providerCard}>
                            <View style={cloudSyncStyles.providerHeader}>
                                <Icon name="logo-google" size={32} color="#4285F4" />
                                <View style={cloudSyncStyles.providerInfo}>
                                    <Text style={cloudSyncStyles.providerName}>Google Drive</Text>
                                    <Text style={cloudSyncStyles.providerStatus}>Not Connected</Text>
                                </View>
                            </View>
                            <Text style={cloudSyncStyles.providerDescription}>
                                Sync your journal entries with Google Drive
                            </Text>
                            <TouchableOpacity 
                                style={cloudSyncStyles.connectButton}
                                onPress={handleSignIn}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={themeStyle.white} />
                                ) : (
                                    <Text style={cloudSyncStyles.connectButtonText}>
                                        Connect to Google Drive
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* OneDrive Card (Coming Soon) */}
                        <View style={[cloudSyncStyles.providerCard, cloudSyncStyles.comingSoonCard]}>
                            <View style={cloudSyncStyles.comingSoonBadge}>
                                <Text style={cloudSyncStyles.comingSoonText}>Coming Soon</Text>
                            </View>
                            <View style={cloudSyncStyles.providerHeader}>
                                <MaterialIcon name="microsoft-onedrive" size={32} color="#0078D4" />
                                <View style={cloudSyncStyles.providerInfo}>
                                    <Text style={cloudSyncStyles.providerName}>OneDrive</Text>
                                    <Text style={cloudSyncStyles.providerStatus}>Not Available</Text>
                                </View>
                            </View>
                            <Text style={cloudSyncStyles.providerDescription}>
                                Sync your journal entries with Microsoft OneDrive
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </ThemeBackground>
        );
    }

    return (
        <ThemeBackground>
            <ScrollView 
                style={cloudSyncStyles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Provider Tab */}
                <View style={cloudSyncStyles.providerTabContainer}>
                    <View style={cloudSyncStyles.activeProviderCard}>
                        <View style={cloudSyncStyles.providerTabHeader}>
                            <Icon name="logo-google" size={28} color="#4285F4" />
                            <Text style={cloudSyncStyles.activeProviderName}>Google Drive</Text>
                            <View style={cloudSyncStyles.connectedBadgeLarge}>
                                <MaterialIcon name="check-circle" size={16} color="#10B981" />
                                <Text style={cloudSyncStyles.connectedStatusText}>Connected</Text>
                            </View>
                        </View>

                        {/* Backup/Restore Actions */}
                        <View style={cloudSyncStyles.actionsGrid}>
                            <TouchableOpacity 
                                style={cloudSyncStyles.actionCard}
                                onPress={handleBackup}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={themeStyle.darkPurple2} size="large" />
                                ) : (
                                    <>
                                        <MaterialIcon name="backup-restore" size={32} color={themeStyle.darkPurple2} />
                                        <Text style={cloudSyncStyles.actionCardTitle}>Create Backup</Text>
                                        <Text style={cloudSyncStyles.actionCardSubtitle}>Save your entries</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[cloudSyncStyles.actionCard, backupFiles.length === 0 && cloudSyncStyles.disabledCard]}
                                onPress={handleRestoreAll}
                                disabled={isLoading || backupFiles.length === 0}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={themeStyle.darkPurple2} size="large" />
                                ) : (
                                    <>
                                        <MaterialIcon 
                                            name="cloud-download-outline" 
                                            size={32} 
                                            color={backupFiles.length === 0 ? themeStyle.darkGrey1 : themeStyle.darkPurple2} 
                                        />
                                        <Text style={[cloudSyncStyles.actionCardTitle, backupFiles.length === 0 && { color: themeStyle.darkGrey1 }]}>
                                            Restore All
                                        </Text>
                                        <Text style={[cloudSyncStyles.actionCardSubtitle, backupFiles.length === 0 && { color: themeStyle.darkGrey1 }]}>
                                            {backupFiles.length === 0 ? 'No backups' : 'Latest backup'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Disconnect Button */}
                        <TouchableOpacity 
                            style={cloudSyncStyles.disconnectButtonBottom}
                            onPress={handleSignOut}
                        >
                            <MaterialIcon name="logout" size={16} color="#DC2626" />
                            <Text style={cloudSyncStyles.disconnectButtonBottomText}>Disconnect Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Backup Files List */}
                <View style={cloudSyncStyles.backupListSection}>
                    <View style={cloudSyncStyles.sectionHeaderRow}>
                        <Text style={cloudSyncStyles.sectionTitle}>
                            Backup Files ({backupFiles.length})
                        </Text>
                        {backupFiles.length > 0 && selectionActive && (
                            <View style={cloudSyncStyles.selectionActions}>
                                <TouchableOpacity
                                    style={cloudSyncStyles.selectAllButton}
                                    onPress={toggleSelectAllBackups}
                                >
                                    <MaterialIcon
                                        name={selectedBackupIds.length === backupFiles.length ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={20}
                                        color={themeStyle.darkPurple2}
                                    />
                                    <Text style={cloudSyncStyles.selectAllText}>Select All</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        cloudSyncStyles.bulkDeleteButton,
                                        selectedBackupIds.length === 0 && cloudSyncStyles.bulkDeleteButtonDisabled
                                    ]}
                                    onPress={handleDeleteSelected}
                                    disabled={selectedBackupIds.length === 0}
                                >
                                    <MaterialIcon name="delete" size={16} color={themeStyle.white} />
                                    <Text style={cloudSyncStyles.bulkDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    
                    {backupFiles.length === 0 ? (
                        <View style={cloudSyncStyles.emptyState}>
                            <MaterialIcon name="cloud-off-outline" size={48} color={themeStyle.darkGrey1} />
                            <Text style={cloudSyncStyles.emptyStateText}>
                                No backups found
                            </Text>
                            <Text style={cloudSyncStyles.emptyStateSubtext}>
                                Create your first backup to get started
                            </Text>
                        </View>
                    ) : (
                        backupFiles.map((file) => (
                            <TouchableOpacity
                                key={file.id}
                                style={cloudSyncStyles.backupItem}
                                activeOpacity={0.9}
                                onLongPress={() => toggleSelectBackup(file.id)}
                                onPress={() => {
                                    if (selectedBackupIds.length > 0) {
                                        toggleSelectBackup(file.id);
                                    }
                                }}
                            >
                                <View style={cloudSyncStyles.backupItemInfo}>
                                    {selectionActive && (
                                        <TouchableOpacity
                                            style={cloudSyncStyles.checkboxButton}
                                            onPress={() => toggleSelectBackup(file.id)}
                                        >
                                            <MaterialIcon
                                                name={selectedBackupIds.includes(file.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                size={22}
                                                color={themeStyle.darkPurple2}
                                            />
                                        </TouchableOpacity>
                                    )}
                                    <MaterialIcon name="file-document" size={24} color={themeStyle.darkPurple2} />
                                    <View style={cloudSyncStyles.backupItemDetails}>
                                        <Text style={cloudSyncStyles.backupItemName}>
                                            {file.name}
                                        </Text>
                                        <Text style={cloudSyncStyles.backupItemMeta}>
                                            Saved: {formatDate(file.modifiedTime)} • {formatFileSize(file.size)}
                                        </Text>
                                    </View>
                                </View>
                                {!selectionActive && (
                                    <View style={cloudSyncStyles.backupItemActions}>
                                        <TouchableOpacity 
                                            style={cloudSyncStyles.restoreButton}
                                            onPress={() => handleRestore(file.id, file.name)}
                                        >
                                            <MaterialIcon name="restore" size={20} color={themeStyle.darkPurple2} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={cloudSyncStyles.deleteButton}
                                            onPress={() => handleDeleteBackup(file.id, file.name)}
                                        >
                                            <MaterialIcon name="delete" size={20} color={themeStyle.brightBrown} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </ThemeBackground>
    );
}

const cloudSyncStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: themeStyle.darkPurple2,
        marginTop: 15,
        marginBottom: 5,
    },
    mainSubtitle: {
        fontSize: 14,
        color: themeStyle.darkGrey1,
        textAlign: 'center',
    },
    providersContainer: {
        padding: 15,
        gap: 15,
    },
    providerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    comingSoonCard: {
        opacity: 0.6,
    },
    comingSoonBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: themeStyle.darkPurple2,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    comingSoonText: {
        color: themeStyle.white,
        fontSize: 12,
        fontWeight: '600',
    },
    providerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    providerInfo: {
        flex: 1,
    },
    providerName: {
        fontSize: 18,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
    },
    providerStatus: {
        fontSize: 12,
        color: themeStyle.darkGrey1,
        marginTop: 2,
    },
    providerDescription: {
        fontSize: 13,
        color: themeStyle.darkGrey1,
        marginBottom: 15,
        lineHeight: 18,
    },
    connectButton: {
        backgroundColor: themeStyle.darkPurple2,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    connectButtonText: {
        color: themeStyle.white,
        fontSize: 14,
        fontWeight: '600',
    },
    connectedHeader: {
        padding: 20,
        paddingBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    connectedBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    connectedStatusText: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '700',
    },
    disconnectButtonBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 18,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
    },
    disconnectButtonBottomText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '600',
    },
    connectedStatus: {
        fontSize: 14,
        color: themeStyle.darkPurple2,
        fontWeight: '600',
    },
    disconnectButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: 'rgba(214, 63, 63, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    disconnectButtonText: {
        color: themeStyle.darkPurple2,
        fontSize: 12,
        fontWeight: '600',
    },
    providerTabContainer: {
        padding: 15,
    },
    activeProviderCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 18,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    providerTabHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    },
    activeProviderName: {
        fontSize: 16,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        flex: 1,
    },
    connectedBadge: {
        backgroundColor: '#10B981',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    connectedBadgeText: {
        color: themeStyle.white,
        fontSize: 11,
        fontWeight: '600',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: 'rgba(142, 68, 173, 0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(142, 68, 173, 0.1)',
    },
    disabledCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    actionCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        marginTop: 10,
        marginBottom: 2,
    },
    actionCardSubtitle: {
        fontSize: 11,
        color: themeStyle.darkGrey1,
    },
    backupListSection: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginBottom: 10,
        gap: 10,
    },
    selectionActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(142, 68, 173, 0.1)',
    },
    selectAllText: {
        fontSize: 12,
        color: themeStyle.darkPurple2,
        fontWeight: '600',
    },
    bulkDeleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: themeStyle.darkPurple2,
    },
    bulkDeleteButtonDisabled: {
        backgroundColor: themeStyle.darkGrey1,
    },
    bulkDeleteText: {
        color: themeStyle.white,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
    },
    emptyStateText: {
        fontSize: 15,
        fontWeight: '600',
        color: themeStyle.darkGrey1,
        marginTop: 12,
    },
    emptyStateSubtext: {
        fontSize: 13,
        color: themeStyle.darkGrey1,
        marginTop: 4,
    },
    backupItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
    },
    backupItemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    checkboxButton: {
        padding: 2,
    },
    backupItemDetails: {
        flex: 1,
    },
    backupItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: themeStyle.darkPurple2,
        marginBottom: 3,
    },
    backupItemMeta: {
        fontSize: 11,
        color: themeStyle.darkGrey1,
    },
    backupItemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    restoreButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(142, 68, 173, 0.15)',
    },
    deleteButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(220, 38, 38, 0.15)',
    },
});
