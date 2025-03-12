import React, { useCallback, useReducer, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Alert,
  TouchableOpacity,
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Camera } from "react-native-vision-camera-face-detector";
import { useCameraDevice, useFrameProcessor } from "react-native-vision-camera";
import RNFS from "react-native-fs";
import CustomModal from "../CustomModals";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREVIEW_MARGIN_TOP = 100;
const PREVIEW_SIZE = 200;

const promptsText = {
  noFaceDetected: "No face detected",
  performActions: "Perform the following actions:",
};

const initialState = {
  faceDetected: false,
};

const detectionReducer = (state, action) => {
  switch (action.type) {
    case "FACE_DETECTED":
      return { ...state, faceDetected: action.value === "yes" };
    case "IMAGE_CAPTURED":
      return {
        ...state,
        imageCaptured: true,
        imageData: action.imageData || state.imageData,
      };
    default:
      throw new Error("Unexpected action type.");
  }
};

const FaceCameraDetector = ({ handleFaceData, currentStep }) => {
  const [photoPath, setPhotoPath] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageBase, setImageBase] = useState("");
  const { width, height } = useWindowDimensions();
  const camera = useRef(null);
  const cameraDevice = useCameraDevice("front");
  const [state, dispatch] = useReducer(detectionReducer, initialState);

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
      const base64 = await RNFS.readFile(photo?.path, "base64");
      console.log(base64, "-------->>>>base64");
      if (photo && photo?.path) {
        setPhotoPath("file://" + photo.path);
        setImageBase(base64);
        console.log("base64", JSON.stringify(base64), "----->");
        setShowModal(true);
      }
      // Verify we have the base64 data
      if (!photo || !base64) {
        console.error("Failed to get base64 data from captured image");
        Alert.alert("Warning", "Could not get image data. Please try again.");
        return null;
      }
      // Save image data in state via dispatch
      dispatch({
        type: "IMAGE_CAPTURED",
        imageData: base64,
      });

      console.log("Image successfully captured and stored in state");
      return base64;
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image: " + error.message);
      return null;
    }
  }, [camera]);

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
    console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`);
  }, []);

  const handleFaceVerification = async () => {
    if (!photoPath || !imageBase) {
      Alert.alert("Please capture an image first");
      return;
    }

    handleFaceData(photoPath, imageBase);
    try {
      //   await AsyncStorage.setItem("photoPath", photoPath);
      await AsyncStorage.setItem("imageBase", imageBase);
      Alert.alert("Image saved successfully!");
      setShowModal(false);
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("An error occurred while saving the image.");
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={290}
        width={6}
        backgroundColor={state.faceDetected ? "#4BB543" : "#aaaaaa"}
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
              //   frameProcessor={frameProcessor}
              pixelFormat="yuv"
            />
          ) : (
            <Text style={styles.noCameraText}>No Camera Found</Text>
          )
        }
      </AnimatedCircularProgress>
      {currentStep === 1 && (
        <View style={{ alignSelf: "center" }}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "pink", width: 150, marginVertical: 6 },
            ]}
            onPress={captureImage}
          >
            <Text
              style={[
                styles.buttonText,
                { textAlign: "center", color: "black" },
              ]}
            >
              Capture Image
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <CustomModal
        visible={showModal}
        photoPath={photoPath}
        onVerify={handleFaceVerification}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
  },
  noCameraText: {
    color: "black",
    fontSize: 16,
    textAlign: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "blue",
    borderRadius: 5,
  },
});

export default FaceCameraDetector;
