const messages = [
  "Could not connect to server",
  "Forgot password?",
  "Log in",
  "email",
  "password",
  "Passwords don't match.",
  "Password reset, you may now log in.",
  "If an account with that email exists, an email will be sent with a reset link.",
  "new password",
  "confirm new password",
  "Suggestions",
  "Reset password",
  "Audio deleted successfully",
  "Processing",
  "Recording saved successfully",
  "Uploading audio...",
  "Recording audio",
  "Add tag",
  "Existing tag",
  "Tag",
  "New tag",
  "Color",
  "Save",
  "No audios found.",
] as const;

type Messages = (typeof messages)[number];

function createEnDict() {
  const dict: { [x in Messages]: string } = {} as any;
  for (let msg of messages) {
    dict[msg] = msg;
  }
  return dict;
}
export const dict = createEnDict();
