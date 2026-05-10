/**
 * Settings Store (Zustand)
 *
 * Caches user preferences from user_settings table.
 * Provides reactive access to weightUnit, defaultRestTime, notifications.
 *
 * Settings are loaded once on app start and cached in Zustand state.
 * Updates are written through to the repository and reflected in state.
 */

import { create } from "zustand";
import type { UserSettingsRepo } from "../db/repositories/user-settings.repo";

// ============================================================
// State Shape
// ============================================================

export interface UserPreferences {
  weightUnit: "kg" | "lbs";
  defaultRestTime: number; // seconds
  notificationsEnabled: boolean;
  reminderTime: string | null; // HH:mm format, or null if disabled
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
}

export interface SettingsStoreState {
  preferences: UserPreferences;
  isLoaded: boolean;
}

export interface SettingsStoreActions {
  /** Load preferences from user_settings table */
  loadPreferences(): void;

  /** Update weight unit */
  setWeightUnit(unit: "kg" | "lbs"): void;

  /** Update default rest time */
  setDefaultRestTime(seconds: number): void;

  /** Update notifications enabled */
  setNotificationsEnabled(enabled: boolean): void;

  /** Update reminder time */
  setReminderTime(time: string | null): void;

  /** Update vibration on rest end */
  setVibrationEnabled(enabled: boolean): void;

  /** Update sound on rest end */
  setSoundEnabled(enabled: boolean): void;

  /** Set onboarding completed */
  setOnboardingCompleted(completed: boolean): void;
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

// ============================================================
// Default Preferences
// ============================================================

const defaultPreferences: UserPreferences = {
  weightUnit: "kg",
  defaultRestTime: 90, // 90 seconds
  notificationsEnabled: true,
  reminderTime: null,
  vibrationEnabled: true,
  soundEnabled: false,
  onboardingCompleted: false,
};

// ============================================================
// Dependencies
// ============================================================

export interface SettingsStoreDeps {
  userSettingsRepo: UserSettingsRepo;
}

// ============================================================
// Store Factory
// ============================================================

export function createSettingsStore(deps: SettingsStoreDeps) {
  const { userSettingsRepo } = deps;

  return create<SettingsStore>((set) => ({
    preferences: { ...defaultPreferences },
    isLoaded: false,

    loadPreferences() {
      const weightUnit = userSettingsRepo.getValue("weight_unit");
      const defaultRestTime = userSettingsRepo.getValue("default_rest_time");
      const notificationsEnabled = userSettingsRepo.getValue(
        "notifications_enabled",
      );
      const reminderTime = userSettingsRepo.getValue("reminder_time");
      const vibrationEnabled = userSettingsRepo.getValue("vibration_enabled");
      const soundEnabled = userSettingsRepo.getValue("sound_enabled");
      const onboardingCompleted = userSettingsRepo.getValue(
        "onboarding_completed",
      );

      set({
        preferences: {
          weightUnit:
            weightUnit === "lbs" ? "lbs" : defaultPreferences.weightUnit,
          defaultRestTime: defaultRestTime
            ? parseInt(defaultRestTime, 10)
            : defaultPreferences.defaultRestTime,
          notificationsEnabled:
            notificationsEnabled === "0"
              ? false
              : notificationsEnabled === "1"
                ? true
                : defaultPreferences.notificationsEnabled,
          reminderTime: reminderTime ?? defaultPreferences.reminderTime,
          vibrationEnabled:
            vibrationEnabled === "0"
              ? false
              : vibrationEnabled === "1"
                ? true
                : defaultPreferences.vibrationEnabled,
          soundEnabled:
            soundEnabled === "0"
              ? false
              : soundEnabled === "1"
                ? true
                : defaultPreferences.soundEnabled,
          onboardingCompleted: onboardingCompleted === "true",
        },
        isLoaded: true,
      });
    },

    setWeightUnit(unit) {
      userSettingsRepo.setValue("weight_unit", unit);
      set((state) => ({
        preferences: { ...state.preferences, weightUnit: unit },
      }));
    },

    setDefaultRestTime(seconds) {
      userSettingsRepo.setValue("default_rest_time", String(seconds));
      set((state) => ({
        preferences: { ...state.preferences, defaultRestTime: seconds },
      }));
    },

    setNotificationsEnabled(enabled) {
      userSettingsRepo.setValue("notifications_enabled", enabled ? "1" : "0");
      set((state) => ({
        preferences: {
          ...state.preferences,
          notificationsEnabled: enabled,
        },
      }));
    },

    setReminderTime(time) {
      userSettingsRepo.setValue("reminder_time", time ?? "");
      set((state) => ({
        preferences: { ...state.preferences, reminderTime: time },
      }));
    },

    setVibrationEnabled(enabled) {
      userSettingsRepo.setValue("vibration_enabled", enabled ? "1" : "0");
      set((state) => ({
        preferences: { ...state.preferences, vibrationEnabled: enabled },
      }));
    },

    setSoundEnabled(enabled) {
      userSettingsRepo.setValue("sound_enabled", enabled ? "1" : "0");
      set((state) => ({
        preferences: { ...state.preferences, soundEnabled: enabled },
      }));
    },

    setOnboardingCompleted(completed) {
      userSettingsRepo.setValue("onboarding_completed", String(completed));
      set((state) => ({
        preferences: {
          ...state.preferences,
          onboardingCompleted: completed,
        },
      }));
    },
  }));
}
