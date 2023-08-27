import { useNavigate, useParams } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import { getAudio, Audio as ApiAudio, getAudioFile, deleteAudio } from "../api";
import { useAuthenticated } from "../auth";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@suid/material";
import PageProgress from "../components/PageProgress";
import AudioPlayer from "../components/AudioPlayer";
import { Delete } from "@suid/icons-material";

const Audio = () => {
  const params = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthenticated();
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [audio, setAudio] = createSignal<ApiAudio | null>(null);
  const createdAt = () => new Date(audio()?.created_at!).toLocaleString();

  onMount(async () => {
    const audioId = parseInt(params.id);
    const { audio, error } = await getAudio(accessToken(), audioId);
    setError(error);
    setAudio(audio);
    setLoading(false);
  });

  const handleDeleteButtonClick = async () => {
    const id = audio()?.id;
    if (!id) {
      return;
    }

    setLoading(true);
    const { error, info } = await deleteAudio(accessToken(), id);
    if (error) {
      setError(error);
    } else if (info) {
      navigate("/", { state: { infoMsg: info } });
    } else {
      navigate("/", { state: { successMsg: "Audio deleted successfully" } });
    }
    setLoading(false);
  };

  return (
    <Show when={!loading()} fallback={<PageProgress />}>
      <Container sx={{ mt: { xs: 3, md: 5, lg: 15 }, mb: 15 }}>
        <Show when={error()}>
          <Alert severity="error">{error()}</Alert>
        </Show>
        <Show when={audio()}>
          {(audio) => (
            <>
              <Stack direction="row" sx={{ mb: 2 }} alignItems="center">
                <Typography variant="h5">{createdAt()}</Typography>
                <IconButton
                  onClick={handleDeleteButtonClick}
                  sx={{
                    ml: "auto",
                    "&:hover": { color: "error.main" },
                    transition: "color 200ms ease",
                  }}
                >
                  <Delete />
                </IconButton>
              </Stack>
              <Card>
                <CardContent>
                  <Show
                    when={audio().transcription}
                    fallback={
                      <Typography fontStyle="italic">Processing</Typography>
                    }
                  >
                    {audio().transcription}
                  </Show>
                </CardContent>
              </Card>
            </>
          )}
        </Show>
      </Container>
      <Box sx={{ position: "fixed", bottom: 0, width: "100%" }}>
        <Show when={audio()}>
          {(audio) => (
            <AudioPlayer
              accessToken={accessToken()}
              audio={audio()}
              setError={setError}
            />
          )}
        </Show>
      </Box>
    </Show>
  );
};

export default Audio;
