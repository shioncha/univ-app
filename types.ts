export interface Subject {
  id: number;
  name: string;
  teacher?: string;
  room?: string;
  color: string; // 例: '#ffc107'
}

export interface ClassSession {
  id: number;
  subject_id: number;
  day_of_week: number; // 0:月, 1:火, ...
  period: number; // 1, 2, 3, ...
}

// 画面表示用に情報を結合した型
export interface TimetableEntry extends ClassSession {
  subject: Subject | null;
}

export type RootStackParamList = {
  Home: undefined; // ホーム画面はパラメータなし
  SubjectDetail: { subjectId: number }; // 詳細画面はsubjectIdを受け取る
  // 他の画面もここに追加
};
