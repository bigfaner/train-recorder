/**
 * Settings Screen (Tab 5)
 *
 * Grouped settings list with training preferences, notifications,
 * data management, and about section. Supports weight unit toggle,
 * rest time selection, export/import/clear data operations.
 */

import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing } from "@utils/constants";
import {
  SettingsGroup,
  NavigationRow,
  UnitToggleRow,
  RestTimeRow,
  ToggleRow,
  DestructiveRow,
  SettingsBottomSheet,
  Toast,
} from "@components/settings";
import {
  getRestTimeOptions,
  getExportRangeOptions,
} from "@components/settings/settings-helpers";
import type { ExportRange } from "../../src/types";

/**
 * Settings screen props interface.
 * In production, these will be injected via store/context.
 */
export interface SettingsScreenProps {
  /** Current weight unit */
  weightUnit: "kg" | "lbs";
  /** Default rest time in seconds */
  defaultRestTime: number;
  /** Whether notifications are enabled */
  notificationsEnabled: boolean;
  /** Whether vibration on rest end is enabled */
  vibrationEnabled: boolean;
  /** Whether sound on rest end is enabled */
  soundEnabled: boolean;
  /** Whether onboarding is completed */
  onboardingCompleted: boolean;
  /** Callback: set weight unit */
  onSetWeightUnit: (unit: "kg" | "lbs") => void;
  /** Callback: set default rest time */
  onSetDefaultRestTime: (seconds: number) => void;
  /** Callback: set notifications enabled */
  onSetNotificationsEnabled: (enabled: boolean) => void;
  /** Callback: set vibration enabled */
  onSetVibrationEnabled: (enabled: boolean) => void;
  /** Callback: set sound enabled */
  onSetSoundEnabled: (enabled: boolean) => void;
  /** Callback: export data */
  onExportData: (range: ExportRange) => Promise<void>;
  /** Callback: import data */
  onImportData: () => Promise<void>;
  /** Callback: clear all data */
  onClearAllData: () => Promise<void>;
}

export default function SettingsScreen({
  weightUnit,
  defaultRestTime,
  notificationsEnabled,
  vibrationEnabled,
  soundEnabled,
  onSetWeightUnit,
  onSetDefaultRestTime,
  onSetNotificationsEnabled,
  onSetVibrationEnabled,
  onSetSoundEnabled,
  onExportData,
  onImportData,
  onClearAllData,
}: SettingsScreenProps) {
  const router = useRouter();

  // Bottom sheet state
  const [restTimeSheetVisible, setRestTimeSheetVisible] = useState(false);
  const [exportSheetVisible, setExportSheetVisible] = useState(false);
  const [importSheetVisible, setImportSheetVisible] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Toast helper
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // Weight unit toggle
  const handleUnitToggle = useCallback(() => {
    const newUnit = weightUnit === "kg" ? "lbs" : "kg";
    onSetWeightUnit(newUnit);
    showToast(`单位已切换为${newUnit === "kg" ? "公斤 (kg)" : "磅 (lbs)"}`);
  }, [weightUnit, onSetWeightUnit, showToast]);

  // Rest time selection
  const handleRestTimeSelect = useCallback(
    (value: number) => {
      onSetDefaultRestTime(value);
      showToast(`默认休息时间已设置为 ${value} 秒`);
    },
    [onSetDefaultRestTime, showToast],
  );

  // Export data
  const handleExportSelect = useCallback(
    async (range: ExportRange) => {
      try {
        await onExportData(range);
        showToast("数据导出成功");
      } catch {
        showToast("导出失败，请重试");
      }
    },
    [onExportData, showToast],
  );

  // Import data
  const handleImportConfirm = useCallback(async () => {
    setImportSheetVisible(false);
    try {
      await onImportData();
      showToast("数据导入成功");
    } catch {
      showToast("导入失败，请重试");
    }
  }, [onImportData, showToast]);

  // Clear all data - two-step confirmation
  const handleClearPress = useCallback(() => {
    Alert.alert(
      "清除所有数据",
      "此操作不可撤销。所有训练记录、训练计划、身体数据、PR 记录将被永久删除。动作库和用户偏好设置将保留。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确认清除",
          style: "destructive",
          onPress: () => {
            onClearAllData()
              .then(() => {
                showToast("数据已清除");
              })
              .catch(() => {
                showToast("清除失败，请重试");
              });
          },
        },
      ],
    );
  }, [onClearAllData, showToast]);

  // Navigation
  const handleExerciseLibrary = useCallback(() => {
    router.push("/exercise-library");
  }, [router]);

  const handleOnboarding = useCallback(() => {
    router.push("/onboarding");
  }, [router]);

  // Rest time and export range options
  const restTimeOptions = getRestTimeOptions();
  const exportRangeOptions = getExportRangeOptions();

  return (
    <View style={styles.container} testID="settings-list">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Training Settings Group */}
        <SettingsGroup title="训练设置" testID="settings-group-training">
          <NavigationRow label="动作库管理" onPress={handleExerciseLibrary} />
          <UnitToggleRow currentUnit={weightUnit} onToggle={handleUnitToggle} />
          <RestTimeRow
            currentValue={defaultRestTime}
            onPress={() => setRestTimeSheetVisible(true)}
          />
        </SettingsGroup>

        {/* Notifications Group */}
        <SettingsGroup title="提醒" testID="settings-group-reminder">
          <ToggleRow
            label="训练提醒"
            value={notificationsEnabled}
            onValueChange={onSetNotificationsEnabled}
          />
          <ToggleRow
            label="休息结束振动"
            value={vibrationEnabled}
            onValueChange={onSetVibrationEnabled}
          />
          <ToggleRow
            label="休息结束提示音"
            value={soundEnabled}
            onValueChange={onSetSoundEnabled}
          />
        </SettingsGroup>

        {/* Data Management Group */}
        <SettingsGroup title="数据管理" testID="settings-group-data">
          <NavigationRow
            label="导出训练数据"
            onPress={() => setExportSheetVisible(true)}
            testID="export-data-btn"
          />
          <NavigationRow
            label="导入训练数据"
            onPress={() => setImportSheetVisible(true)}
            testID="import-data-btn"
          />
          <DestructiveRow
            label="清除所有数据"
            onPress={handleClearPress}
            testID="clear-data-btn"
          />
        </SettingsGroup>

        {/* About Group */}
        <SettingsGroup title="关于" testID="settings-group-about">
          <NavigationRow
            label="新手引导"
            onPress={handleOnboarding}
            testID="onboarding-link"
          />
        </SettingsGroup>
      </ScrollView>

      {/* Bottom Sheets */}
      <SettingsBottomSheet
        title="选择默认休息时间"
        visible={restTimeSheetVisible}
        options={restTimeOptions}
        selectedValue={defaultRestTime}
        onSelect={handleRestTimeSelect}
        onClose={() => setRestTimeSheetVisible(false)}
      />

      <SettingsBottomSheet
        title="选择导出范围"
        visible={exportSheetVisible}
        options={exportRangeOptions}
        selectedValue={"all" as ExportRange}
        onSelect={handleExportSelect}
        onClose={() => setExportSheetVisible(false)}
      />

      {/* Import confirmation bottom sheet */}
      <SettingsBottomSheet
        title="导入训练数据"
        visible={importSheetVisible}
        options={[
          {
            label: "相同 ID 的记录以导入数据为准，新增记录直接添加",
            value: "confirm",
          },
        ]}
        selectedValue={"confirm"}
        onSelect={handleImportConfirm}
        onClose={() => setImportSheetVisible(false)}
      />

      {/* Toast */}
      <Toast message={toastMessage} visible={toastVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.contentPadding,
    paddingBottom: 40,
  },
});
