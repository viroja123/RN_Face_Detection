import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import levenshtein from "fast-levenshtein";

const MATCH_THRESHOLD = 75;
const SUCCESS_THRESHOLD = 75; // Define a reasonable match percentage
const SAMPLE_SENTENCES = [
  "Good Morning How Are you!",
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with a dozen liquor jugs.",
  "The five boxing wizards jump quickly.",
  "The early bird catches the worm, but the second mouse gets the cheese.",
  "A journey of a thousand miles begins with a single step.",
  "All that glitters is not gold; all that wanders is not lost.",
  "Do not count your chickens before they are hatched.",
];

const AudioTest = ({ onMatchSuccess }) => {
  const [transcript, setTranscript] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [isMatched, setIsMatched] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

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
    getRandomSentence();
  }, []);

  const stopSpeechRecognition = useCallback(async () => {
    if (recognizing) {
      try {
        await ExpoSpeechRecognitionModule.stop();
        setRecognizing(false);
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

    const distance = levenshtein.get(
      spokenText.toLowerCase(),
      currentSentence.toLowerCase()
    );
    const maxLength = Math.max(spokenText.length, currentSentence.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    const roundedSimilarity = Number(similarity.toFixed(2));

    setMatchPercentage(roundedSimilarity);
    setIsMatched(roundedSimilarity >= MATCH_THRESHOLD);

    console.log("Speech match percentage:", roundedSimilarity);

    // Notify parent when match percentage is 75% or above
    if (roundedSimilarity >= MATCH_THRESHOLD) {
      console.log(
        "call the the match percentage-------------------",
        roundedSimilarity
      );
      onMatchSuccess?.(true);
    }
     else {
      console.log("no match 000000000000000000");
      onMatchSuccess?.(false);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech Recognition Error:", event.error, event.message);
  });

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
      await stopSpeechRecognition();
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

  const getRandomSentence = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_SENTENCES.length);
    setCurrentSentence(SAMPLE_SENTENCES[randomIndex]);
    setTranscript("");
    setMatchPercentage(0);
    setIsMatched(false);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sentenceTitle}>Please read aloud:</Text>
      <Text style={styles.sentenceTxt}>{currentSentence}</Text>
      <TouchableOpacity
        style={styles.newSentenceBtn}
        onPress={getRandomSentence}
      >
        <Text style={styles.btnText}>Get New Sentence</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row" }}>
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
          <Text
            style={[
              styles.resultTitle,
              matchPercentage >= SUCCESS_THRESHOLD ? styles.successText : null,
            ]}
          >
            Match: {matchPercentage}%
            {matchPercentage >= SUCCESS_THRESHOLD ? " ✓" : ""}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sentenceTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#555",
  },
  sentenceTxt: {
    fontSize: 16,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  newSentenceBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#7f8c8d",
    padding: 2,
    borderRadius: 4,
    marginVertical: 4,
  },
  recordBtn: {
    backgroundColor: "#3498db",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 30,
    width: "50%",
    alignSelf: "center",
  },
  recordingBtn: { backgroundColor: "#e74c3c" },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  successBtn: { backgroundColor: "#4BB543" },
  disabledBtn: { backgroundColor: "#cccccc" },
  successText: { color: "#4BB543", fontWeight: "bold" },
  resultContainer: {
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
});

export default AudioTest;
