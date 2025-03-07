import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";

const AudioCameraControls = ({
  recognizing,
  handleStart,
  ExpoSpeechRecognitionModule,
  transcript,
  setCameraFacing,
  autoMode,
  setAutoMode,
  cameraPaused,
  setCameraPaused,
  cameraMounted,
  setCameraMounted,
  captureImage,
  isRecording,
  handleVideoAndAudioCapture,
  handleStartLiveLiness,
}) => {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: "column",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <Pressable
          style={{
            backgroundColor: "#CBC3E3",
            padding: 10,
            borderRadius: 10,
            marginBottom: 10,
          }}
          onPress={handleStartLiveLiness}
        >
          <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
            Start LiveLiness
          </Text>
        </Pressable>
      </View>
      {/* <View style={{ alignItems: "center" }}>
        {!recognizing ? (
          <Pressable
            style={{
              backgroundColor: "#CBC3E3",
              padding: 10,
              borderRadius: 10,
            }}
            onPress={handleStart}
          >
            <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
              Start Audio Recording
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={{
              backgroundColor: "#CBC3E3",
              padding: 10,
              borderRadius: 10,
            }}
            onPress={() => ExpoSpeechRecognitionModule.stop()}
          >
            <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
              Stop Audio Recording
            </Text>
          </Pressable>
        )}

        <ScrollView>
          <Text>{transcript}</Text>
        </ScrollView>
      </View> */}

      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <Pressable
          style={{ backgroundColor: "#CBC3E3", padding: 10, borderRadius: 10 }}
          onPress={() =>
            setCameraFacing((prev) => (prev === "front" ? "back" : "front"))
          }
        >
          <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
            Front/Back Cam
          </Text>
        </Pressable>
        <Pressable
          style={{ backgroundColor: "#CBC3E3", padding: 10, borderRadius: 10 }}
          onPress={() => setAutoMode((prev) => !prev)}
        >
          <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
            {autoMode ? "Disable" : "Enable"} AutoMode
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <Pressable
          style={{
            backgroundColor: "#CBC3E3",
            padding: 10,
            borderRadius: 10,
            marginTop: 10,
          }}
          onPress={() => setCameraPaused((prev) => !prev)}
        >
          <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
            {cameraPaused ? "Resume" : "Pause"} Cam
          </Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: "#CBC3E3",
            padding: 10,
            borderRadius: 10,
            marginTop: 10,
          }}
          onPress={() => setCameraMounted((prev) => !prev)}
        >
          <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
            {cameraMounted ? "Unmount" : "Mount"} Cam
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <Pressable
          style={{
            backgroundColor: "#CBC3E3",
            padding: 10,
            borderRadius: 10,
            marginTop: 10,
          }}
          onPress={captureImage}
        >
          <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
            Capture Image
          </Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: isRecording ? "red" : "#CBC3E3",
            padding: 10,
            borderRadius: 10,
            marginTop: 10,
          }}
          onPress={handleVideoAndAudioCapture}
        >
          <Text style={{ color: "black", fontSize: 15, fontWeight: "bold" }}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AudioCameraControls;
