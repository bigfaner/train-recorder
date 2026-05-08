import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout" options={{ title: 'Workout' }} />
        <Stack.Screen name="feeling" options={{ title: 'Post-Workout' }} />
        <Stack.Screen name="other-sport" options={{ title: 'Other Sport' }} />
        <Stack.Screen name="exercise-library" options={{ title: 'Exercises' }} />
        <Stack.Screen name="exercise-detail" options={{ title: 'Exercise Detail' }} />
        <Stack.Screen name="body-data" options={{ title: 'Body Data' }} />
        <Stack.Screen name="plan-editor" options={{ title: 'Plan Editor' }} />
        <Stack.Screen name="training-day-editor" options={{ title: 'Training Day' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="sport-editor" options={{ title: 'Sport Editor' }} />
      </Stack>
    </>
  );
}
