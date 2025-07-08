export interface Subject {
  id: number;
  name: string;
  teacher?: string;
  room?: string;
  color: string; // 例: '#ffc107'
}

export interface Task {
  id: number;
  subject_id: number; // 関連する授業のID
  content: string; // 課題の内容
  due_date: string; // 課題の締め切り (YYYY-MM-DD形式)
  is_done: number; // 課題の完了状態
}

export interface ClassSession {
  id: number;
  subject_id: number;
  day_of_week: number; // 0:月, 1:火, ...
  period: number; // 1, 2, 3, ...
}

// 画面表示用に情報を結合した型
export interface TimetableEntry extends ClassSession {
  subject: (Subject & { taskCount?: number }) | null;
}

export type RootStackParamList = {
  Home: undefined; // ホーム画面はパラメータなし
  SubjectDetail: { subjectId: number }; // 詳細画面はsubjectIdを受け取る
  // 他の画面もここに追加
};

export interface TaskWithSubject extends Task {
  subjectName: string;
  subjectColor: string;
}
