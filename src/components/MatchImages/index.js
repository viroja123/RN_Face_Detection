import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState, useEffect } from "react";
import FaceSDK, {
  MatchFacesResponse,
  MatchFacesRequest,
  MatchFacesImage,
  ComparedFacesSplit,
  Enum,
} from "@regulaforensics/react-native-face-api";
import RNFS from "react-native-fs";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MatchImage = ({
  image1,
  image2,
  image1Ref,
  image2Ref,
  onHighSimilarity,
  currentStep,
}) => {
  const [similarity, setSimilarity] = useState("nil");
  const [similarityValue, setSimilarityValue] = useState(0);
  const [image1Gender, setImage1Gender] = useState(null);
  const [image2Gender, setImage2Gender] = useState(null);

  // Use useEffect to call the parent function when similarity changes
  useEffect(() => {
    if (similarityValue > 75) {
      console.log("High similarity detected:", similarityValue);
      onHighSimilarity && onHighSimilarity(similarityValue);
    }
    if (similarity === "nil") {
      onHighSimilarity && onHighSimilarity(0);
    }
  }, [similarityValue, onHighSimilarity, similarity]);

  useEffect(() => {
    const fetchImageGender = async () => {
      setTimeout(async () => {
        if (currentStep === 4) {
          const image1Data = await AsyncStorage.getItem(
            "Image1GenderLabelName"
          );
          const image2Data = await AsyncStorage.getItem(
            "Image2GenderLabelName"
          );
          if (image1Data && image2Data) {
            setImage1Gender(image1Data);
            setImage2Gender(image2Data);
          }
        }
      }, 1500);
    };
    fetchImageGender();
  }, [currentStep]);

  const startMatchImages = async () => {
    try {
      console.log("Start Matching Images");

      if (!image1 || !image2) {
        console.error("Error: One or both images are missing!");
        setSimilarity("Error: Missing images");
        return;
      }

      console.log("Both images exist, processing...");
      setSimilarity("Processing...");

      let matchImage1 = new MatchFacesImage();
      let matchImage2 = new MatchFacesImage();

      if (image1Ref && image1Ref.current && image1Ref.current.image) {
        console.log("Using image1Ref directly");
        matchImage1 = image1Ref.current;
      } else if (
        image1.uri &&
        image1.uri.startsWith("data:image/png;base64,")
      ) {
        matchImage1.image = image1.uri.split(",")[1];
        matchImage1.imageType = Enum.ImageType.LIVE;
      } else {
        console.error("Invalid image1 format");
        setSimilarity("Invalid image1 format");
        return;
      }

      if (image2Ref && image2Ref.current && image2Ref.current.image) {
        matchImage2.image = await RNFS.readFile(image2.uri, "base64");
        matchImage2.imageType = Enum.ImageType.PRINTED;
      } else if (image2.uri) {
        try {
          if (!image2.uri.startsWith("data:")) {
            matchImage2.image = await RNFS.readFile(image2.uri, "base64");
            console.log(
              "Read image2 from file:",
              image2.uri,
              matchImage2.image
            );
          } else if (image2.uri.startsWith("data:image/png;base64,")) {
            matchImage2.image = image2.uri.split(",")[1];
            console.log("Extracted base64 from image2 URI");
          }
        } catch (readError) {
          console.error("Error reading image2 file:", readError);
          setSimilarity("Error reading image2 file");
          return;
        }
      } else {
        console.error("Invalid image2 format");
        setSimilarity("Invalid image2 format");
        return;
      }

      console.log(
        "Image1 base64 length:",
        matchImage1.image ? matchImage1.image.length : "undefined"
      );
      console.log(
        "Image2 base64 length:",
        matchImage2.image ? matchImage2.image.length : "undefined"
      );

      if (!matchImage1.image || !matchImage2.image) {
        console.error("One or both images have no base64 data");
        setSimilarity("Invalid image data");
        return;
      }

      const request = new MatchFacesRequest();
      request.images = [matchImage1, matchImage2];

      console.log("Sending match request...");

      FaceSDK.matchFaces(
        request,
        null,
        (json) => {
          console.log("MatchFaces response received");
          const response = MatchFacesResponse.fromJson(JSON.parse(json));
          if (!response.results || response.results.length === 0) {
            console.error("No match results returned");
            setSimilarity("No match results");
            return;
          }

          FaceSDK.splitComparedFaces(
            response.results,
            0.75,
            (str) => {
              const split = ComparedFacesSplit.fromJson(JSON.parse(str));
              if (split.matchedFaces && split.matchedFaces.length > 0) {
                const similarityResult = (
                  split.matchedFaces[0].similarity * 100
                ).toFixed(2);
                setSimilarity(`${similarityResult}%`);
                setSimilarityValue(parseFloat(similarityResult));
                if (similarityResult > 75) {
                  onHighSimilarity(similarityResult);
                }
              } else {
                setSimilarity("No match found");
                setSimilarityValue(0);
              }
            },
            (splitError) => {
              console.error("Face split error:", splitError);
              setSimilarity("Error processing match results");
            }
          );
        },
        (matchError) => {
          console.error("Face matching error:", matchError);
          setSimilarity("Error matching faces");
        }
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      setSimilarity("Unexpected error occurred");
    }
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignSelf: "center" }}>
        {image1 ? (
          <View style={{ borderRadius: 20 }}>
            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              Liveness:
            </Text>
            <Image
              source={image1.uri ? { uri: image1.uri } : image1}
              resizeMode="contain"
              style={{ height: 150, width: 150, borderRadius: 10 }}
            />
            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              Gender : {image1Gender}
            </Text>
          </View>
        ) : (
          <View
            style={{
              height: 150,
              width: 150,
              backgroundColor: "#ddd",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>No image 1</Text>
          </View>
        )}

        {image2 ? (
          <View style={{ borderRadius: 20 }}>
            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              Face :
            </Text>
            <Image
              source={image2.uri ? { uri: image2.uri } : image2}
              resizeMode="contain"
              style={{
                height: 150,
                width: 150,
                transform: [{ rotate: "270deg" }],
              }}
            />
            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              Gender : {image2Gender}
            </Text>
          </View>
        ) : (
          <View
            style={{
              height: 150,
              width: 150,
              backgroundColor: "#ddd",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>No image 2</Text>
          </View>
        )}
      </View>
      <View style={{ alignSelf: "center", marginTop: 10 }}>
        <TouchableOpacity style={styles.button} onPress={startMatchImages}>
          <Text style={styles.buttonText}>Start Match Images</Text>
        </TouchableOpacity>
      </View>
      <Text
        style={{ textAlign: "center", fontWeight: "bold", marginVertical: 10 }}
      >
        Similarity: {similarity}
      </Text>
    </View>
  );
};

export default MatchImage;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "blue",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
