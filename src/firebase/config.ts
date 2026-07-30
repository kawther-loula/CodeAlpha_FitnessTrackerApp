import { initializeApp } from 'firebase/app';
// @ts-expect-error getReactNativePersistence exists in React Native entry point of firebase/auth
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAg6bXDVntrDqpAqL8vsh3mo4_ahYozGhY",
    authDomain: "fitness-tracker-pro-ae550.firebaseapp.com",
    projectId: "fitness-tracker-pro-ae550",
    storageBucket: "fitness-tracker-pro-ae550.firebasestorage.app",
    messagingSenderId: "759790956982",
    appId: "1:759790956982:web:a18811d033b8b0e19d9117",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export const firestore = getFirestore(app);