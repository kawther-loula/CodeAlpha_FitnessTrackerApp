module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF5A36",     // orange énergie — boutons, accents, CTA
        dark: "#121417",        // presque noir — textes forts, mode sombre
        surface: "#F7F7F8",     // fond gris très clair — arrière-plan des écrans
        card: "#FFFFFF",        // fond des cartes/blocs
        muted: "#8A8F98",       // gris — textes secondaires, dates, labels
        success: "#22C55E",     // vert — objectifs atteints, streaks
        border: "#E5E7EB",      // gris clair — bordures/séparateurs
      },
    },
  },
  plugins: [],
};