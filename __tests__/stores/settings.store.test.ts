/**
 * Unit tests for SettingsStore.
 * Tests preference loading, updates, and write-through to repository.
 */

import { createSettingsStore } from "../../src/stores/settings.store";
import type { UserSettingsRepo } from "../../src/db/repositories/user-settings.repo";

function createMockSettingsRepo(): jest.Mocked<UserSettingsRepo> {
  const store = new Map<string, string>();

  return {
    getValue: jest.fn((key: string) => store.get(key) ?? null),
    setValue: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return {
        id: 1,
        biz_key: 1n,
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      };
    }),
    findById: jest.fn(),
    findByBizKey: jest.fn(),
    findAll: jest.fn(() => []),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<UserSettingsRepo>;
}

describe("SettingsStore", () => {
  let repo: jest.Mocked<UserSettingsRepo>;
  let store: ReturnType<typeof createSettingsStore>;

  beforeEach(() => {
    repo = createMockSettingsRepo();
    store = createSettingsStore({ userSettingsRepo: repo });
  });

  describe("initial state", () => {
    it("should have default preferences before loading", () => {
      const state = store.getState();
      expect(state.isLoaded).toBe(false);
      expect(state.preferences.weightUnit).toBe("kg");
      expect(state.preferences.defaultRestTime).toBe(90);
      expect(state.preferences.notificationsEnabled).toBe(true);
      expect(state.preferences.reminderTime).toBeNull();
      expect(state.preferences.vibrationEnabled).toBe(true);
      expect(state.preferences.soundEnabled).toBe(false);
      expect(state.preferences.onboardingCompleted).toBe(false);
    });
  });

  describe("loadPreferences", () => {
    it("should load preferences from repo", () => {
      (repo.getValue as jest.Mock).mockImplementation((key: string) => {
        const map: Record<string, string> = {
          weight_unit: "lbs",
          default_rest_time: "120",
          notifications_enabled: "0",
          reminder_time: "08:00",
          vibration_enabled: "0",
          sound_enabled: "1",
          onboarding_completed: "true",
        };
        return map[key] ?? null;
      });

      store.getState().loadPreferences();

      const prefs = store.getState().preferences;
      expect(prefs.weightUnit).toBe("lbs");
      expect(prefs.defaultRestTime).toBe(120);
      expect(prefs.notificationsEnabled).toBe(false);
      expect(prefs.reminderTime).toBe("08:00");
      expect(prefs.vibrationEnabled).toBe(false);
      expect(prefs.soundEnabled).toBe(true);
      expect(prefs.onboardingCompleted).toBe(true);
      expect(store.getState().isLoaded).toBe(true);
    });

    it("should use defaults when repo returns null", () => {
      (repo.getValue as jest.Mock).mockReturnValue(null);

      store.getState().loadPreferences();

      const prefs = store.getState().preferences;
      expect(prefs.weightUnit).toBe("kg");
      expect(prefs.defaultRestTime).toBe(90);
      expect(prefs.notificationsEnabled).toBe(true);
    });
  });

  describe("setWeightUnit", () => {
    it("should update weight unit and persist", () => {
      store.getState().setWeightUnit("lbs");

      expect(store.getState().preferences.weightUnit).toBe("lbs");
      expect(repo.setValue).toHaveBeenCalledWith("weight_unit", "lbs");
    });
  });

  describe("setDefaultRestTime", () => {
    it("should update rest time and persist", () => {
      store.getState().setDefaultRestTime(180);

      expect(store.getState().preferences.defaultRestTime).toBe(180);
      expect(repo.setValue).toHaveBeenCalledWith("default_rest_time", "180");
    });
  });

  describe("setNotificationsEnabled", () => {
    it("should update notifications and persist", () => {
      store.getState().setNotificationsEnabled(false);

      expect(store.getState().preferences.notificationsEnabled).toBe(false);
      expect(repo.setValue).toHaveBeenCalledWith("notifications_enabled", "0");
    });
  });

  describe("setReminderTime", () => {
    it("should update reminder time and persist", () => {
      store.getState().setReminderTime("07:30");

      expect(store.getState().preferences.reminderTime).toBe("07:30");
      expect(repo.setValue).toHaveBeenCalledWith("reminder_time", "07:30");
    });

    it("should clear reminder time with null", () => {
      store.getState().setReminderTime(null);

      expect(store.getState().preferences.reminderTime).toBeNull();
      expect(repo.setValue).toHaveBeenCalledWith("reminder_time", "");
    });
  });

  describe("setOnboardingCompleted", () => {
    it("should update onboarding status and persist", () => {
      store.getState().setOnboardingCompleted(true);

      expect(store.getState().preferences.onboardingCompleted).toBe(true);
      expect(repo.setValue).toHaveBeenCalledWith(
        "onboarding_completed",
        "true",
      );
    });
  });

  describe("setVibrationEnabled", () => {
    it("should update vibration and persist", () => {
      store.getState().setVibrationEnabled(false);

      expect(store.getState().preferences.vibrationEnabled).toBe(false);
      expect(repo.setValue).toHaveBeenCalledWith("vibration_enabled", "0");
    });
  });

  describe("setSoundEnabled", () => {
    it("should update sound and persist", () => {
      store.getState().setSoundEnabled(true);

      expect(store.getState().preferences.soundEnabled).toBe(true);
      expect(repo.setValue).toHaveBeenCalledWith("sound_enabled", "1");
    });
  });
});
