import {
  Component,
  Show,
  createEffect,
  createSignal,
  lazy,
  onCleanup,
  onMount,
} from "solid-js";
import { useAuthenticated } from "../auth";
import { getAudios, Audio, newAudio, getAudio } from "../api";
import {
  Alert,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from "@suid/material";
import PageProgress from "../components/PageProgress";
import { useLocation } from "@solidjs/router";
import { GridView, Mic, Stop, ViewList } from "@suid/icons-material";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/plugins/record";
const AudiosGrid = lazy(() => import("../components/AudiosGrid"));
const AudiosTable = lazy(() => import("../components/AudiosTable"));

const Audios = () => {
  const accessToken = useAuthenticated();
  const [audios, setAudios] = createSignal<Audio[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [uploading, setUploading] = createSignal(false);
  const [newAudioId, setNewAudioId] = createSignal<number | null>(null);
  const [recordingAudio, setRecordingAudio] = createSignal(false);
  const [recordingAudioOpen, setRecordingAudioOpen] = createSignal(false);
  const [successMsg, setSuccessMsg] = createSignal("");
  const [infoMsg, setInfoMsg] = createSignal("");
  const [inGridView, setInGridView] = createSignal(true);
  const onLargeScreen = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const location = useLocation();
  let newAudioTimer = 0;

  createEffect(() => {
    const audioId = newAudioId();
    if (audioId === null) {
      clearInterval(newAudioTimer);
      return;
    }

    newAudioTimer = window.setInterval(() => {
      let audioId = newAudioId();
      if (audioId === null) {
        clearInterval(newAudioTimer);
        return;
      }

      for (let audio of audios()) {
        if (audio.id === audioId) {
          if (audio.transcription !== null) {
            clearInterval(newAudioTimer);
            return;
          }
          break;
        }
      }

      callGetAudio(audioId);
    }, 1000);
  });

  onMount(async () => {
    const savedView = localStorage.getItem("view");
    if (savedView === "table") {
      setInGridView(false);
    }

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
    if (cachedError) {
      setError(cachedError);
    }
    setLoading(cachedAudios.length > 0 ? false : true);

    await callGetAudios();
  });

  onCleanup(() => clearInterval(newAudioTimer));

  const callGetAudios = async () => {
    const { audios, error } = await getAudios(false, accessToken());
    setAudios(audios);
    if (error) {
      setError(error);
    }
    setLoading(false);
  };

  const callGetAudio = async (audioId: number) => {
    const { audio: newAudio, error } = await getAudio(
      false,
      accessToken(),
      audioId,
    );
    if (error) {
      setError(error);
    }
    if (newAudio) {
      setAudios((audios) => {
        const idx = audios.findIndex((audio) => audio.id === audioId);
        audios[idx] = newAudio;
        return [...audios];
      });
    }
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
    const { error, info, id } = await newAudio(accessToken(), blob);
    setUploading(false);
    setNewAudioId(id);
    if (error) {
      setError(error);
    } else if (info) {
      setInfoMsg(info);
    } else {
      setSuccessMsg("Recording saved successfully");
      await callGetAudios();
    }
  };

  const handleViewChange = (newView: string) => {
    if (newView === "table") {
      setInGridView(false);
    } else {
      setInGridView(true);
    }
    localStorage.setItem("view", newView);
  };

  return (
    <>
      <Show when={onLargeScreen()}>
        <Stack direction="row" justifyContent="end" mt={3} mr={3}>
          <IconButton
            color={inGridView() ? "primary" : "default"}
            onClick={() => handleViewChange("grid")}
          >
            <GridView />
          </IconButton>
          <IconButton
            color={inGridView() ? "default" : "primary"}
            onClick={() => handleViewChange("table")}
          >
            <ViewList />
          </IconButton>
        </Stack>
      </Show>
      <Show when={!loading()} fallback={<PageProgress />}>
        <Container sx={{ mb: 2, mt: { xs: 3, md: 5, lg: 10 } }}>
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
        <Show
          when={inGridView()}
          fallback={
            <AudiosTable
              audios={audios()}
              accessToken={accessToken()}
              setError={setError}
              setInfoMsg={setInfoMsg}
              setSuccessMsg={setSuccessMsg}
              setLoading={setLoading}
              refreshAudios={callGetAudios}
            />
          }
        >
          <AudiosGrid audios={audios()} />
        </Show>
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
