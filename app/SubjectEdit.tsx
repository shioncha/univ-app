import { Database } from "@/services/database";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [1, 2, 3, 4, 5];
const COLORS = [
  "#4caf50",
  "#f44336",
  "#2196f3",
  "#ff9800",
  "#9c27b0",
  "#795548",
];

export default function SubjectEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // フォームの各入力値を管理するstate
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  const handleSave = async () => {
    // 入力チェック
    if (!name.trim()) {
      Alert.alert("エラー", "授業名を入力してください。");
      return;
    }

    try {
      // 1. 授業情報をDBに保存
      const newSubjectId = await Database.addSubject({
        name: name.trim(),
        teacher: teacher.trim(),
        room: room.trim(),
        color: selectedColor,
      });

      // 2. 時間割のコマ情報をDBに保存
      await Database.addClass({
        subject_id: newSubjectId,
        day_of_week: selectedDay,
        period: selectedPeriod,
      });

      Alert.alert("成功", "新しい授業を追加しました。");
      // 保存後、前の画面に戻る
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "授業の追加に失敗しました。");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.container}
        onScrollBeginDrag={Keyboard.dismiss} // スクロール時にキーボードを閉じる
      >
        <Text style={[styles.label, { color: colors.text }]}>授業名 *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="例: Webプログラミング"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>担当教員</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={teacher}
          onChangeText={setTeacher}
          placeholder="例: 田中 太郎"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>教室</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={room}
          onChangeText={setRoom}
          placeholder="例: 101教室"
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: colors.text }]}>時間</Text>
        <View style={styles.selectorContainer}>
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.chip,
                selectedDay === index && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedDay === index && { color: "#fff" },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.selectorContainer}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.chip,
                selectedPeriod === period && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedPeriod === period && { color: "#fff" },
                ]}
              >
                {period}限
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>カラー</Text>
        <View style={styles.selectorContainer}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorChip,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColorChip,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存する</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedColorChip: {
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  saveButton: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 32,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
