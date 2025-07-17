import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Task } from "@/types";

// TaskItemコンポーネント (単一の課題)
interface TaskItemProps {
  item: Task;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}
const TaskItem: React.FC<TaskItemProps> = ({ item, onToggleStatus }) => {
  const { colors } = useTheme();
  const isDone = item.is_done === 1;
  const iconName = isDone ? "checkmark-circle" : "ellipse-outline";
  const iconColor = isDone ? colors.primary : colors.text;
  const formattedDate = item.due_date.substring(5).replace("-", "/");

  return (
    <View
      style={[styles.taskItemContainer, { borderBottomColor: colors.border }]}
    >
      <TouchableOpacity
        onPress={() => onToggleStatus(item.id, isDone)}
        style={styles.iconContainer}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
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
        <Text style={[styles.dueDate, { color: colors.text, opacity: 0.7 }]}>
          締め切り: {formattedDate}
        </Text>
      </View>
    </View>
  );
};

// TaskListコンポーネント (課題のリスト)
interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleStatus,
}) => {
  if (tasks.length === 0) {
    return (
      <Text style={{ textAlign: "center", padding: 20, opacity: 0.5 }}>
        登録されている課題はありません。
      </Text>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TaskItem item={item} onToggleStatus={onToggleStatus} />
      )}
      scrollEnabled={false} // ScrollViewの中で使うので無効化
    />
  );
};

const styles = StyleSheet.create({
  taskItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    padding: 8,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskContent: {
    fontSize: 16,
  },
  dueDate: {
    fontSize: 12,
    marginTop: 4,
  },
});
