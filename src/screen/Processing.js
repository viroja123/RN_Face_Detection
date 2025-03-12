import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  NativeEventEmitter,
  Platform,
  Image,
} from "react-native";
import StepIndicator from "react-native-step-indicator";
import FaceCameraDetector from "../components/faceCamera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCameraPermission } from "react-native-vision-camera";
import AudioTest from "../components/audioTest";
import FaceSDK, {
  Enum,
  FaceCaptureResponse,
  LivenessResponse,
  MatchFacesResponse,
  MatchFacesRequest,
  MatchFacesImage,
  ComparedFacesSplit,
  InitConfig,
  InitResponse,
  LivenessSkipStep,
  RNFaceApi,
  LivenessNotification,
} from "@regulaforensics/react-native-face-api";
import MatchImage from "../components/MatchImages";
import * as RNFS from "react-native-fs";

const steps = [
  "Start",
  "Face Detection",
  "Audio Test",
  "Liveness",
  "Matching Image",
  "Complete",
];

const Progressing = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [liveness, setLiveness] = useState("nil");
  const [img1, setImg1] = useState("");
  const [img2, setImg2] = useState("");
  const [similarity, setSimilarity] = useState("nil");
  const image1Ref = useRef(new MatchFacesImage());
  const image2Ref = useRef(new MatchFacesImage());
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, []);

  useEffect(() => {
    if (currentStep === 1) {
      checkStoredImageData();
    }
    if (currentStep === 3) {
      setIsNextDisabled(true);
    }
  }, [currentStep]);

  useEffect(() => {
    // Enable Next button when liveness is "passed"
    if (liveness === "passed" && currentStep === 3) {
      setIsNextDisabled(false);
    }
  }, [liveness, currentStep]);

  useEffect(() => {
    const eventManager = new NativeEventEmitter(RNFaceApi);
    eventManager.addListener("livenessNotificationEvent", (data) => {
      const notification = LivenessNotification.fromJson(JSON.parse(data));
      console.log("LivenessStatus:", notification.status);
    });

    const onInit = (json) => {
      console.log("json", json);
      const response = InitResponse.fromJson(JSON.parse(json));
      if (!response.success) {
        console.log(response.error.code, response.error.message);
      } else {
        console.log("Init complete");
      }
    };

    // "../../../license/regula.license";
    const licPath =
      Platform.OS === "ios"
        ? `${RNFS.MainBundlePath}/license/regula.license`
        : "regula.license";
    const readFile =
      Platform.OS === "ios" ? RNFS.readFile : RNFS.readFileAssets;

    readFile(licPath, "base64")
      .then((license) => {
        const config = new InitConfig();
        config.license = license;
        FaceSDK.initialize(config, onInit, () => {});
      })
      .catch(() => {
        FaceSDK.initialize(null, onInit, () => {});
      });
  }, []);

  const getStepIndicatorStyles = () => ({
    stepIndicatorSize: 25,
    currentStepIndicatorSize: 28,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 4,
    stepStrokeWidth: 2,
    stepStrokeCurrentColor: "#4BB543",
    stepStrokeFinishedColor: "#4BB543",
    stepStrokeUnFinishedColor: "#A9A9A9",
    separatorFinishedColor: "#4BB543",
    separatorUnFinishedColor: "#A9A9A9",
    stepIndicatorFinishedColor: "#4BB543",
    stepIndicatorUnFinishedColor: "#FFFFFF",
    stepIndicatorCurrentColor: "#FFA500",
    stepIndicatorLabelFontSize: 14,
    currentStepIndicatorLabelFontSize: 14,
    stepIndicatorLabelCurrentColor: "#FFFFFF",
    stepIndicatorLabelFinishedColor: "#FFFFFF",
    stepIndicatorLabelUnFinishedColor: "#A9A9A9",
    labelColor: "#666",
    currentStepLabelColor: "#4BB543",
    labelSize: 14,
  });

  const handleReset = async () => {
    setCurrentStep(0);
    setIsNextDisabled(false);
    await AsyncStorage.clear();
    await AsyncStorage.removeItem("imageBase64");
    await AsyncStorage.removeItem("photoPath");
    console.log("AsyncStorage cleared.");
  };

  //2nd Face Detection
  const handleFaceData = async (imagePath, base64Image) => {
    if (imagePath && base64Image) {
      try {
        await AsyncStorage.setItem("photoPath", imagePath);
        await AsyncStorage.setItem("imageBase64", base64Image);
        Alert.alert("Image saved successfully!");
        console.log("Face Data", imagePath, base64Image, "Saved");

        setIsNextDisabled(false); // Enable Next button after storing data
      } catch (error) {
        await AsyncStorage.clear();
        await AsyncStorage.removeItem("imageBase64");
        await AsyncStorage.removeItem("photoPath");

        console.error("Error saving image data:", error);
      }
    }
  };

  const checkStoredImageData = async () => {
    try {
      const photoPath = await AsyncStorage.getItem("photoPath");
      const imageBase64 = await AsyncStorage.getItem("imageBase64");
      setIsNextDisabled(!photoPath || !imageBase64); // Disable if missing
    } catch (error) {
      console.error("Error fetching image data:", error);
      setIsNextDisabled(true);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      await checkStoredImageData();
      if (isNextDisabled) {
        Alert.alert("Error", "Please capture an image before proceeding.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  // 4th Liveness

  const setImage = (first, base64, type) => {
    if (!base64) return;
    setSimilarity("null");

    if (first) {
      image1Ref.current = new MatchFacesImage();
      image1Ref.current.image = base64;
      image1Ref.current.imageType = type;
      setImg1({ uri: `data:image/png;base64,${base64}` });
      setLiveness("null");

      console.log("Image1Ref Base64:", image1Ref.current.image.length);
    }

    AsyncStorage.getItem("imageBase64")
      .then((d) => {
        console.log("d", d);
        console.log("Stored Image Base64 Length:", d ? d.length : "No data");
        if (d) {
          image2Ref.current = new MatchFacesImage();
          image2Ref.current.image = d;
          setImg2({ uri: `data:image/png;base64,${d}` });

          console.log("Image2Ref Base64:", image2Ref.current.image.length);
        }
      })
      .catch((e) => {
        console.log("AsyncStorage error:", e);
        setIsNextDisabled(true);
      });
  };

  const startLiveness = () => {
    console.log("call the liveness");
    FaceSDK.startLiveness(
      { skipStep: [LivenessSkipStep.ONBOARDING_STEP] },
      (json) => {
        const response = LivenessResponse.fromJson(JSON.parse(json));
        if (response.image) {
          setImage(true, response.image, Enum.ImageType.LIVE);
          console.log("call the liveness");
          const livenessStatus =
            response.liveness === Enum.LivenessStatus.PASSED
              ? "passed"
              : "unknown";
          setLiveness(livenessStatus);

          // Enable Next button only if liveness check passed
          if (livenessStatus === "passed") {
            setIsNextDisabled(false);
          } else {
            setIsNextDisabled(true);
          }
        }
      },
      () => {}
    );
  };

  //5 Match Image Return boolean Data
  const handleHighSimilarity = (similarityValue) => {
    if (similarityValue > 75) {
      setIsNextDisabled(false);
      console.log(`High similarity detected: ${similarityValue}%`);
    } else {
      setIsNextDisabled(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        {currentStep === 1 && (
          <FaceCameraDetector
            handleFaceData={handleFaceData}
            currentStep={currentStep}
          />
        )}
        {currentStep === 2 && (
          <FaceCameraDetector
            handleFaceData={handleFaceData}
            currentStep={currentStep}
          />
        )}

        {currentStep === 2 && (
          <AudioTest
            onMatchSuccess={(isMatched) => {
              setIsNextDisabled(!isMatched); // This will set to false when isMatched is true
              console.log("isMatched", isMatched);
            }}
          />
        )}
      </View>

      {currentStep === 3 && (
        <View>
          <TouchableOpacity style={styles.button} onPress={startLiveness}>
            <Text style={styles.buttonText}>Start Liveness</Text>
          </TouchableOpacity>

          {currentStep === 3 && (
            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              liveness: {liveness}
            </Text>
          )}
        </View>
      )}

      {currentStep === 4 && (
        <MatchImage
          image1={img1}
          image2={img2}
          image1Ref={image1Ref}
          image2Ref={image1Ref}
          onHighSimilarity={handleHighSimilarity}
        />
      )}

      {currentStep === 5 && (
        <Image
          source={require("../images/correct.png")}
          resizeMode="contain"
          style={{
            width: 200,
            height: 200,
            alignSelf: "center",
            marginBottom: 80,
          }}
        />
      )}
      {currentStep !== 2 && (
        <View
          style={{
            backgroundColor: "#FFB6D9",
            padding: 10,
            alignSelf: "center",
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 14, marginTop: 5, color: "black" }}>
            {currentStep === 0 &&
              "Ensure you are in a well-lit environment with a clear background. Position your face in the center of the camera frame."}
            {currentStep === 1 &&
              "Stay still and face the camera directly. Ensure your entire face is visible without obstructions."}

            {currentStep === 3 &&
              "Follow the instructions ( smile, or turn your head). Ensure smooth movements and real."}
            {currentStep === 4 &&
              "Comparing your live image with the registered image for verification. Please wait."}
            {currentStep === 5 &&
              "Verification successful! You have completed the process."}
          </Text>
        </View>
      )}

      <View style={{ height: 230 }}>
        <StepIndicator
          customStyles={getStepIndicatorStyles()}
          currentPosition={currentStep}
          labels={steps}
          stepCount={steps.length}
          direction="vertical"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "red" }]}
          onPress={handleReset}
          disabled={currentStep === 0}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>

        {currentStep !== 5 && (
          <TouchableOpacity
            style={[
              styles.button,
              (currentStep === steps.length - 1 || isNextDisabled) &&
                styles.disabledButton,
            ]}
            onPress={handleNextStep}
            disabled={currentStep === steps.length - 1 || isNextDisabled}
          >
            <Text style={styles.buttonText}>
              {currentStep === 0 ? "Start" : "Next"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 2,
    gap: 10,
    alignSelf: "center",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "blue",
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: "#A9A9A9",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default Progressing;
