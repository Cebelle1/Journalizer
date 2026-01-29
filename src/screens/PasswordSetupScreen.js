import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { ThemeBackground, themeStyle } from '../styles/theme';
import { setPassword, getPasswordStrengthInfo } from '../services/PasswordService';
import Icon from '@expo/vector-icons/Ionicons';

export default function PasswordSetupScreen({ navigation, onPasswordSet }) {
    const [password, setPasswordValue] = useState('');
    const [confirmPassword, setConfirmPasswordValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [strengthInfo, setStrengthInfo] = useState({ score: 0, label: 'No password', color: '#D1D5DB' });
    
    // Debug: Log password state
    React.useEffect(() => {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        const passwordsMatch = password === confirmPassword && password.length > 0;
        const meetsLength = password.length >= 8;
        
        console.log('Password state updated:', {
            length: password.length,
            hasUpper,
            hasLower,
            hasNumber,
            hasSpecial,
            meetsLength,
            passwordsMatch,
            isLoading
        });
    }, [password, confirmPassword, isLoading]);

    const handlePasswordChange = (pwd) => {
        setPasswordValue(pwd);
        const info = getPasswordStrengthInfo(pwd);
        setStrengthInfo(info);
    };

    const validateInputs = () => {
        if (!password.trim()) {
            Alert.alert('Error', 'Password cannot be empty');
            return false;
        }
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            Alert.alert('Error', 'Password must contain at least one uppercase letter');
            return false;
        }
        if (!/[a-z]/.test(password)) {
            Alert.alert('Error', 'Password must contain at least one lowercase letter');
            return false;
        }
        if (!/[0-9]/.test(password)) {
            Alert.alert('Error', 'Password must contain at least one number');
            return false;
        }
        if (!/[^a-zA-Z0-9]/.test(password)) {
            Alert.alert('Error', 'Password must contain at least one special character');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSetPassword = async () => {
        console.log('handleSetPassword called');
        if (!validateInputs()) {
            console.log('Validation failed');
            return;
        }

        console.log('Validation passed, starting password set');
        setIsLoading(true);
        try {
            console.log('Calling setPassword...');
            await setPassword(password);
            console.log('setPassword successful');
            Alert.alert('Success', 'Password set successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        console.log('Success alert closed, calling onPasswordSet or navigation');
                        if (onPasswordSet) {
                            onPasswordSet();
                        } else {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'MainApp' }],
                            });
                        }
                    },
                },
            ]);
        } catch (error) {
            console.error('Error in handleSetPassword:', error);
            Alert.alert('Error', error.message || 'Failed to set password');
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordValid = password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password) &&
        password === confirmPassword;

    return (
        <ThemeBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Icon 
                            name="lock-closed-outline" 
                            size={50} 
                            color={themeStyle.darkPurple2}
                        />
                        <Text style={styles.title}>Secure Your Journal</Text>
                        <Text style={styles.subtitle}>
                            Create a strong password to protect your private entries
                        </Text>
                    </View>

                    {/* Password Input Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Create Password</Text>
                        
                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Icon 
                                name="lock-open-outline" 
                                size={20} 
                                color={themeStyle.darkGrey1}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                placeholderTextColor={themeStyle.lightGrey1}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={handlePasswordChange}
                                editable={!isLoading}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                <Icon 
                                    name={showPassword ? 'eye' : 'eye-off'} 
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
                                    name={password.length >= 8 ? "checkmark-circle" : "remove-circle"}
                                    size={16}
                                    color={password.length >= 8 ? '#10B981' : themeStyle.lightGrey1}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    password.length >= 8 && styles.requirementMet
                                ]}>
                                    At least 8 characters
                                </Text>
                            </View>
                            <View style={styles.requirementItem}>
                                <Icon 
                                    name={/[A-Z]/.test(password) ? "checkmark-circle" : "remove-circle"}
                                    size={16}
                                    color={/[A-Z]/.test(password) ? '#10B981' : themeStyle.lightGrey1}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    /[A-Z]/.test(password) && styles.requirementMet
                                ]}>
                                    One uppercase letter (A-Z)
                                </Text>
                            </View>
                            <View style={styles.requirementItem}>
                                <Icon 
                                    name={/[a-z]/.test(password) ? "checkmark-circle" : "remove-circle"}
                                    size={16}
                                    color={/[a-z]/.test(password) ? '#10B981' : themeStyle.lightGrey1}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    /[a-z]/.test(password) && styles.requirementMet
                                ]}>
                                    One lowercase letter (a-z)
                                </Text>
                            </View>
                            <View style={styles.requirementItem}>
                                <Icon 
                                    name={/[0-9]/.test(password) ? "checkmark-circle" : "remove-circle"}
                                    size={16}
                                    color={/[0-9]/.test(password) ? '#10B981' : themeStyle.lightGrey1}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    /[0-9]/.test(password) && styles.requirementMet
                                ]}>
                                    One number (0-9)
                                </Text>
                            </View>
                            <View style={styles.requirementItem}>
                                <Icon 
                                    name={/[^a-zA-Z0-9]/.test(password) ? "checkmark-circle" : "remove-circle"}
                                    size={16}
                                    color={/[^a-zA-Z0-9]/.test(password) ? '#10B981' : themeStyle.lightGrey1}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    /[^a-zA-Z0-9]/.test(password) && styles.requirementMet
                                ]}>
                                    One special character (!@#$%^&*)
                                </Text>
                            </View>
                            <View style={styles.requirementItem}>
                                <Icon 
                                    name={password === confirmPassword && password ? "checkmark-circle" : "remove-circle"}
                                    size={16}
                                    color={password === confirmPassword && password ? '#10B981' : themeStyle.lightGrey1}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    password === confirmPassword && password && styles.requirementMet
                                ]}>
                                    Passwords match
                                </Text>
                            </View>
                        </View>
                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Icon 
                                name="lock-closed-outline" 
                                size={20} 
                                color={themeStyle.darkGrey1}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm password"
                                placeholderTextColor={themeStyle.lightGrey1}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPasswordValue}
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
                    

                    {/* Set Password Button */}
                    <TouchableOpacity
                        style={[
                            styles.setPasswordButton,
                            (isLoading || !isPasswordValid) && styles.buttonDisabled
                        ]}
                        onPress={() => {
                            console.log('Button pressed! isLoading:', isLoading, 'isPasswordValid:', isPasswordValid);
                            handleSetPassword();
                        }}
                        disabled={isLoading || !isPasswordValid}
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
                                <Text style={styles.setPasswordButtonText}>Set Password</Text>
                            </>
                        )}
                    </TouchableOpacity>


                </ScrollView>
            </KeyboardAvoidingView>
        </ThemeBackground>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 70,
        paddingBottom: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
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
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(142, 68, 173, 0.05)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
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
    section: {
        marginBottom: 28,
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
    setPasswordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: themeStyle.darkPurple2,
        borderRadius: 12,
        paddingVertical: 14,
        gap: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    setPasswordButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: themeStyle.white,
    },
});
