import { TimetableView } from "@/components/TimetableView";
import { Ionicons } from "@expo/vector-icons"; // アイコン表示のために必要
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  // 現在の日付を取得してフォーマットする
  const today = new Date();
  const dateString = `${today.getMonth() + 1}月${today.getDate()}日 (${
    "日月火水木金土"[today.getDay()]
  })`;

  return (
    // SafeAreaViewで囲み、背景色を設定
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー全体をまとめるView */}
      <View style={styles.headerContainer}>
        {/* 日付とタイトル */}
        <View>
          <Text style={styles.dateText}>{dateString}</Text>
          <Text style={styles.title}>時間割</Text>
        </View>
        {/* 設定ボタン（将来の機能拡張用） */}
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      {/* 時間割本体 */}
      <View style={{ flex: 1, paddingBottom: 30 }}>
        <TimetableView />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fa", // 全体の背景色
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1c1c1e",
  },
  dateText: {
    fontSize: 14,
    color: "#8a8a8e",
    marginBottom: 2,
    fontWeight: "600",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#e9e9eb",
  },
});
