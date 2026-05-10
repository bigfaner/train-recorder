/**
 * Settings Page UI Components
 *
 * Grouped settings list with toggle rows, navigation rows,
 * bottom sheets, and toast notifications.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Colors, Typography, Spacing } from "@utils/constants";

// ============================================================
// SettingsGroup
// ============================================================

export interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
  testID?: string;
}

export function SettingsGroup({ title, children, testID }: SettingsGroupProps) {
  return (
    <View style={styles.group} testID={testID}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupContent}>{children}</View>
    </View>
  );
}

// ============================================================
// SettingsRow (base row)
// ============================================================

export interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export function SettingsRow({
  label,
  value,
  onPress,
  children,
}: SettingsRowProps) {
  const content = (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ============================================================
// ToggleRow
// ============================================================

export interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.6}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.accent }}
        thumbColor="#ffffff"
        accessibilityState={{ checked: value }}
      />
    </TouchableOpacity>
  );
}

// ============================================================
// UnitToggleRow
// ============================================================

export interface UnitToggleRowProps {
  currentUnit: "kg" | "lbs";
  onToggle: () => void;
}

const UNIT_LABELS: Record<"kg" | "lbs", string> = {
  kg: "公斤 (kg)",
  lbs: "磅 (lbs)",
};

export function UnitToggleRow({ currentUnit, onToggle }: UnitToggleRowProps) {
  return (
    <SettingsRow
      label="重量单位"
      value={UNIT_LABELS[currentUnit]}
      onPress={onToggle}
    />
  );
}

// ============================================================
// RestTimeRow
// ============================================================

export interface RestTimeRowProps {
  currentValue: number;
  onPress: () => void;
}

export function RestTimeRow({ currentValue, onPress }: RestTimeRowProps) {
  return (
    <SettingsRow
      label="默认休息时间"
      value={`${currentValue} 秒`}
      onPress={onPress}
    />
  );
}

// ============================================================
// NavigationRow
// ============================================================

export interface NavigationRowProps {
  label: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
}

export function NavigationRow({
  label,
  subtitle,
  onPress,
  testID,
}: NavigationRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.6}
      testID={testID}
    >
      <View style={styles.navRowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// DestructiveRow
// ============================================================

export interface DestructiveRowProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

export function DestructiveRow({
  label,
  onPress,
  testID,
}: DestructiveRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.6}
      testID={testID}
    >
      <Text style={[styles.rowLabel, styles.destructiveText]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ============================================================
// BottomSheet
// ============================================================

export interface BottomSheetProps {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({
  title,
  visible,
  onClose,
  children,
}: BottomSheetProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.sheetClose}>取消</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetContent}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================
// SettingsBottomSheet (Option Picker)
// ============================================================

export interface SelectOption<T = number | string> {
  label: string;
  value: T;
}

export interface SettingsBottomSheetProps<T = number | string> {
  title: string;
  visible: boolean;
  options: SelectOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function SettingsBottomSheet<T = number | string>({
  title,
  visible,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SettingsBottomSheetProps<T>) {
  return (
    <BottomSheet title={title} visible={visible} onClose={onClose}>
      {options.map((option) => (
        <TouchableOpacity
          key={String(option.value)}
          style={[
            styles.optionRow,
            option.value === selectedValue && styles.optionRowSelected,
          ]}
          onPress={() => {
            onSelect(option.value);
            onClose();
          }}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.optionLabel,
              option.value === selectedValue && styles.optionLabelSelected,
            ]}
          >
            {option.label}
          </Text>
          {option.value === selectedValue ? (
            <Text style={styles.optionCheck}>✓</Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
}

// ============================================================
// Toast
// ============================================================

export interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  group: {
    marginBottom: Spacing.sectionSpacing,
  },
  groupTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as "500",
    color: Colors.textTertiary,
    letterSpacing: Typography.caption.letterSpacing,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: Spacing.contentPadding,
  },
  groupContent: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.cardPadding,
    paddingVertical: 14,
    minHeight: Spacing.touchTarget,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowValue: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  navRowLeft: {
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textTertiary,
    marginLeft: 8,
  },
  destructiveText: {
    color: Colors.error,
  },
  // BottomSheet
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Spacing.cardBorderRadius,
    borderTopRightRadius: Spacing.cardBorderRadius,
    paddingBottom: 40, // safe area
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.cardPadding,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight as "600",
    color: Colors.textPrimary,
  },
  sheetClose: {
    fontSize: Typography.body.fontSize,
    color: Colors.accent,
  },
  sheetContent: {
    paddingHorizontal: Spacing.cardPadding,
  },
  // Option rows
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionRowSelected: {
    backgroundColor: Colors.backgroundAlt,
    marginHorizontal: -Spacing.cardPadding,
    paddingHorizontal: Spacing.cardPadding,
  },
  optionLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.accent,
    fontWeight: "600",
  },
  optionCheck: {
    fontSize: 18,
    color: Colors.accent,
    fontWeight: "600",
  },
  // Toast
  toast: {
    position: "absolute" as const,
    bottom: 100,
    left: Spacing.contentPadding,
    right: Spacing.contentPadding,
    backgroundColor: Colors.textPrimary,
    borderRadius: Spacing.inputBorderRadius,
    paddingVertical: 12,
    paddingHorizontal: Spacing.cardPadding,
    alignItems: "center",
  },
  toastText: {
    color: "#ffffff",
    fontSize: Typography.body.fontSize,
  },
});
