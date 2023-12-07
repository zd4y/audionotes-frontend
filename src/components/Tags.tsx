import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@suid/material";
import { Component, For, Show, createSignal } from "solid-js";
import { Tag } from "../api";
import { AddCircle } from "@suid/icons-material";
import { StackProps } from "@suid/material/Stack";
import { SelectChangeEvent } from "@suid/material/Select";
import { tagAudio as apiTagAudio } from "../api";
import { useT } from "../I18nProvider";

const Tags: Component<
  {
    audioId: number;
    tags: Tag[];
    existingTags: Tag[];
    existingTagsLoading: boolean;
    accessToken: string;
    setError: (error: string) => void;
    refresh: () => void;
  } & StackProps
> = (props) => {
  const [selectedExistingTag, setSelectedExistingTag] = createSignal("");
  const [newTagColor, setNewTagColor] = createSignal("#2196f3");
  const [newTagName, setNewTagName] = createSignal("");
  const [newTagDialogOpen, setNewTagDialogOpen] = createSignal(false);
  const t = useT();
  const rest = () => {
    const { tags: _, ...rest } = props;
    return rest;
  };

  const handleExistingTagSelect = async (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    setSelectedExistingTag(value);
    setNewTagDialogOpen(false);
    await tagAudio({ name: value });
  };

  const handleNewTagBtnClick = () => {
    setNewTagDialogOpen(true);
  };

  const handleNewTagSave = async () => {
    const data = { name: newTagName(), color: newTagColor() };
    setNewTagDialogOpen(false);
    await tagAudio(data);
  };

  const tagAudio = async (tagData: { name: string; color?: string }) => {
    const { error } = await apiTagAudio(
      props.accessToken,
      props.audioId,
      tagData,
    );
    if (error) {
      props.setError(error);
    }
    props.refresh();
  };

  return (
    <Stack direction="row" spacing={1} {...rest()}>
      <For each={props.tags}>
        {(tag) => (
          <Chip
            label={tag.name}
            variant="filled"
            sx={{ backgroundColor: tag.color || undefined }}
          />
        )}
      </For>
      <Show when={!props.existingTagsLoading}>
        <IconButton size="small" color="primary" onClick={handleNewTagBtnClick}>
          <AddCircle fontSize="inherit" />
        </IconButton>
      </Show>
      <Dialog
        open={newTagDialogOpen()}
        onClose={() => setNewTagDialogOpen(false)}
      >
        <DialogTitle>{t("Add tag")}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" mb={1}>
            {t("Existing tag")}
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="select-existing-tag-label">{t("Tag")}</InputLabel>
            <Select
              value={selectedExistingTag()}
              id="nose"
              labelId="select-existing-tag-label"
              label="Tag"
              sx={{ mb: 2 }}
              onChange={handleExistingTagSelect}
            >
              <For each={props.existingTags}>
                {(existingTag) => (
                  <MenuItem value={existingTag.name}>
                    {existingTag.name}
                  </MenuItem>
                )}
              </For>
            </Select>
          </FormControl>
          <Divider />
          <Typography variant="h6" mt={2} mb={1}>
            {t("New tag")}
          </Typography>
          <Stack>
            <Box mb={2}>
              <input
                name="color"
                type="color"
                value={newTagColor()}
                onInput={(e) => setNewTagColor(e.currentTarget.value)}
              />
              <label for="color" style={{ "margin-left": "10px" }}>
                {t("Color")}
              </label>
            </Box>
            <TextField
              required
              name="name"
              label="name"
              value={newTagName()}
              onChange={(_, value) => setNewTagName(value)}
            />
            <Button sx={{ mt: 1 }} onClick={handleNewTagSave}>
              {t("Save")}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default Tags;
