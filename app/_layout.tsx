import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="workout"
            options={{ title: "Workout", headerShown: false }}
          />
          <Stack.Screen
            name="feeling"
            options={{ title: "Training Feeling", headerShown: false }}
          />
          <Stack.Screen
            name="other-sport"
            options={{ title: "Other Sport", headerShown: false }}
          />
          <Stack.Screen
            name="exercise-library"
            options={{ title: "Exercise Library", headerShown: false }}
          />
          <Stack.Screen
            name="exercise-detail"
            options={{ title: "Exercise Detail", headerShown: false }}
          />
          <Stack.Screen
            name="body-data"
            options={{ title: "Body Data", headerShown: false }}
          />
          <Stack.Screen
            name="plan-editor"
            options={{ title: "Plan Editor", headerShown: false }}
          />
          <Stack.Screen
            name="training-day-editor"
            options={{ title: "Training Day", headerShown: false }}
          />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen
            name="sport-editor"
            options={{ title: "Sport Editor", headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
