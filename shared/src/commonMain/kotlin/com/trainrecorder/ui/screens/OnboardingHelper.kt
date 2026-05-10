package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.model.TrainingType

/**
 * A template day definition within an onboarding plan template.
 * Uses exercise categories to match against seeded exercises.
 */
data class TemplateDay(
    val displayName: String,
    val trainingType: TrainingType,
    val exerciseCategories: List<ExerciseCategory>,
)

/**
 * A plan template offered during onboarding.
 */
data class PlanTemplate(
    val id: String,
    val displayName: String,
    val description: String,
    val days: List<TemplateDay>,
)

/**
 * Pre-defined plan templates for onboarding.
 *
 * Based on PRD 5.11.3:
 * - PPL (Push/Pull/Legs): 3-day cycle, for powerlifting enthusiasts
 * - Upper-Lower Split: 2-day cycle, for fitness beginners
 * - Full Body: 1-day cycle, for beginners or time-limited users
 *
 * Exercise pre-fill uses categories matching the seeded exercise library:
 * - Push day: bench press, incline press, dumbbell press, dips (CORE + UPPER_PUSH)
 * - Pull day: deadlift, barbell row, pull-ups (CORE + UPPER_PULL)
 * - Legs day: squat, front squat, leg press, leg curl (CORE + LOWER)
 */
val PLAN_TEMPLATES: List<PlanTemplate> = listOf(
    PlanTemplate(
        id = "ppl",
        displayName = "推拉蹲 (PPL)",
        description = "3天一循环，适合力量举爱好者",
        days = listOf(
            TemplateDay(
                displayName = "推日",
                trainingType = TrainingType.PUSH,
                exerciseCategories = listOf(
                    ExerciseCategory.CORE, // 卧推
                    ExerciseCategory.UPPER_PUSH, // 上斜卧推, 哑铃卧推, 双杠臂屈伸
                ),
            ),
            TemplateDay(
                displayName = "拉日",
                trainingType = TrainingType.PULL,
                exerciseCategories = listOf(
                    ExerciseCategory.CORE, // 硬拉
                    ExerciseCategory.UPPER_PULL, // 杠铃划船, 引体向上, 高位下拉, 哑铃划船
                ),
            ),
            TemplateDay(
                displayName = "蹲日",
                trainingType = TrainingType.LEGS,
                exerciseCategories = listOf(
                    ExerciseCategory.CORE, // 深蹲
                    ExerciseCategory.LOWER, // 前蹲, 腿举, 罗马尼亚硬拉, 腿弯举
                ),
            ),
        ),
    ),
    PlanTemplate(
        id = "upper_lower",
        displayName = "上下肢分化",
        description = "2天一循环，适合健身入门者",
        days = listOf(
            TemplateDay(
                displayName = "上肢日",
                trainingType = TrainingType.PUSH,
                exerciseCategories = listOf(
                    ExerciseCategory.CORE, // 卧推, 推举
                    ExerciseCategory.UPPER_PUSH, // 上斜卧推, 哑铃卧推
                    ExerciseCategory.UPPER_PULL, // 杠铃划船, 引体向上
                    ExerciseCategory.SHOULDER, // 侧平举
                ),
            ),
            TemplateDay(
                displayName = "下肢日",
                trainingType = TrainingType.LEGS,
                exerciseCategories = listOf(
                    ExerciseCategory.CORE, // 深蹲
                    ExerciseCategory.LOWER, // 前蹲, 腿举, 罗马尼亚硬拉, 腿弯举
                    ExerciseCategory.ABS_CORE, // 卷腹
                ),
            ),
        ),
    ),
    PlanTemplate(
        id = "full_body",
        displayName = "全身训练",
        description = "每次练全身，适合新手或时间有限者",
        days = listOf(
            TemplateDay(
                displayName = "全身日",
                trainingType = TrainingType.OTHER,
                exerciseCategories = listOf(
                    ExerciseCategory.CORE, // 深蹲, 卧推
                    ExerciseCategory.UPPER_PULL, // 杠铃划船
                    ExerciseCategory.LOWER, // 腿举
                ),
            ),
        ),
    ),
)

/**
 * Generate a plan name from a template.
 */
fun generatePlanName(template: PlanTemplate): String = template.displayName

/**
 * Onboarding step titles for the 4-step flow.
 */
fun getOnboardingStepTitles(): List<String> = listOf(
    "Welcome",
    "Choose Plan",
    "Exercises",
    "Ready",
)
