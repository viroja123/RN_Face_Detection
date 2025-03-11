import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Button,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  Platform,
  NativeEventEmitter,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import * as RNFS from "react-native-fs";
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

const FaceLiveness = ({ navigation }) => {
  const [img1, setImg1] = useState(require("../../images/portrait.png"));
  const [img2, setImg2] = useState(require("../../images/portrait.png"));
  const [similarity, setSimilarity] = useState("nil");
  const [liveness, setLiveness] = useState("nil");
  // let image1 = new MatchFacesImage();
  // let image2 = new MatchFacesImage();
  const image1Ref = useRef(new MatchFacesImage());
  const image2Ref = useRef(new MatchFacesImage());

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

  const pickImage = (first) => {
    Alert.alert(
      "Select option",
      "",
      [
        {
          text: "Use gallery",
          onPress: () =>
            launchImageLibrary(
              {
                mediaType: "photo",
                selectionLimit: 1,
                includeBase64: true,
              },
              (response) => {
                if (!response.assets) return;
                setImage(
                  first,
                  response.assets[0].base64,
                  Enum.ImageType.PRINTED
                );
              }
            ),
        },
        {
          text: "Use camera",
          onPress: () =>
            FaceSDK.startFaceCapture(
              null,
              (json) => {
                // console.log("json", JSON.stringify(json));
                const response = FaceCaptureResponse.fromJson(JSON.parse(json));
                console.log("response", JSON.stringify(response), "-");
                if (response.image?.image) {
                  setImage(first, response.image.image, Enum.ImageType.LIVE);
                }
              },
              () => {}
            ),
        },
      ],
      { cancelable: true }
    );
  };

  const setImage = (first, base64, type) => {
    if (!base64) return;
    setSimilarity("null");
    if (first) {
      // Create a new MatchFacesImage and update the ref
      image1Ref.current = new MatchFacesImage();
      image1Ref.current.image = base64;
      image1Ref.current.imageType = type;
      setImg1({ uri: `data:image/png;base64,${base64}` });
      setLiveness("null");
    } else {
      // Create a new MatchFacesImage and update the ref
      image2Ref.current = new MatchFacesImage();
      image2Ref.current.image = base64;
      image2Ref.current.imageType = type;
      setImg2({ uri: `data:image/png;base64,${base64}` });
    }
  };

  const checkAudio = () => {
    navigation.navigate("AudioVerification");
  };

  const clearResults = () => {
    setImg1(require("../../images/portrait.png"));
    setImg2(require("../../images/portrait.png"));
    setSimilarity("null");
    setLiveness("null");
    image1Ref.current = new MatchFacesImage();
    image2Ref.current = new MatchFacesImage();
  };

  const matchFaces = () => {
    const image1 = image1Ref.current;
    const image2 = image2Ref.current;
    if (
      image1 == null ||
      image1.image == null ||
      image1.image == "" ||
      image2 == null ||
      image2.image == null ||
      image2.image == ""
    )
      return;
    setSimilarity("Processing...");
    const request = new MatchFacesRequest();
    request.images = [image1, image2];
    FaceSDK.matchFaces(
      request,
      null,
      (json) => {
        const response = MatchFacesResponse.fromJson(JSON.parse(json));
        FaceSDK.splitComparedFaces(
          response.results,
          0.75,
          (str) => {
            const split = ComparedFacesSplit.fromJson(JSON.parse(str));
            setSimilarity(
              split.matchedFaces.length > 0
                ? `${(split.matchedFaces[0].similarity * 100).toFixed(2)}%`
                : "error"
            );
          },
          setSimilarity
        );
      },
      setSimilarity
    );
  };

  const startLiveness = () => {
    FaceSDK.startLiveness(
      { skipStep: [LivenessSkipStep.ONBOARDING_STEP] },
      (json) => {
        const response = LivenessResponse.fromJson(JSON.parse(json));
        if (response.image) {
          setImage(true, response.image, Enum.ImageType.LIVE);
          setLiveness(
            response.liveness === Enum.LivenessStatus.PASSED
              ? "passed"
              : "unknown"
          );
        }
      },
      () => {}
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 15 }}>
        <TouchableOpacity
          onPress={() => pickImage(true)}
          style={{ alignItems: "center" }}
        >
          <Image
            source={img1}
            resizeMode="contain"
            style={{ height: 150, width: 150 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => pickImage(false)}
          style={{ alignItems: "center" }}
        >
          <Image
            source={img2}
            resizeMode="contain"
            style={{ height: 150, width: 200 }}
          />
        </TouchableOpacity>
      </View>

      <View style={{ width: "100%", alignItems: "center" }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#4285F4",
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            width: 140,
          }}
          onPress={matchFaces}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
          >
            Match
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#4285F4",
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            width: 140,
          }}
          onPress={startLiveness}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
          >
            Liveness
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#4285F4",
            padding: 10,
            borderRadius: 5,
            width: 140,
          }}
          onPress={clearResults}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
          >
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", padding: 10 }}>
        <Text>Similarity: {similarity}</Text>
        <View style={{ padding: 10 }} />
        <Text>Liveness: {liveness}</Text>
      </View>

      <View>
        <TouchableOpacity
          style={{
            backgroundColor: "#4285F4",
            padding: 10,
            borderRadius: 5,
            alignItems: "center",
            width: 140,
          }}
          onPress={checkAudio}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
          >
            Audio Check
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
});

export default FaceLiveness;
