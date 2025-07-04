import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Subject } from "../types";

interface Props {
  subject: Subject | null;
}

export const SubjectCell: React.FC<Props> = ({ subject }) => {
  const router = useRouter(); // 変更

  const handlePress = () => {
    if (subject) {
      // 遷移先にオブジェクトを渡す
      router.push({
        pathname: "/SubjectDetail", // パス名で指定
        params: { subjectId: subject.id },
      });
    }
  };

  if (!subject) {
    // 授業がなければ空のセルを表示
    return <View style={styles.emptyCell} />;
  }

  return (
    <TouchableOpacity
      style={[styles.cell, { backgroundColor: subject.color }]}
      onPress={handlePress}
    >
      <Text style={styles.subjectName}>{subject.name}</Text>
      {subject.room && <Text style={styles.roomName}>{subject.room}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  emptyCell: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    margin: 1,
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
    marginTop: 2,
  },
});
