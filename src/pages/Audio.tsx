import { useParams } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import { getAudio, Audio as ApiAudio, getAudioFile } from "../api";
import { useAuthenticated } from "../auth";
import {
  Alert,
  Card,
  CardContent,
  Container,
  Typography,
} from "@suid/material";
import PageProgress from "../components/PageProgress";

const Audio = () => {
  const params = useParams();
  const accessToken = useAuthenticated();
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [audio, setAudio] = createSignal<ApiAudio | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = createSignal("");
  const createdAt = () => new Date(audio()?.created_at!).toLocaleString();

  onMount(async () => {
    const audioId = parseInt(params.id);
    const { audio, error } = await getAudio(accessToken(), audioId);
    setError(error);
    setAudio(audio);
    setLoading(false);
    if (error) return;
    const { blob, error: error2 } = await getAudioFile(accessToken(), audioId);
    setError(error2);
    if (error2 || blob === null) return;
    const blobUrl = URL.createObjectURL(blob);
    setAudioBlobUrl(blobUrl);
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
                <audio style="width: 100%" controls src={audioBlobUrl()} />
              </Card>
            </>
          )}
        </Show>
      </Container>
    </Show>
  );
};

export default Audio;
