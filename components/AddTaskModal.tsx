import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string, dueDate: string) => void;
}

export const AddTaskModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSave = () => {
    if (!content.trim() || !dueDate.trim()) {
      Alert.alert('入力エラー', '課題の内容と締め切りを両方入力してください。');
      return;
    }
    // 日付のフォーマットを簡易的にチェック (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert('入力エラー', '締め切りは「YYYY-MM-DD」の形式で入力してください。');
      return;
    }
    onSave(content, dueDate);
    setContent('');
    setDueDate('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>新しい課題を追加</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="課題の内容 (例: レポート提出)"
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="締め切り (例: 2025-07-20)"
            placeholderTextColor="#999"
            value={dueDate}
            onChangeText={setDueDate}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={{ color: colors.text }}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={{ color: '#fff' }}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
});
