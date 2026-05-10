package com.trainrecorder.viewmodel

import kotlin.test.Test
import kotlin.test.assertEquals

data class TestState(val value: Int, val label: String)

class TestViewModel(initial: TestState = TestState(value = 0, label = "initial")) : BaseViewModel<TestState>(initial) {
    fun updateState(reduce: TestState.() -> TestState) {
        setState(reduce)
    }
}

class BaseViewModelTest {
    @Test
    fun initialStateIsCorrect() {
        val viewModel = TestViewModel()
        assertEquals(TestState(value = 0, label = "initial"), viewModel.state.value)
    }

    @Test
    fun setStateUpdatesState() {
        val viewModel = TestViewModel()
        viewModel.updateState { copy(value = 42, label = "updated") }
        assertEquals(TestState(value = 42, label = "updated"), viewModel.state.value)
    }

    @Test
    fun setStatePreservesUnchangedFields() {
        val viewModel = TestViewModel()
        viewModel.updateState { copy(value = 99) }
        assertEquals(99, viewModel.state.value.value)
        assertEquals("initial", viewModel.state.value.label)
    }
}
