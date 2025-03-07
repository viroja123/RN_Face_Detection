import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

// Custom Hook: Checks if the screen is focused
export function useIsScreenFocused() {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () =>
      setIsFocused(true)
    );
    const unsubscribeBlur = navigation.addListener("blur", () =>
      setIsFocused(false)
    );
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  return isFocused;
}

// Custom Hook: Checks App State (Active, Background, Inactive)
export function useAppStateStatus() {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}
