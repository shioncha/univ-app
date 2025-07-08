/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#f7f8fa",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    card: "#ffffff",
    border: "#e0e0e0",
    primary: "#0a7ea4",
    notification: "#ff3b30",
  },
  dark: {
    text: "#ecf0f1",
    background: "#121212",
    tint: tintColorDark,
    icon: "#9ba1a6",
    tabIconDefault: "#9ba1a6",
    tabIconSelected: tintColorDark,
    card: "#1e1e1e",
    border: "#333333",
    primary: "#0a7ea4",
    notification: "#ff453a",
  },
};
