import { Component, For, Show, createSignal, onMount } from "solid-js";
import { Audio, Tag, deleteAudio, getTags } from "../api";
import {
  Checkbox,
  Container,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@suid/material";
import { Delete } from "@suid/icons-material";
import { A } from "@solidjs/router";
import Tags from "./Tags";
import { useT } from "../I18nProvider";

const AudiosTable: Component<{
  audios: Audio[];
  accessToken: string;
  setError: (error: string) => void;
  setInfoMsg: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
  setLoading: (loading: boolean) => void;
  refreshAudios: () => void;
}> = (props) => {
  const [existingTags, setExistingTags] = createSignal<Tag[] | null>(null);
  const t = useT();

  onMount(async () => {
    const { tags, error } = await getTags(props.accessToken);
    if (error) {
      props.setError(error);
    } else {
      setExistingTags(tags);
    }
  });

  return (
    <Container sx={{ mb: 10 }}>
      <TableContainer>
        <Table>
          <TableBody>
            <For each={props.audios} fallback={<p>{t("No audios found.")}</p>}>
              {(audio) => (
                <>
                  <AudioTableRow
                    audio={audio}
                    existingTags={existingTags()}
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
  existingTags: Tag[] | null;
  accessToken: string;
  setError: (error: string) => void;
  setInfoMsg: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
  setLoading: (loading: boolean) => void;
  refreshAudios: () => void;
}> = (props) => {
  const t = useT();

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
        backgroundColor:
          props.audio.transcription !== null ? "background.paper" : "#e0e0e0",
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox />
      </TableCell>
      <TableCell
        align="left"
        component={A}
        href={`/${props.audio.id}`}
        sx={{ textDecoration: "none" }}
      >
        <Show
          when={props.audio.transcription !== null}
          fallback={
            <Typography fontStyle="italic" fontSize="small">
              {t("Processing")}
            </Typography>
          }
        >
          <Typography>{props.audio.transcription}</Typography>
        </Show>
      </TableCell>
      <TableCell
        padding={props.audio.tags.length > 0 ? "checkbox" : "none"}
        align="right"
      >
        <Tags
          audioId={props.audio.id}
          tags={props.audio.tags}
          existingTags={props.existingTags || []}
          existingTagsLoading={props.existingTags === null}
          setError={props.setError}
          refresh={props.refreshAudios}
          accessToken={props.accessToken}
          justifyContent="end"
        />
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
