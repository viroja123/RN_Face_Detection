import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from "react-native";
import StepIndicator from "react-native-step-indicator";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import {
  useCameraDevice,
  useFrameProcessor,
  Camera as VisionCamera,
} from "react-native-vision-camera";
import { runOnJS } from "react-native-reanimated";
import { Camera } from "react-native-vision-camera-face-detector";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { SAMPLE_SENTENCES } from "../utils/constants";
import levenshtein from "fast-levenshtein";

const LiveLiness = ({ navigation }) => {
  // Configuration Constants
  const PREVIEW_MARGIN_TOP = 50;
  const PREVIEW_SIZE = 300;
  const SMILE_THRESHOLD = 0.85;
  const EYE_CLOSED_THRESHOLD = 0.5;
  const MATCH_PERCENTAGE_THRESHOLD = 80;
  const MAX_SENTENCE_REGENERATION = 3;

  const { width, height } = useWindowDimensions();
  const camera = useRef(null);
  const cameraDevice = useCameraDevice("front");

  const promptsText = {
    noFaceDetected: "No face detected",
    performActions: "Perform the following actions:",
  };

  // Step Labels
  const labels = [
    "Position Face",
    "Speak Phrase",
    "Smile",
    "Close Eyes",
    "Verification Complete",
  ];

  const initialState = {
    faceDetected: false,
    promptText: promptsText.noFaceDetected,
    detectionsList: labels,
    currentDetectionIndex: 0,
    progressFill: 0,
    processComplete: false,
  };
  const detectionReducer = (state, action) => {
    try {
      const numDetections = state.detectionsList.length;
      // +1 for face detection
      const newProgressFill =
        (100 / (numDetections + 1)) * (state.currentDetectionIndex + 1);

      switch (action.type) {
        case "FACE_DETECTED":
          if (action.value === "yes") {
            return {
              ...state,
              faceDetected: true,
              progressFill: newProgressFill,
            };
          } else {
            // Reset
            return initialState;
          }
        case "NEXT_DETECTION":
          const nextIndex = state.currentDetectionIndex + 1;
          if (nextIndex === numDetections) {
            // success
            return { ...state, processComplete: true, progressFill: 100 };
          }
          // next
          return {
            ...state,
            currentDetectionIndex: nextIndex,
            progressFill: newProgressFill,
          };
        default:
          throw new Error("Unexpeceted action type.");
      }
    } catch (error) {
      console.error("error on detection reducer : ", error);
    }
  };

  // State Management
  const [currentPosition, setCurrentPosition] = useState(0);
  // const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [isMatched, setIsMatched] = useState(false);
  const [randomSentence, setRandomSentence] = useState("Hello...");
  const [smiledFace, setSmiledFace] = useState(false);
  const [eyesClosed, setEyesClosed] = useState(false);

  const [state, dispatch] = useReducer(detectionReducer, initialState);

  // Enhanced stopSpeechRecognition to return a promise
  const stopSpeechRecognition = useCallback(async () => {
    try {
      if (recognizing) {
        ExpoSpeechRecognitionModule.stop();
        setRecognizing(false);
        setTranscript("");
      }
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  }, [recognizing]);
  // Reusable Random Sentence Selection
  const getRandomSentence = useCallback(() => {
    // Reset speech recognition and related states
    stopSpeechRecognition();
    setTranscript("");
    setMatchPercentage(0);
    setIsMatched(false);

    // Select and set new random sentence
    const randomIndex = Math.floor(Math.random() * SAMPLE_SENTENCES.length);
    setRandomSentence(SAMPLE_SENTENCES[randomIndex]);
  }, [stopSpeechRecognition]);

  // Cleanup Effect
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
    };
  }, []);
  // Speech Recognition Event Handlers
  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("result", (event) => {
    console.log("result", event);
    const spokenText = event.results[0]?.transcript || "";
    setTranscript(spokenText);

    // Robust Similarity Calculation
    const distance = levenshtein.get(
      spokenText.toLowerCase(),
      randomSentence.toLowerCase()
    );
    const maxLength = Math.max(spokenText.length, randomSentence.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    setMatchPercentage(Number(similarity.toFixed(2)));

    if (similarity >= MATCH_PERCENTAGE_THRESHOLD) {
      setIsMatched(true);
      // advanceToNextStep();
    }
  });

  // Centralized Step Advancement Logic
  const advanceToNextStep = () => {
    // stopSpeechRecognition();
    setCurrentPosition((prev) => (prev < labels.length - 1 ? prev + 1 : prev));
  };

  // Comprehensive Permission and Speech Recognition Start
  const handleStart = async () => {
    try {
      // Ensure we're not already recognizing
      if (recognizing) {
        console.log("Speech recognition already in progress");
        return;
      }

      // Get a new random sentence if not already done
      if (!randomSentence) {
        getRandomSentence();
      }

      // Check camera and speech recognition permissions
      const cameraPermission = await VisionCamera.requestCameraPermission();
      const speechPermission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!cameraPermission || !speechPermission.granted) {
        Alert.alert(
          "Permissions Required",
          "Camera and speech recognition permissions are necessary.",
          [{ text: "OK" }]
        );
        return;
      }

      // Additional safety check
      if (!ExpoSpeechRecognitionModule) {
        Alert.alert(
          "Module Error",
          "Speech recognition module is not available."
        );
        return;
      }

      // Stop any existing recognition before starting
      stopSpeechRecognition();

      // Start speech recognition with more robust error handling
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
    } catch (error) {
      console.error("Comprehensive speech recognition error:", error);

      // More detailed error handling
      if (error.message) {
        Alert.alert(
          "Speech Recognition Error",
          error.message || "Could not start speech recognition."
        );
      }

      // Reset states
      setRecognizing(false);
      setTranscript("");
    }
  };

  // Improved Face Detection Callback
  const handleFacesDetected = useCallback(
    (faces) => {
      try {
        if (faces.length === 0) {
          if (state.faceDetected)
            dispatch({ type: "FACE_DETECTED", value: "no" });

          return;
        }

        const face = faces[0];
        const faceBounds = face.bounds;
        const faceMidX = faceBounds.x + faceBounds.width / 2;
        const faceMidY = faceBounds.y + faceBounds.height / 2;

   
        const isFaceInPreviewArea =
          faceMidY >= PREVIEW_MARGIN_TOP &&
          faceMidY <= PREVIEW_MARGIN_TOP + PREVIEW_SIZE &&
          faceMidX >= (width - PREVIEW_SIZE) / 2 &&
          faceMidX <= (width + PREVIEW_SIZE) / 2;

        if (!isFaceInPreviewArea) {
          if (state.faceDetected)
            dispatch({ type: "FACE_DETECTED", value: "no" });

          return;
        }

        // Update state only if value has changed
        if (!state.faceDetected) {
          // runOnJS(setIsFaceDetected)(true);
          dispatch({ type: "FACE_DETECTED", value: "yes" });
        }

        // Smile Detection (update only if different)
        const newSmiledFace = face.smilingProbability >= SMILE_THRESHOLD;
        if (smiledFace !== newSmiledFace) {
          runOnJS(setSmiledFace)(newSmiledFace);
        }

        // Eye Closure Detection (update only if different)
        const leftEyeClosed =
          face.leftEyeOpenProbability <= EYE_CLOSED_THRESHOLD;
        const rightEyeClosed =
          face.rightEyeOpenProbability <= EYE_CLOSED_THRESHOLD;
        const newEyesClosed = leftEyeClosed && rightEyeClosed;

        if (eyesClosed !== newEyesClosed) {
          runOnJS(setEyesClosed)(newEyesClosed);
        }
      } catch (error) {
        console.log("Face detection error:", error);
      }
    },
    [width, height, state.faceDetected, smiledFace, eyesClosed]
  );

  // Comprehensive Step Handling
  const handleDetection = () => {
    if (!state.faceDetected) {
      Alert.alert(
        "Positioning Error",
        "Please center your face in the circle!"
      );
      return;
    }

    switch (currentPosition) {
      case 0: // Face Detection
        advanceToNextStep();
        break;
      case 1: // Audio
        getRandomSentence();
        // handleStart();
        advanceToNextStep();

        break;
      case 2: // Smile
        if (smiledFace) advanceToNextStep();
        else Alert.alert("Smile Detection", "Please smile for the camera!");
        break;
      case 3: // Eyes
        if (eyesClosed) advanceToNextStep();
        else Alert.alert("Eye Closure", "Please close both eyes!");
        break;
      case 4: // Final Step
        Alert.alert(
          "Liveness Verification",
          "Verification completed successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                try {
                  // Check if navigation is available before calling goBack()
                  if (navigation && typeof navigation.goBack === "function") {
                    navigation.goBack();
                  }
                } catch (error) {
                  console.error("Navigation error:", error);
                }
              },
            },
          ]
        );
        break;
    }
  };

  // Consistent Step Indicator Styles
  const getStepIndicatorStyles = () => ({
    stepIndicatorSize: 25,
    currentStepIndicatorSize: 30,
    stepStrokeCurrentColor: "#4BB543",
    stepStrokeFinishedColor: "#4BB543",
    stepIndicatorFinishedColor: "#4BB543",
    currentStepLabelColor: "#4BB543",
  });

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`);
  }, []);

  return (
    <View style={styles.container}>
      {currentPosition === 1 && (
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            Please Read Loud:
          </Text>
          <Text style={{ color: isMatched ? "green" : "red", fontSize: 20 }}>
            {randomSentence}
          </Text>

          <Text style={{ fontSize: 16, marginTop: 4 }}>
            Your Speech: {transcript}
          </Text>

          <Text
            style={{
              color: isMatched ? "green" : "red",
              fontSize: 18,
              marginTop: 3,
            }}
          >
            Match: {matchPercentage}%
          </Text>
        </View>
      )}

      <View style={{ alignSelf: "center" }}>
        <AnimatedCircularProgress
          size={290}
          width={6}
          fill={(currentPosition / (labels.length - 1)) * 100}
          tintColor={state.faceDetected ? "#4BB543" : "#3d5875"}
          backgroundColor={state.faceDetected ? "#4BB543" : "#aaaaaa"}
        >
          {() =>
            cameraDevice ? (
              <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={cameraDevice}
                isActive={true}
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

      <View style={{ marginTop: 20 }}>
        <StepIndicator
          customStyles={getStepIndicatorStyles()}
          currentPosition={currentPosition}
          labels={labels}
        />
        <Pressable style={styles.button} onPress={handleDetection}>
          <Text style={styles.buttonText}>Next Step</Text>
        </Pressable>
        {currentPosition == 1 && (
          <Pressable
            style={[styles.button, { backgroundColor: "red" }]}
            onPress={stopSpeechRecognition}
          >
            <Text style={styles.buttonText}>Stop Audio</Text>
          </Pressable>
        )}
      </View>

      <View>
        <Text
          style={[
            styles.statusText,
            { color: state.faceDetected ? "green" : "red" },
          ]}
        >
          {state.faceDetected ? "Face Detected" : "No Face Detected"}
        </Text>
        <Text style={styles.instructionText}>
          Please center your face in the circle
        </Text>
        <Text style={styles.instructionText}>
          {currentPosition == 1 && "Please Speak Loudly!"}
        </Text>
        <Text style={styles.instructionText}>
          {currentPosition == 2 && "Please smile for the camera!"}
        </Text>
        <Text style={styles.instructionText}>
          {currentPosition == 3 && "Please close both eyes!"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  noCameraText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    alignSelf: "center",
    backgroundColor: "#4BB543",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  statusText: {
    textAlign: "center",
    marginTop: 0,
    fontSize: 30,
    fontWeight: "bold",
    color: "red",
  },
  instructionText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
});

export default LiveLiness;
