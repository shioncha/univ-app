import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import base64 from "base-64";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import pako from "pako";
import React, { useEffect, useRef, useState } from "react"; // useRefをインポート
import {
  ActivityIndicator,
  Alert,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Database } from "@/services/database";
import { TimetableData } from "@/types";

interface CompactTimetableData {
  s: { n: string; t?: string; c: string }[];
  c: { i: number; d: number; p: number }[];
}

export default function QRCodeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [mode, setMode] = useState<"scan" | "display">("scan");
  const [permission, requestPermission] = useCameraPermissions();
  const [collectedChunks, setCollectedChunks] = useState<Map<number, string>>(
    new Map()
  );
  const [totalChunks, setTotalChunks] = useState<number | null>(null);
  const [myQRChunks, setMyQRChunks] = useState<string[]>([]);
  const [currentQRIndex, setCurrentQRIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ▼▼▼ 修正点: stateの代わりにuseRefで処理中のロックを管理 ▼▼▼
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const loadMyDataForQRCode = async () => {
    setIsLoading(true);
    setMode("display");
    try {
      const data = await Database.getAllDataForExport();
      const minifiedData = {
        s: data.subjects.map((s) => ({ n: s.name, t: s.teacher, c: s.color })),
        c: data.classes.map((c) => ({
          i: c.subjectIndex,
          d: c.day_of_week,
          p: c.period,
        })),
      };
      const jsonString = JSON.stringify(minifiedData);

      const compressed = pako.deflate(jsonString);
      let binaryString = "";
      for (let i = 0; i < compressed.length; i++) {
        binaryString += String.fromCharCode(compressed[i]);
      }
      const base64String = base64.encode(binaryString);

      const CHUNK_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < base64String.length; i += CHUNK_SIZE) {
        chunks.push(base64String.substring(i, i + CHUNK_SIZE));
      }
      const prefixedChunks = chunks.map(
        (chunk, index) => `${index + 1}/${chunks.length}:${chunk}`
      );
      setMyQRChunks(prefixedChunks);
      setCurrentQRIndex(0);
    } catch (error) {
      Alert.alert("エラー", "QRコード用データの生成に失敗しました。");
      setMode("scan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    // ▼▼▼ 修正点: 処理中の場合は、新しいスキャンを完全に無視する ▼▼▼
    if (isProcessing.current) {
      return;
    }
    isProcessing.current = true; // 処理を開始するのでロックする

    try {
      const [header, payload] = data.split(":");
      const [partStr, totalStr] = header.split("/");
      const part = parseInt(partStr, 10);
      const total = parseInt(totalStr, 10);
      if (isNaN(part) || isNaN(total) || !payload)
        throw new Error("無効な形式");

      if (totalChunks === null) setTotalChunks(total);
      else if (total !== totalChunks) {
        Alert.alert(
          "エラー",
          "異なる時間割のQRコードが混ざっているようです。最初からやり直してください。",
          [{ text: "OK", onPress: resetScan }]
        );
        return;
      }

      if (!collectedChunks.has(part)) {
        const newChunks = new Map(collectedChunks);
        newChunks.set(part, payload);
        setCollectedChunks(newChunks);
        if (newChunks.size === total) {
          processAllChunks(newChunks, total);
        } else {
          Alert.alert(
            "読み取り成功",
            `パート ${newChunks.size} / ${total} を読み取りました。\n次のQRコードをスキャンしてください。`,
            [
              {
                text: "OK",
                onPress: () => {
                  isProcessing.current = false;
                },
              }, // OKを押したらロックを解除
            ]
          );
        }
      } else {
        // すでに読み込み済みの場合は、ロックをすぐに解除
        isProcessing.current = false;
      }
    } catch (e) {
      Alert.alert(
        "読み取りエラー",
        "このアプリ用のQRコードではないようです。",
        [
          {
            text: "OK",
            onPress: () => {
              isProcessing.current = false;
            },
          }, // OKを押したらロックを解除
        ]
      );
    }
  };

  const processAllChunks = (chunks: Map<number, string>, total: number) => {
    let fullBase64String = "";
    for (let i = 1; i <= total; i++) {
      fullBase64String += chunks.get(i);
    }

    Alert.alert(
      "インポート確認",
      "すべてのQRコードを読み取りました。時間割をインポートしますか？",
      [
        { text: "キャンセル", onPress: resetScan, style: "cancel" },
        {
          text: "インポート実行",
          style: "destructive",
          onPress: async () => {
            try {
              const binaryString = base64.decode(fullBase64String);
              const compressed = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                compressed[i] = binaryString.charCodeAt(i);
              }
              const jsonString = pako.inflate(compressed, { to: "string" });

              const compactData = JSON.parse(
                jsonString
              ) as CompactTimetableData;
              if (!compactData.s || !compactData.c)
                throw new Error("データ構造が無効です。");

              const rehydratedData: TimetableData = {
                subjects: compactData.s.map((cs) => ({
                  name: cs.n,
                  teacher: cs.t || "",
                  room: "",
                  color: cs.c,
                })),
                classes: compactData.c.map((cc) => ({
                  subjectIndex: cc.i,
                  day_of_week: cc.d,
                  period: cc.p,
                })),
              };
              await Database.importData(rehydratedData);
              Alert.alert("成功", "データのインポートが完了しました。", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert("エラー", "データの復元に失敗しました。", [
                { text: "OK", onPress: resetScan },
              ]);
            }
          },
        },
      ]
    );
  };

  const resetScan = () => {
    setCollectedChunks(new Map());
    setTotalChunks(null);
    isProcessing.current = false; // ▼▼▼ 修正点: スキャン状態もリセット ▼▼▼
  };

  const renderScanner = () => {
    if (!permission) return <ActivityIndicator />;
    if (!permission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Text
            style={{
              color: colors.text,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            カメラへのアクセスを許可してください。
          </Text>
          <Button onPress={requestPermission} title="権限をリクエスト" />
        </View>
      );
    }
    return (
      <View style={styles.scannerContainer}>
        {/* ▼▼▼ 修正点: onBarcodeScannedは常に同じ関数を渡す ▼▼▼ */}
        <CameraView
          onBarcodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.finderOverlay}>
          <View style={styles.finderBox} />
        </View>
        <View style={styles.scanProgress}>
          <Text style={styles.scanProgressText}>
            {totalChunks
              ? `パート ${collectedChunks.size} / ${totalChunks} をスキャン中`
              : "QRコードをスキャンしてください"}
          </Text>
        </View>
      </View>
    );
  };

  const renderMyQRCode = () => {
    if (isLoading) return <ActivityIndicator size="large" />;
    if (myQRChunks.length === 0) {
      return (
        <Text style={{ color: colors.text, padding: 20, textAlign: "center" }}>
          QRコードを生成できませんでした。
        </Text>
      );
    }
    return (
      <View style={styles.qrDisplayContainer}>
        <View style={[styles.qrContainer, { backgroundColor: "white" }]}>
          <QRCode value={myQRChunks[currentQRIndex]} size={250} />
        </View>
        <Text style={[styles.qrInfoText, { color: colors.text }]}>
          QRコード {currentQRIndex + 1} / {myQRChunks.length}
        </Text>
        <View style={styles.qrNavButtons}>
          <Button
            title="< 前へ"
            onPress={() => setCurrentQRIndex((i) => i - 1)}
            disabled={currentQRIndex === 0}
          />
          <Button
            title="次へ >"
            onPress={() => setCurrentQRIndex((i) => i + 1)}
            disabled={currentQRIndex === myQRChunks.length - 1}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {mode === "scan" ? renderScanner() : renderMyQRCode()}
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: colors.border },
              mode === "scan" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setMode("scan")}
          >
            <Ionicons
              name="scan-outline"
              size={24}
              color={mode === "scan" ? "white" : colors.text}
            />
            <Text
              style={[
                styles.tabText,
                { color: mode === "scan" ? "white" : colors.text },
              ]}
            >
              スキャン
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: colors.border },
              mode === "display" && { backgroundColor: colors.primary },
            ]}
            onPress={loadMyDataForQRCode}
          >
            <Ionicons
              name="qr-code-outline"
              size={24}
              color={mode === "display" ? "white" : colors.text}
            />
            <Text
              style={[
                styles.tabText,
                { color: mode === "display" ? "white" : colors.text },
              ]}
            >
              マイQRコード
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qrContainer: { padding: 30, borderRadius: 12 },
  footer: { flexDirection: "row", padding: 20, gap: 20 },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  tabText: { fontSize: 16, fontWeight: "bold" },
  scannerContainer: { flex: 1, width: "100%" },
  finderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  finderBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 10,
  },
  scanProgress: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
  },
  scanProgressText: { color: "white", fontSize: 16, fontWeight: "bold" },
  qrDisplayContainer: { alignItems: "center", gap: 20 },
  qrInfoText: { fontSize: 18, fontWeight: "bold" },
  qrNavButtons: { flexDirection: "row", gap: 40 },
});
