import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router"; // useRouterをインポート
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { TimetableView } from "@/components/TimetableView";

export default function HomeScreen() {
  const router = useRouter(); // routerを取得
  const { colors } = useTheme(); // ダークモード対応のためテーマカラーを取得
  const tabBarHeight = useBottomTabBarHeight();

  // 現在の日付を取得してフォーマットする
  const today = new Date();
  const dateString = `${today.getMonth() + 1}月${today.getDate()}日 (${
    "日月火水木金土"[today.getDay()]
  })`;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
        { marginBottom: tabBarHeight },
      ]}
    >
      {/* ヘッダー全体をまとめるView */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={[styles.dateText, { color: colors.text, opacity: 0.7 }]}>
            {dateString}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>時間割</Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/SubjectEdit")} // 編集画面へ遷移
        >
          <Ionicons name="add" size={28} color={"#fff"} />
        </TouchableOpacity>
      </View>

      {/* 時間割本体 */}
      <View style={{ flex: 1 }}>
        <TimetableView />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  },
  dateText: {
    fontSize: 14,
    marginBottom: 2,
    fontWeight: "600",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
