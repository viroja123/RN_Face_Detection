import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Camera } from "react-native-vision-camera-face-detector";
import RNFS from "react-native-fs";
import CustomModal from "../CustomModals";
import {
  useCameraDevice,
  Camera as VisionCamera,
} from "react-native-vision-camera";
import invokeGenderDetector from "../../hook/UseFaceGender";
import { supabase } from "../../config/initSupabase";
import { uploadImageToStorage } from "../../utils/method";

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

const FaceCameraDetector = ({
  handleFaceData,
  currentStep,
  onFaceDetectionChange,
}) => {
  const [photoPath, setPhotoPath] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageBase, setImageBase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { width, height } = useWindowDimensions();
  const camera = useRef(null);
  const cameraDevice = useCameraDevice("front");
  const [state, dispatch] = useReducer(detectionReducer, initialState);
  const [success, setSuccess] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [faceGenderData, setFaceGenderData] = useState(null);

  // Function to request camera permission
  const requestCameraPermission = async () => {
    const permission = await VisionCamera.requestCameraPermission();
    if (permission === "granted") {
      setHasPermission(true);
    } else {
      Alert.alert("Camera permission is required to proceed.");
    }
  };

  // Request permission when component mounts
  useEffect(() => {
    requestCameraPermission();
  }, []);

  const captureImage = useCallback(async () => {
    if (!camera.current) {
      console.error("Camera reference is not available");
      return null;
    }
    try {
      setSuccess(false);
      console.log("Attempting to capture image...");

      // Take photo with base64 encoding enabled
      const photo = await camera.current.takePhoto({
        qualityPrioritization: "speed",
        flash: "off",
        enableAutoStabilization: true,
        skipMetadata: true,
        includeBase64: true,
      });

      console.log("Photo captured:", photo ? "success" : "failed");
      const base64 = await RNFS.readFile(photo?.path, "base64");
      if (photo && photo?.path) {
        setPhotoPath("file://" + photo.path);
        setImageBase(base64);
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
        imageData: photo.path,
      });

      console.log("Image successfully captured and stored in state");

      return photo.path;
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
            onFaceDetectionChange(true);
          }
        } else {
          if (state.faceDetected) {
            dispatch({ type: "FACE_DETECTED", value: "no" });
            console.log("No face detected");
            onFaceDetectionChange(false);
          }
        }
      } catch (error) {
        console.error("Error in face detection:", error);
        if (state.faceDetected) {
          dispatch({ type: "FACE_DETECTED", value: "no" });
          onFaceDetectionChange(false);
        }
      }
    },
    [state.faceDetected, onFaceDetectionChange]
  );

  // const uploadImageToStorage = async (path) => {
  //   try {
  //     const imageName = path.split("/").pop();
  //     console.log("Uploading:", imageName);
  //     const fileData = await RNFS.readFile(path, "base64");

  //     console.log("fileData,", fileData, "fileData--->");
  //     const { data: data11, error } = await supabase.storage
  //       .from("image")
  //       .upload(imageName, decode(fileData), {
  //         contentType: "image/png",
  //       });
  //     console.log("data---------->", data11);
  //     if (error) {
  //       console.error("Upload error:", error);
  //       return null;
  //     }

  //     const { data } = await supabase.storage
  //       .from("image")
  //       .getPublicUrl(imageName);

  //     console.log("Image URL:", data.publicUrl);
  //     return data;
  //   } catch (error) {
  //     console.error("error", error);
  //   }
  // };

  const handleFaceVerification = async () => {
    if (!photoPath || !imageBase) {
      Alert.alert("Please capture an image first");
      return;
    }
    setIsLoading(true);
    try {
      // console.log("open---->");

      const url = await uploadImageToStorage(photoPath, false);
      console.log("Uploaded!", url);

      const genderData = await invokeGenderDetector(url.publicUrl);
      if (genderData) {
        // console.log("genderData--->", genderData);
        setFaceGenderData(genderData);
      }
      // console.log("genderData", genderData?.labelName);
      // console.log("close---->");
      handleFaceData(photoPath, imageBase, genderData?.labelName);
      setSuccess(true);
      setIsLoading(false);
      setShowModal(false);
    } catch (error) {
      setIsLoading(false);
      setSuccess(false);
      console.error("Error saving image:", error);
      Alert.alert("An error occurred while saving the image.");
    }
  };
  const confidence = faceGenderData?.confidence * 100;

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
        <View
          style={{
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: state.faceDetected ? "pink" : "grey",
                width: 200,
                marginVertical: 6,
              },
            ]}
            disabled={!state.faceDetected}
            onPress={captureImage}
          >
            <Text
              style={[
                styles.buttonText,
                { textAlign: "center", color: "black" },
              ]}
            >
              {state.faceDetected ? " Capture Image" : "No Face Capture"}
            </Text>
          </TouchableOpacity>
          {success && (
            <Image
              source={require("../../images/correct.png")}
              style={{ width: 40, height: 40, marginLeft: 10 }}
            />
          )}
        </View>
      )}
      {success && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ textAlign: "left" }}>
            Gender :{" "}
            <Text style={{ fontWeight: "bold" }}>
              {faceGenderData?.labelName || "Unknown"}
            </Text>
          </Text>
          <Text style={{ textAlign: "right" }}>
            Probability :{" "}
            <Text style={{ fontWeight: "bold" }}>{confidence.toFixed()}</Text>
          </Text>
        </View>
      )}
      <CustomModal
        visible={showModal}
        photoPath={photoPath}
        onVerify={handleFaceVerification}
        onClose={() => setShowModal(false)}
        isLoading={isLoading}
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
