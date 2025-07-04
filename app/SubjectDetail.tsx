import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ClassSession, Subject } from "../types";

// --- モックデータ (デモ用) ---
// 実際のアプリでは、このデータはデータベースから取得します。
const MOCK_SUBJECTS: Subject[] = [
  {
    id: 1,
    name: "Webデザイン",
    teacher: "田中 太郎",
    room: "101号室",
    color: "#4caf50",
  },
  {
    id: 2,
    name: "線形代数",
    teacher: "鈴木 次郎",
    room: "203号室",
    color: "#f44336",
  },
  {
    id: 3,
    name: "マーケティング論",
    teacher: "佐藤 花子",
    room: "305号室",
    color: "#2196f3",
  },
  {
    id: 4,
    name: "データベース入門",
    teacher: "山田 一郎",
    room: "404号室",
    color: "#ff9800",
  },
];
const MOCK_CLASSES: ClassSession[] = [
  { id: 101, subject_id: 2, day_of_week: 0, period: 1 }, // 月曜1限
  { id: 102, subject_id: 1, day_of_week: 0, period: 2 }, // 月曜2限
  { id: 103, subject_id: 3, day_of_week: 2, period: 3 }, // 水曜3限
  { id: 104, subject_id: 2, day_of_week: 3, period: 1 }, // 木曜1限
  { id: 105, subject_id: 4, day_of_week: 4, period: 4 }, // 金曜4限
];
const DAYS = ["月", "火", "水", "木", "金", "土"];
// --- モックデータここまで ---

// Expo Routerでは、ファイルがそのまま画面コンポーネントになります。
export default function SubjectDetailScreen() {
  // URL/ルートのパラメータを取得
  const params = useLocalSearchParams();
  // ヘッダーなどを操作するためにNavigationフックを取得
  const navigation = useNavigation();

  // パラメータは文字列で渡されるため、数値に変換
  const subjectId = Number(params.subjectId);

  // 状態管理
  const [subject, setSubject] = useState<Subject | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  // subjectIdが変更されたらデータを再取得する
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => alert("設定画面はまだ実装されていません")}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
        </TouchableOpacity>
      ),
    });
    if (isNaN(subjectId)) {
      setLoading(false);
      return;
    }

    // --- データ取得処理 ---
    // 本来はここで非同期にデータベースからデータを取得する
    const foundSubject = MOCK_SUBJECTS.find((s) => s.id === subjectId) || null;
    const foundSessions = MOCK_CLASSES.filter(
      (c) => c.subject_id === subjectId
    );

    setSubject(foundSubject);
    setSessions(foundSessions);
    setLoading(false);

    // 画面のヘッダータイトルを授業名に動的に設定
    if (foundSubject) {
      navigation.setOptions({ title: foundSubject.name });
    } else {
      navigation.setOptions({ title: "見つかりません" });
    }
  }, [subjectId, navigation]);

  // 削除ボタンが押されたときの処理
  const handleDelete = () => {
    Alert.alert(
      "授業の削除",
      `「${subject?.name}」を削除しますか？\n関連する課題やテストも全て削除されます。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          onPress: () => {
            console.log("削除処理を実行:", subjectId);
            // ここでデータベースから対象の授業と関連データを削除する処理を呼び出す
            // 削除後、前の画面に戻る
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // ローディング中の表示
  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  // 授業が見つからなかった場合の表示
  if (!subject) {
    return (
      <View style={styles.centered}>
        <Text>授業データが見つかりませんでした。</Text>
      </View>
    );
  }

  // メインの画面表示
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* --- 基本情報セクション --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>担当教員</Text>
            <Text style={styles.value}>{subject.teacher || "未設定"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>教室</Text>
            <Text style={styles.value}>{subject.room || "未設定"}</Text>
          </View>
        </View>

        {/* --- 時間割情報セクション --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>時間割</Text>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <View key={session.id} style={styles.infoRow}>
                <Text style={styles.value}>
                  {DAYS[session.day_of_week]}曜日 {session.period}限
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.value}>時間割に登録されていません</Text>
          )}
        </View>

        {/* --- 課題・テストセクション (今後の拡張用) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>課題・テスト</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>＋ 新しい課題を追加</Text>
          </TouchableOpacity>
          {/* ここに課題一覧などを表示するコンポーネントを配置 */}
        </View>

        {/* --- 操作ボタンセクション --- */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => console.log("編集画面へ")}
          >
            <Text style={styles.buttonText}>この授業を編集</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={[styles.buttonText, styles.deleteButtonText]}>
              この授業を削除
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// スタイル定義
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    // 影をつけて立体感を出す
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 16,
    color: "#555",
  },
  value: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#e8f0fe",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#4285f4",
    fontWeight: "bold",
    fontSize: 16,
  },
  actionSection: {
    marginVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    backgroundColor: "#e0e0e0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deleteButton: {
    backgroundColor: "#fde8e8",
  },
  deleteButtonText: {
    color: "#c93c3c",
  },
});
