import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused, useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Database } from "@/services/database";
import { TaskWithSubject } from "@/types";

// 単一の課題を表示するコンポーネント
const TaskItem: React.FC<{ item: TaskWithSubject; onToggle: () => void }> = ({
  item,
  onToggle,
}) => {
  const { colors } = useTheme();
  const isDone = item.is_done === 1;
  const iconName = isDone ? "checkmark-circle" : "ellipse-outline";
  const formattedDate = item.due_date.substring(5).replace("-", "/");

  return (
    <View style={[styles.taskItemContainer, { backgroundColor: colors.card }]}>
      <TouchableOpacity onPress={onToggle} style={styles.iconContainer}>
        <Ionicons
          name={iconName}
          size={28}
          color={isDone ? item.subjectColor : colors.text}
        />
      </TouchableOpacity>
      <View style={styles.taskTextContainer}>
        <Text
          style={[
            styles.taskContent,
            {
              color: colors.text,
              textDecorationLine: isDone ? "line-through" : "none",
            },
          ]}
        >
          {item.content}
        </Text>
        <View style={styles.subjectInfo}>
          <View
            style={[
              styles.subjectColorDot,
              { backgroundColor: item.subjectColor },
            ]}
          />
          <Text style={[styles.subjectName, { color: colors.text }]}>
            {item.subjectName}
          </Text>
        </View>
      </View>
      <Text style={[styles.dueDate, { color: colors.text }]}>
        {formattedDate}
      </Text>
    </View>
  );
};

export default function AllTasksScreen() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskWithSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      loadTasks();
    }
  }, [isFocused]);

  const loadTasks = async () => {
    try {
      const allTasks = await Database.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error("全課題の読み込みに失敗", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: number, currentStatus: boolean) => {
    try {
      await Database.updateTaskStatus(taskId, !currentStatus);
      loadTasks(); // リストを再読み込み
    } catch (error) {
      console.error("課題の状態更新に失敗", error);
    }
  };

  if (isLoading) {
    return (
      <ActivityIndicator
        style={{ flex: 1, backgroundColor: colors.background }}
      />
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: Platform.OS === "ios" ? tabBarHeight : 0,
        },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>すべての課題</Text>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            onToggle={() => handleToggleStatus(item.id, item.is_done === 1)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              課題はありません🎉
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: "bold" },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  taskItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: { paddingRight: 12 },
  taskTextContainer: { flex: 1 },
  taskContent: { fontSize: 16, fontWeight: "500" },
  subjectInfo: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  subjectColorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  subjectName: { fontSize: 12, opacity: 0.7 },
  dueDate: { fontSize: 14, fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 18, opacity: 0.5 },
});
