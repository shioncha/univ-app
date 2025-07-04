import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClassSession, Subject, TimetableEntry } from "../types";
import { SubjectCell } from "./SubjectCell";

// モックデータ (実際はデータベースから取得)
const MOCK_SUBJECTS: Subject[] = [
  {
    id: 1,
    name: "Webデザイン",
    teacher: "田中先生",
    room: "101",
    color: "#4caf50",
  },
  {
    id: 2,
    name: "線形代数",
    teacher: "鈴木先生",
    room: "203",
    color: "#f44336",
  },
  {
    id: 3,
    name: "マーケティング論",
    teacher: "佐藤先生",
    room: "305",
    color: "#2196f3",
  },
  {
    id: 4,
    name: "データベース入門",
    teacher: "山田 一郎",
    room: "404",
    color: "#ff9800",
  },
];

const MOCK_CLASSES: ClassSession[] = [
  { id: 101, subject_id: 2, day_of_week: 0, period: 1 }, // 月曜1限
  { id: 102, subject_id: 1, day_of_week: 0, period: 2 }, // 月曜2限
  { id: 103, subject_id: 3, day_of_week: 2, period: 3 }, // 水曜3限
  { id: 104, subject_id: 2, day_of_week: 3, period: 1 }, // 木曜1限
  { id: 105, subject_id: 4, day_of_week: 4, period: 5 }, // 金曜5限
];

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [1, 2, 3, 4, 5];

export const TimetableView: React.FC = () => {
  const [timetable, setTimetable] = useState<(TimetableEntry | null)[][]>([]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    // --- データ取得と加工処理 ---
    // 本来はここで非同期にデータベースからデータを取得する
    const subjects = MOCK_SUBJECTS;
    const classes = MOCK_CLASSES;

    // 5x5の空の時間割グリッドを作成
    const grid: (TimetableEntry | null)[][] = Array(PERIODS.length)
      .fill(null)
      .map(() => Array(DAYS.length).fill(null));

    // 取得した授業データをグリッドに配置
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
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* ヘッダー (曜日) */}
      <View style={styles.headerRow}>
        <View style={styles.timeHeaderCell} />
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.headerText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 本体 (時限と授業セル) */}
      <View style={styles.body}>
        {/* 左側ヘッダー (時限) */}
        <View style={styles.timeColumn}>
          {PERIODS.map((period) => (
            <View key={period} style={styles.timeCell}>
              <Text style={styles.headerText}>{period}</Text>
            </View>
          ))}
        </View>

        {/* 授業グリッド */}
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

// スタイル定義
const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
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
