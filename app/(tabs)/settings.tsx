import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Database } from "@/services/database";
import { TimetableData } from "@/types";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleExport = async () => {
    try {
      const data = await Database.getAllDataForExport();
      const jsonString = JSON.stringify(data, null, 2);
      const uri = FileSystem.documentDirectory + "timetable.json";
      await FileSystem.writeAsStringAsync(uri, jsonString);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("エラー", "このデバイスでは共有機能を利用できません。");
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("エクスポートに失敗", error);
      Alert.alert("エラー", "データのエクスポートに失敗しました。");
    }
  };

  const handleImport = async () => {
    Alert.alert(
      "データのインポート",
      "現在の時間割と課題はすべて削除されます。よろしいですか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "インポート実行",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: "application/json",
              });
              if (result.canceled) return;

              const uri = result.assets[0].uri;
              const jsonString = await FileSystem.readAsStringAsync(uri);
              const data = JSON.parse(jsonString) as TimetableData;

              // 簡単なデータ検証
              if (!data.subjects || !data.classes) {
                throw new Error("無効なファイル形式です。");
              }

              await Database.importData(data);
              Alert.alert("成功", "データのインポートが完了しました。");
            } catch (error) {
              console.error("インポートに失敗", error);
              Alert.alert(
                "エラー",
                `データのインポートに失敗しました。\n${
                  (error as Error).message
                }`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>設定</Text>
      </View>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push("/SubjectEdit")}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            新しい授業を追加
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={handleExport}
        >
          <Ionicons name="share-outline" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            時間割をエクスポート
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={handleImport}
        >
          <Ionicons name="download-outline" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            時間割をインポート
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push("/QRCodeScreen")}
        >
          <Ionicons name="qr-code-outline" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            QRコードで時間割を送受信
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: "bold" },
  container: { flex: 1, padding: 16 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
  },
});
