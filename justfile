# Train Recorder Kotlin - Build Commands

# Compile all targets
compile scope="":
    ./gradlew :shared:compileDebugKotlinAndroid :androidApp:compileDebugKotlinAndroid {{scope}} --no-daemon

# Run tests
test scope="":
    ./gradlew :shared:allTests {{scope}} --no-daemon

# Format code (Kotlin uses ktlint via spotless or native formatting)
fmt scope="":
    @echo "Kotlin formatting not yet configured"

# Lint code
lint scope="":
    @echo "Kotlin linting not yet configured"

# Clean build artifacts
clean:
    ./gradlew clean --no-daemon

# Build Android debug APK
android-debug:
    ./gradlew :androidApp:assembleDebug --no-daemon

claude:
    claude --dangerously-skip-permissions

claude-c:
    claude --dangerously-skip-permissions -c
