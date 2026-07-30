# 🏋️ Fitness Tracker App

Application mobile de suivi d'activité physique développée avec **React Native (Expo)** et **TypeScript**, dans le cadre du stage CodeAlpha — Task 3 : Fitness Tracker App.

## 📱 Aperçu

Une app complète de fitness tracking permettant de suivre pas, activités, calories, hydratation, objectifs personnalisés, et progression dans le temps — avec sauvegarde locale (SQLite) et synchronisation cloud (Firebase).

## ✨ Fonctionnalités

### Core Features
- **Dashboard** — résumé quotidien : pas, calories, temps d'entraînement, hydratation, streak, % d'objectif atteint
- **Activity Tracking** — log d'activités (marche, course, vélo, muscu, natation, yoga, HIIT, personnalisé) avec durée, distance, calories, notes
- **Steps Tracker** — saisie manuelle avec cercle de progression animé (SVG)
- **Water Tracker** — suivi de l'hydratation avec boutons rapides (+250/+500/+750ml)
- **Progress** — graphiques (bar chart, line chart, pie chart) sur 7 jours + statistiques hebdo/mensuelles
- **Goals** — objectifs personnalisables (pas, calories, eau, minutes d'entraînement)
- **History** — historique groupé par date avec détail au clic et suppression
- **Profile** — informations personnelles + calcul automatique du BMI

### Professional Features
- 🌙 **Dark mode** automatique (suit les réglages du système)
- 🏅 **Achievements** — badges débloquables (première séance, streak 7 jours, 10k pas, objectif atteint, défis hebdo)
- 🔥 **Streak counter** — série actuelle + record historique
- ⭐ **Favorite workouts** — sauvegarde de séances type pour un log rapide
- 🎯 **Weekly challenges** — défis hebdomadaires (5 séances, 50k pas)
- ⚖️ **Weight tracker** — graphique d'évolution du poids
- 📤 **Export CSV** — export de l'historique des activités
- 🔔 **Notifications** — rappels quotidiens (entraînement, hydratation)
- ☁️ **Cloud Sync (Firebase)** — authentification email/mot de passe + sauvegarde/restauration des données en ligne
- 💾 **Backup local (JSON)** — export/import manuel en complément du cloud

## 🛠️ Stack technique

| Catégorie | Technologie |
|---|---|
| Framework | React Native + Expo |
| Langage | TypeScript |
| Styling | NativeWind (Tailwind CSS pour React Native) |
| Navigation | React Navigation (Bottom Tabs) |
| Base de données locale | SQLite (expo-sqlite) |
| Backend cloud | Firebase (Authentication + Firestore) |
| Graphiques | react-native-chart-kit, react-native-svg |
| Icônes | @expo/vector-icons |

## 📂 Structure du projet

```
src/
  components/     → composants réutilisables (ProgressBar, etc.)
  context/        → Context API (Auth, Goals)
  db/             → couche SQLite (requêtes, initialisation)
  firebase/       → configuration Firebase + synchronisation cloud
  navigation/      → configuration de la navigation par onglets
  screens/        → écrans de l'application
  types/          → interfaces et types TypeScript
  utils/          → fonctions utilitaires (achievements, export, notifications, backup)
```

## 🚀 Installation

```bash
git clone https://github.com/TON_USERNAME/CodeAlpha_FitnessTrackerApp.git
cd CodeAlpha_FitnessTrackerApp
npm install
npx expo start
```

Scanner le QR code avec l'app **Expo Go** (Android/iOS) pour lancer l'application.

> ⚠️ Les notifications programmées ne fonctionnent pas dans Expo Go (limitation Expo SDK 53+) — elles nécessitent un development build ou l'APK final.

## 📦 Build APK

```bash
eas build --platform android --profile preview
```

## 🔐 Configuration Firebase

Le projet utilise Firebase Authentication (Email/Password) et Firestore pour la synchronisation cloud. La configuration se trouve dans `src/firebase/config.ts`.

## 👩‍💻 Auteur

Kawther — Étudiante en développement web et mobile (ISIA)
Projet réalisé dans le cadre du stage **CodeAlpha** (App Development track).

## 📄 Cahier des charges

Projet réalisé selon les spécifications **CodeAlpha Task 3 — Fitness Tracker App**, couvrant l'intégralité des Core Features et Professional Features demandées.