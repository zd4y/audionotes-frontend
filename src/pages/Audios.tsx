import {
  Component,
  For,
  Show,
  createEffect,
  createSignal,
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
  DialogTitle,
  Fab,
  Grid,
  Link,
  Typography,
} from "@suid/material";
import PageProgress from "../components/PageProgress";
import { A } from "@solidjs/router";
import { Mic, Stop } from "@suid/icons-material";

const Audios = () => {
  const accessToken = useAuthenticated();
  const [audios, setAudios] = createSignal<ApiAudio[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [recordingAudio, setRecordingAudio] = createSignal(false);
  const [recordingAudioOpen, setRecordingAudioOpen] = createSignal(false);

  onMount(async () => {
    await callGetAudios();
  });

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
    if (error.length > 0) {
      setError(error);
    } else {
      await callGetAudios();
    }
    setRecordingAudio(false);
    setRecordingAudioOpen(false);
  };

  return (
    <>
      <Show when={!loading()} fallback={<PageProgress />}>
        <Container sx={{ mt: 15, mb: 15 }}>
          <Show when={error()}>
            <Alert severity="error">{error()}</Alert>
          </Show>
          <Grid container spacing={2}>
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
                  <Audio audio={audio} />
                </Grid>
              )}
            </For>
          </Grid>
        </Container>
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

const Audio: Component<{ audio: ApiAudio }> = (props) => {
  const transcribed =
    props.audio.transcription && props.audio.transcription.length > 0;
  return (
    <Link
      component={A}
      href={`/${props.audio.id}`}
      sx={{ textDecoration: "none" }}
    >
      <Card
        sx={{
          width: 250,
          height: 250,
          backgroundColor: transcribed ? "#fff" : "#e0e0e0",
        }}
      >
        <CardContent>
          <Show
            when={transcribed}
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
  const [mediaRecorder, setMediaRecorder] = createSignal<MediaRecorder | null>(
    null,
  );
  const [chunks, setChunks] = createSignal<Blob[]>([]);
  const [blob, setBlob] = createSignal<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = createSignal("");

  createEffect(async () => {
    if (!props.open || !props.recording) {
      stopRecording();
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      setMediaRecorder(mediaRecorder);
      mediaRecorder.start();
      mediaRecorder.ondataavailable = (e) => {
        setChunks((oldChunks) => [...oldChunks, e.data]);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks(), { type: "audio/ogg; codecs=opus" });
        setBlob(blob);
        setChunks([]);
        setAudioBlobUrl(URL.createObjectURL(blob));
      };
    }
  });

  const handleClose = () => {
    stopRecording();
    props.onClose();
  };

  const handleSave = () => {
    props.onSave(blob()!);
  };

  const stopRecording = () => {
    mediaRecorder()?.stop();
    mediaRecorder()
      ?.stream.getTracks()
      .forEach((track) => track.stop());
    setMediaRecorder(null);
  };

  return (
    <Dialog open={props.open} onClose={handleClose}>
      <DialogTitle>Recording audio</DialogTitle>
      <Show when={audioBlobUrl()}>
        <audio controls src={audioBlobUrl()} />
        <DialogActions>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Show>
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
