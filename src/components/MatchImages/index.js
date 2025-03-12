import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import FaceSDK, {
  MatchFacesResponse,
  MatchFacesRequest,
  ComparedFacesSplit,
} from "@regulaforensics/react-native-face-api";

const MatchImage = ({
  image1,
  image2,
  image1Ref,
  image2Ref,
  onHighSimilarity,
}) => {
  const [similarity, setSimilarity] = useState("nil");
  const [similarityValue, setSimilarityValue] = useState(0);

  // Use useEffect to call the parent function when similarity changes
  useEffect(() => {
    if (similarityValue > 75) {
      console.log("call the similarty function0000000000000000");
      // Call the parent function if similarity is greater than 75%
      onHighSimilarity && onHighSimilarity(similarityValue);
    }
  }, [similarityValue, onHighSimilarity]);

  const startMatchImages = () => {
    console.log("Start Matching Images");
    if (!image1Ref.current.image && !image2Ref.current.image) {
      Alert.alert("Retry the All step");
      onHighSimilarity(0);
    }

    console.log("Image1Ref:", image1Ref.current.image ? "Exists" : "Null");
    console.log("Image2Ref:", image2Ref.current.image ? "Exists" : "Null");

    if (!image1Ref.current.image || !image2Ref.current.image) {
      console.error("Missing images for comparison!");
      return;
    }

    const image1 = image1Ref.current;
    const image2 = image2Ref.current;
    if ((image1, image2)) {
      console.log("images image exist");
    }
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
    console.log("request", request);
    request.images = [image1, image2];
    console.log("request", request);
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

  return (
    <View>
      <View style={{ flexDirection: "row", alignSelf: "center" }}>
        {image1 ? (
          <View style={{ borderRadius: 20 }}>
            <Image
              source={image1}
              resizeMode="contain"
              style={{ height: 150, width: 150, borderRadius: 10 }}
            />
          </View>
        ) : (
          <View style={{ height: 150, width: 150, backgroundColor: "#ddd" }}>
            <Text>No image 1</Text>
          </View>
        )}

        {image2 ? (
          <View style={{ borderRadius: 20 }}>
            <Image
              source={image2}
              resizeMode="contain"
              style={{ height: 150, width: 150 }}
            />
          </View>
        ) : (
          <View style={{ height: 150, width: 150, backgroundColor: "#ddd" }}>
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
        Similarity : {similarity}
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
