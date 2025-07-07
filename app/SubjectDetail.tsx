import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
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

import { AddTaskModal } from "@/components/AddTaskModal";
import { TaskList } from "@/components/TaskList";
import { Database } from "@/services/database";
import { ClassSession, Subject, Task } from "@/types";

const DAYS = ["月", "火", "水", "木", "金", "土"];

export default function SubjectDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const subjectId = Number(params.subjectId);

  // 状態管理
  const [subject, setSubject] = useState<Subject | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // 課題リスト用のstate
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false); // 課題追加モーダル表示用のstate

  // 画面が表示されるたびにデータを再読み込み
  useEffect(() => {
    if (isFocused && !isNaN(subjectId)) {
      loadAllData();
    }
  }, [isFocused, subjectId]);

  // ヘッダーに編集ボタンを設定
  useEffect(() => {
    if (subject) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleEdit}
            style={{ paddingHorizontal: 10 }}
          >
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: () => null });
    }
  }, [navigation, colors, subject]);

  /**
   * 授業情報と課題リストをデータベースから読み込む
   */
  const loadAllData = async () => {
    try {
      setLoading(true);
      const subjectData = await Database.getSubjectById(subjectId);
      const taskData = await Database.getTasksBySubjectId(subjectId);

      setSubject(subjectData.subject);
      setSessions(subjectData.sessions);
      setTasks(taskData);

      navigation.setOptions({
        title: subjectData.subject?.name || "見つかりません",
      });
    } catch (error) {
      console.error("データの読み込みに失敗しました", error);
      Alert.alert("エラー", "データの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 編集画面へ遷移
   */
  const handleEdit = () => {
    if (!subject) return;
    router.push({
      pathname: "/SubjectEdit",
      params: { subjectId: subject.id },
    });
  };

  /**
   * 新しい課題を保存する
   */
  const handleSaveTask = async (content: string, dueDate: string) => {
    try {
      await Database.addTask({
        subject_id: subjectId,
        content,
        due_date: dueDate,
      });
      setIsModalVisible(false); // モーダルを閉じる
      loadAllData(); // データを再読み込みしてリストを更新
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "課題の追加に失敗しました。");
    }
  };

  /**
   * 課題の完了状態を切り替える
   */
  const handleToggleTaskStatus = async (
    taskId: number,
    currentStatus: boolean
  ) => {
    try {
      await Database.updateTaskStatus(taskId, !currentStatus);
      loadAllData();
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "課題の状態更新に失敗しました。");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (!subject) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>
          授業データが見つかりませんでした。
        </Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScrollView style={styles.container}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              基本情報
            </Text>
            <View
              style={[styles.infoRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.label, { color: colors.text }]}>
                担当教員
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {subject.teacher || "未設定"}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.label, { color: colors.text }]}>教室</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {subject.room || "未設定"}
              </Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              時間割
            </Text>
            {sessions.map((session, index) => (
              <View
                key={session.id}
                style={[
                  styles.infoRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index === sessions.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <Text style={[styles.value, { color: colors.text }]}>
                  {DAYS[session.day_of_week]}曜日 {session.period}限
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                課題
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <TaskList tasks={tasks} onToggleStatus={handleToggleTaskStatus} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <AddTaskModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveTask}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: "500" },
});
