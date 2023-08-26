import { Box, CircularProgress, Fade } from "@suid/material";

const PageProgress = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Fade in style={{ transitionDelay: "400ms" }} unmountOnExit>
        <CircularProgress />
      </Fade>
    </Box>
  );
};

export default PageProgress;
