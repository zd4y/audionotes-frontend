import { useNavigate, useParams } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import { getAudio, Audio as ApiAudio, deleteAudio, getTags } from "../api";
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
import Tags from "../components/Tags";

const Audio = () => {
  const params = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthenticated();
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [audio, setAudio] = createSignal<ApiAudio | null>(null);
  const [existingTags, setExistingTags] = createSignal([]);
  const createdAt = () => new Date(audio()?.created_at!).toLocaleString();

  onMount(async () => {
    const audioId = parseInt(params.id);

    const { audio: cachedAudio, error: cachedError } = await getAudio(
      true,
      accessToken(),
      audioId,
    );
    setError(cachedError);
    setAudio(cachedAudio);
    setLoading(cachedAudio ? false : true);

    await callGetAudio();
  });

  const callGetAudio = async () => {
    const audioId = parseInt(params.id);

    const { audio, error } = await getAudio(false, accessToken(), audioId);
    setError(error);
    setAudio(audio);
    setLoading(false);

    if (error) {
      return;
    }

    const { tags, error: error2 } = await getTags(accessToken());
    setError(error2);
    setExistingTags(tags);
  };

  const handleDeleteButtonClick = async () => {
    const id = audio()?.id;
    if (!id) {
      return;
    }

    setLoading(true);
    const { error, info } = await deleteAudio(accessToken(), id);
    if (error) {
      setError(error);
      setLoading(false);
    } else if (info) {
      navigate("/", { state: { infoMsg: info } });
    } else {
      navigate("/", { state: { successMsg: "Audio deleted successfully" } });
    }
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
              <Card
                sx={{
                  backgroundColor: audio().transcription
                    ? "background.paper"
                    : "#e0e0e0",
                }}
              >
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
              <Tags
                audioId={audio().id}
                tags={audio().tags}
                existingTags={existingTags()}
                setError={setError}
                refresh={callGetAudio}
                accessToken={accessToken()}
                mt={2}
              />
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
