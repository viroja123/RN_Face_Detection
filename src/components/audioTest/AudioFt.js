import { PixelRatio, Platform, View } from "react-native";
// import {GCanvasView} from '@flyskywhy/react-native-gcanvas';
// if (Platform.OS !== "web") {
//   var { PERMISSIONS, request } = require("react-native-permissions").default;
// }
import LiveAudioStream, {
  PowerLevel,
  NativeRecordReceivePCM,
  FrequencyHistogramView,
} from "react-native-live-audio-fft";

export const AudioFt = () => {
  const optionsOfLiveAudioStream = {
    sampleRate: 32000, // default is 44100 but 32000 is adequate for accurate voice recognition, maybe even music
    channels: 1, // 1 or 2, default 1
    bitsPerSample: 16, // 8 or 16, default 16
    audioSource: 1, // android only (see below), 1 for music, 6 for voice recognition, default is 6
    bufferSize: 4096, // default is 2048
  };

  const histogramSetScale = 1; // if is not 1, e.g. PixelRatio.get(), you should define devicePixelRatio of <GCanvasView/> (see below)

  // ref to initWaveStore() in
  // https://github.com/xiangyuecn/Recorder/blob/master/app-support-sample/index.html
  const histogramSet = {
    canvas, // e.g. https://github.com/flyskywhy/react-native-gcanvas
    ctx,
    width, // if canvas is not defined, at least must define width and height
    height, // if canvas is defined, it is allowed to not define width and height
    scale: histogramSetScale, // if histogramSetScale is 1, you can remove this line because default is 1
    asyncFftAtFps: false, // default is true, if you want draw on every onAudioPcmData(), you should set it to false
    lineCount: 20,
    minHeight: 1,
    stripeEnable: false,
  };
  const histogram = FrequencyHistogramView(histogramSet);

  LiveAudioStream.on("data", (pcmDataBase64) => {
    const { pcmData, sum } = NativeRecordReceivePCM(pcmDataBase64);
    // const powerLevel = PowerLevel(sum, pcmData.length);

    // ref to envIn() in
    // https://github.com/xiangyuecn/Recorder/blob/master/src/recorder-core.js
    // ref to onProcess() in
    // https://github.com/xiangyuecn/Recorder/blob/master/app-support-sample/index.html
    // ref to FrequencyHistogramView.input() in
    // https://github.com/xiangyuecn/Recorder/blob/1.2.23070100/src/extensions/frequency.histogram.view.js
    const frequencyData = histogram.input(
      pcmData,
      0 /* powerLevel, useless in histogram */,
      optionsOfLiveAudioStream.sampleRate
    );

    if (histogram.set.asyncFftAtFps === false) {
      if (histogram.set.canvas) {
        // draw() will invoke frequencyData2H() automatically then draw
        // on histogram.set.canvas
        histogram.draw(frequencyData, optionsOfLiveAudioStream.sampleRate);
      } else if (histogram.set.width && histogram.set.height) {
        const { lastH } = histogram.frequencyData2H({
          frequencyData,
          sampleRate: optionsOfLiveAudioStream.sampleRate,
        });
        // then your custom canvas or other usecase can use lastH which
        // is an array of height (max is histogram.set.height) on every
        // (count is histogram.set.lineCount) frequency
        // ...
      }
    }
  });
  //   ...
  startAudioRecoder = async () => {
    // const status = await request(
    //   Platform.select({
    //     android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    //     ios: PERMISSIONS.IOS.MICROPHONE,
    //   })
    // );
    // if (status === "granted") {
    LiveAudioStream.stop();
    LiveAudioStream.init(optionsOfLiveAudioStream);
    LiveAudioStream.start();
    // }
  };

  stopAudioRecoder = () => {
    LiveAudioStream.stop();
  };
  console.log("call the audioft");
  return (
    <View>
      <Text>hello</Text>
      <Text>hello</Text>
      <Text>hello</Text>
      <Text>hello</Text>
      <Text>hello</Text>
    </View>
  );
};
