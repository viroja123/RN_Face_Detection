import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

// Array of random sentences for users to read
const SAMPLE_SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "How vexingly quick daft zebras jump!",
  "Pack my box with five dozen liquor jugs.",
  "Amazingly few discotheques provide jukeboxes.",
  "The five boxing wizards jump quickly.",
  "Sphinx of black quartz, judge my vow.",
  "The early bird catches the worm, but the second mouse gets the cheese.",
  "A journey of a thousand miles begins with a single step.",
  "All that glitters is not gold; all that wanders is not lost.",
  "Do not count your chickens before they are hatched.",
];

const SpeechToTextScreen = () => {
  const [recording, setRecording] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    // Set a random sentence when component mounts
    getRandomSentence();
  }, []);

  const getRandomSentence = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_SENTENCES.length);
    setCurrentSentence(SAMPLE_SENTENCES[randomIndex]);
  };

  const startAudioRecording = async () => {
    try {
      setTranscript("");
      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopAudioRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
  };

  const getNewSentence = () => {
    getRandomSentence();
    setTranscript("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speech Recognition Test</Text>

      <View style={styles.sentenceContainer}>
        <Text style={styles.sentenceTitle}>Please read aloud:</Text>
        <Text style={styles.sentenceTxt}>{currentSentence}</Text>
        <TouchableOpacity
          style={styles.newSentenceBtn}
          onPress={getNewSentence}
        >
          <Text style={styles.btnText}>Get New Sentence</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.recordBtn, recording ? styles.recordingBtn : null]}
      >
        <Text style={styles.btnText}>
          {recording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>

      {transcript ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Your speech:</Text>
          <ScrollView style={styles.transcriptScroll}>
            <Text style={styles.transcriptTxt}>{transcript}</Text>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    margin: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
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
    lineHeight: 24,
    color: "#1a1a1a",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  newSentenceBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#7f8c8d",
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  recordingBtn: {
    backgroundColor: "#e74c3c",
  },
  disabledBtn: {
    backgroundColor: "#95a5a6",
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    width: "100%",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#555",
  },
  transcriptScroll: {
    maxHeight: 120,
  },
  transcriptTxt: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
  },
  accuracyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
  },
  accuracyTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 10,
    color: "#555",
  },
  accuracyValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  highAccuracy: {
    color: "#27ae60",
  },
  mediumAccuracy: {
    color: "#f39c12",
  },
  lowAccuracy: {
    color: "#e74c3c",
  },
});

export default SpeechToTextScreen;
