import { View, Text, StyleSheet } from 'react-native';

export default function SportEditorScreen() {
  return (
    <View style={styles.container}>
      <Text>Sport Editor Screen</Text>
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
