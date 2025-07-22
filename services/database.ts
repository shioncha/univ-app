import * as Notifications from "expo-notifications";
import * as SQLite from "expo-sqlite";

import {
  ClassSession,
  Subject,
  Task,
  TaskWithSubject,
  TimetableData,
} from "@/types";

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
        notification_id TEXT,
        FOREIGN KEY (subject_id) REFERENCES Subjects (id) ON DELETE CASCADE
      );
    `);
  });
};

/**
 * 課題の締め切り当日の午前9時に通知を予約する
 */
const scheduleTaskNotification = async (
  taskContent: string,
  dueDate: string
): Promise<string | null> => {
  try {
    const triggerDate = new Date(`${dueDate}T09:00:00`);
    if (triggerDate.getTime() < Date.now()) {
      return null;
    }
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      year: triggerDate.getFullYear(),
      month: triggerDate.getMonth() + 1,
      day: triggerDate.getDate(),
      hour: 9,
      minute: 0,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "今日の課題締め切りです！",
        body: taskContent,
        sound: "default",
      },
      trigger,
    });
  } catch (error) {
    console.error("通知の予約に失敗:", error);
    return null;
  }
};

/**
 * 予約された通知をIDを指定してキャンセルする
 */
const cancelNotification = async (notificationId: string) => {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
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
 * 新しい課題を追加し、通知を予約する
 */
const addTask = async (
  task: Omit<Task, "id" | "is_done" | "notification_id">
): Promise<number> => {
  const notificationId = await scheduleTaskNotification(
    task.content,
    task.due_date
  );
  const result = await db.runAsync(
    "INSERT INTO Tasks (subject_id, content, due_date, notification_id) VALUES (?, ?, ?, ?);",
    task.subject_id,
    task.content,
    task.due_date,
    notificationId
  );
  return result.lastInsertRowId;
};

/**
 * 課題の完了状態を更新し、必要であれば通知をキャンセルする
 */
const updateTaskStatus = async (
  taskId: number,
  isDone: boolean
): Promise<void> => {
  if (isDone) {
    const task = await db.getFirstAsync<Task>(
      "SELECT notification_id FROM Tasks WHERE id = ?;",
      taskId
    );
    if (task?.notification_id) {
      await cancelNotification(task.notification_id);
    }
    await db.runAsync(
      "UPDATE Tasks SET is_done = 1, notification_id = NULL WHERE id = ?;",
      taskId
    );
  } else {
    const task = await db.getFirstAsync<Task>(
      "SELECT content, due_date FROM Tasks WHERE id = ?;",
      taskId
    );
    if (task) {
      const newNotificationId = await scheduleTaskNotification(
        task.content,
        task.due_date
      );
      await db.runAsync(
        "UPDATE Tasks SET is_done = 0, notification_id = ? WHERE id = ?;",
        newNotificationId,
        taskId
      );
    }
  }
};

/**
 * 課題を更新し、通知を再予約する
 */
const updateTask = async (
  taskId: number,
  content: string,
  dueDate: string
): Promise<void> => {
  const oldTask = await db.getFirstAsync<Task>(
    "SELECT notification_id FROM Tasks WHERE id = ?;",
    taskId
  );
  if (oldTask?.notification_id) {
    await cancelNotification(oldTask.notification_id);
  }
  const newNotificationId = await scheduleTaskNotification(content, dueDate);
  await db.runAsync(
    "UPDATE Tasks SET content = ?, due_date = ?, notification_id = ? WHERE id = ?;",
    content,
    dueDate,
    newNotificationId,
    taskId
  );
};

/**
 * 課題を削除し、関連する通知もキャンセルする
 */
const deleteTask = async (taskId: number): Promise<void> => {
  const task = await db.getFirstAsync<Task>(
    "SELECT notification_id FROM Tasks WHERE id = ?;",
    taskId
  );
  if (task?.notification_id) {
    await cancelNotification(task.notification_id);
  }
  await db.runAsync("DELETE FROM Tasks WHERE id = ?;", taskId);
};

/**
 * 授業削除時に、関連するすべての通知をキャンセルするためのヘルパー関数
 */
const getNotificationIdsForSubject = async (
  subjectId: number
): Promise<string[]> => {
  const results = await db.getAllAsync<{ notification_id: string }>(
    "SELECT notification_id FROM Tasks WHERE subject_id = ? AND notification_id IS NOT NULL;",
    subjectId
  );
  return results.map((r) => r.notification_id);
};

/**
 * 授業を削除し、関連するすべての通知をキャンセルする
 */
const deleteSubject = async (id: number): Promise<void> => {
  const notificationIds = await getNotificationIdsForSubject(id);
  for (const notificationId of notificationIds) {
    await cancelNotification(notificationId);
  }
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
 * 時間割データを取得する
 */
const getTimetable = async (): Promise<{
  subjects: Subject[];
  classes: ClassSession[];
}> => {
  const subjects = await db.getAllAsync<Subject>("SELECT * FROM Subjects;");
  const classes = await db.getAllAsync<ClassSession>("SELECT * FROM Classes;");
  return { subjects, classes };
};

/**
 * 指定したIDの授業とそのコマを取得する
 */
const getSubjectById = async (
  id: number
): Promise<{ subject: Subject | null; sessions: ClassSession[] }> => {
  const subject = await db.getFirstAsync<Subject>(
    "SELECT * FROM Subjects WHERE id = ?;",
    id
  );
  const sessions = await db.getAllAsync<ClassSession>(
    "SELECT * FROM Classes WHERE subject_id = ?;",
    id
  );
  return { subject, sessions };
};

/**
 * 特定の授業に関連する課題をすべて取得する
 */
const getTasksBySubjectId = async (subjectId: number): Promise<Task[]> => {
  // getAllAsyncを使って、条件に一致するすべての行をオブジェクトの配列として取得します。
  return await db.getAllAsync<Task>(
    "SELECT * FROM Tasks WHERE subject_id = ? ORDER BY due_date ASC;",
    subjectId
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

/**
 * エクスポート用にすべての時間割データを取得する
 */
const getAllDataForExport = async (): Promise<TimetableData> => {
  // IDを除いた授業情報を取得
  const subjects = await db.getAllAsync<Omit<Subject, "id">>(
    "SELECT name, teacher, room, color FROM Subjects;"
  );

  // 授業名と時間割情報を結合して取得
  const classesWithSubjectName = await db.getAllAsync<{
    name: string;
    day_of_week: number;
    period: number;
  }>(
    "SELECT Subjects.name, Classes.day_of_week, Classes.period FROM Classes JOIN Subjects ON Classes.subject_id = Subjects.id;"
  );

  // 授業名をsubjects配列のインデックスに変換するためのマップを作成
  const subjectsMap = new Map(subjects.map((s, i) => [s.name, i]));

  const classes = classesWithSubjectName
    .map((c) => ({
      subjectIndex: subjectsMap.get(c.name) ?? -1, // 授業名に対応するインデックスを取得
      day_of_week: c.day_of_week,
      period: c.period,
    }))
    .filter((c) => c.subjectIndex !== -1);
  return { subjects, classes };
};

/**
 * インポートしたデータでデータベースを上書きする
 */
const importData = async (data: TimetableData): Promise<void> => {
  await db.withTransactionAsync(async () => {
    // 既存のデータをすべて削除
    await db.execAsync(
      "DELETE FROM Tasks; DELETE FROM Classes; DELETE FROM Subjects;"
    );

    // 新しい授業データを挿入し、新しいIDを記録
    const subjectIds = [];
    for (const subject of data.subjects) {
      const result = await db.runAsync(
        "INSERT INTO Subjects (name, teacher, room, color) VALUES (?, ?, ?, ?);",
        subject.name,
        subject.teacher || null,
        subject.room || null,
        subject.color
      );
      subjectIds.push(result.lastInsertRowId);
    }

    // 新しい時間割データを挿入
    for (const classInfo of data.classes) {
      const subjectId = subjectIds[classInfo.subjectIndex]; // インデックスから新しいIDを取得
      if (subjectId) {
        await db.runAsync(
          "INSERT INTO Classes (subject_id, day_of_week, period) VALUES (?, ?, ?);",
          subjectId,
          classInfo.day_of_week,
          classInfo.period
        );
      }
    }
  });
};

const scheduleTestNotification = async () => {
  console.log("--- テスト通知を5秒後に予約します ---");
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "これはテスト通知です",
      body: "この通知が表示されれば、通知機能自体は正常に動作しています。",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
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
  updateTask,
  deleteTask,
  getAllTasks,
  getIncompleteTasksCount,
  getIncompleteTaskCountsBySubject,
  getAllDataForExport,
  importData,
  scheduleTestNotification,
};
