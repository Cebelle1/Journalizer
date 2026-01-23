import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import MaterialIcon from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemeBackground, themeStyle } from '../styles/theme';
import { exportAllData, importAllData } from '../database/journalDB';
import googleDriveService from '../services/googleDriveService';
import { format } from 'date-fns';

export default function CloudSyncScreen() {
    const navigation = useNavigation();
    const [activeProvider, setActiveProvider] = useState('google');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [backupFiles, setBackupFiles] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

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
            console.log('Checking authentication status...');
            const authenticated = await googleDriveService.isAuthenticated();
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
            const success = await googleDriveService.authenticate();
            if (success) {
                console.log('Sign in successful');
                setIsAuthenticated(true);
                Alert.alert('Success', 'Successfully signed in to Google Drive');
                await loadBackupFiles();
            } else {
                console.log('Sign in returned false');
                Alert.alert('Error', 'Sign in was cancelled or failed.');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            Alert.alert('Error', 'An error occurred during sign in: ' + error.message);
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
                            await googleDriveService.signOut();
                            setIsAuthenticated(false);
                            setBackupFiles([]);
                            Alert.alert('Success', 'Successfully signed out');
                        } catch (error) {
                            console.error('Sign out error:', error);
                            Alert.alert('Error', 'Failed to sign out');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const loadBackupFiles = async () => {
        try {
            const files = await googleDriveService.listBackups();
            setBackupFiles(files);
        } catch (error) {
            console.error('Error loading backup files:', error);
            Alert.alert('Error', 'Failed to load backup files: ' + error.message);
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            // Export data from database
            const data = await exportAllData();
            
            // Use the backupJournal method from service
            await googleDriveService.backupJournal(data);
            
            Alert.alert('Success', 'Backup completed successfully!');
            await loadBackupFiles();
        } catch (error) {
            console.error('Backup error:', error);
            Alert.alert('Error', 'Failed to create backup: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (fileId, fileName) => {
        Alert.alert(
            'Restore Backup',
            `Are you sure you want to restore from "${fileName}"?\n\nThis will replace all current journal entries!`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restore',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            // Download file from Google Drive
                            const backupData = await googleDriveService.downloadBackup(fileId);
                            
                            // Import into database - pass the entire backup object
                            await importAllData(backupData);
                            
                            Alert.alert('Success', 'Backup restored successfully!');
                        } catch (error) {
                            console.error('Restore error:', error);
                            Alert.alert('Error', 'Failed to restore backup: ' + error.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
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
                            await googleDriveService.deleteBackup(fileId);
                            Alert.alert('Success', 'Backup deleted successfully');
                            await loadBackupFiles();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete backup: ' + error.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBackupFiles();
        setRefreshing(false);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const kb = bytes / 1024;
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
                {/* Header */}
                <View style={cloudSyncStyles.connectedHeader}>
                    <View style={cloudSyncStyles.headerTitleRow}>
                        <View>
                            <Text style={cloudSyncStyles.mainTitle}>Cloud Sync</Text>
                            <Text style={cloudSyncStyles.connectedStatus}>
                                <MaterialIcon name="check-circle" size={14} color={themeStyle.darkPurple2} /> Connected to Google Drive
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={cloudSyncStyles.disconnectButton}
                            onPress={handleSignOut}
                        >
                            <Text style={cloudSyncStyles.disconnectButtonText}>Disconnect</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Provider Tab */}
                <View style={cloudSyncStyles.providerTabContainer}>
                    <View style={cloudSyncStyles.activeProviderCard}>
                        <View style={cloudSyncStyles.providerTabHeader}>
                            <Icon name="logo-google" size={28} color="#4285F4" />
                            <Text style={cloudSyncStyles.activeProviderName}>Google Drive</Text>
                            <View style={cloudSyncStyles.connectedBadge}>
                                <Text style={cloudSyncStyles.connectedBadgeText}>Connected</Text>
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

                            <View style={[cloudSyncStyles.actionCard, cloudSyncStyles.disabledCard]}>
                                <MaterialIcon name="cloud-download-outline" size={32} color={themeStyle.darkGrey1} />
                                <Text style={[cloudSyncStyles.actionCardTitle, { color: themeStyle.darkGrey1 }]}>Restore</Text>
                                <Text style={[cloudSyncStyles.actionCardSubtitle, { color: themeStyle.darkGrey1 }]}>Coming soon</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Backup Files List */}
                <View style={cloudSyncStyles.backupListSection}>
                    <Text style={cloudSyncStyles.sectionTitle}>
                        Backup Files ({backupFiles.length})
                    </Text>
                    
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
                            <View key={file.id} style={cloudSyncStyles.backupItem}>
                                <View style={cloudSyncStyles.backupItemInfo}>
                                    <MaterialIcon name="file-document" size={24} color={themeStyle.darkPurple2} />
                                    <View style={cloudSyncStyles.backupItemDetails}>
                                        <Text style={cloudSyncStyles.backupItemName}>
                                            {file.name}
                                        </Text>
                                        <Text style={cloudSyncStyles.backupItemMeta}>
                                            {formatDate(file.modifiedTime)} • {formatFileSize(file.size)}
                                        </Text>
                                    </View>
                                </View>
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
                            </View>
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
        alignItems: 'flex-start',
    },
    connectedStatus: {
        fontSize: 12,
        color: themeStyle.darkPurple2,
        marginTop: 5,
        fontWeight: '500',
    },
    disconnectButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
