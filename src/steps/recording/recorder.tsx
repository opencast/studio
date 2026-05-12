import fixWebmDuration from "webm-duration-fix";
import { Settings } from "../../settings";
import { dimensionsOf, onSafari } from "../../util";


export type OnStopCallback = (args: {
  url: string;
  media: Blob;
  mimeType: string;
  dimensions: [number, number] | null;
}) => void;

export default class Recorder {
  #recorder: MediaRecorder;
  #data: Blob[] = [];
  #dimensions: [number, number] | null;
  #silentAudioCtx: AudioContext | null = null;

  onStop: OnStopCallback;

  constructor(
    stream: MediaStream,
    settings: Settings["recording"],
    onStop: OnStopCallback,
  ) {
    // Figure out MIME type.
    let mimeType: string | undefined;
    if ("isTypeSupported" in MediaRecorder) {
      mimeType = (settings?.mimes || [])
        .find(mime => MediaRecorder.isTypeSupported(mime));
      if (mimeType) {
        console.debug("using first supported MIME type from settings: ", mimeType);
      } else if (settings?.mimes) {
        console.debug("None of the MIME types specified in settings are supported by "
          + "this `MediaRecorder`");
      }
    } else if (settings?.mimes) {
      console.debug("MIME types were specified, but `MediaRecorder.isTypeSupported` is not "
        + "supported by your browser");
    }


    this.#reset();

    this.#dimensions = dimensionsOf(stream);
    this.onStop = onStop;

    // Safari workaround: when recording a video-only stream (no audio
    // tracks), Safari produces a file whose duration is roughly doubled.
    // Adding a silent audio track prevents this.
    if (onSafari() && stream.getAudioTracks().length === 0) {
      const audioCtx = new AudioContext();
      this.#silentAudioCtx = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      const src = audioCtx.createConstantSource();
      src.offset.value = 0;
      src.connect(dest);
      src.start();
      stream = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    }

    const videoBitsPerSecond = settings?.videoBitrate;
    this.#recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
    this.#recorder.ondataavailable = this.#onDataAvailable;
    this.#recorder.onstop = this.#onStop;
  }

  #reset = () => {
    this.#data = [];
  };

  #onDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      this.#data.push(event.data);
    } else {
      console.log("Recording data has size 0!", event);
    }
  };

  #onStop = async (_event: Event) => {
    const mimeType = this.#data[0]?.type || this.#recorder.mimeType;
    const mainMimeType = mimeType.split(";")[0].trim();
    let media;

    const fixMimeTypes = ["video/webm", "video/x-matroska"];

    if (fixMimeTypes.includes(mainMimeType)) {
      media = await fixWebmDuration(new Blob(this.#data, { type: mimeType }));
    } else {
      media = new Blob(this.#data, { type: mimeType });
    }

    const url = URL.createObjectURL(media);

    this.#reset();
    this.#silentAudioCtx?.close();
    this.#silentAudioCtx = null;

    this.onStop?.({ url, media, mimeType, dimensions: this.#dimensions });
  };

  start() {
    this.#recorder.start();
  }

  pause() {
    this.#recorder.pause();
  }

  resume() {
    this.#recorder.resume();
  }

  stop() {
    this.#recorder.stop();
  }
}
