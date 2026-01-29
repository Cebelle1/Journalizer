import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { ThemeBackground, themeStyle } from '../styles/theme';
import { verifyPassword } from '../services/PasswordService';
import Icon from '@expo/vector-icons/Ionicons';

export default function PasswordPromptScreen({ navigation, onPasswordVerified }) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
    const [lockedUntil, setLockedUntil] = useState(null);

    const handlePasswordVerify = async () => {
        if (!password.trim()) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setIsLoading(true);
        try {
            const isValid = await verifyPassword(password);
            
            if (isValid) {
                setPassword('');
                setAttempts(0);
                if (onPasswordVerified) {
                    onPasswordVerified();
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainApp' }],
                    });
                }
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setPassword('');

                if (newAttempts >= maxAttempts) {
                    // Lock the app for security
                    const now = new Date();
                    const lockoutEnd = new Date(now.getTime() + lockoutDuration);
                    setLockedUntil(lockoutEnd);

                    Alert.alert(
                        'Security Alert',
                        `Too many failed attempts. Please try again in 15 minutes for security.`,
                        [{ text: 'OK' }]
                    );
                } else {
                    const remainingAttempts = maxAttempts - newAttempts;
                    Alert.alert(
                        'Incorrect Password',
                        `Please try again. ${remainingAttempts} attempt(s) remaining.\n\nAfter 5 failed attempts, access will be locked for 15 minutes.`,
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while verifying password');
            console.error('Password verification error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkLockout = () => {
        if (!lockedUntil) return false;
        const now = new Date();
        if (now < lockedUntil) return true;
        // Lockout has expired
        setLockedUntil(null);
        setAttempts(0);
        setPassword('');
        return false;
    };

    const isLocked = checkLockout();
    const isDisabled = isLoading || isLocked;

    const getRemainingLockoutTime = () => {
        if (!lockedUntil) return '';
        const now = new Date();
        const diff = lockedUntil - now;
        const minutes = Math.ceil(diff / 60000);
        return minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : '';
    };

    return (
        <ThemeBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Icon 
                            name="lock-closed" 
                            size={50} 
                            color={themeStyle.darkPurple2}
                        />
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Enter your password to access your journal
                        </Text>
                    </View>

                    {/* Lockout Warning */}
                    {isLocked && (
                        <View style={styles.lockoutAlert}>
                            <Icon 
                                name="alert-circle" 
                                size={24} 
                                color="#EF4444"
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.lockoutAlertTitle}>Account Temporarily Locked</Text>
                                <Text style={styles.lockoutAlertText}>
                                    Too many failed attempts. Please try again in {getRemainingLockoutTime()}.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Password Input Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Password</Text>
                        
                        <View style={[
                            styles.inputContainer,
                            attempts >= 3 && !isLocked && styles.inputContainerWarning,
                            isLocked && styles.inputContainerError
                        ]}>
                            <Icon 
                                name="lock-open-outline" 
                                size={20} 
                                color={themeStyle.darkGrey1}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={themeStyle.lightGrey1}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                onSubmitEditing={handlePasswordVerify}
                                editable={!isDisabled}
                                autoFocus
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={isDisabled}
                            >
                                <Icon 
                                    name={showPassword ? 'eye' : 'eye-off'} 
                                    size={20} 
                                    color={themeStyle.darkGrey1}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Attempt Counter */}
                    {attempts > 0 && attempts < maxAttempts && !isLocked && (
                        <View style={styles.attemptsWarning}>
                            <Icon 
                                name="warning" 
                                size={16} 
                                color="#F59E0B"
                            />
                            <Text style={styles.attemptsWarningText}>
                                {maxAttempts - attempts} attempt(s) remaining
                            </Text>
                        </View>
                    )}

                    {/* Security Info */}
                    <View style={styles.infoCard}>
                        <Icon 
                            name="shield-checkmark" 
                            size={20} 
                            color={themeStyle.darkPurple2}
                        />
                        <Text style={styles.infoText}>
                            Your password is protected with PBKDF2 encryption
                        </Text>
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            isDisabled && styles.buttonDisabled
                        ]}
                        onPress={handlePasswordVerify}
                        disabled={isDisabled || !password}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={themeStyle.white} size="small" />
                        ) : (
                            <>
                                <Icon 
                                    name="checkmark" 
                                    size={18} 
                                    color={themeStyle.white}
                                />
                                <Text style={styles.verifyButtonText}>Unlock</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Forget Password Note */}
                    <View style={styles.noteContainer}>
                        <Icon 
                            name="information-circle" 
                            size={16} 
                            color={themeStyle.darkGrey1}
                        />
                        <Text style={styles.noteText}>
                            Password is stored locally and encrypted. If forgotten, you'll need to reinstall the app.
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ThemeBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: themeStyle.darkGrey1,
        textAlign: 'center',
        lineHeight: 20,
    },
    lockoutAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    lockoutAlertTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#DC2626',
        marginBottom: 4,
    },
    lockoutAlertText: {
        fontSize: 12,
        color: '#991B1B',
        lineHeight: 18,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: themeStyle.darkPurple2,
        marginBottom: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(142, 68, 173, 0.2)',
        height: 50,
    },
    inputContainerWarning: {
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
    },
    inputContainerError: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
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
    attemptsWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    attemptsWarningText: {
        fontSize: 12,
        color: '#D97706',
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(142, 68, 173, 0.05)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
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
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: themeStyle.darkPurple2,
        borderRadius: 12,
        paddingVertical: 14,
        gap: 10,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: themeStyle.white,
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(107, 114, 128, 0.08)',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    noteText: {
        fontSize: 12,
        color: themeStyle.darkGrey1,
        flex: 1,
        lineHeight: 18,
        fontWeight: '500',
    },
});
