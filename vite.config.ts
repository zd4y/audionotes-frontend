import { defineConfig, loadEnv } from "vite";
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa";
// import devtools from 'solid-devtools/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const vitePwaOptions: Partial<VitePWAOptions> = {
    includeAssets: ["favicon.ico"],
    manifest: {
      name: "AudioNotes",
      short_name: "AudioNotes",
      description: "Audio notes",
      theme_color: "#eeeeee",
      icons: [
        {
          src: "pwa-64x64.png",
          sizes: "64x64",
          type: "image/png",
        },
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      runtimeCaching: [
        {
          handler: "NetworkOnly",
          urlPattern: new RegExp(env.VITE_API_BASE_URL + "/api/audios", "i"),
          method: "POST",
          options: {
            backgroundSync: {
              name: "uploadAudio",
              options: {
                maxRetentionTime: 24 * 60,
              },
            },
          },
        },
        {
          handler: "NetworkOnly",
          urlPattern: new RegExp(
            env.VITE_API_BASE_URL + "/api/audios/\\d+",
            "i",
          ),
          method: "DELETE",
          options: {
            backgroundSync: {
              name: "deleteAudio",
              options: {
                maxRetentionTime: 24 * 60,
              },
            },
          },
        },
      ],
    },
  };

  if (mode === "development") {
    vitePwaOptions.mode = "development";
    vitePwaOptions.devOptions = {
      enabled: true,
    };
  }

  return {
    plugins: [
      /* 
      Uncomment the following line to enable solid-devtools.
      For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
      */
      // devtools(),
      suidPlugin(),
      solidPlugin(),
      VitePWA(vitePwaOptions),
    ],
    server: {
      port: 3000,
    },
    build: {
      target: "esnext",
    },
  };
});
