import { View, Text, StyleSheet } from 'react-native';

export default function PlanEditorScreen() {
  return (
    <View style={styles.container}>
      <Text>Plan Editor Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
