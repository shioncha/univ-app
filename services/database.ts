import * as SQLite from "expo-sqlite";

import { ClassSession, Subject, Task, TaskWithSubject } from "@/types";

// 新しいAPI: openDatabaseSync を使用
const db = SQLite.openDatabaseSync("timetable.db");

/**
 * データベースの初期化処理
 * アプリ起動時に一度だけ呼び出す
 */
const initDB = async (): Promise<void> => {
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

/**
 * 新しい課題を追加する
 * @param task - 追加する課題情報 (IDとis_doneは除く)
 * @returns 追加された課題のID
 */
const addTask = async (task: Omit<Task, "id" | "is_done">): Promise<number> => {
  const result = await db.runAsync(
    "INSERT INTO Tasks (subject_id, content, due_date) VALUES (?, ?, ?);",
    task.subject_id,
    task.content,
    task.due_date
  );
  return result.lastInsertRowId;
};

/**
 * 特定の授業に関連する課題をすべて取得する (締め切り順)
 * @param subjectId - 授業のID
 * @returns 課題のリスト
 */
const getTasksBySubjectId = async (subjectId: number): Promise<Task[]> => {
  // getAllAsyncを使って、条件に一致するすべての行をオブジェクトの配列として取得します。
  return await db.getAllAsync<Task>(
    "SELECT * FROM Tasks WHERE subject_id = ? ORDER BY due_date ASC;",
    subjectId
  );
};

/**
 * 課題の完了状態を更新する
 * @param taskId - 更新する課題のID
 * @param isDone - 新しい完了状態 (true/false)
 */
const updateTaskStatus = async (
  taskId: number,
  isDone: boolean
): Promise<void> => {
  // isDoneがtrueなら1、falseなら0をデータベースに保存します。
  await db.runAsync(
    "UPDATE Tasks SET is_done = ? WHERE id = ?;",
    isDone ? 1 : 0,
    taskId
  );
};

/**
 * すべての課題を、関連する授業情報と共に取得する
 */
const getAllTasks = async (): Promise<TaskWithSubject[]> => {
  const query = `
    SELECT
      Tasks.*,
      Subjects.name AS subjectName,
      Subjects.color AS subjectColor
    FROM Tasks
    JOIN Subjects ON Tasks.subject_id = Subjects.id
    ORDER BY Tasks.is_done ASC, Tasks.due_date ASC;
  `;
  return await db.getAllAsync<TaskWithSubject>(query);
};

/**
 * 未完了の課題の総数を取得する
 * @returns 未完了の課題の数
 */
const getIncompleteTasksCount = async (): Promise<number> => {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM Tasks WHERE is_done = 0;"
  );
  return result?.count ?? 0;
};

/**
 * 科目ごとの未完了課題数を取得する
 * @returns { [subjectId: number]: number } 形式のオブジェクト
 */
const getIncompleteTaskCountsBySubject = async (): Promise<
  Record<number, number>
> => {
  const results = await db.getAllAsync<{ subject_id: number; count: number }>(
    "SELECT subject_id, COUNT(*) as count FROM Tasks WHERE is_done = 0 GROUP BY subject_id;"
  );
  // 配列を { subject_id: count } の形式のオブジェクトに変換
  return results.reduce((acc, row) => {
    acc[row.subject_id] = row.count;
    return acc;
  }, {} as Record<number, number>);
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
  addTask,
  getTasksBySubjectId,
  updateTaskStatus,
  getAllTasks,
  getIncompleteTasksCount,
  getIncompleteTaskCountsBySubject,
};
