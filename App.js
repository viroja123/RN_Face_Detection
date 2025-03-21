import React, { useEffect } from "react";
import { NativeModules, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MainNavigator from "./src/screen/Navigator.js";

export default function App() {
  console.log("call the appp");
  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          {/* <View style={styles.container}>
        <Text style={{ color: "black" }}>
          Open up App.js to start working on your app!
        </Text>
        <StatusBar style="auto" />
      </View> */}
          {/* <Detection /> */}
          {/* <ToastManager /> */}

          <MainNavigator />
        </View>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
