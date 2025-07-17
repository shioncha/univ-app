import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

import { Database } from "@/services/database";

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
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  // 編集モードかどうかを判定
  const subjectId = Number(params.subjectId);
  const isEditMode = !isNaN(subjectId);

  // フォームの各入力値を管理するstate
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // 編集モードの場合、既存のデータを読み込んでフォームにセットする
  useEffect(() => {
    navigation.setOptions({ title: isEditMode ? "授業の編集" : "授業の追加" });

    if (isEditMode) {
      const loadData = async () => {
        try {
          const { subject, sessions } = await Database.getSubjectById(
            subjectId
          );
          if (subject) {
            setName(subject.name);
            setTeacher(subject.teacher || "");
            setRoom(subject.room || "");
            setSelectedColor(subject.color);
            if (sessions.length > 0) {
              setSelectedDay(sessions[0].day_of_week);
              setSelectedPeriod(sessions[0].period);
            }
          }
        } catch (error) {
          console.error(error);
          Alert.alert("エラー", "データの読み込みに失敗しました。");
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isEditMode, subjectId]);

  /**
   * 保存ボタンが押されたときの処理
   */
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("エラー", "授業名を入力してください。");
      return;
    }

    try {
      if (isEditMode) {
        // --- 編集モードの処理 ---
        await Database.updateSubject({
          id: subjectId,
          name: name.trim(),
          teacher: teacher.trim(),
          room: room.trim(),
          color: selectedColor,
        });
        await Database.updateClass({
          subject_id: subjectId,
          day_of_week: selectedDay,
          period: selectedPeriod,
        });
      } else {
        // --- 新規作成モードの処理 ---
        const newSubjectId = await Database.addSubject({
          name: name.trim(),
          teacher: teacher.trim(),
          room: room.trim(),
          color: selectedColor,
        });
        await Database.addClass({
          subject_id: newSubjectId,
          day_of_week: selectedDay,
          period: selectedPeriod,
        });
      }
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "保存に失敗しました。");
    }
  };

  /**
   * 削除ボタンが押されたときの処理
   */
  const handleDelete = () => {
    Alert.alert("授業の削除", `「${name}」を完全に削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await Database.deleteSubject(subjectId);
            Alert.alert("成功", "授業を削除しました。");
            // 編集画面と詳細画面の両方から戻る
            router.back(); // 編集画面から戻る
            if (router.canGoBack()) {
              router.back(); // 詳細画面から戻る
            }
          } catch (error) {
            console.error("授業の削除に失敗しました", error);
            Alert.alert("エラー", "授業の削除に失敗しました。");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, backgroundColor: colors.background }}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.container}
        onScrollBeginDrag={Keyboard.dismiss} // スクロール時にキーボードを閉じる
        keyboardShouldPersistTaps="handled" // タップ時にキーボード外でも反応
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
                { backgroundColor: colors.border },
                selectedDay === index && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.text },
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
                { backgroundColor: colors.border },
                selectedPeriod === period && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.text },
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

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>保存する</Text>
        </TouchableOpacity>

        {isEditMode && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>この授業を削除</Text>
          </TouchableOpacity>
        )}
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
  deleteButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  deleteButtonText: {
    color: "#c93c3c",
    fontSize: 16,
    fontWeight: "bold",
  },
});
