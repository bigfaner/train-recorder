import { View, Text, StyleSheet } from 'react-native';

export default function FeelingScreen() {
  return (
    <View style={styles.container}>
      <Text>Feeling Screen</Text>
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
