import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import levenshtein from "fast-levenshtein";

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

const MATCH_THRESHOLD = 8;

const SpeechToTextScreen = () => {
  const [transcript, setTranscript] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [isMatched, setIsMatched] = useState();
  const [hasPermission, setHasPermission] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  // Function to get a random sentence
  const getRandomSentence = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_SENTENCES.length);
    setCurrentSentence(SAMPLE_SENTENCES[randomIndex]);
    setTranscript("");
    setMatchPercentage(0);
    setIsMatched(false);
  }, []);

  // Request Microphone Permissions on Mount
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

  // Stop Speech Recognition
  const stopSpeechRecognition = useCallback(async () => {
    if (recognizing) {
      try {
        await ExpoSpeechRecognitionModule.stop();
        setRecognizing(false);
        setTranscript("");
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
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech Recognition Error:", event.error, event.message);
  });

  // Start Speech Recognition
  const startAudioRecording = async () => {
    if (recognizing) return;
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissions Required",
          "Speech recognition permissions are necessary."
        );
        return;
      }

      await stopSpeechRecognition(); // Stop any existing recognition
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speech Recognition Test</Text>

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

      <TouchableOpacity
        style={[styles.recordBtn, recognizing ? styles.recordingBtn : null]}
        onPress={recognizing ? stopSpeechRecognition : startAudioRecording}
        disabled={!hasPermission}
      >
        <Text style={styles.btnText}>
          {recognizing ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Your speech:</Text>
        <Text style={[styles.resultTitle]}>Match: {matchPercentage}%</Text>

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
    padding: 15,
    borderRadius: 8,
    width: "100%",
    marginBottom: 20,
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
    marginBottom: 20,
  },
  recordingBtn: { backgroundColor: "#e74c3c" },
  btnText: { color: "white", fontSize: 16, fontWeight: "bold" },
  resultContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    width: "100%",
  },
  transcriptScroll: {
    padding: 10,
    backgroundColor: "#D3D3D3",
    borderRadius: 8,
  },
});

export default SpeechToTextScreen;
