import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Database } from "@/services/database";
import { TimetableData } from "@/types";

// メニュー項目を再利用可能なコンポーネントとして定義
const MenuItem = ({ icon, text, onPress, colors, isLast = false }) => (
  <TouchableOpacity
    style={[
      styles.menuItem,
      {
        backgroundColor: colors.card,
      },
      // ▼▼▼ 修正点: 最後の要素でない場合にのみ、下線と色を適用 ▼▼▼
      !isLast && {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      },
    ]}
    onPress={onPress}
  >
    <Ionicons
      name={icon}
      size={24}
      color={colors.text}
      style={styles.menuIcon}
    />
    <Text style={[styles.menuText, { color: colors.text }]}>{text}</Text>
    <Ionicons
      name="chevron-forward-outline"
      size={20}
      color={colors.text}
      style={{ opacity: 0.5 }}
    />
  </TouchableOpacity>
);

// セクションを再利用可能なコンポーネントとして定義
const MenuSection = ({ title, children, colors }) => {
  const childrenArray = React.Children.toArray(children);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.sectionItems}>
        {React.Children.map(childrenArray, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              isLast: index === childrenArray.length - 1,
            });
          }
          return child;
        })}
      </View>
    </View>
  );
};

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
      <ScrollView>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>設定</Text>
        </View>
        <View style={styles.container}>
          <MenuSection title="時間割の管理" colors={colors}>
            <MenuItem
              icon="add-circle-outline"
              text="新しい授業を追加"
              onPress={() => router.push("/SubjectEdit")}
              colors={colors}
            />
          </MenuSection>

          <MenuSection title="データの連携" colors={colors}>
            <MenuItem
              icon="qr-code-outline"
              text="QRコードで送受信"
              onPress={() => router.push("/QRCodeScreen")}
              colors={colors}
            />
            <MenuItem
              icon="download-outline"
              text="時間割をインポート"
              onPress={handleImport}
              colors={colors}
            />
            <MenuItem
              icon="share-outline"
              text="時間割をエクスポート"
              onPress={handleExport}
              colors={colors}
            />
          </MenuSection>

          <MenuSection title="その他" colors={colors}>
            <MenuItem
              icon="extension-puzzle-outline"
              text="Chrome拡張機能（PCからの取込）"
              onPress={() =>
                Linking.openURL(
                  "https://github.com/shioncha/univ-app-extension?tab=readme-ov-file#usage"
                ).catch(() => console.error("URLを開けませんでした。"))
              }
              colors={colors}
            />
            <MenuItem
              icon="information-circle-outline"
              text="このアプリについて"
              onPress={() =>
                Linking.openURL("https://github.com/shioncha/univ-app").catch(
                  () => console.error("URLを開けませんでした。")
                )
              }
              colors={colors}
            />
          </MenuSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: "bold" },
  container: { flex: 1, padding: 16 },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 10,
    marginBottom: 12,
    opacity: 0.6,
  },
  sectionItems: {
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    // ▼▼▼ 修正点: ここでは下線を設定しない ▼▼▼
  },
  menuIcon: {
    width: 30,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});
