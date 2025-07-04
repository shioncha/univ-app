import { SafeAreaView, StyleSheet, Text } from "react-native";

export default function Task() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={{ padding: 20, fontSize: 18 }}>
        タスク画面はまだ実装されていません。 近日中に実装予定です。
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
  },
});
