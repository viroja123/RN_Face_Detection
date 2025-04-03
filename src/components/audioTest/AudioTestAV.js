// import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { Toast } from "toastify-react-native";
// import {
//   ExpoSpeechRecognitionModule,
//   useSpeechRecognitionEvent,
// } from "expo-speech-recognition";
// import levenshtein from "fast-levenshtein";
// import { Audio } from "expo-av";
// import {
//   AndroidAudioEncoder,
//   AndroidOutputFormat,
//   IOSOutputFormat,
// } from "expo-av/build/Audio";

// const MATCH_THRESHOLD = 75;
// const SUCCESS_THRESHOLD = 75; // Define a reasonable match percentage
// const SAMPLE_SENTENCES = [
//   "Good morning! How are you doing today? I hope you have a wonderful day ahead filled with joy, laughter, and success in everything you do!",
//   "The quick brown fox, feeling adventurous, jumped over the lazy dog and then ran swiftly across the vast green meadow under the bright golden sun.",
//   "Pack my box with a dozen liquor jugs, making sure each one is tightly sealed and arranged neatly so that they do not break during the long journey ahead.",
//   "The five boxing wizards, known for their incredible agility, jumped quickly across the arena, dodging attacks and displaying their impressive skills with great precision.",
//   "The early bird catches the worm, but the second mouse gets the cheese—this proves that patience and timing can sometimes be just as important as speed and eagerness.",
//   "A journey of a thousand miles begins with a single step, and every great achievement in life is the result of persistence, determination, and never giving up on your dreams.",
//   "All that glitters is not gold; all that wanders is not lost, for sometimes the most unexpected paths lead to the most beautiful and rewarding destinations in life.",
//   "Do not count your chickens before they are hatched, because life is full of surprises, and things do not always go according to plan—patience and careful planning are key.",
// ];

// const AudioTestAV = ({ onNextCall, isFaceDetected }) => {
//   const [transcript, setTranscript] = useState("");
//   const [currentSentence, setCurrentSentence] = useState("");
//   const [matchPercentage, setMatchPercentage] = useState(0);
//   const [isMatched, setIsMatched] = useState(false);
//   const [hasPermission, setHasPermission] = useState(false);
//   const [recognizing, setRecognizing] = useState(false);
//   const [recognizingExpoAv, setRecognizingExpoAv] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingUri, setRecordingUri] = useState();
//   const [genderResult, setGenderResult] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [avRecordingPlaying, setAvRecordingPlaying] = useState(false);
//   const [duration, setDuration] = useState(0);
//   const [alert, setAlert] = useState(false);

//   const recordingRef = useRef();
//   useEffect(() => {
//     (async () => {
//       try {
//         const { status } =
//           await ExpoSpeechRecognitionModule.requestPermissionsAsync();
//         setHasPermission(status === "granted");
//         if (status !== "granted") {
//           Alert.alert(
//             "Permission Denied",
//             "Please grant microphone permissions to use speech recognition"
//           );
//         }
//       } catch (error) {
//         console.error("Error requesting microphone permission:", error);
//         Alert.alert("Error", "Could not request microphone permission");
//       }
//     })();
//     getRandomSentence();
//   }, []);

//   useEffect(() => {
//     if (genderResult?.data?.genderTitle && genderResult?.statusCode === 200) {
//       onNextCall?.(true);
//     } else {
//       onNextCall?.(false);
//     }
//   }, [genderResult]);

//   const stopSpeechRecognition = useCallback(async () => {
//     if (recognizing) {
//       try {
//         await ExpoSpeechRecognitionModule.stop();
//         setRecognizing(false);
//       } catch (error) {
//         console.error("Error stopping speech recognition:", error);
//         // onMatchSuccess?.(false);
//       }
//     }
//   }, [recognizing]);

//   useSpeechRecognitionEvent("start", () => setRecognizing(true));
//   useSpeechRecognitionEvent("end", () => setRecognizing(false));
//   useSpeechRecognitionEvent("result", (event) => {
//     const spokenText = event.results[0]?.transcript || "";
//     setTranscript(spokenText);

//     const distance = levenshtein.get(
//       spokenText.toLowerCase(),
//       currentSentence.toLowerCase()
//     );
//     const maxLength = Math.max(spokenText.length, currentSentence.length);
//     const similarity = ((maxLength - distance) / maxLength) * 100;
//     const roundedSimilarity = Number(similarity.toFixed(2));

//     setMatchPercentage(roundedSimilarity);
//     setIsMatched(roundedSimilarity >= MATCH_THRESHOLD);

//     // Notify parent when match percentage is 75% or above
//     // if (roundedSimilarity >= MATCH_THRESHOLD) {
//     //   onMatchSuccess?.(true);
//     // } else {
//     //   onMatchSuccess?.(false);
//     // }
//   });

//   useSpeechRecognitionEvent("error", (event) => {
//     console.error("Speech Recognition Error:", event.error, event.message);
//   });

//   const startAudioRecording = async () => {
//     try {
//       if (recognizing) return;
//       const permission =
//         await ExpoSpeechRecognitionModule.requestPermissionsAsync();
//       console.log("permission", permission);
//       if (!permission.granted) {
//         Toast.error(`Permissions not granted`, "bottom");
//       }
//       const microphonePermissions =
//         await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
//       console.log("Microphone permissions", microphonePermissions);
//       if (!microphonePermissions.granted) {
//         Toast.error(
//           `Permissions not granted11 ${JSON.stringify(microphonePermissions)}`,
//           "bottom"
//         );
//         return;
//       }

//       ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync().then(
//         (result) => {
//           console.log("result", JSON.stringify(result));
//         }
//       );

//       ExpoSpeechRecognitionModule.start({
//         interimResults: true,
//         maxAlternatives: 3,
//         continuous: true,
//         requiresOnDeviceRecognition: false,
//         addsPunctuation: true,
//         contextualStrings: [
//           "expo-speech-recognition",
//           "Carlsen",
//           "Ian Nepomniachtchi",
//           "Praggnanandhaa",
//         ],
//         volumeChangeEventOptions: { enabled: false, intervalMillis: 300 },
//       });
//       setRecognizing(false); // Reset recognizing on failure
//     } catch (error) {
//       console.error("Speech Recognition Error:", error);
//       Toast.error(
//         error.message || "Could not start speech recognition.",
//         "bottom"
//       );

//       // onMatchSuccess?.(false);
//       setRecognizing(false);
//     }
//   };

//   const getRandomSentence = useCallback(() => {
//     // onMatchSuccess?.(false);
//     const randomIndex = Math.floor(Math.random() * SAMPLE_SENTENCES.length);
//     setCurrentSentence(SAMPLE_SENTENCES[randomIndex]);
//     setTranscript("");
//     setMatchPercentage(0);
//     setIsMatched(false);
//   }, []);

//   const startExpoAv = async () => {
//     try {
//       setDuration(0);
//       setRecognizingExpoAv(true);
//       // setIsRecording(true);
//       setTranscript("");
//       setRecordingUri(null);
//       if (recordingRef.current) {
//         await recordingRef.current.stopAndUnloadAsync();
//         recordingRef.current = null;
//       }

//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });

//       const { recording } = await Audio.Recording.createAsync({
//         isMeteringEnabled: true,
//         android: {
//           bitRate: 32000,
//           extension: ".m4a",
//           outputFormat: AndroidOutputFormat.MPEG_4,
//           audioEncoder: AndroidAudioEncoder.AAC,
//           numberOfChannels: 1,
//           sampleRate: 16000,
//         },
//         ios: {
//           ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
//           numberOfChannels: 1,
//           bitRate: 16000,
//           extension: ".wav",
//           outputFormat: IOSOutputFormat.LINEARPCM,
//         },
//         web: {
//           mimeType: "audio/wav",
//           bitsPerSecond: 128000,
//         },
//       });

//       // Store recording reference
//       recordingRef.current = recording;
//       // setRecognizingExpoAv(false);

//       // Start Speech Recognition
//     } catch (error) {
//       console.error("Recording Error:", error);
//       Toast.error("Could not start recording", "bottom");
//       setIsRecording(false);
//       setRecognizingExpoAv(false);
//       onMatchSuccess?.(false);
//     }
//   };
//   const stopExpoAv = async () => {
//     try {
//       // Stop Speech Recognition
//       await ExpoSpeechRecognitionModule.stop();

//       const recording = recordingRef.current;
//       if (recording) {
//         const s = await recording.getStatusAsync();
//         await recording.stopAndUnloadAsync();
//         const uri = recording.getURI();
//         console.log("Audio Recording URI:", uri);
//         const durationSeconds = (s?.durationMillis / 1000).toFixed(2);
//         setDuration(durationSeconds);

//         // Store the recording URI
//         setRecordingUri(uri);

//         // Clear the recording reference
//         recordingRef.current = null;
//       }

//       setRecognizingExpoAv(false);
//       // Reset states
//       setIsRecording(false);
//     } catch (error) {
//       console.error("Stop Recording Error:", error);
//       Toast.error("Error stopping recording", "bottom");
//     }
//   };

//   const playExpoAv = async () => {
//     try {
//       if (avRecordingPlaying) {
//         console.log("call the ");
//         stopExpoAv();
//       }
//       setAvRecordingPlaying(true);
//       await Audio.Sound.createAsync(
//         { uri: recordingUri },
//         { shouldPlay: true }
//       ).catch((reason) => {
//         console.error("Error playing audio AV playExpoAv function:", reason);
//         setAvRecordingPlaying(false);
//       });
//     } catch (error) {
//       setAvRecordingPlaying(false);
//     }
//   };

//   const getGender = async () => {
//     try {
//       if (duration <= 4) {
//         console.log("less than 4", duration);
//         setAlert(true);
//         return;
//       }
//       setAlert(false);
//       setIsLoading(true);
//       const url = "https://voice-gender-recognition.p.rapidapi.com/api/gender";

//       const data = new FormData();
//       data.append("sound", {
//         uri: recordingUri,
//         type: "audio/m4a",
//         name: "recording.m4a",
//       });

//       const options = {
//         method: "POST",
//         headers: {
//           "x-rapidapi-key":
//             "d856dffa18msh530f78e89174beep16b8c3jsn60d8a2a32cb0",
//           "x-rapidapi-host": "voice-gender-recognition.p.rapidapi.com",
//         },
//         body: data,
//       };

//       const response = await fetch(url, options);
//       const result = await response.json();

//       setGenderResult(result);

//       if (genderResult?.data?.genderTitle && genderResult?.statusCode == 200) {
//         onNextCall?.(true);
//       } else {
//         onNextCall?.(false);
//       }
//       setIsLoading(false);
//     } catch (error) {
//       setIsLoading(false);
//       console.error("Error detecting gender from voice:", error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {alert && (
//         <Text style={[styles.instruction, { color: alert ? "red" : "#333" }]}>
//           Please speak continuously for **more than 3 seconds** but **less than
//           1 minute**.
//         </Text>
//       )}
//       <View style={styles.subContainer}>
//         <Text style={styles.libraryText}>Expo AV:</Text>
//         <Text style={styles.sentenceTitle}>Please read aloud:</Text>
//         <Text style={styles.sentenceTxt}>{currentSentence}</Text>
//         <TouchableOpacity
//           style={styles.newSentenceBtn}
//           onPress={getRandomSentence}
//         >
//           <Text style={styles.btnText}>Get New Sentence</Text>
//         </TouchableOpacity>
//         <Text style={styles.sentenceTitle}>
//           test the gender from your audio please read the above sentence :
//         </Text>
//         <TouchableOpacity
//           style={[
//             styles.recordBtn,
//             recognizingExpoAv ? styles.recordingBtn : null,
//             { marginVertical: 6 },
//           ]}
//           onPress={recognizingExpoAv ? stopExpoAv : startExpoAv}
//         >
//           <Text style={styles.btnText}>
//             {recognizingExpoAv
//               ? "Stop Recording ExpoAV"
//               : "Start Recording ExpoAV"}
//           </Text>
//         </TouchableOpacity>
//         {/* {recordingUri && <Text>File :{recordingUri}</Text>} */}
//         {recordingUri && (
//           <View
//             style={{
//               flexDirection: "row",
//               marginVertical: 4,
//               alignSelf: "center",
//             }}
//           >
//             <TouchableOpacity
//               style={[
//                 styles.recordBtn,
//                 {
//                   backgroundColor: avRecordingPlaying ? "red" : "#3498db",
//                   width: "40%",
//                   marginRight: 10,
//                 },
//               ]}
//               onPress={playExpoAv}
//             >
//               <Text style={styles.btnText}>{"Play"}</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.recordBtn, { width: "40%" }]}
//               onPress={getGender}
//             >
//               <Text style={styles.btnText}>Test Gender</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//         <Text>Seconds: {duration}</Text>
//         <Text style={[styles.libraryText, { textAlign: "center" }]}>
//           {isLoading
//             ? "Processing..."
//             : `Gender: ${genderResult?.data?.genderTitle || "Unknown"}`}
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { backgroundColor: "#f5f5f5", marginBottom: 4 },
//   sentenceTitle: {
//     fontSize: 14,
//     fontWeight: "400",
//     color: "#555",
//     marginBottom: 2,
//   },
//   subContainer: {
//     paddingHorizontal: 15,
//     paddingVertical: 2,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sentenceTxt: {
//     fontSize: 16,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     borderLeftWidth: 4,
//     borderLeftColor: "#3498db",
//     backgroundColor: "#555",
//     color: "white",
//     fontWeight: "500",
//   },
//   newSentenceBtn: {
//     alignSelf: "flex-end",
//     backgroundColor: "#7f8c8d",
//     padding: 2,
//     borderRadius: 4,
//     marginVertical: 2,
//   },
//   recordBtn: {
//     backgroundColor: "#3498db",
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 30,
//     width: "50%",
//     alignSelf: "center",
//   },
//   recordingBtn: { backgroundColor: "#e74c3c" },
//   btnText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   successBtn: { backgroundColor: "#4BB543" },
//   disabledBtn: { backgroundColor: "#cccccc" },
//   successText: { color: "#4BB543", fontWeight: "bold" },
//   resultContainer: {
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     marginTop: 4,
//   },
//   libraryText: {
//     fontSize: 18,
//     color: "#555",
//     fontWeight: "bold",
//   },
//   instruction: {
//     fontSize: 14,
//     textAlign: "center",
//     color: "#333",
//     fontWeight: "bold",
//   },
// });

// export default AudioTestAV;

import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import React, { Component } from "react";
import {
  Alert,
  PermissionsAndroid,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// import { GCanvasView } from "@flyskywhy/react-native-gcanvas";
// if (Platform.OS !== "web") {
//   var { PERMISSIONS, request } = require("react-native-permissions").default;
// }
import LiveAudioStream, {
  PowerLevel,
  NativeRecordReceivePCM,
  WaveSurferView,
  FrequencyHistogramView,
} from "react-native-live-audio-fft";
import { Buffer } from "buffer";
global.Buffer = Buffer;

const optionsOfLiveAudioStream = {
  sampleRate: 32000, // default is 44100 but 32000 is adequate for accurate voice recognition, maybe even music
  channels: 1, // 1 or 2, default 1
  bitsPerSample: 16, // 8 or 16, default 16
  audioSource: 1, // android only, 1 for music, 6 for voice recognition, default is 6
  bufferSize: 1024, // default is 2048
};

const histogramSetScale = 1; // if is not 1, e.g. PixelRatio.get(), you should define devicePixelRatio of <GCanvasView/> (see below)

const histogramSet = {
  // canvas, // e.g. https://github.com/flyskywhy/react-native-gcanvas
  // ctx,
  width: 100, // if canvas is not defined, at least must define width and height
  height: 100, // if canvas is defined, it is allowed to not define width and height
  scale: histogramSetScale, // if histogramSetScale is 1, you can remove this line because default is 1
  asyncFftAtFps: false, // default is true, if you want draw on every onAudioPcmData(), you should set it to false
  lineCount: 20,
  minHeight: 1,
  stripeEnable: false,
};

const histogram = FrequencyHistogramView(histogramSet);

const waveSurferWidth = 300;
const waveSurferHeight = 100;

export default class AudioTestAV extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasOc1: false,
      detectedGender: "unknown",
    };

    console.log("this.props", this.props);

    // Initialize histogram here
    this.canvas = null;
    LiveAudioStream.on("data", this.onAudioPcmData);
  }

  async componentDidMount() {
    try {
      if (this.state.detectedGender === "unknown") {
        this.props.onNextCall(false);
      }

      const { status } =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      // setHasPermission(status === "granted");
      console.log("status------------>", status);
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
    if (Platform.OS === "web") {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target.id === "canvasExample") {
            let { width, height } = entry.contentRect;
            this.onCanvasResize({ width, height, canvas: entry.target });
          }
        }
      });
      resizeObserver.observe(document.getElementById("canvasExample"));
    }
  }

  initCanvas = (canvas) => {
    if (this.canvas) {
      return;
    }
    console.log("canvas", canvas);
    this.canvas = canvas;
    if (Platform.OS === "web") {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
    }

    this.ctx = this.canvas.getContext("2d");

    const offscreenCanvas = document.createElement("canvas");
    const offscreenCanvasCtx = offscreenCanvas.getContext("2d");

    const waveSurferSet = {
      canvas: this.canvas,
      ctx: this.ctx,
      canvas2: offscreenCanvas,
      ctx2: offscreenCanvasCtx,
      fps: 10,
      duration: 2000, // move speed, smaller is faster
    };
    this.waveSurfer = WaveSurferView(waveSurferSet);
  };

  onCanvasResize = ({ width, height, canvas }) => {
    canvas.width = width;
    canvas.height = height;

    this.waveSurfer.set.width = width;
    this.waveSurfer.set.height = height;
  };

  onAudioPcmData = (pcmDataBase64) => {
    const { pcmData, sum } = NativeRecordReceivePCM(pcmDataBase64);

    const powerLevel = PowerLevel(sum, pcmData.length);
    console.log("powerLevel", powerLevel);
    const frequencyData = histogram.input(
      pcmData,
      0 /* powerLevel, useless in histogram */,
      optionsOfLiveAudioStream.sampleRate
    );
    // console.log("frequencyData", frequencyData);

    if (histogram.set.asyncFftAtFps === false) {
      if (histogram.set.canvas) {
        histogram.draw(frequencyData, optionsOfLiveAudioStream.sampleRate);
      } else if (histogram.set.width && histogram.set.height) {
        const { lastH, stripesH, originY, heightY, frequencies, gender } =
          histogram.frequencyData2H({
            frequencyData,
            sampleRate: optionsOfLiveAudioStream.sampleRate,
          });
        if (gender !== this.state.detectedGender) {
          this.setState({ detectedGender: gender }, () => {
            // Call onNextCall only if gender is detected (not "unknown")
            if (this.props.onNextCall) {
              console.log("gender-------------------", gender);
              this.props.onNextCall(gender !== "unknown");
            }
          });
        }
        // else if (gender === "" && this.props.onNextCall) {
        //   this.props.onNextCall(false);
        // }
      }
    }
  };

  startAudioRecoder = async () => {
    console.log("start--------------");
    LiveAudioStream.stop();
    LiveAudioStream.init(optionsOfLiveAudioStream);
    console.log("after init");
    LiveAudioStream.start();
  };

  stopAudioRecorder = () => {
    console.log("call the stop");
    LiveAudioStream.stop();
  };
  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={this.startAudioRecoder}
          style={{
            backgroundColor: "#00FF00",
            borderRadius: 10,
            marginVertical: 10,
          }}
        >
          <Text style={styles.welcome}>Start audio recoder</Text>
        </TouchableOpacity>
        <View
          style={{
            backgroundColor: "#FF000030",
          }}
        >
          <Text>Gender : {this.state.detectedGender}</Text>
        </View>
        <TouchableOpacity
          onPress={this.stopAudioRecorder}
          style={{
            backgroundColor: "#FF0001",
            borderRadius: 10,
            marginVertical: 10,
          }}
        >
          <Text style={styles.welcome}>Stop audio recoder</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  gcanvas: {
    flex: 1,
    width: "100%",
  },
  welcome: {
    color: "black",
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
});
