import axios from "axios";
import * as FileSystem from "expo-file-system";

const useFaceVerification = async (imageUri) => {
  try {
    if (!imageUri) {
      throw new Error("Image URI is required for verification.");
    }

    const apiKey = "AIzaSyAgnWKSSOz0_yx0LSgTNhLJGMLs5fepK9o"; // Replace with env variable in production
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    // Convert the image to Base64
    const base64ImageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const requestData = {
      requests: [
        {
          image: {
            content: base64ImageData,
          },
          features: [{ type: "FACE_DETECTION", maxResults: 5 }], // Changed to FACE_DETECTION
        },
      ],
    };

    // Send request to Google Vision API
    const response = await axios.post(apiUrl, requestData, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data; // Return response for further handling
  } catch (error) {
    console.error("Face verification error:", error);
    return null;
  }
};

export default useFaceVerification;
