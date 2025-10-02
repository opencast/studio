import { JSX, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import Oscilloscope from "oscilloscope";
import { Spinner, useColorScheme } from "@opencast/appkit";

import { useDispatch, useStudioState } from "../../studio-state";
import { startAudioCapture, stopAudioCapture } from "../../capturer";
import { getUniqueDevices, COLORS } from "../../util";
import { LAST_AUDIO_DEVICE_KEY } from ".";
import { ErrorBox } from "../../ui/ErrorBox";
import { Select } from "../../ui/Select";


// Once the microphone is selected, this is shown. Renders an
// audio-visualization and a device-selector.
export const MicrophonePreview: React.FC = () => {
  const { t } = useTranslation();
  const { isHighContrast } = useColorScheme();
  const dispatch = useDispatch();
  const state = useStudioState();
  const { audioStream, audioAllowed, audioUnexpectedEnd } = state;

  // Get current device ID and all possible audio input devices.
  const currentDeviceId = audioStream?.getAudioTracks()?.[0]?.getSettings()?.deviceId;
  const devices = getUniqueDevices(state.mediaDevices, "audioinput");

  // We write the currently used device ID to local storage to remember it
  // between visits of Studio.
  useEffect(() => {
    if (currentDeviceId) {
      window.localStorage.setItem(LAST_AUDIO_DEVICE_KEY, currentDeviceId);
    }
  });

  const changeDevice = async (deviceId: string) => {
    // The stream is only falsy if it unexpectedly ended.
    if (audioStream) {
      stopAudioCapture(audioStream, dispatch);
    }

    await startAudioCapture(dispatch, { exact: deviceId });
  };

  const selectId = useId();
  let body: JSX.Element = <></>;
  if (audioStream) {
    body = <>
      <AudioVisualziation stream={audioStream} />
      <div css={{
        display: "flex",
        width: "80%",
        minWidth: "240px",
        alignItems: "center",
      }}>
        <label htmlFor={selectId} css={{
          marginRight: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontWeight: 700,
          color: COLORS.neutral70,
        }}>{t("steps.audio.device")}</label>
        <Select
          id={selectId}
          value={currentDeviceId}
          onChange={e => changeDevice(e.target.value)}
          css={{
            flex: "1 1",
            minWidth: 50,

          }}
        >
          {devices.map((d, i) => (
            <option key={i} value={d.deviceId}>{d.label ?? "unlabeled microphone"}</option>
          ))}
        </Select>
      </div>
    </>;
  } else if (audioAllowed === false) {
    body = <ErrorBox
      title={t("steps.audio.not-allowed-title")}
      body={t("steps.audio.not-allowed-text")}
    />;
  } else if (audioUnexpectedEnd === true) {
    body = <ErrorBox body={t("error-lost-audio-stream")} />;
  } else {
    body = <Spinner size={75} />;
  }

  return (
    <div css={{
      maxWidth: 850,
      backgroundColor: COLORS.neutral05,
      borderRadius: 16,
      boxShadow: isHighContrast ? "none" : "0 4px 16px var(--shadow-color)",
      width: "100%",
      margin: "0 auto",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxHeight: "400px",
      gap: 16,
    }}>
      {body}
    </div>
  );
};

type AudioVisualziationProps = {
  stream: MediaStream;
};

const AudioVisualziation: React.FC<AudioVisualziationProps> = ({ stream }) => {
  const isDark = useColorScheme().scheme === "dark";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx == null) {
        throw new Error("Could not get 2D context for canvas");
      }
      ctx.lineWidth = 2;

      // We use `--color-accent9` in light mode, but have to hard code it here.
      // In dark mode, we use the tranditional yellow as it just looks better.
      ctx.strokeStyle = isDark ? "#f1c40f" : "#044a81";

      const audioContext = new window.AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const scope = new Oscilloscope(source, { fftSize: 1024 });
      scope.animate(ctx);

      return () => scope.stop();
    }
    return () => {};
  }, [stream, isDark]);

  return (
    <canvas
      ref={canvasRef}
      width="800px"
      height="200px"
      css={{
        width: "100%",
        height: "min(200px, 20vh)",
        flex: "1 0 70px",
      }}
    />
  );
};
