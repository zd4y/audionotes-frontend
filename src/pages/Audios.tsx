import { Component, Show, createEffect, createSignal, onMount } from "solid-js";
import { useAuthenticated } from "../auth";
import { getAudios, Audio, newAudio } from "../api";
import {
  Alert,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  useTheme,
} from "@suid/material";
import PageProgress from "../components/PageProgress";
import { useLocation } from "@solidjs/router";
import { Mic, Stop } from "@suid/icons-material";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/plugins/record";
import AudiosGrid from "../components/AudiosGrid";

const Audios = () => {
  const accessToken = useAuthenticated();
  const [audios, setAudios] = createSignal<Audio[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [uploading, setUploading] = createSignal(false);
  const [recordingAudio, setRecordingAudio] = createSignal(false);
  const [recordingAudioOpen, setRecordingAudioOpen] = createSignal(false);
  const [successMsg, setSuccessMsg] = createSignal("");
  const [infoMsg, setInfoMsg] = createSignal("");
  const location = useLocation();

  onMount(async () => {
    const locationState = location.state as any;
    if (locationState?.successMsg) {
      setSuccessMsg(locationState.successMsg);
    }
    if (locationState?.infoMsg) {
      setInfoMsg(locationState.infoMsg);
    }
    let { audios: cachedAudios, error: cachedError } = await getAudios(
      true,
      accessToken(),
    );
    setAudios(cachedAudios);
    setError(cachedError);
    setLoading(cachedAudios.length > 0 ? false : true);

    await callGetAudios();
  });

  const callGetAudios = async () => {
    let { audios: audios2, error: error2 } = await getAudios(
      false,
      accessToken(),
    );
    setAudios(audios2);
    setError(error2);
    setLoading(false);
  };

  const onRecordingBtnClick = () => {
    setSuccessMsg("");
    setInfoMsg("");
    setRecordingAudio((recording) => !recording);
    setRecordingAudioOpen(true);
  };

  const onSaveRecording = async (blob: Blob) => {
    setSuccessMsg("");
    setInfoMsg("");
    setUploading(true);
    setRecordingAudio(false);
    setRecordingAudioOpen(false);
    const { error, info } = await newAudio(accessToken(), blob);
    setUploading(false);
    if (error) {
      setError(error);
    } else if (info) {
      setInfoMsg(info);
    } else {
      setSuccessMsg("Recording saved successfully");
      await callGetAudios();
    }
  };

  return (
    <>
      <Show when={!loading()} fallback={<PageProgress />}>
        <Container sx={{ mb: 2, mt: { xs: 3, md: 5, lg: 15 } }}>
          <Show when={error()}>
            <Alert severity="error">{error()}</Alert>
          </Show>
          <Show when={successMsg()}>
            <Alert severity="success">{successMsg()}</Alert>
          </Show>
          <Show when={infoMsg()}>
            <Alert severity="info">{infoMsg()}</Alert>
          </Show>
          <Show when={uploading()}>
            <Alert severity="info">Uploading audio...</Alert>
          </Show>
        </Container>
        <AudiosGrid audios={audios()} />
      </Show>
      <Fab
        onClick={onRecordingBtnClick}
        color={recordingAudio() ? "error" : "primary"}
        aria-label="record"
        sx={{
          position: "fixed",
          right: { xs: 25, lg: 50 },
          bottom: { xs: 25, lg: 50 },
          zIndex: 10000,
        }}
      >
        {recordingAudio() ? <Stop /> : <Mic />}
      </Fab>
      <RecordAudio
        open={recordingAudioOpen()}
        recording={recordingAudio()}
        onSave={onSaveRecording}
      />
    </>
  );
};

const RecordAudio: Component<{
  open: boolean;
  recording: boolean;
  onSave: (audioBlob: Blob) => void;
}> = (props) => {
  const [blob, setBlob] = createSignal<Blob | null>(null);
  const theme = useTheme();

  let container: HTMLDivElement | undefined;
  let waveSurfer: WaveSurfer | null = null;
  let record: RecordPlugin;

  createEffect(() => {
    if (!props.open || !props.recording) {
      stopRecording();
      return;
    }

    if (!container) return;

    setBlob(null);

    waveSurfer = WaveSurfer.create({
      container,
      waveColor: theme.palette.primary.main,
      height: 250,
      barWidth: 4,
      barGap: 4,
      barRadius: 2,
    });
    record = waveSurfer.registerPlugin(
      RecordPlugin.create({
        renderRecordedAudio: false,
        mimeType: "audio/webm",
      }),
    );
    record.on("record-end", (blob: Blob) => {
      setBlob(() => blob);
    });
    record.startRecording();
  });

  const handleClose = () => {
    stopRecording();
  };

  const stopRecording = () => {
    waveSurfer?.destroy();
    waveSurfer = null;
    record = null;
  };

  createEffect(() => {
    const b = blob();
    if (b) {
      props.onSave(b);
    }
  });

  return (
    <Dialog open={props.open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Recording audio</DialogTitle>
      <DialogContent>
        <div ref={container} />
      </DialogContent>
    </Dialog>
  );
};

export default Audios;
