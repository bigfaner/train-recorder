/**
 * ExerciseLibraryScreen component — browse/search exercises grouped by category.
 *
 * Two modes:
 * - Browse mode: tap exercise row to navigate to detail page
 * - Selection mode: checkboxes for multi-select, "完成" button returns selection
 *
 * Features:
 * - Exercises grouped by 7 categories from PRD §5.5
 * - Real-time search filter by name
 * - Collapsible category sections
 * - "自定义动作" button for custom exercise creation
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing, ComponentSizes } from "@utils/constants";
import type { Exercise } from "../../types";
import {
  groupExercisesByCategory,
  filterExercisesByQuery,
  formatIncrement,
  formatRestTime,
  type ExerciseGroup,
} from "./exercise-helpers";

export interface ExerciseLibraryScreenProps {
  /** All active exercises from repository */
  exercises: Exercise[];
  /** Whether in selection mode (from plan editor) */
  selectionMode?: boolean;
  /** Currently selected exercise biz_keys (selection mode only) */
  selectedBizKeys?: bigint[];
  /** Callback when an exercise is tapped (browse mode) */
  onExercisePress?: (exercise: Exercise) => void;
  /** Callback when selection changes (selection mode) */
  onSelectionChange?: (selected: Exercise[]) => void;
  /** Callback when "完成" button is pressed (selection mode) */
  onCompleteSelection?: (selected: Exercise[]) => void;
  /** Callback when "自定义动作" button is pressed */
  onCreateCustom?: () => void;
}

export function ExerciseLibraryScreen({
  exercises,
  selectionMode = false,
  selectedBizKeys = [],
  onExercisePress,
  onSelectionChange,
  onCompleteSelection,
  onCreateCustom,
}: ExerciseLibraryScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  // Group and filter exercises
  const exerciseGroups = useMemo(() => {
    const grouped = groupExercisesByCategory(exercises);
    return filterExercisesByQuery(grouped, searchQuery);
  }, [exercises, searchQuery]);

  const hasResults = exerciseGroups.length > 0;

  const toggleCategory = useCallback((categoryKey: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  }, []);

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      if (selectionMode) {
        // Toggle selection
        const isSelected = selectedBizKeys.includes(exercise.biz_key);
        const currentSelected = exercises.filter((e) =>
          selectedBizKeys.includes(e.biz_key),
        );
        const newSelected = isSelected
          ? currentSelected.filter((e) => e.biz_key !== exercise.biz_key)
          : [...currentSelected, exercise];
        onSelectionChange?.(newSelected);
      } else {
        onExercisePress?.(exercise);
      }
    },
    [
      selectionMode,
      selectedBizKeys,
      exercises,
      onSelectionChange,
      onExercisePress,
    ],
  );

  const selectedCount = selectedBizKeys.length;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索动作名称..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityRole="search"
          accessibilityLabel="搜索动作"
        />
      </View>

      {/* Exercise List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {hasResults ? (
          exerciseGroups.map((group) => (
            <CategorySection
              key={group.category.key}
              group={group}
              isCollapsed={collapsedCategories.has(group.category.key)}
              selectionMode={selectionMode}
              selectedBizKeys={selectedBizKeys}
              onToggleCollapse={() => toggleCategory(group.category.key)}
              onExercisePress={handleExercisePress}
            />
          ))
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>未找到匹配的动作</Text>
          </View>
        )}

        {/* Add Custom Exercise Button */}
        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={onCreateCustom}
          accessibilityRole="button"
          accessibilityLabel="添加自定义动作"
        >
          <Text style={styles.addCustomIcon}>+</Text>
          <Text style={styles.addCustomText}>自定义动作</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Selection Mode Bottom Bar */}
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionCount}>
            已选择 {selectedCount} 个动作
          </Text>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              const selected = exercises.filter((e) =>
                selectedBizKeys.includes(e.biz_key),
              );
              onCompleteSelection?.(selected);
            }}
            accessibilityRole="button"
            accessibilityLabel="完成选择"
          >
            <Text style={styles.completeButtonText}>完成</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// --- Category Section ---

interface CategorySectionProps {
  group: ExerciseGroup;
  isCollapsed: boolean;
  selectionMode: boolean;
  selectedBizKeys: bigint[];
  onToggleCollapse: () => void;
  onExercisePress: (exercise: Exercise) => void;
}

function CategorySection({
  group,
  isCollapsed,
  selectionMode,
  selectedBizKeys,
  onToggleCollapse,
  onExercisePress,
}: CategorySectionProps) {
  return (
    <View style={styles.categorySection}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={onToggleCollapse}
        accessibilityRole="button"
        accessibilityLabel={`${group.category.labelZh} ${isCollapsed ? "展开" : "折叠"}`}
      >
        <Text style={styles.categoryTitle}>
          {group.category.labelZh}
          <Text style={styles.categoryEn}> {group.category.labelEn}</Text>
        </Text>
        <Text style={styles.collapseIcon}>{isCollapsed ? ">" : "v"}</Text>
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={styles.exerciseList}>
          {group.exercises.map((exercise) => {
            const isSelected = selectedBizKeys.includes(exercise.biz_key);
            return (
              <ExerciseRow
                key={exercise.biz_key.toString()}
                exercise={exercise}
                selectionMode={selectionMode}
                isSelected={isSelected}
                onPress={() => onExercisePress(exercise)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// --- Exercise Row ---

interface ExerciseRowProps {
  exercise: Exercise;
  selectionMode: boolean;
  isSelected: boolean;
  onPress: () => void;
}

function ExerciseRow({
  exercise,
  selectionMode,
  isSelected,
  onPress,
}: ExerciseRowProps) {
  return (
    <TouchableOpacity
      style={styles.exerciseRow}
      onPress={onPress}
      accessibilityRole={selectionMode ? "checkbox" : "button"}
      accessibilityLabel={exercise.exercise_name}
      accessibilityState={selectionMode ? { checked: isSelected } : undefined}
    >
      {selectionMode && (
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
      )}
      <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
      <View style={styles.exerciseMeta}>
        <Text style={styles.metaIncrement}>
          {formatIncrement(exercise.increment)}
        </Text>
        <Text style={styles.metaRest}>
          {formatRestTime(exercise.default_rest)}
        </Text>
      </View>
      {!selectionMode && <Text style={styles.arrowIcon}>›</Text>}
    </TouchableOpacity>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    paddingHorizontal: Spacing.contentPadding,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    height: ComponentSizes.inputHeight,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.contentPadding,
    paddingBottom: 24,
  },
  categorySection: {
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  categoryTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.02,
  },
  categoryEn: {
    fontWeight: "400" as const,
    color: Colors.textTertiary,
    textTransform: "none",
    fontSize: 12,
  },
  collapseIcon: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  exerciseList: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardBorderRadius,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: Spacing.touchTarget,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxMark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  exerciseName: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontWeight: "500" as const,
    color: Colors.textPrimary,
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  metaIncrement: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "500" as const,
    color: Colors.accent,
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  metaRest: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    backgroundColor: "rgba(134, 134, 139, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  arrowIcon: {
    fontSize: 20,
    color: Colors.textTertiary,
  },
  noResults: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textTertiary,
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: Spacing.cardBorderRadius,
    marginTop: 16,
  },
  addCustomIcon: {
    fontSize: 20,
    color: Colors.accent,
    fontWeight: "600" as const,
  },
  addCustomText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500" as const,
    color: Colors.accent,
  },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.contentPadding,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectionCount: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  completeButton: {
    backgroundColor: Colors.accent,
    borderRadius: ComponentSizes.buttonBorderRadius,
    paddingHorizontal: 24,
    height: ComponentSizes.buttonHeight - 12,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: "600" as const,
    color: "#ffffff",
  },
});
