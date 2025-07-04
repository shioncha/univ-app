import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Subject } from "../types";

interface Props {
  subject: Subject | null;
}

export const SubjectCell: React.FC<Props> = ({ subject }) => {
  const router = useRouter();
  const { colors } = useTheme(); // テーマカラーを取得

  const handlePress = () => {
    if (subject) {
      router.push({
        pathname: "/SubjectDetail",
        params: { subjectId: subject.id },
      });
    }
  };

  // 授業がない場合、テーマに合わせた背景色と枠線を表示
  if (!subject) {
    return (
      <View
        style={[
          styles.emptyCell,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[styles.cell, { backgroundColor: subject.color }]}
      onPress={handlePress}
    >
      <Text style={styles.subjectName} numberOfLines={2}>
        {subject.name}
      </Text>
      {subject.room && <Text style={styles.roomName}>{subject.room}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  emptyCell: {
    flex: 1,
    margin: 1,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  cell: {
    flex: 1,
    margin: 1,
    padding: 4,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  roomName: {
    fontSize: 11,
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
});
