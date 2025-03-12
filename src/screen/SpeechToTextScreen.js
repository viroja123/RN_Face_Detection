import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
  BackHandler,
} from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import levenshtein from "fast-levenshtein";
import { useCameraDevice, useFrameProcessor } from "react-native-vision-camera";
import { Camera } from "react-native-vision-camera-face-detector";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import RNFS from "react-native-fs";

// Sample Sentences for Testing
const SAMPLE_SENTENCES = [
  "Good Morning How Are you!",
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with  dozen liquor jugs.",
  "The five boxing wizards jump quickly.",
  "The early bird catches the worm, but the second mouse gets the cheese.",
  "A journey of a thousand miles begins with a single step.",
  "All that glitters is not gold; all that wanders is not lost.",
  "Do not count your chickens before they are hatched.",
];

const initialState = {
  faceDetected: false,
  imageCaptured: false,
  imageData: null,
};

const MATCH_THRESHOLD = 8;
const SUCCESS_THRESHOLD = 75; // Threshold for success at 75%
const REFERENCE_IMAGE_KEY = "reference_face_image";

const SpeechToTextScreen = () => {
  const [transcript, setTranscript] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [isMatched, setIsMatched] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [successTriggered, setSuccessTriggered] = useState(false);

  const { width, height } = useWindowDimensions();
  const camera = useRef(null);
  const cameraDevice = useCameraDevice("front");
  const navigation = useNavigation();

  const detectionReducer = (state, action) => {
    try {
      switch (action.type) {
        case "FACE_DETECTED":
          return {
            ...state,
            faceDetected: action.value === "yes",
          };
        case "IMAGE_CAPTURED":
          return {
            ...state,
            imageCaptured: true,
            imageData: action.imageData || state.imageData,
          };
        case "RESET_STATE":
          return {
            ...initialState,
          };
        default:
          return state;
      }
    } catch (error) {
      console.error("Error in detection reducer:", error);
      return state;
    }
  };

  const [state, dispatch] = useReducer(detectionReducer, initialState);

  const getRandomSentence = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_SENTENCES.length);
    setCurrentSentence(SAMPLE_SENTENCES[randomIndex]);
    setTranscript("");
    setMatchPercentage(0);
    setIsMatched(false);
    setSuccessTriggered(false);

    dispatch({ type: "RESET_STATE" });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setHasPermission(status === "granted");
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please grant microphone permissions to use speech recognition"
          );
        }
      } catch (error) {
        console.error("Error requesting microphone permission:", error);
        Alert.alert("Error", "Could not request microphone permission");
      }
    })();

    // Set an initial sentence
    getRandomSentence();

    return () => {
      if (recognizing) {
        ExpoSpeechRecognitionModule.stop();
      }
    };
  }, []);

  const handleSuccess = useCallback(async () => {
    if (successTriggered) return; // Prevent multiple alerts

    setSuccessTriggered(true);
    await stopSpeechRecognition();

    try {
      // Make sure we have image data before saving
      if (state.imageData) {
        await AsyncStorage.setItem(REFERENCE_IMAGE_KEY, state.imageData);
        console.log("Image successfully saved to AsyncStorage");
      } else {
        console.error("No image data available to save");
      }

      Alert.alert(
        "Success",
        "Match percentage achieved! Image and audio captured successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("Navigating back...");
              // Navigate to FaceLiveness with the props
              navigation.navigate("FaceLiveness", {
                imagePath: state.imageData, // Pass the image data
                audioTestPassed: true, // Pass audio test result
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error in handleSuccess:", error);
      Alert.alert("Error", "Failed to save image data");
    }
  }, [successTriggered, state.imageData, navigation, stopSpeechRecognition]);

  // Monitor match percentage for success threshold
  useEffect(() => {
    console.log(
      "Checking success conditions:",
      "Match percentage:",
      matchPercentage,
      "Success triggered:",
      successTriggered,
      "Image captured:",
      state.imageCaptured
    );

    if (
      matchPercentage >= SUCCESS_THRESHOLD &&
      !successTriggered &&
      state.imageCaptured
    ) {
      handleSuccess();
    }
  }, [matchPercentage, successTriggered, state.imageCaptured, handleSuccess]);

  const captureImage = useCallback(async () => {
    if (!camera.current) {
      console.error("Camera reference is not available");
      return null;
    }

    try {
      console.log("Attempting to capture image...");

      // Take photo with base64 encoding enabled
      const photo = await camera.current.takePhoto({
        qualityPrioritization: "speed",
        flash: "off",
        enableAutoStabilization: true,
        skipMetadata: true,
        includeBase64: true, // Make sure base64 is enabled
      });

      console.log("Photo captured:", photo, photo ? "success" : "failed");
      const base64 = await RNFS.readFile(photo.path, "base64");
      console.log("base64", JSON.stringify(base64), "----->");
      // Verify we have the base64 data
      if (!photo || !base64) {
        console.error("Failed to get base64 data from captured image");
        Alert.alert("Warning", "Could not get image data. Please try again.");
        return null;
      }

      // Save image data in state via dispatch
      dispatch({
        type: "IMAGE_CAPTURED",
        imageData: photo.base64,
      });

      console.log("Image successfully captured and stored in state");
      return photo.base64;
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image: " + error.message);
      return null;
    }
  }, [camera]);

  // Stop Speech Recognition
  const stopSpeechRecognition = useCallback(async () => {
    if (recognizing) {
      try {
        await ExpoSpeechRecognitionModule.stop();
        setRecognizing(false);
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  }, [recognizing]);

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));

  useSpeechRecognitionEvent("result", (event) => {
    const spokenText = event.results[0]?.transcript || "";
    setTranscript(spokenText);

    // Calculate Match Percentage
    const distance = levenshtein.get(
      spokenText.toLowerCase(),
      currentSentence.toLowerCase()
    );
    const maxLength = Math.max(spokenText.length, currentSentence.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    const roundedSimilarity = Number(similarity.toFixed(2));

    setMatchPercentage(roundedSimilarity);
    setIsMatched(roundedSimilarity >= MATCH_THRESHOLD);

    // Check if we've reached the success threshold
    console.log("Speech match percentage:", roundedSimilarity);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech Recognition Error:", event.error, event.message);
  });

  // Start Speech Recognition after capturing image
  const startAudioRecording = async () => {
    if (recognizing) return;

    try {
      // Check speech recognition permission
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissions Required",
          "Speech recognition permissions are necessary."
        );
        return;
      }

      // First capture the image
      const imageData = await captureImage();

      // If image capture failed, don't proceed with speech recognition
      if (!imageData) {
        console.log(
          "Not starting speech recognition because image capture failed"
        );
        return;
      }

      // Stop any existing recognition
      await stopSpeechRecognition();

      // Start speech recognition
      console.log("Starting speech recognition...");
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
    } catch (error) {
      console.error("Speech Recognition Error:", error);
      Alert.alert(
        "Error",
        error.message || "Could not start speech recognition."
      );
      setRecognizing(false);
    }
  };

  const handleFacesDetected = useCallback(
    async (face) => {
      try {
        if (face && face[0]) {
          if (!state.faceDetected) {
            dispatch({ type: "FACE_DETECTED", value: "yes" });
            console.log("Face detected!");
          }
        } else {
          if (state.faceDetected) {
            dispatch({ type: "FACE_DETECTED", value: "no" });
            console.log("No face detected");
          }
        }
      } catch (error) {
        console.error("Error in face detection:", error);
        if (state.faceDetected) {
          dispatch({ type: "FACE_DETECTED", value: "no" });
        }
      }
    },
    [state.faceDetected]
  );

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    // console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sentenceContainer}>
        <Text style={styles.sentenceTitle}>Please read aloud:</Text>
        <Text style={styles.sentenceTxt}>{currentSentence}</Text>
        <TouchableOpacity
          style={styles.newSentenceBtn}
          onPress={getRandomSentence}
        >
          <Text style={styles.btnText}>Get New Sentence</Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignSelf: "center" }}>
        <AnimatedCircularProgress
          size={290}
          width={6}
          fill={state.faceDetected ? 100 : 0}
          tintColor={"#4BB543"}
          backgroundColor={"#aaaaaa"}
        >
          {() =>
            cameraDevice ? (
              <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={cameraDevice}
                isActive={true}
                photo={true}
                faceDetectionCallback={handleFacesDetected}
                faceDetectionOptions={{
                  performanceMode: "accurate",
                  classificationMode: "all",
                  contourMode: "all",
                  landmarkMode: "all",
                  windowWidth: width,
                  windowHeight: height,
                  trackingEnabled: false,
                  autoMode: true,
                }}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
              />
            ) : (
              <Text style={styles.noCameraText}>No Camera Found</Text>
            )
          }
        </AnimatedCircularProgress>
      </View>

      <TouchableOpacity
        style={[
          styles.recordBtn,
          recognizing ? styles.recordingBtn : null,
          successTriggered ? styles.successBtn : null,
          !state.faceDetected ? styles.disabledBtn : null,
        ]}
        onPress={recognizing ? stopSpeechRecognition : startAudioRecording}
        disabled={!hasPermission || successTriggered || !state.faceDetected}
      >
        <Text style={styles.btnText}>
          {recognizing
            ? "Stop Recording"
            : successTriggered
            ? "Success!"
            : state.faceDetected
            ? "Start Recording"
            : "No Face Detected"}
        </Text>
      </TouchableOpacity>

      {state.imageCaptured && (
        <Text style={styles.captureStatus}>✓ Image captured successfully</Text>
      )}

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Your speech:</Text>
        <Text
          style={[
            styles.resultTitle,
            matchPercentage >= SUCCESS_THRESHOLD ? styles.successText : null,
          ]}
        >
          Match: {matchPercentage}%
          {matchPercentage >= SUCCESS_THRESHOLD ? " ✓" : ""}
        </Text>

        <ScrollView style={[styles.transcriptScroll]}>
          <Text style={styles.transcriptTxt}>{transcript}</Text>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  sentenceContainer: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    borderRadius: 8,
    width: "100%",
    marginBottom: 10,
  },
  sentenceTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#555",
  },
  sentenceTxt: {
    fontSize: 18,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  newSentenceBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#7f8c8d",
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  recordBtn: {
    backgroundColor: "#3498db",
    padding: 14,
    borderRadius: 30,
    width: "70%",
    alignItems: "center",
    marginVertical: 20,
  },
  recordingBtn: { backgroundColor: "#e74c3c" },
  successBtn: { backgroundColor: "#4BB543" },
  disabledBtn: { backgroundColor: "#cccccc" },
  successText: { color: "#4BB543", fontWeight: "bold" },
  btnText: { color: "white", fontSize: 16, fontWeight: "bold" },
  resultContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    width: "100%",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  transcriptScroll: {
    padding: 10,
    backgroundColor: "#D3D3D3",
    borderRadius: 8,
  },
  transcriptTxt: {
    fontSize: 16,
  },
  noCameraText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  captureStatus: {
    color: "#4BB543",
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default SpeechToTextScreen;
