import {
  Component,
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  onMount,
} from "solid-js";
import { Audio as ApiAudio, getAudioFile } from "../api";
import {
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@suid/material";
import { PauseCircle, PlayCircle } from "@suid/icons-material";
import styles from "./AudioPlayer.module.css";

const AudioPlayer: Component<{
  accessToken: string;
  audio: ApiAudio;
  setError: (error: string) => void;
}> = (props) => {
  let slider: HTMLInputElement;
  let audio: HTMLAudioElement;
  const [audioBlobUrl, setAudioBlobUrl] = createSignal("");
  const [playing, setPlaying] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [duration, setDuration] = createSignal(0);
  const [progress, setProgress] = createSignal(0);

  const handlePlayingToggle = async () => {
    const playing = setPlaying((playing) => !playing);

    if (audioBlobUrl()) {
      playPause(playing);
      return;
    }

    if (!playing) {
      return;
    }

    setLoading(true);
    const { blob, error } = await getAudioFile(
      props.accessToken,
      props.audio.id,
    );
    props.setError(error);
    if (error || blob === null) return;
    setAudioBlobUrl(URL.createObjectURL(blob));
    if (audio.readyState > 0) {
      setPlayerValues();
    }
    playPause(playing);
    setLoading(false);
  };

  const playPause = (playing: boolean) => {
    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const setPlayerValues = () => {
    if (isFinite(audio.duration)) {
      setDuration(audio.duration);
      return;
    }

    const player = new Audio(audioBlobUrl());
    player.addEventListener("durationchange", () => {
      if (isFinite(player.duration)) {
        setDuration(player.duration);
      }
    });
    player.load();
    player.currentTime = 1e101;
    player.volume = 0;
    player.play();
  };

  const handleSliderInput = () => {
    setProgress(+slider.value);
  };

  const handleSliderChange = () => {
    audio.currentTime = +slider.value;
    setProgress(+slider.value);
  };

  const handleAudioTimeUpdate = () => {
    setProgress(Math.floor(audio.currentTime));
    if (audio.ended) {
      setPlaying(false);
    }
  };

  createEffect(() => {
    const p = (progress() / Math.floor(duration())) * 100 || 0;
    slider.style.setProperty("--val", `${p}%`);
  });

  return (
    <Stack
      direction="row"
      backgroundColor="#111"
      alignItems="center"
      padding={1.5}
    >
      <Show when={audioBlobUrl()}>
        <audio
          ref={audio!}
          src={audioBlobUrl()}
          onLoadedMetadata={() => setPlayerValues()}
          onTimeUpdate={handleAudioTimeUpdate}
        />
      </Show>
      <IconButton onClick={handlePlayingToggle}>
        <Switch
          fallback={<PlayCircle htmlColor="#eee" sx={{ fontSize: 50 }} />}
        >
          <Match when={loading()}>
            <CircularProgress size={50} sx={{ color: "#eee" }} />
          </Match>
          <Match when={playing()}>
            <PauseCircle htmlColor="#eee" sx={{ fontSize: 50 }} />
          </Match>
        </Switch>
      </IconButton>
      <Typography color="#eee" ml={1} mr={1}>
        {calculateTime(progress())}
      </Typography>
      <input
        ref={slider!}
        type="range"
        max={duration() ? Math.floor(duration()) : 100}
        value={progress()}
        class={styles.slider}
        onInput={handleSliderInput}
        onChange={handleSliderChange}
      />
      <Typography color="#eee" mr={2}>
        <Show when={duration() > 0}>{calculateTime(duration())}</Show>
      </Typography>
    </Stack>
  );
};

// from https://css-tricks.com/lets-create-a-custom-audio-player/
const calculateTime = (secs: number) => {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${returnedSeconds}`;
};

export default AudioPlayer;
