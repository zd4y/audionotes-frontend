import { Component, For, Show, createSignal, onMount } from "solid-js";
import { useAuthenticated } from "../auth";
import { getAudios, Audio as ApiAudio } from "../api";
import { Alert, Card, CardContent, CircularProgress, Container, Grid, Typography } from "@suid/material";

const Audios = () => {
  const accessToken = useAuthenticated();
  const [audios, setAudios] = createSignal<ApiAudio[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    let { audios, error } = await getAudios(accessToken());
    setLoading(false)
    setError(error)
    setAudios(audios)
  })

  return (
    <Container sx={{ mt: 15 }}>
      <Show when={!loading()} fallback={<CircularProgress />}>
        <Show when={error()}>
          <Alert severity="error">{error()}</Alert>
        </Show>
        <Grid container spacing={2}>
          <For each={audios()} fallback={<Typography>No audios found.</Typography>}>
            {(audio) => <Grid item><Audio audio={audio} /></Grid>}
          </For></Grid>
      </Show>
    </Container>
  );
};

const Audio: Component<{ audio: ApiAudio }> = ({ audio }) => {
  return <Card>
    <CardContent>
      <Show when={audio.transcription && audio.transcription.length > 0} fallback={<Typography fontStyle="italic">Processing</Typography>}>
        {audio.transcription}
      </Show>
    </CardContent>
  </Card>
}

export default Audios;
