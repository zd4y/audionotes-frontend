import {
  Component,
  For,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { useAuthenticated } from "../auth";
import { getAudios, Audio as ApiAudio, newAudio } from "../api";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  Link,
  Typography,
  useTheme,
} from "@suid/material";
import PageProgress from "../components/PageProgress";
import { A } from "@solidjs/router";
import { Mic, Stop } from "@suid/icons-material";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/plugins/record";

const SPACE_BETWEEN_CARDS = 16;

const Audios = () => {
  const accessToken = useAuthenticated();
  const [audios, setAudios] = createSignal<ApiAudio[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [uploading, setUploading] = createSignal(false);
  const [recordingAudio, setRecordingAudio] = createSignal(false);
  const [recordingAudioOpen, setRecordingAudioOpen] = createSignal(false);
  const [audioCardSize, setAudioCardSize] = createSignal(0);
  const [containerMargin, setContainerMargin] = createSignal(0);
  const [successMsg, setSuccessMsg] = createSignal("");
  let timeoutId = 0;

  onMount(async () => {
    await callGetAudios();
    window.addEventListener("resize", handleWindowResize);
    calculateAudioCardSize();
  });

  onCleanup(() => {
    window.removeEventListener("resize", handleWindowResize);
    setAudioCardSize(0);
    clearTimeout(timeoutId);
  });

  const handleWindowResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => calculateAudioCardSize(), 1000);
  };

  const calculateAudioCardSize = () => {
    const windowSize = document.getElementById("root")!.clientWidth;

    let initialSize = 150;
    let containerMargin = 0;
    if (windowSize >= 900) {
      initialSize = 150;
      containerMargin = 0.1 * windowSize;
    } else if (windowSize >= 450) {
      initialSize = 130;
    } else if (windowSize > 360) {
      initialSize = 150;
    } else if (windowSize >= 150) {
      initialSize = 100;
    }

    const totalSize = windowSize - containerMargin * 2;

    const initialSpace = initialSize + SPACE_BETWEEN_CARDS;
    const numOfCards = Math.floor(
      (totalSize - SPACE_BETWEEN_CARDS) / initialSpace,
    );
    const remainingSpace = totalSize - SPACE_BETWEEN_CARDS * (numOfCards + 1);

    setContainerMargin(Math.floor(containerMargin));
    setAudioCardSize(Math.floor(remainingSpace / numOfCards));
  };

  const callGetAudios = async () => {
    let { audios, error } = await getAudios(accessToken());
    setAudios(audios);
    setError(error);
    setLoading(false);
  };

  const onRecordingBtnClick = () => {
    setSuccessMsg("");
    setRecordingAudio((recording) => !recording);
    setRecordingAudioOpen(true);
  };

  const onSaveRecording = async (blob: Blob) => {
    setSuccessMsg("");
    setUploading(true);
    setRecordingAudio(false);
    setRecordingAudioOpen(false);
    const { error } = await newAudio(accessToken(), blob);
    setUploading(false);
    if (error) {
      setError(error);
    } else {
      await callGetAudios();
      setSuccessMsg("Recording saved successfully");
    }
  };

  return (
    <>
      <Show when={!loading() && audioCardSize()} fallback={<PageProgress />}>
        <Container sx={{ mb: 2, mt: { xs: 5, lg: 15 } }}>
          <Show when={error()}>
            <Alert severity="error">{error()}</Alert>
          </Show>
          <Show when={successMsg()}>
            <Alert severity="success">{successMsg()}</Alert>
          </Show>
          <Show when={uploading()}>
            <Alert severity="info">Uploading audio...</Alert>
          </Show>
        </Container>
        <Grid
          container
          sx={{ mb: { xs: 5, lg: 15 } }}
          paddingLeft={`${containerMargin() + SPACE_BETWEEN_CARDS}px`}
          paddingRight={`${containerMargin()}px`}
        >
          <For
            each={audios()}
            fallback={
              <Grid item>
                <Typography>No audios found.</Typography>
              </Grid>
            }
          >
            {(audio) => (
              <Grid item>
                <Audio audio={audio} size={audioCardSize()} />
              </Grid>
            )}
          </For>
        </Grid>
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

const Audio: Component<{ audio: ApiAudio; size: number }> = (props) => {
  return (
    <Link
      component={A}
      href={`/${props.audio.id}`}
      sx={{ textDecoration: "none" }}
    >
      <Card
        sx={{
          width: props.size,
          height: props.size,
          marginRight: `${SPACE_BETWEEN_CARDS}px`,
          marginBottom: `${SPACE_BETWEEN_CARDS}px`,
          backgroundColor: props.audio.transcription ? "#fff" : "#e0e0e0",
        }}
      >
        <CardContent>
          <Show
            when={props.audio.transcription}
            fallback={<Typography fontStyle="italic">Processing</Typography>}
          >
            {cutText(props.audio.transcription, 310)}
          </Show>
        </CardContent>
      </Card>
    </Link>
  );
};

const RecordAudio: Component<{
  open: boolean;
  recording: boolean;
  onSave: (audioBlob: Blob) => void;
}> = (props) => {
  const [blob, setBlob] = createSignal<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = createSignal("");
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
    setAudioBlobUrl("");

    waveSurfer = WaveSurfer.create({
      container,
      waveColor: theme.palette.primary.main,
      height: 250,
      barWidth: 4,
      barGap: 4,
      barRadius: 2,
    });
    record = waveSurfer.registerPlugin(RecordPlugin.create());
    record.on("record-end", (blob: Blob) => {
      const recordedUrl = URL.createObjectURL(blob);
      setAudioBlobUrl(recordedUrl);
      setBlob(blob);
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
        <Show when={audioBlobUrl()}>
          <audio controls src={audioBlobUrl()} />
        </Show>
      </DialogContent>
    </Dialog>
  );
};

const cutText = (text: string, toLen: number) => {
  if (text.length <= toLen) {
    return text;
  }
  let newText = text.slice(0, toLen - 3);
  return newText + "...";
};

export default Audios;
