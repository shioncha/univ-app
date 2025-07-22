import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

// アプリがフォアグラウンド（起動中）でも通知を表示するための設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 通知の許可をリクエストし、リスナーを設定するカスタムフック
 */
export const useNotifications = () => {
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      // Android用の設定
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      // iOS / Android 両方で通知の許可をリクエスト
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("プッシュ通知の権限が許可されませんでした。");
      }
    };

    registerForPushNotificationsAsync();

    // （任意）通知をタップしたときの動作を定義するリスナー
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("通知がタップされました:", response);
      });

    // コンポーネントがアンマウントされるときにリスナーをクリーンアップ
    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);
};
