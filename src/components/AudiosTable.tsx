import { Component, For, Show } from "solid-js";
import { Audio, deleteAudio } from "../api";
import {
  Checkbox,
  Chip,
  Container,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@suid/material";
import { Delete } from "@suid/icons-material";

const AudiosTable: Component<{
  audios: Audio[];
  accessToken: string;
  setError: (error: string) => void;
  setInfoMsg: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
  setLoading: (loading: boolean) => void;
  refreshAudios: () => void;
}> = (props) => {
  return (
    <Container sx={{ mb: 10 }}>
      <TableContainer>
        <Table>
          <TableBody>
            <For each={props.audios} fallback={<p>No audios found</p>}>
              {(audio) => (
                <>
                  <AudioTableRow
                    audio={audio}
                    accessToken={props.accessToken}
                    setError={props.setError}
                    setInfoMsg={props.setInfoMsg}
                    setSuccessMsg={props.setSuccessMsg}
                    setLoading={props.setLoading}
                    refreshAudios={props.refreshAudios}
                  />
                  <Divider />
                </>
              )}
            </For>
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

const AudioTableRow: Component<{
  audio: Audio;
  accessToken: string;
  setError: (error: string) => void;
  setInfoMsg: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
  setLoading: (loading: boolean) => void;
  refreshAudios: () => void;
}> = (props) => {
  const handleDeleteButtonClick = async () => {
    props.setLoading(true);
    const { error, info } = await deleteAudio(
      props.accessToken,
      props.audio.id,
    );
    if (error) {
      props.setError(error);
    } else if (info) {
      props.setInfoMsg(info);
    } else {
      props.setSuccessMsg("Audio deleted successfully");
    }
    props.setLoading(false);
    props.refreshAudios();
  };

  return (
    <TableRow
      sx={{
        backgroundColor: props.audio.transcription
          ? "background.paper"
          : "#e0e0e0",
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox />
      </TableCell>
      <TableCell align="left">
        <Show
          when={props.audio.transcription}
          fallback={
            <Typography fontStyle="italic" fontSize="small">
              Processing
            </Typography>
          }
        >
          <Typography>{props.audio.transcription}</Typography>
        </Show>
      </TableCell>
      <TableCell padding="checkbox">
        <Stack direction="row" spacing={1}>
          <For each={props.audio.tags}>
            {(tag) => (
              <Chip
                label={tag.name}
                variant="filled"
                sx={{ backgroundColor: tag.color || undefined }}
              />
            )}
          </For>
        </Stack>
      </TableCell>
      <TableCell padding="checkbox">
        <IconButton onClick={handleDeleteButtonClick}>
          <Delete />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default AudiosTable;
