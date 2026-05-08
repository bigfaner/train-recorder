// Application constants placeholder

// --- Design System Tokens ---

export const Colors = {
  // Surfaces
  background: "#ffffff",
  backgroundAlt: "#f5f5f7",
  surface: "#ffffff",
  border: "#d2d2d7",

  // Text
  textPrimary: "#1d1d1f",
  textSecondary: "#6e6e73",
  textTertiary: "#86868b",

  // Actions
  accent: "#0071e3",
  accentHover: "#0077ed",
  success: "#30d158",
  error: "#ff3b30",

  // Training types
  pushDay: "#0071e3",
  pullDay: "#30d158",
  legDay: "#ff9500",
  otherSport: "#af52de",
  restDay: "#86868b",
} as const;

export const Typography = {
  // Font families
  sfProDisplay: "-apple-system, 'Segoe UI', Roboto, sans-serif",
  sfProText: "-apple-system, 'Segoe UI', Roboto, sans-serif",

  // Roles: [fontSize, fontWeight, letterSpacing]
  heading1: { fontSize: 28, fontWeight: "600" as const, letterSpacing: -0.01 },
  heading2: { fontSize: 22, fontWeight: "600" as const, letterSpacing: 0 },
  heading3: { fontSize: 17, fontWeight: "600" as const, letterSpacing: 0 },
  body: { fontSize: 17, fontWeight: "400" as const, letterSpacing: 0 },
  bodySmall: { fontSize: 15, fontWeight: "400" as const, letterSpacing: 0 },
  caption: { fontSize: 13, fontWeight: "500" as const, letterSpacing: 0.02 },
  timerDisplay: {
    fontSize: 72,
    fontWeight: "700" as const,
    letterSpacing: -0.02,
  },
  weightDisplay: {
    fontSize: 48,
    fontWeight: "700" as const,
    letterSpacing: -0.02,
  },
} as const;

export const Spacing = {
  contentPadding: 16,
  sectionSpacing: 24,
  cardSpacing: 12,
  cardPadding: 16,
  cardBorderRadius: 16,
  inputBorderRadius: 12,
  touchTarget: 44,
} as const;

export const ComponentSizes = {
  buttonHeight: 50,
  buttonBorderRadius: 12,
  inputHeight: 44,
  inputPaddingHorizontal: 16,
  inputBorderRadius: 12,
  navBarHeight: 44,
  tabBarHeight: 83,
  tagPaddingHorizontal: 12,
  tagPaddingVertical: 4,
} as const;
