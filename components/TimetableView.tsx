import { useIsFocused, useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Database } from "../services/database";
import { ClassSession, Subject, TimetableEntry } from "../types";
import { SubjectCell } from "./SubjectCell";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [1, 2, 3, 4, 5];

export const TimetableView: React.FC = () => {
  const { colors } = useTheme(); // テーマカラーを取得
  const [timetable, setTimetable] = useState<(TimetableEntry | null)[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadTimetableData();
    }
  }, [isFocused]);

  const loadTimetableData = async () => {
    try {
      const { subjects, classes } = await Database.getTimetable();
      processAndSetTimetable(subjects, classes);
    } catch (error) {
      console.error("時間割データの読み込みに失敗しました", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAndSetTimetable = (
    subjects: Subject[],
    classes: ClassSession[]
  ) => {
    const grid: (TimetableEntry | null)[][] = Array(PERIODS.length)
      .fill(null)
      .map(() => Array(DAYS.length).fill(null));
    classes.forEach((cls) => {
      const subject = subjects.find((s) => s.id === cls.subject_id) || null;
      if (
        subject &&
        cls.day_of_week < DAYS.length &&
        cls.period - 1 < PERIODS.length
      ) {
        grid[cls.period - 1][cls.day_of_week] = { ...cls, subject };
      }
    });
    setTimetable(grid);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.headerRow}>
        <View style={styles.timeHeaderCell} />
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={[styles.headerText, { color: colors.text }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.timeColumn}>
          {PERIODS.map((period) => (
            <View key={period} style={styles.timeCell}>
              <Text style={[styles.headerText, { color: colors.text }]}>
                {period}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.gridContainer}>
          {timetable.map((row, periodIndex) => (
            <View key={periodIndex} style={styles.row}>
              {row.map((entry, dayIndex) => (
                <View key={dayIndex} style={styles.cellWrapper}>
                  <SubjectCell subject={entry?.subject || null} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", height: 30 },
  timeHeaderCell: { width: 30 },
  dayHeaderCell: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerText: { fontWeight: "bold" },
  body: { flexDirection: "row", flex: 1 },
  timeColumn: { width: 30 },
  timeCell: { flex: 1, justifyContent: "center", alignItems: "center" },
  gridContainer: { flex: 1, flexDirection: "column" },
  row: { flex: 1, flexDirection: "row" },
  cellWrapper: { flex: 1 },
});
