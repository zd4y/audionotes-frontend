import { Card, CardContent, Grid, Link, Typography } from "@suid/material";
import {
  Component,
  For,
  Show,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Audio } from "../api";
import { A } from "@solidjs/router";

const SPACE_BETWEEN_CARDS = 16;

const AudiosGrid: Component<{ audios: Audio[] }> = (props) => {
  let timeoutId = 0;
  const [containerMargin, setContainerMargin] = createSignal(0);
  const [audioCardSize, setAudioCardSize] = createSignal(0);

  onMount(() => {
    calculateAudioCardSize();
    window.addEventListener("resize", handleWindowResize);
  });

  onCleanup(() => {
    window.removeEventListener("resize", handleWindowResize);
    setAudioCardSize(0);
    clearTimeout(timeoutId);
  });

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

  const handleWindowResize = () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => calculateAudioCardSize(), 1000);
  };

  return (
    <Show when={audioCardSize()}>
      <Grid
        container
        sx={{ mb: { xs: 5, lg: 15 } }}
        paddingLeft={`${containerMargin() + SPACE_BETWEEN_CARDS}px`}
        paddingRight={`${containerMargin()}px`}
      >
        <For
          each={props.audios}
          fallback={
            <Grid item>
              <Typography>No audios found.</Typography>
            </Grid>
          }
        >
          {(audio) => (
            <Grid item>
              <AudioCard audio={audio} size={audioCardSize()} />
            </Grid>
          )}
        </For>
      </Grid>
    </Show>
  );
};

const AudioCard: Component<{ audio: Audio; size: number }> = (props) => {
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
            {props.audio.transcription}
          </Show>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AudiosGrid;
