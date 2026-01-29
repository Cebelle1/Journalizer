import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert,
    ActivityIndicator,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { ThemeBackground, themeStyle } from '../styles/theme';
import { changePassword } from '../services/PasswordService';
import { useFontSize } from '../context/FontSizeContext';
import { fontSizePresets, getFontSizeLabel } from '../utils/fontSizeUtils';
import Icon from '@expo/vector-icons/Ionicons';

export default function SettingsScreen() {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { fontSizeMultiplier, updateFontSize } = useFontSize();

    const handleNewPasswordChange = (pwd) => {
        setNewPassword(pwd);
    };

    const validatePasswordInputs = () => {
        if (!currentPassword.trim()) {
            Alert.alert('Error', 'Current password cannot be empty');
            return false;
        }
        if (!newPassword.trim()) {
            Alert.alert('Error', 'New password cannot be empty');
            return false;
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters long');
            return false;
        }
        if (!/[A-Z]/.test(newPassword)) {
            Alert.alert('Error', 'New password must contain at least one uppercase letter');
            return false;
        }
        if (!/[a-z]/.test(newPassword)) {
            Alert.alert('Error', 'New password must contain at least one lowercase letter');
            return false;
        }
        if (!/[0-9]/.test(newPassword)) {
            Alert.alert('Error', 'New password must contain at least one number');
            return false;
        }
        if (!/[^a-zA-Z0-9]/.test(newPassword)) {
            Alert.alert('Error', 'New password must contain at least one special character');
            return false;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return false;
        }
        if (currentPassword === newPassword) {
            Alert.alert('Error', 'New password must be different from current password');
            return false;
        }
        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePasswordInputs()) return;

        setIsLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password changed successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setShowPasswordModal(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                    },
                },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemeBackground>
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Icon 
                        name="settings" 
                        size={40} 
                        color={themeStyle.darkPurple2}
                    />
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>

                {/* Settings Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Display</Text>

                    {/* Font Size Setting */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingItemLeft}>
                            <Icon 
                                name="text" 
                                size={24} 
                                color={themeStyle.darkPurple2}
                                style={styles.settingIcon}
                            />
                            <View>
                                <Text style={styles.settingItemTitle}>Font Size</Text>
                                <Text style={styles.settingItemSubtitle}>
                                    Current: {getFontSizeLabel(fontSizeMultiplier)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Font Size Options */}
                    <View style={styles.fontSizeContainer}>
                        {Object.entries(fontSizePresets).map(([key, multiplier]) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.fontSizeButton,
                                    fontSizeMultiplier === multiplier && styles.fontSizeButtonActive
                                ]}
                                onPress={() => updateFontSize(multiplier)}
                            >
                                <Text 
                                    style={[
                                        styles.fontSizeButtonText,
                                        fontSizeMultiplier === multiplier && styles.fontSizeButtonTextActive
                                    ]}
                                >
                                    {getFontSizeLabel(multiplier)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    {/* Change Password Button */}
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowPasswordModal(true)}
                    >
                        <View style={styles.settingItemLeft}>
                            <Icon 
                                name="lock-closed" 
                                size={24} 
                                color={themeStyle.darkPurple2}
                                style={styles.settingIcon}
                            />
                            <View>
                                <Text style={styles.settingItemTitle}>Change Password</Text>
                                <Text style={styles.settingItemSubtitle}>Update your app password</Text>
                            </View>
                        </View>
                        <Icon 
                            name="chevron-forward" 
                            size={24} 
                            color={themeStyle.darkGrey1}
                        />
                    </TouchableOpacity>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Icon 
                        name="information-circle" 
                        size={20} 
                        color={themeStyle.darkGrey1}
                    />
                    <Text style={styles.infoText}>
                        Your password protects your private journal entries and is stored securely on your device.
                    </Text>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showPasswordModal}
                transparent
                animationType="slide"
            >
                <ThemeBackground>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.modalContainer}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowPasswordModal(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                >
                                    <Icon 
                                        name="close" 
                                        size={28} 
                                        color={themeStyle.darkPurple2}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Change Password</Text>
                                <View style={{ width: 28 }} />
                            </View>

                            <ScrollView 
                                style={styles.modalContent}
                                contentContainerStyle={styles.modalContentContainer}
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Current Password */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Current Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Icon 
                                            name="lock-closed-outline" 
                                            size={20} 
                                            color={themeStyle.darkGrey1}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter current password"
                                            placeholderTextColor={themeStyle.lightGrey1}
                                            secureTextEntry={!showCurrentPassword}
                                            value={currentPassword}
                                            onChangeText={setCurrentPassword}
                                            editable={!isLoading}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                            disabled={isLoading}
                                        >
                                            <Icon 
                                                name={showCurrentPassword ? 'eye' : 'eye-off'} 
                                                size={20} 
                                                color={themeStyle.darkGrey1}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* New Password Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>New Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Icon 
                                            name="lock-closed-outline" 
                                            size={20} 
                                            color={themeStyle.darkGrey1}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter new password"
                                            placeholderTextColor={themeStyle.lightGrey1}
                                            secureTextEntry={!showNewPassword}
                                            value={newPassword}
                                            onChangeText={handleNewPasswordChange}
                                            editable={!isLoading}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => setShowNewPassword(!showNewPassword)}
                                            disabled={isLoading}
                                        >
                                            <Icon 
                                                name={showNewPassword ? 'eye' : 'eye-off'} 
                                                size={20} 
                                                color={themeStyle.darkGrey1}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Password Requirements */}
                                    <View style={styles.requirementsContainer}>
                                        <Text style={styles.requirementTitle}>Password Requirements:</Text>
                                        <View style={styles.requirementItem}>
                                            <Icon 
                                                name={newPassword.length >= 8 ? "checkmark-circle" : "remove-circle"}
                                                size={16}
                                                color={newPassword.length >= 8 ? '#10B981' : themeStyle.lightGrey1}
                                            />
                                            <Text style={[
                                                styles.requirementText,
                                                newPassword.length >= 8 && styles.requirementMet
                                            ]}>
                                                At least 8 characters
                                            </Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <Icon 
                                                name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "remove-circle"}
                                                size={16}
                                                color={/[A-Z]/.test(newPassword) ? '#10B981' : themeStyle.lightGrey1}
                                            />
                                            <Text style={[
                                                styles.requirementText,
                                                /[A-Z]/.test(newPassword) && styles.requirementMet
                                            ]}>
                                                One uppercase letter (A-Z)
                                            </Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <Icon 
                                                name={/[a-z]/.test(newPassword) ? "checkmark-circle" : "remove-circle"}
                                                size={16}
                                                color={/[a-z]/.test(newPassword) ? '#10B981' : themeStyle.lightGrey1}
                                            />
                                            <Text style={[
                                                styles.requirementText,
                                                /[a-z]/.test(newPassword) && styles.requirementMet
                                            ]}>
                                                One lowercase letter (a-z)
                                            </Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <Icon 
                                                name={/[0-9]/.test(newPassword) ? "checkmark-circle" : "remove-circle"}
                                                size={16}
                                                color={/[0-9]/.test(newPassword) ? '#10B981' : themeStyle.lightGrey1}
                                            />
                                            <Text style={[
                                                styles.requirementText,
                                                /[0-9]/.test(newPassword) && styles.requirementMet
                                            ]}>
                                                One number (0-9)
                                            </Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <Icon 
                                                name={/[^a-zA-Z0-9]/.test(newPassword) ? "checkmark-circle" : "remove-circle"}
                                                size={16}
                                                color={/[^a-zA-Z0-9]/.test(newPassword) ? '#10B981' : themeStyle.lightGrey1}
                                            />
                                            <Text style={[
                                                styles.requirementText,
                                                /[^a-zA-Z0-9]/.test(newPassword) && styles.requirementMet
                                            ]}>
                                                One special character (!@#$%^&*)
                                            </Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <Icon 
                                                name={newPassword === confirmPassword && newPassword ? "checkmark-circle" : "remove-circle"}
                                                size={16}
                                                color={newPassword === confirmPassword && newPassword ? '#10B981' : themeStyle.lightGrey1}
                                            />
                                            <Text style={[
                                                styles.requirementText,
                                                newPassword === confirmPassword && newPassword && styles.requirementMet
                                            ]}>
                                                Passwords match
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Confirm New Password */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Confirm Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Icon 
                                            name="lock-closed-outline" 
                                            size={20} 
                                            color={themeStyle.darkGrey1}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Confirm new password"
                                            placeholderTextColor={themeStyle.lightGrey1}
                                            secureTextEntry={!showConfirmPassword}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            editable={!isLoading}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={isLoading}
                                        >
                                            <Icon 
                                                name={showConfirmPassword ? 'eye' : 'eye-off'} 
                                                size={20} 
                                                color={themeStyle.darkGrey1}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Modal Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setShowPasswordModal(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.updateButton,
                                        (isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) && styles.buttonDisabled
                                    ]}
                                    onPress={handleChangePassword}
                                    disabled={isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={themeStyle.white} size="small" />
                                    ) : (
                                        <>
                                            <Icon 
                                                name="lock-closed" 
                                                size={18} 
                                                color={themeStyle.white}
                                            />
                                            <Text style={styles.updateButtonText}>Update Password</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </ThemeBackground>
            </Modal>
        </ThemeBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        marginTop: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(142, 68, 173, 0.1)',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 12,
    },
    settingItemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: themeStyle.darkPurple2,
        marginBottom: 2,
    },
    settingItemSubtitle: {
        fontSize: 12,
        color: themeStyle.darkGrey1,
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(142, 68, 173, 0.05)',
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 5,
        marginBottom: 40,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(142, 68, 173, 0.1)',
    },
    infoText: {
        fontSize: 12,
        color: themeStyle.darkPurple2,
        flex: 1,
        fontWeight: '500',
        lineHeight: 18,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        marginBottom: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(142, 68, 173, 0.2)',
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: themeStyle.darkPurple2,
        fontWeight: '500',
    },
    strengthContainer: {
        marginBottom: 14,
    },
    strengthBar: {
        height: 6,
        backgroundColor: themeStyle.lightGrey1,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    strengthFill: {
        height: '100%',
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    requirementsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    requirementTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        marginBottom: 10,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    requirementText: {
        fontSize: 12,
        color: themeStyle.darkGrey1,
        fontWeight: '500',
    },
    requirementMet: {
        color: '#10B981',
        fontWeight: '600',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 60,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.08)',
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(142, 68, 173, 0.1)',
        borderRadius: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(142, 68, 173, 0.2)',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
    },
    updateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: themeStyle.darkPurple2,
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    updateButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: themeStyle.white,
    },
    fontSizeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 12,
        marginBottom: 20,
    },
    fontSizeButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1.5,
        borderColor: 'rgba(142, 68, 173, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fontSizeButtonActive: {
        backgroundColor: themeStyle.darkPurple2,
        borderColor: themeStyle.darkPurple2,
    },
    fontSizeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: themeStyle.darkPurple2,
    },
    fontSizeButtonTextActive: {
        color: themeStyle.white,
    },
});