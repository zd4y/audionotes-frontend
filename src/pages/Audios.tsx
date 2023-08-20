import { Component, For, Show, createSignal, onMount } from "solid-js";
import { useAuthenticated } from "../auth";
import { getAudios, Audio as ApiAudio } from "../api";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Fab,
  Grid,
  Link,
  Typography,
} from "@suid/material";
import PageProgress from "../components/PageProgress";
import { A } from "@solidjs/router";
import { Mic } from "@suid/icons-material";

const Audios = () => {
  const accessToken = useAuthenticated();
  const [audios, setAudios] = createSignal<ApiAudio[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    let { audios, error } = await getAudios(accessToken());
    setLoading(false);
    setError(error);
    setAudios(audios);
  });

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
              fallback={<Typography>No audios found.</Typography>}
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
      <Fab color="primary" aria-label="record" sx={{ position: "absolute", right: 50, bottom: 50 }}>
        <Mic />
      </Fab>
    </>
  );
};

const Audio: Component<{ audio: ApiAudio }> = ({ audio }) => {
  const transcribed = audio.transcription && audio.transcription.length > 0;
  return (
    <Link component={A} href={`/${audio.id}`} sx={{ textDecoration: "none" }}>
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
            {cutText(audio.transcription, 310)}
          </Show>
        </CardContent>
      </Card>
    </Link>
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
