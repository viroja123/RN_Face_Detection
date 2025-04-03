import { View, Text } from "react-native";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Detection from "./Detection";
import LiveLiness from "./LiveLiness";
import FaceLiveness from "./FaceLiveness";
import AudioVerification from "./AudioVerification";
import Processing from "./Processing";
import AudioTest from "../components/audioTest/index2";

const MainNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator>
      {/* <Stack.Screen name="Detection" component={Detection} /> */}
      {/* <Stack.Screen name="FaceLiveness" component={FaceLiveness} /> */}
      {/* <Stack.Screen name="LiveLiness" component={LiveLiness} /> */}
      {/* <Stack.Screen
        name="AudioVerification"
        component={AudioVerification}
        options={{ headerTitle: "Speech Recognition Test" }}
      /> */}
      <Stack.Screen name="Processing" component={Processing} />
      {/* <Stack.Screen name="Processing" component={AudioTest} /> */}
    </Stack.Navigator>
  );
};

export default MainNavigator;
