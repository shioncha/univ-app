import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string, dueDate: string) => void;
}

export const AddTaskModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // 日付を 'YYYY-MM-DD' 形式の文字列にフォーマットする関数
  const formatDate = (rawDate: Date) => {
    const year = rawDate.getFullYear();
    const month = (rawDate.getMonth() + 1).toString().padStart(2, "0");
    const day = rawDate.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // カレンダーで日付が選択されたときの処理
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert("入力エラー", "課題の内容を入力してください。");
      return;
    }
    // stateのdateをフォーマットして保存
    onSave(content, formatDate(date));
    // 保存後、フォームをリセット
    setContent("");
    setDate(new Date());
  };

  const showDatePicker = () => {
    Keyboard.dismiss(); // 先にキーボードを閉じる
    setShowPicker(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            新しい課題を追加
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
            placeholder="課題の内容 (例: レポート提出)"
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            onFocus={() => {
              // もしピッカーが表示されていたら、閉じる
              if (showPicker) {
                setShowPicker(false);
              }
            }}
          />

          {/* ▼▼▼ 締め切り入力欄をボタンに変更 ▼▼▼ */}
          <Text style={[styles.label, { color: colors.text }]}>締め切り</Text>
          <TouchableOpacity
            style={[styles.input, { justifyContent: "center" }]}
            onPress={showDatePicker}
          >
            <Text style={{ color: colors.text }}>{formatDate(date)}</Text>
          </TouchableOpacity>

          {/* カレンダーピッカー (showPickerがtrueの時だけ表示) */}
          {showPicker && (
            <View>
              {/* iOSでのみ完了ボタンを表示 */}
              {Platform.OS === "ios" && (
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text
                      style={[styles.doneButtonText, { color: colors.primary }]}
                    >
                      完了
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                locale="ja-JP"
              />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={{ color: colors.text }}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={{ color: "#fff" }}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 48,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  pickerHeader: {
    alignItems: "flex-end",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  doneButton: {
    padding: 5,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
