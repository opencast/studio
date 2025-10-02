import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { keyframes } from "@emotion/react";
import { FiPauseCircle } from "react-icons/fi";

import {
  useStudioState, useDispatch, Dispatcher, Recording as StudioRecording,
} from "../../studio-state";
import { useOpencast } from "../../opencast";

import { stopCapture } from "../../capturer";
import { StepProps } from "..";
import { ErrorBox } from "../../ui/ErrorBox";
import { StepContainer } from "../elements";
import { VideoBox, VideoBoxProps, useVideoBoxResize } from "../../ui/VideoBox";
import { dimensionsOf, useUnloadBlocker } from "../../util";
import { RecordingControls } from "./controls";
import Recorder, { OnStopCallback } from "./recorder";
import { useSettings } from "../../settings";
import { useColorScheme } from "@opencast/appkit";


export type RecordingState = "inactive" | "paused" | "recording";


const addRecordOnStop = (
  dispatch: Dispatcher,
  deviceType: StudioRecording["deviceType"],
): OnStopCallback => {
  return ({ media, url, mimeType, dimensions }) => {
    dispatch({
      type: "ADD_RECORDING",
      recording: { deviceType, media, url, mimeType, dimensions },
    });
  };
};

const mixAudioIntoVideo = (audioStreams: (MediaStream | null)[], videoStream: MediaStream) => (
  audioStreams.reduce<MediaStream>(
    (stream, audioStream) => audioStream?.getAudioTracks().length
      ? new MediaStream([
        ...stream.getVideoTracks(),
        ...(
          stream.getAudioTracks().length
            ? (() => {
              const audioContext = new AudioContext();
              const accumulatedAudio = audioContext.createMediaStreamSource(stream);
              const currentAudio = audioContext.createMediaStreamSource(audioStream);
              const resultAudio = audioContext.createMediaStreamDestination();
              accumulatedAudio.connect(resultAudio);
              currentAudio.connect(resultAudio);
              return resultAudio.stream;
            })()
            : audioStream
        ).getAudioTracks(),
      ])
      : stream,
    videoStream,
  )
);


export const Recording: React.FC<StepProps> = ({ goToNextStep, goToPrevStep }) => {
  const { t } = useTranslation();
  const recordingDispatch = useDispatch();
  const opencast = useOpencast();
  const dispatch = useDispatch();
  const settings = useSettings();
  const state = useStudioState();
  const {
    displayStream, userStream, displayUnexpectedEnd, userUnexpectedEnd, audioUnexpectedEnd,
  } = state;

  const [recordingState, setRecordingState] = useState<RecordingState>("inactive");

  const desktopRecorder = useRef<Recorder>();
  const videoRecorder = useRef<Recorder>();

  const canRecord = (displayStream || userStream)
    && !userUnexpectedEnd && !displayUnexpectedEnd && !audioUnexpectedEnd;

  const startRecording = () => {
    // In theory, we should never have recordings at this point. But just to be
    // sure, in case of a bug elsewhere, we clear the recordings here.
    dispatch({ type: "CLEAR_RECORDINGS" });

    if (displayStream) {
      const onStop = addRecordOnStop(dispatch, "desktop");
      const stream = mixAudioIntoVideo([state.audioStream], displayStream);
      desktopRecorder.current = new Recorder(stream, settings.recording, onStop);
      desktopRecorder.current.start();
    }
    if (userStream) {
      const onStop = addRecordOnStop(dispatch, "video");
      const stream = mixAudioIntoVideo([state.audioStream, displayStream], userStream);
      videoRecorder.current = new Recorder(stream, settings.recording, onStop);
      videoRecorder.current.start();
    }

    setRecordingState("recording");
    dispatch({ type: "START_RECORDING" });
  };

  const stopRecording = (premature: boolean) => {
    desktopRecorder.current?.stop();
    videoRecorder.current?.stop();
    dispatch({ type: premature ? "STOP_RECORDING_PREMATURELY" : "STOP_RECORDING" });
    opencast.refreshConnection();
    stopCapture(state, recordingDispatch);
    goToNextStep();
  };

  const pauseRecording = () => {
    setRecordingState("paused");
    desktopRecorder.current?.pause();
    videoRecorder.current?.pause();
  };

  const resumeRecording = () => {
    setRecordingState("recording");
    desktopRecorder.current?.resume();
    videoRecorder.current?.resume();
  };

  // Detect if a stream ended unexpectedly. In that case we want to stop the
  // recording completely.
  useEffect(() => {
    const unexpectedEnd = userUnexpectedEnd || displayUnexpectedEnd || audioUnexpectedEnd;
    if (unexpectedEnd && (recordingState === "recording" || recordingState === "paused")) {
      stopRecording(true);
    }
  });

  const paused = recordingState === "paused";
  const previews: VideoBoxProps["children"] = [];
  if (displayStream || displayUnexpectedEnd) {
    previews.push({
      body: <StreamPreview stream={displayStream} paused={paused} />,
      dimensions: () => dimensionsOf(displayStream),
      autoSize: !displayStream,
    });
  }
  if (userStream || userUnexpectedEnd) {
    previews.push({
      body: <StreamPreview stream={userStream} paused={paused} />,
      dimensions: () => dimensionsOf(userStream),
      autoSize: !userStream,
    });
  }

  useUnloadBlocker(recordingState !== "inactive");

  return (
    <StepContainer
      title={t("steps.record.label")}
      prevButton={{
        onClick: goToPrevStep,
        disabled: recordingState !== "inactive",
      }}
      nextButton={{
        onClick: () => stopRecording(false),
        disabled: recordingState !== "paused",
        label: t("steps.record.stop-button-title"),
      }}
    >
      {audioUnexpectedEnd && (
        <ErrorBox body={t("error-lost-audio-stream")} />
      )}

      <VideoBox gap={20}>{previews}</VideoBox>
      <div css={{ position: "absolute", bottom: 32, width: "100%" }}>
        {canRecord && (
          <RecordingControls {...{
            startRecording,
            pauseRecording,
            resumeRecording,
            recordingState,
          }} />
        )}
      </div>
    </StepContainer>
  );
};


type StreamPreviewProps = {
  stream: MediaStream | null;
  paused: boolean;
};

const StreamPreview: React.FC<StreamPreviewProps> = ({ stream, paused }) => {
  const { t } = useTranslation();
  const resizeVideoBox = useVideoBoxResize();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isHighContrast } = useColorScheme();

  useEffect(() => {
    const v = videoRef.current;
    if (v && stream) {
      if (!v.srcObject) {
        v.srcObject = stream;
      }
      v.addEventListener("resize", resizeVideoBox);

      if (paused) {
        v.pause();
      } else {
        v.play();
      }

      return () => v.removeEventListener("resize", resizeVideoBox);
    }
  });

  if (!stream) {
    return <ErrorBox css={{ margin: 0 }} body={t("error-lost-video-stream")} />;
  }

  return (
    <div
      css={{
        position: "relative",
        boxShadow: isHighContrast ? "none" : "0 2px 12px rgba(0, 0, 0, 0.35)",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {paused && <PauseOverlay />}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        tabIndex={-1}
        css={{
          outline: "none",
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      ></video>
    </div>
  );
};

const PauseOverlay: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      css={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(50, 50, 50, 0.7)",
      }}
    >
      <div css={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        gap: 8,
        fontSize: 20,
        marginTop: 32,
        textShadow: "0 0 12px rgba(0, 0, 0, 0.6)",
        animation: `2s ease-in-out infinite none ${keyframes({
          "0%": { opacity: 1 },
          "50%": { opacity: 0.7 },
          "100%": { opacity: 1 },
        })}`,
      }}>
        <FiPauseCircle css={{ fontSize: 26 }} />
        {t("steps.record.is-paused")}
      </div>
    </div>
  );
};
