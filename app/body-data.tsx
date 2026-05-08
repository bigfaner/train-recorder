import { View, Text, StyleSheet } from 'react-native';

export default function BodyDataScreen() {
  return (
    <View style={styles.container}>
      <Text>Body Data Screen</Text>
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
