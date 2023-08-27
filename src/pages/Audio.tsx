import { useParams } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import { getAudio, Audio as ApiAudio, getAudioFile } from "../api";
import { useAuthenticated } from "../auth";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from "@suid/material";
import PageProgress from "../components/PageProgress";
import AudioPlayer from "../components/AudioPlayer";

const Audio = () => {
  const params = useParams();
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

  return (
    <Show when={!loading()} fallback={<PageProgress />}>
      <Container sx={{ mt: 15, mb: 15 }}>
        <Show when={error()}>
          <Alert severity="error">{error()}</Alert>
        </Show>
        <Show when={audio()}>
          {(audio) => (
            <>
              <Typography sx={{ mb: 4 }} variant="h4">
                {createdAt()}
              </Typography>
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
