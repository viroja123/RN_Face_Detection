import { View, Text } from "react-native";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Detection from "./Detection";
import LiveLiness from "./LiveLiness";

const MainNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Detection" component={Detection} />
      <Stack.Screen name="LiveLiness" component={LiveLiness} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
