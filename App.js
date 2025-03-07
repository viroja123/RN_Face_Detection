import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import Detection from "./src/hook/screen/Detection";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MainNavigator from "./src/hook/screen/Navigator";

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
