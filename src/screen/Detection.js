import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/core";
import { useAppState } from "@react-native-community/hooks";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Camera } from "react-native-vision-camera-face-detector";
import { ClipOp, Skia, TileMode } from "@shopify/react-native-skia";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import CustomModal from "../components/CustomModals";
import AudioCameraControls from "../components/AudioVideoCameraControl";
import { SAMPLE_SENTENCES } from "../utils/constants";
import levenshtein from "fast-levenshtein";

function Detection({ navigation }) {
  return (
    <SafeAreaProvider>
      <FaceDetection navigation={navigation} />
    </SafeAreaProvider>
  );
}

function FaceDetection({ navigation }) {
  const { width, height } = useWindowDimensions();
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  //permission
  const { hasPermission, requestPermission } = useCameraPermission();

  //state
  const [cameraMounted, setCameraMounted] = useState(false);
  const [cameraPaused, setCameraPaused] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [cameraFacing, setCameraFacing] = useState("front");
  const [photoPath, setPhotoPath] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [randomSentence, setRandomSentence] = useState("Hello...");
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [isMatched, setIsMatched] = useState(false);

  //app status
  const isFocused = useIsFocused();
  const appState = useAppState();
  const isCameraActive = !cameraPaused && isFocused && appState === "active";

  //camera
  const cameraDevice = useCameraDevice(cameraFacing);

  //ref
  const camera = useRef(null);
  const bottomSheetRef = useRef(null);

  //animation
  const aFaceW = useSharedValue(0);
  const aFaceH = useSharedValue(0);
  const aFaceX = useSharedValue(0);
  const aFaceY = useSharedValue(0);
  const aRot = useSharedValue(0);

  const faceDetectionOptions = useRef({
    performanceMode: "accurate",
    classificationMode: "all",
    contourMode: "all",
    landmarkMode: "all",
    windowWidth: width,
    windowHeight: height,
    trackingEnabled: true,
    autoMode: true,
  }).current;

  const boundingBoxStyle = useAnimatedStyle(() => ({
    position: "absolute",
    borderWidth: 4,
    borderLeftColor: "rgb(0,255,0)",
    borderRightColor: "rgb(0,255,0)",
    borderBottomColor: "rgb(0,255,0)",
    borderTopColor: "rgb(0,255,0)",
    width: withTiming(aFaceW.value, {
      duration: 100,
    }),
    height: withTiming(aFaceH.value, {
      duration: 100,
    }),
    left: withTiming(aFaceX.value, {
      duration: 100,
    }),
    top: withTiming(aFaceY.value, {
      duration: 100,
    }),
    transform: [
      {
        rotate: `${aRot.value}deg`,
      },
    ],
  }));

  //hook
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, []);

  //function

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("result", (event) => {
    const spokenText = event.results[0]?.transcript || "";
    setTranscript(spokenText);

    // Calculate similarity
    const distance = levenshtein.get(
      spokenText.toLowerCase(),
      randomSentence.toLowerCase()
    );
    const maxLength = Math.max(spokenText.length, randomSentence.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    setMatchPercentage(similarity.toFixed(2));

    if (similarity >= 80) {
      setIsMatched(true);
    } else {
      setIsMatched(false);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    console.log("error code:", event.error, "error message:", event.message);
  });

  const stopRecordingAudioAndVideo = () => {
    setIsRecording(false);
    ExpoSpeechRecognitionModule.stop();
  };

  const handleStart = async () => {
    // console.log("call the handleStart--------------->");
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    // console.log("result------------->", result);
    if (!result.granted) {
      console.warn("Permissions not granted", result);
      return;
    }
    // Start speech recognition
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: false,
      addsPunctuation: false,
      contextualStrings: ["Carlsen", "Nepomniachtchi", "Praggnanandhaa"],
    });
  };

  const getRandomSentence = () => {
    setIsMatched(false); // Reset match status
    setMatchPercentage(0);
    const randomIndex = Math.floor(Math.random() * SAMPLE_SENTENCES.length);
    setRandomSentence(SAMPLE_SENTENCES[randomIndex]);
  };

  const handleFacesDetected = (faces) => {
    // console.log("faces----------------", JSON.stringify(faces));
    if (!faces) {
      runOnJS(resetBoundingBox)();
    }
    const { bounds } = faces[0];
    const { width, height, x, y } = bounds;
    aFaceW.value = width;
    aFaceH.value = height;
    aFaceX.value = x;
    aFaceY.value = y;
  };

  const resetBoundingBox = () => {
    aFaceW.value = withTiming(0);
    aFaceH.value = withTiming(0);
    aFaceX.value = withTiming(0);
    aFaceY.value = withTiming(0);
  };

  const handleVideoAndAudioCapture = async () => {
    console.log("handleVideoAndAudioCapture");

    // Check camera mounting
    if (!cameraMounted) {
      Alert.alert("Please Mount Cam");
      return;
    }

    // Check camera ref
    if (!camera.current) {
      Alert.alert("Camera not ready!");
      return;
    }

    try {
      // If already recording, stop the recording
      handleStart();
      if (isRecording) {
        await camera.current.stopRecording();
        stopRecordingAudioAndVideo();
        return;
      }

      // Set recording state before starting
      setIsRecording(true);
      !isRecording && getRandomSentence();

      // Start video recording
      camera.current.startRecording({
        onRecordingFinished: async (video) => {
          console.log("Recording finished:", video);
          stopRecordingAudioAndVideo();
        },
        onRecordingError: async (error) => {
          console.error("Recording error:", error);
          stopRecordingAudioAndVideo();
        },
      });
    } catch (error) {
      console.error("Error in video capture:", error);
      Alert.alert("Error", "Failed to handle recording: " + error.message);
      stopRecordingAudioAndVideo();
    }
  };
  const captureImage = async () => {
    if (!cameraMounted) {
      Alert.alert("Please Mount Cam");
      return;
    }
    if (!camera.current) {
      Alert.alert("Camera not ready!");
      return;
    }

    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: "quality",
        flash: "off",
      });

      console.log("Photo captured:", photo);
      if (photo.path) {
        setPhotoPath("file://" + photo.path); // Ensure proper URI format
        setShowModal(true);
      }
    } catch (error) {
      console.error("Failed to take photo", error);
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const handleFaceVerification = async () => {
    if (!photoPath) {
      Alert.alert("Please capture an image first");
      return;
    }

    setIsVerifying(true);
    setVerificationComplete(false);

    try {
      Alert.alert("In Development");

      // console.log("call the useFaceVerification ----------------", photoPath);
      // const result = await useFaceVerification(photoPath);
      // if (result) {
      //   console.log("Face Detection Result:", result);
      //   setVerificationComplete(true);
      // } else {
      //   Alert.alert("Verification failed. Try again.");
      // }
    } catch (error) {
      console.error(error);
      Alert.alert("An error occurred while verifying the image.");
    } finally {
      setIsVerifying(false);
    }
  };

  function handleSkiaActions(faces, frame) {
    "worklet";
    // if no faces are detected we do nothing
    if (Object.keys(faces).length <= 0) return;

    console.log("SKIA - faces", faces.length, "frame", frame.toString());

    const { bounds, contours, landmarks } = faces[0];

    // draw a blur shape around the face points
    const blurRadius = 25;
    const blurFilter = Skia.ImageFilter.MakeBlur(
      blurRadius,
      blurRadius,
      TileMode.Repeat,
      null
    );
    const blurPaint = Skia.Paint();
    blurPaint.setImageFilter(blurFilter);
    const contourPath = Skia.Path.Make();
    const necessaryContours = ["FACE", "LEFT_CHEEK", "RIGHT_CHEEK"];

    necessaryContours.map((key) => {
      contours?.[key]?.map((point, index) => {
        if (index === 0) {
          // it's a starting point
          contourPath.moveTo(point.x, point.y);
        } else {
          // it's a continuation
          contourPath.lineTo(point.x, point.y);
        }
      });
      contourPath.close();
    });

    frame.save();
    frame.clipPath(contourPath, ClipOp.Intersect, true);
    frame.render(blurPaint);
    frame.restore();

    // draw mouth shape
    const mouthPath = Skia.Path.Make();
    const mouthPaint = Skia.Paint();
    mouthPaint.setColor(Skia.Color("red"));
    const necessaryLandmarks = ["MOUTH_BOTTOM", "MOUTH_LEFT", "MOUTH_RIGHT"];

    necessaryLandmarks.map((key, index) => {
      const point = landmarks?.[key];
      if (!point) return;

      if (index === 0) {
        // it's a starting point
        mouthPath.moveTo(point.x, point.y);
      } else {
        // it's a continuation
        mouthPath.lineTo(point.x, point.y);
      }
    });
    mouthPath.close();
    frame.drawPath(mouthPath, mouthPaint);

    // draw a rectangle around the face
    const rectPaint = Skia.Paint();
    rectPaint.setColor(Skia.Color("blue"));
    rectPaint.setStyle(1);
    rectPaint.setStrokeWidth(5);
    frame.drawRect(bounds, rectPaint);
  }

  function handleUiRotation(rotation) {
    aRot.value = rotation;
  }

  const handleStartLiveLiness = () => {
    console.log("call the handleStartLiveLiness");
    navigation.navigate("LiveLiness");
  };

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        {hasPermission && cameraDevice ? (
          <>
            {cameraMounted && (
              <>
                <View
                  style={{
                    position: "absolute",
                    zIndex: 1111111,
                    top: 20,
                    left: 20,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 20 }}>
                    Please Read Loud:
                  </Text>
                  <Text
                    style={{ color: isMatched ? "green" : "red", fontSize: 22 }}
                  >
                    {randomSentence}
                  </Text>

                  <Text style={{ color: "white", fontSize: 16, marginTop: 10 }}>
                    Your Speech: {transcript}
                  </Text>

                  <Text
                    style={{
                      color: isMatched ? "green" : "red",
                      fontSize: 18,
                      marginTop: 10,
                    }}
                  >
                    Match: {matchPercentage}%
                  </Text>

                  {!isMatched && (
                    <Text style={{ color: "yellow", fontSize: 16 }}>
                      Try again with a different sentence!
                    </Text>
                  )}
                </View>
                <Camera
                  ref={camera}
                  style={StyleSheet.absoluteFill}
                  isActive={isCameraActive}
                  device={cameraDevice}
                  faceDetectionCallback={handleFacesDetected}
                  photo={true}
                  audio={false}
                  video={true}
                  onUIRotationChanged={handleUiRotation}
                  faceDetectionOptions={{
                    ...faceDetectionOptions,
                    autoMode,
                    cameraFacing,
                  }}
                  skiaActions={handleSkiaActions}
                />
                <Animated.View style={boundingBoxStyle} />
                {cameraPaused && (
                  <Text
                    style={{
                      width: "100%",
                      backgroundColor: "blue",
                      textAlign: "center",
                      color: "white",
                    }}
                  >
                    Camera is PAUSED
                  </Text>
                )}
              </>
            )}
            {!cameraMounted && (
              <Text
                style={{
                  width: "100%",
                  backgroundColor: "pink",
                  textAlign: "center",
                }}
              >
                Camera is NOT mounted
              </Text>
            )}
          </>
        ) : (
          <Text
            style={{
              width: "100%",
              backgroundColor: "red",
              textAlign: "center",
              color: "white",
            }}
          >
            No camera device or permission
          </Text>
        )}
      </View>
      <AudioCameraControls
        recognizing={recognizing}
        handleStart={handleStart}
        ExpoSpeechRecognitionModule={ExpoSpeechRecognitionModule}
        transcript={transcript}
        setCameraFacing={setCameraFacing}
        autoMode={autoMode}
        setAutoMode={setAutoMode}
        cameraPaused={cameraPaused}
        setCameraPaused={setCameraPaused}
        cameraMounted={cameraMounted}
        setCameraMounted={setCameraMounted}
        captureImage={captureImage}
        isRecording={isRecording}
        handleVideoAndAudioCapture={handleVideoAndAudioCapture}
        handleStartLiveLiness={handleStartLiveLiness}
      />

      {/* <SpeechToTextScreen /> */}
      <CustomModal
        visible={showModal}
        photoPath={photoPath}
        onVerify={handleFaceVerification}
        onClose={() => setShowModal(false)}
      />
      {isBottomSheetOpen && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose={verificationComplete} // Allow swipe only when verification is complete
          onChange={(index) => {
            if (index === -1) {
              setIsBottomSheetOpen(false); // Update state when closed manually
            }
          }}
        >
          <BottomSheetView
            style={{ flex: 1, padding: 36, alignItems: "center" }}
          >
            {isVerifying ? (
              <>
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}
                >
                  We are verifying your image, please wait...
                </Text>
                <ActivityIndicator size="large" color="#6200EE" />
              </>
            ) : verificationComplete ? (
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Verification Complete 🎉
              </Text>
            ) : null}
          </BottomSheetView>
        </BottomSheet>
      )}
    </>
  );
}

export default Detection;
