package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.model.TrainingType
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class OnboardingHelperTest {

    // ============================================================
    // Template Definitions
    // ============================================================

    @Test
    fun `PLAN_TEMPLATES has 3 templates`() {
        assertEquals(3, PLAN_TEMPLATES.size)
    }

    @Test
    fun `PPL template has correct structure`() {
        val ppl = PLAN_TEMPLATES.find { it.id == "ppl" }
        assertNotNull(ppl)
        assertEquals("推拉蹲 (PPL)", ppl!!.displayName)
        assertEquals(3, ppl.days.size)
        assertEquals(TrainingType.PUSH, ppl.days[0].trainingType)
        assertEquals(TrainingType.PULL, ppl.days[1].trainingType)
        assertEquals(TrainingType.LEGS, ppl.days[2].trainingType)
    }

    @Test
    fun `Upper-Lower template has correct structure`() {
        val ul = PLAN_TEMPLATES.find { it.id == "upper_lower" }
        assertNotNull(ul)
        assertEquals("上下肢分化", ul!!.displayName)
        assertEquals(2, ul.days.size)
        assertEquals(TrainingType.PUSH, ul.days[0].trainingType)
        assertEquals(TrainingType.LEGS, ul.days[1].trainingType)
    }

    @Test
    fun `Full Body template has correct structure`() {
        val fb = PLAN_TEMPLATES.find { it.id == "full_body" }
        assertNotNull(fb)
        assertEquals("全身训练", fb!!.displayName)
        assertEquals(1, fb.days.size)
        assertEquals(TrainingType.OTHER, fb.days[0].trainingType)
    }

    // ============================================================
    // Pre-filled Exercises
    // ============================================================

    @Test
    fun `PPL push day has correct exercise categories`() {
        val ppl = PLAN_TEMPLATES.find { it.id == "ppl" }!!
        val pushDay = ppl.days[0]
        assertTrue(pushDay.exerciseCategories.isNotEmpty())
        assertTrue(pushDay.exerciseCategories.contains(ExerciseCategory.CORE)) // bench press
        assertTrue(pushDay.exerciseCategories.contains(ExerciseCategory.UPPER_PUSH))
    }

    @Test
    fun `PPL pull day has correct exercise categories`() {
        val ppl = PLAN_TEMPLATES.find { it.id == "ppl" }!!
        val pullDay = ppl.days[1]
        assertTrue(pullDay.exerciseCategories.contains(ExerciseCategory.CORE)) // deadlift
        assertTrue(pullDay.exerciseCategories.contains(ExerciseCategory.UPPER_PULL))
    }

    @Test
    fun `PPL legs day has correct exercise categories`() {
        val ppl = PLAN_TEMPLATES.find { it.id == "ppl" }!!
        val legsDay = ppl.days[2]
        assertTrue(legsDay.exerciseCategories.contains(ExerciseCategory.CORE)) // squat
        assertTrue(legsDay.exerciseCategories.contains(ExerciseCategory.LOWER))
    }

    @Test
    fun `all template days have non-empty exercise lists`() {
        for (template in PLAN_TEMPLATES) {
            for (day in template.days) {
                assertTrue(
                    day.exerciseCategories.isNotEmpty(),
                    "Day ${day.displayName} in template ${template.displayName} should have exercises"
                )
            }
        }
    }

    // ============================================================
    // Template ID generation
    // ============================================================

    @Test
    fun `generatePlanName returns template display name`() {
        val ppl = PLAN_TEMPLATES.find { it.id == "ppl" }!!
        assertEquals("推拉蹲 (PPL)", generatePlanName(ppl))
    }

    @Test
    fun `getOnboardingStepTitles returns 4 steps`() {
        val steps = getOnboardingStepTitles()
        assertEquals(4, steps.size)
        assertEquals("Welcome", steps[0])
        assertEquals("Choose Plan", steps[1])
        assertEquals("Exercises", steps[2])
        assertEquals("Ready", steps[3])
    }
}
