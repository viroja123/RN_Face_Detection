import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Toast } from "toastify-react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import levenshtein from "fast-levenshtein";

const MATCH_THRESHOLD = 75;
const SUCCESS_THRESHOLD = 75; // Define a reasonable match percentage
const SAMPLE_SENTENCES = [
  "Good Morning How Are you!",
  "Pack my box with a jugs.",
  "The five boxing wizards jump quickly.",
  "The early bird catches the worm",
  "A journey of a thousand miles",
  "All that glitters is not gold",
  "The red panda had a party",
];

const AudioTest = ({ onMatchSuccess, isFaceDetected }) => {
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
        onMatchSuccess?.(false);
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

    // Notify parent when match percentage is 75% or above
    if (roundedSimilarity >= MATCH_THRESHOLD) {
      onMatchSuccess?.(true);
    } else {
      onMatchSuccess?.(false);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech Recognition Error:", event.error, event.message);
  });

  const startAudioRecording = async () => {
    try {
      if (recognizing) return;
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log("permission", permission);
      if (!permission.granted) {
        Toast.error(`Permissions not granted`, "bottom");
      }
      const microphonePermissions =
        await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      console.log("Microphone permissions", microphonePermissions);
      if (!microphonePermissions.granted) {
        Toast.error(
          `Permissions not granted11 ${JSON.stringify(microphonePermissions)}`,
          "bottom"
        );
        return;
      }

      ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync().then(
        (result) => {
          console.log("result", JSON.stringify(result));
        }
      );

      ExpoSpeechRecognitionModule.start({
        interimResults: true,
        maxAlternatives: 3,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: [
          "expo-speech-recognition",
          "Carlsen",
          "Ian Nepomniachtchi",
          "Praggnanandhaa",
        ],
        volumeChangeEventOptions: { enabled: false, intervalMillis: 300 },
      });
      setRecognizing(false); // Reset recognizing on failure
    } catch (error) {
      console.error("Speech Recognition Error:", error);
      Toast.error(
        error.message || "Could not start speech recognition.",
        "bottom"
      );

      onMatchSuccess?.(false);
      setRecognizing(false);
    }
  };

  const getRandomSentence = useCallback(() => {
    onMatchSuccess?.(false);
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
          disabled={!isFaceDetected}
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
    fontSize: 14,
    fontWeight: "400",
    color: "#555",
  },
  sentenceTxt: {
    fontSize: 16,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
    backgroundColor: "#555",
    color: "white",
    fontWeight: "500",
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

// import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
// import React, { Component } from "react";
// import {
//   Alert,
//   PermissionsAndroid,
//   PixelRatio,
//   Platform,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// // import { GCanvasView } from "@flyskywhy/react-native-gcanvas";
// // if (Platform.OS !== "web") {
// //   var { PERMISSIONS, request } = require("react-native-permissions").default;
// // }
// import LiveAudioStream, {
//   PowerLevel,
//   NativeRecordReceivePCM,
//   WaveSurferView,
//   FrequencyHistogramView,
// } from "react-native-live-audio-fft";
// import { Buffer } from "buffer";
// import { GCanvasView } from "@flyskywhy/react-native-gcanvas";
// global.Buffer = Buffer;

// const optionsOfLiveAudioStream = {
//   sampleRate: 32000, // default is 44100 but 32000 is adequate for accurate voice recognition, maybe even music
//   channels: 1, // 1 or 2, default 1
//   bitsPerSample: 16, // 8 or 16, default 16
//   audioSource: 1, // android only, 1 for music, 6 for voice recognition, default is 6
//   bufferSize: 1024, // default is 2048
// };

// const histogramSetScale = 1; // if is not 1, e.g. PixelRatio.get(), you should define devicePixelRatio of <GCanvasView/> (see below)

// // ref to initWaveStore() in
// // https://github.com/xiangyuecn/Recorder/blob/master/app-support-sample/index.html
// const histogramSet = {
//   // canvas, // e.g. https://github.com/flyskywhy/react-native-gcanvas
//   // ctx,
//   width: 100, // if canvas is not defined, at least must define width and height
//   height: 100, // if canvas is defined, it is allowed to not define width and height
//   scale: histogramSetScale, // if histogramSetScale is 1, you can remove this line because default is 1
//   asyncFftAtFps: false, // default is true, if you want draw on every onAudioPcmData(), you should set it to false
//   lineCount: 20,
//   minHeight: 1,
//   stripeEnable: false,
// };

// const histogram = FrequencyHistogramView(histogramSet);

// const waveSurferWidth = 300;
// const waveSurferHeight = 100;

// export default class AudioWaveSurfer extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       hasOc1: false,
//     };

//     // Initialize histogram here
//     this.canvas = null;
//     LiveAudioStream.on("data", this.onAudioPcmData);
//   }

//   async componentDidMount() {
//     try {
//       const { status } =
//         await ExpoSpeechRecognitionModule.requestPermissionsAsync();
//       // setHasPermission(status === "granted");
//       console.log("status------------>", status);
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission Denied",
//           "Please grant microphone permissions to use speech recognition"
//         );
//       }
//     } catch (error) {
//       console.error("Error requesting microphone permission:", error);
//       Alert.alert("Error", "Could not request microphone permission");
//     }
//     if (Platform.OS === "web") {
//       const resizeObserver = new ResizeObserver((entries) => {
//         for (let entry of entries) {
//           if (entry.target.id === "canvasExample") {
//             let { width, height } = entry.contentRect;
//             this.onCanvasResize({ width, height, canvas: entry.target });
//           }
//         }
//       });
//       resizeObserver.observe(document.getElementById("canvasExample"));
//     }
//   }

//   initCanvas = (canvas) => {
//     if (this.canvas) {
//       return;
//     }
//     console.log("canvas", canvas);
//     this.canvas = canvas;
//     if (Platform.OS === "web") {
//       // canvas.width not equal canvas.clientWidth but "Defaults to 300" ref
//       // to https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas,
//       // so have to assign again, unless <canvas width=SOME_NUMBER/> in render()
//       this.canvas.width = this.canvas.clientWidth;
//       this.canvas.height = this.canvas.clientHeight;
//     }
//     // should not name this.context because this.context is already be {} here and will
//     // be {} again after componentDidUpdate() on react-native or react-native-web, so
//     // name this.ctx
//     this.ctx = this.canvas.getContext("2d");

//     const offscreenCanvas = document.createElement("canvas");
//     const offscreenCanvasCtx = offscreenCanvas.getContext("2d");

//     const waveSurferSet = {
//       canvas: this.canvas,
//       ctx: this.ctx,
//       canvas2: offscreenCanvas,
//       ctx2: offscreenCanvasCtx,
//       fps: 10, // refresh speed, will stuck if too high with https://github.com/flyskywhy/react-native-gcanvas
//       duration: 2000, // move speed, smaller is faster
//     };
//     this.waveSurfer = WaveSurferView(waveSurferSet);
//   };

//   onCanvasResize = ({ width, height, canvas }) => {
//     canvas.width = width;
//     canvas.height = height;

//     this.waveSurfer.set.width = width;
//     this.waveSurfer.set.height = height;
//   };

//   onAudioPcmData = (pcmDataBase64) => {
//     // console.log("pcmDataBase64", pcmDataBase64);
//     const { pcmData, sum } = NativeRecordReceivePCM(pcmDataBase64);
//     // const pcmData = Buffer.from(pcmDataBase64, "base64"); // Decode Base64 to PCM Data
//     // console.log("pcmData", pcmData);
//     // console.log("sum", pcmData);
//     const powerLevel = PowerLevel(sum, pcmData.length);
//     console.log("powerLevel", powerLevel);
//     const frequencyData = histogram.input(
//       pcmData,
//       0 /* powerLevel, useless in histogram */,
//       optionsOfLiveAudioStream.sampleRate
//     );
//     // console.log("frequencyData", frequencyData);

//     if (histogram.set.asyncFftAtFps === false) {
//       if (histogram.set.canvas) {
//         // draw() will invoke frequencyData2H() automatically then draw
//         // on this.histogram.set.canvas
//         histogram.draw(frequencyData, optionsOfLiveAudioStream.sampleRate);
//       } else if (histogram.set.width && histogram.set.height) {
//         const { lastH, stripesH, originY, heightY, frequencies, gender } =
//           histogram.frequencyData2H({
//             frequencyData,
//             sampleRate: optionsOfLiveAudioStream.sampleRate,
//           });
//         console.log("gender", gender);
//       }
//     }
//     // ref to envIn() in
//     // https://github.com/xiangyuecn/Recorder/blob/master/src/recorder-core.js
//     // ref to onProcess() in
//     // https://github.com/xiangyuecn/Recorder/blob/master/app-support-sample/index.html
//     // ref to WaveSurferView.input() in
//     // https://github.com/xiangyuecn/Recorder/blob/1.2.23070100/src/extensions/wavesurfer.view.js
//     // this.waveSurfer.input(
//     //   pcmData,
//     //   0 /* powerLevel, useless in waveSurfer */,
//     //   optionsOfLiveAudioStream.sampleRate
//     // );
//   };

//   startAudioRecoder = async () => {
//     console.log("call the =================audio start");
//     // const status1 = await request(
//     //   Platform.select({
//     //     android: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//     //     ios: PermissionsAndroid.PERMISSIONS.MICROPHONE,
//     //   })
//     // );
//     // console.log("status1------------->", status1);
//     // const { status } =
//     //   await ExpoSpeechRecognitionModule.requestPermissionsAsync();
//     // console.log("status", status);
//     // if (status === "granted") {
//     console.log("start--------------");
//     LiveAudioStream.stop();
//     LiveAudioStream.init(optionsOfLiveAudioStream);
//     console.log("after init");
//     LiveAudioStream.start();
//     // }
//   };

//   stopAudioRecorder = () => {
//     console.log("call the stop");
//     LiveAudioStream.stop();
//   };
//   render() {
//     // console.log("this.state.hasOc1------->", this.state.hasOc1);
//     return (
//       <View style={styles.container}>
//         {/* {Platform.OS !== "web" && (
//           <GCanvasView
//             style={{
//               width: waveSurferWidth * 2,
//               height: waveSurferHeight,
//               position: "absolute",
//               left: 1000, // 1000 should enough to not display on screen means offscreen canvas :P
//               top: 0,
//               zIndex: -100, // -100 should enough to not bother onscreen canvas
//             }}
//             offscreenCanvas={true}
//             onCanvasCreate={(canvas) => {
//               this.setState({ hasOc1: true });
//             }}
//             isGestureResponsible={false}
//           />
//         )} */}
//         <TouchableOpacity onPress={this.startAudioRecoder}>
//           <Text style={styles.welcome}>Start audio recoder</Text>
//         </TouchableOpacity>
//         <View
//           style={{
//             width: waveSurferWidth,
//             height: waveSurferHeight,
//             backgroundColor: "#FF000030",
//           }}
//         >
//           <View style={{ width: 10, backgroundColor: "red" }}>
//             <Text>Gender :</Text>{}
//             {/* <GCanvasView
//               onCanvasResize={this.onCanvasResize}
//               onCanvasCreate={this.initCanvas}
//               isGestureResponsible={false}
//               style={styles.gcanvas}
//             /> */}
//           </View>
//         </View>
//         <TouchableOpacity onPress={this.stopAudioRecorder}>
//           <Text style={styles.welcome}>Stop audio recoder</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F5FCFF",
//   },
//   gcanvas: {
//     flex: 1,
//     width: "100%",
//     // above maybe will cause
//     //     WARN     getImageData: not good to be here, should refactor source code somewhere
//     // if let this component as a children of another component,
//     // you can use below
//     // width: waveSurferWidth,
//     // height: waveSurferHeight,

//     // backgroundColor: '#FF000030', // TextureView doesn't support displaying a background drawable since Android API 24
//   },
//   welcome: {
//     color: "black",
//     fontSize: 20,
//     textAlign: "center",
//     marginVertical: 20,
//   },
// });
