import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, Alert, ActivityIndicator, ScrollView, Animated } from 'react-native';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase/config';

// DESIGN SYSTEM TOKENS
const THEME = {
  primary: '#FF5A36',
  success: '#22C55E',
  surface: '#F7F7F8',
  card: '#FFFFFF',
  muted: '#8A8F98',
  dark: '#121417',
  border: '#E5E7EB',
};

export default function AuthScreen() {
    const isDark = useColorScheme() === 'dark';
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                speed: 10,
                bounciness: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Erreur', 'Merci de remplir tous les champs.');
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email.trim(), password);
            } else {
                await signInWithEmailAndPassword(auth, email.trim(), password);
            }
        } catch (error: any) {
            Alert.alert('Erreur', translateFirebaseError(error.code));
        } finally {
            setLoading(false);
        }
    };

    const screenBg = isDark ? '#0d1117' : THEME.surface;
    const cardBg = isDark ? '#1a1f2e' : THEME.card;
    const inputBg = isDark ? '#0f1318' : '#f8fafc';
    const textPrimary = isDark ? '#ffffff' : THEME.dark;
    const textMuted = isDark ? '#9ca3af' : THEME.muted;

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: screenBg }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                {/* Header Banner */}
                <View
                    style={{
                        backgroundColor: isDark ? '#1a1f2e' : THEME.primary,
                        borderRadius: 24,
                        padding: 24,
                        marginBottom: 32,
                        alignItems: 'center',
                        shadowColor: THEME.primary,
                        shadowOpacity: 0.3,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 8,
                    }}
                >
                    <Text style={{ fontSize: 48, marginBottom: 12 }}>💪</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
                        Bienvenue
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
                        Fitness Tracker Pro
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                        Suivez votre progression et atteignez vos objectifs
                    </Text>
                </View>

                {/* Auth Card */}
                <View
                    style={{
                        backgroundColor: cardBg,
                        borderRadius: 22,
                        padding: 24,
                        shadowColor: '#000',
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 4,
                    }}
                >
                    {/* Title */}
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                        {isSignUp ? 'Créer un nouveau compte' : 'Se connecter'}
                    </Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginBottom: 24 }}>
                        {isSignUp ? 'Rejoignez-nous' : 'Bienvenue'}
                    </Text>

                    {/* Email Input */}
                    <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Adresse Email
                    </Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="vous@exemple.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading}
                        placeholderTextColor={textMuted}
                        style={{
                            backgroundColor: inputBg,
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            fontSize: 15,
                            color: textPrimary,
                            borderWidth: 1,
                            borderColor: isDark ? '#2d3748' : THEME.border,
                            marginBottom: 18,
                        }}
                    />

                    {/* Password Input */}
                    <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Mot de passe
                    </Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                        editable={!loading}
                        placeholderTextColor={textMuted}
                        style={{
                            backgroundColor: inputBg,
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            fontSize: 15,
                            color: textPrimary,
                            borderWidth: 1,
                            borderColor: isDark ? '#2d3748' : THEME.border,
                            marginBottom: 24,
                        }}
                    />

                    {/* Submit Button */}
                    <Pressable
                        onPress={handleSubmit}
                        disabled={loading}
                        style={{
                            backgroundColor: THEME.primary,
                            borderRadius: 16,
                            paddingVertical: 16,
                            alignItems: 'center',
                            shadowColor: THEME.primary,
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 5,
                            marginBottom: 16,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                                {isSignUp ? '✓ Créer mon compte' : '→ Se connecter'}
                            </Text>
                        )}
                    </Pressable>

                    {/* Toggle Auth Mode */}
                    <Pressable
                        onPress={() => setIsSignUp(!isSignUp)}
                        disabled={loading}
                        style={{
                            backgroundColor: isDark ? '#252d3d' : '#f0f4ff',
                            borderRadius: 14,
                            paddingVertical: 14,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: isDark ? '#3d4556' : THEME.border,
                        }}
                    >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: THEME.primary }}>
                            {isSignUp ? '← Déjà un compte ? Se connecter' : '→ Pas de compte ? S\'inscrire'}
                        </Text>
                    </Pressable>
                </View>

                {/* Footer Info */}
                <View style={{ marginTop: 32, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: textMuted, textAlign: 'center', lineHeight: 18 }}>
                        En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                    </Text>
                </View>
            </Animated.View>
        </ScrollView>
    );
}

function translateFirebaseError(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'Cet email est déjà utilisé.';
        case 'auth/invalid-email':
            return 'Email invalide.';
        case 'auth/weak-password':
            return 'Mot de passe trop court (6 caractères minimum).';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Email ou mot de passe incorrect.';
        default:
            return 'Une erreur est survenue. Réessaie.';
    }
}
