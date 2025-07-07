import * as SQLite from "expo-sqlite";

import { ClassSession, Subject } from "@/types";

// 新しいAPI: openDatabaseSync を使用
const db = SQLite.openDatabaseSync("timetable.db");

/**
 * データベースの初期化処理
 * アプリ起動時に一度だけ呼び出す
 */
const initDB = async (): Promise<void> => {
  // ▼▼▼ 修正点 ▼▼▼
  // PRAGMA文をトランザクションの外に移動します
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // withTransactionAsync でテーブル作成処理のみを囲みます
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        teacher TEXT,
        room TEXT,
        color TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS Classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        period INTEGER NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES Subjects (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        due_date TEXT NOT NULL,
        is_done INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (subject_id) REFERENCES Subjects (id) ON DELETE CASCADE
      );
    `);
  });
};

/**
 * 新しい授業を追加する
 * @param subject - 追加する授業情報
 * @returns 追加された授業のID
 */
const addSubject = async (subject: Omit<Subject, "id">): Promise<number> => {
  // runAsync は INSERT, UPDATE, DELETE に使用し、結果を返す
  const result = await db.runAsync(
    "INSERT INTO Subjects (name, teacher, room, color) VALUES (?, ?, ?, ?);",
    subject.name,
    subject.teacher || null,
    subject.room || null,
    subject.color
  );
  return result.lastInsertRowId;
};

/**
 * 時間割のコマを追加する
 * @param classSession - 追加するコマ情報
 * @returns 追加されたコマのID
 */
const addClass = async (
  classSession: Omit<ClassSession, "id">
): Promise<number> => {
  const result = await db.runAsync(
    "INSERT INTO Classes (subject_id, day_of_week, period) VALUES (?, ?, ?);",
    classSession.subject_id,
    classSession.day_of_week,
    classSession.period
  );
  return result.lastInsertRowId;
};

/**
 * 時間割データを取得する
 * @returns データベースから取得した授業とコマのデータ
 */
const getTimetable = async (): Promise<{
  subjects: Subject[];
  classes: ClassSession[];
}> => {
  // getAllAsync は複数の行をオブジェクトの配列として取得する
  const subjects = await db.getAllAsync<Subject>("SELECT * FROM Subjects;");
  const classes = await db.getAllAsync<ClassSession>("SELECT * FROM Classes;");
  return { subjects, classes };
};

/**
 * 指定したIDの授業とそのコマを取得する
 * @param id - 授業のID
 * @returns 授業情報と紐づくコマの配列
 */
const getSubjectById = async (
  id: number
): Promise<{ subject: Subject | null; sessions: ClassSession[] }> => {
  // 単一の授業を取得
  const subject =
    db.getAllSync<Subject>("SELECT * FROM Subjects WHERE id = ?;", id)[0] ||
    null;
  // 授業に紐づくコマを取得
  const sessions = await db.getAllAsync<ClassSession>(
    "SELECT * FROM Classes WHERE subject_id = ?;",
    id
  );
  return { subject, sessions };
};

/**
 * 授業を削除する
 * @param id - 削除する授業のID
 */
const deleteSubject = async (id: number): Promise<void> => {
  await db.runAsync("DELETE FROM Subjects WHERE id = ?;", id);
};

/**
 * 既存の授業情報を更新する
 * @param subject - 更新する授業情報（IDを含む）
 */
const updateSubject = async (subject: Subject): Promise<void> => {
  await db.runAsync(
    "UPDATE Subjects SET name = ?, teacher = ?, room = ?, color = ? WHERE id = ?;",
    subject.name,
    subject.teacher || null,
    subject.room || null,
    subject.color,
    subject.id
  );
};

/**
 * 既存のコマ情報を更新する (UIが1授業1コマなので、最初の1件を更新)
 * @param classSession - 更新するコマ情報
 */
const updateClass = async (
  classSession: Omit<ClassSession, "id">
): Promise<void> => {
  await db.runAsync(
    "UPDATE Classes SET day_of_week = ?, period = ? WHERE subject_id = ?;",
    classSession.day_of_week,
    classSession.period,
    classSession.subject_id
  );
};

// 作成した関数をエクスポート
export const Database = {
  initDB,
  addSubject,
  addClass,
  getTimetable,
  getSubjectById,
  deleteSubject,
  updateSubject,
  updateClass,
};
