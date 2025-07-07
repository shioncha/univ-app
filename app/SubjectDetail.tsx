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

import { Database } from "@/services/database";
import { ClassSession, Subject } from "@/types";

const DAYS = ["月", "火", "水", "木", "金", "土"];

export default function SubjectDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const subjectId = Number(params.subjectId);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused && !isNaN(subjectId)) {
      loadSubjectData();
    }
  }, [isFocused, subjectId]);

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
    }
  }, [navigation, colors, subject]);

  const loadSubjectData = async () => {
    try {
      setLoading(true);
      const { subject: foundSubject, sessions: foundSessions } =
        await Database.getSubjectById(subjectId);

      setSubject(foundSubject);
      setSessions(foundSessions);

      navigation.setOptions({ title: foundSubject?.name || "見つかりません" });
    } catch (error) {
      console.error("授業データの読み込みに失敗しました", error);
      Alert.alert("エラー", "データの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!subject) return;
    router.push({
      pathname: "/SubjectEdit",
      params: { subjectId: subject.id },
    });
  };

  const handleDelete = () => {
    if (!subject) return;
    Alert.alert(
      "授業の削除",
      `「${subject.name}」を削除しますか？\n関連する課題やテストも全て削除されます。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          onPress: async () => {
            try {
              await Database.deleteSubject(subject.id);
              Alert.alert("成功", "授業を削除しました。");
              router.back();
            } catch (error) {
              console.error("授業の削除に失敗しました", error);
              Alert.alert("エラー", "授業の削除に失敗しました。");
            }
          },
          style: "destructive",
        },
      ]
    );
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView style={styles.container}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            基本情報
          </Text>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>担当教員</Text>
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
      </ScrollView>
    </SafeAreaView>
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
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: "500" },
  actionSection: { marginVertical: 24, paddingHorizontal: 16 },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: { color: "#c93c3c", fontSize: 16, fontWeight: "bold" },
});
