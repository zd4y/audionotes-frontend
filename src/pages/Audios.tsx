import {
  Component,
  For,
  Show,
  createComputed,
  createEffect,
  createSignal,
  on,
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
  const [recordingAudio, setRecordingAudio] = createSignal(false);
  const [recordingAudioOpen, setRecordingAudioOpen] = createSignal(false);
  const [audioCardSize, setAudioCardSize] = createSignal(0);
  const [containerMargin, setContainerMargin] = createSignal(0);
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
    setRecordingAudio((recording) => !recording);
    setRecordingAudioOpen(true);
  };

  const onRecordingClose = () => {
    setRecordingAudio(false);
    setRecordingAudioOpen(false);
  };

  const onSaveRecording = async (blob: Blob) => {
    const { error } = await newAudio(accessToken(), blob);
    if (error) {
      setError(error);
    } else {
      await callGetAudios();
    }
    setRecordingAudio(false);
    setRecordingAudioOpen(false);
  };

  return (
    <>
      <Show when={!loading() && audioCardSize()} fallback={<PageProgress />}>
        <Show when={error()}>
          <Alert severity="error">{error()}</Alert>
        </Show>
        <Grid
          container
          sx={{ mt: { xs: 5, lg: 15 }, mb: { xs: 5, lg: 15 } }}
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
        onClose={onRecordingClose}
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
  onClose: () => void;
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
      height: 100,
      normalize: true,
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
    props.onClose();
  };

  const handleSave = () => {
    props.onSave(blob()!);
  };

  const stopRecording = () => {
    waveSurfer?.destroy();
    waveSurfer = null;
    record = null;
  };

  return (
    <Dialog open={props.open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Recording audio</DialogTitle>
      <DialogContent>
        <div ref={container} />
        <Show when={audioBlobUrl()}>
          <audio controls src={audioBlobUrl()} />
        </Show>
      </DialogContent>
      <DialogActions>
        <Show when={audioBlobUrl()}>
          <Button onClick={handleSave}>Save</Button>
        </Show>
      </DialogActions>
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
