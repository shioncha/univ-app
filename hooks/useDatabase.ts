import { useEffect, useState } from "react";
import { Database } from "../services/database";

export function useDatabase() {
  const [isDBLoading, setIsDBLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Database.initDB();
      } catch (error) {
        console.error("データベース初期化失敗", error);
      } finally {
        setIsDBLoading(false);
      }
    };

    initialize();
  }, []);

  return {
    isDBLoading,
    addSubject: Database.addSubject,
    addClass: Database.addClass,
    getTimetable: Database.getTimetable,
    deleteSubject: Database.deleteSubject,
  };
}
