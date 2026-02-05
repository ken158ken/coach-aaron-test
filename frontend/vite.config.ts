import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, mode }) => {
  const isSSRBuild = mode === "ssr";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
    build: isSSRBuild
      ? {
          // SSR 構建配置
          outDir: "dist/server",
          ssr: true,
          rollupOptions: {
            input: path.resolve(__dirname, "src/entry-server.tsx"),
            output: {
              format: "esm",
              entryFileNames: "[name].js",
            },
          },
        }
      : {
          // 客戶端構建配置
          outDir: "dist/client",
          sourcemap: true,
          rollupOptions: {
            input: {
              main: path.resolve(__dirname, "index.html"),
            },
          },
        },
    ssr: {
      // SSR 執行時配置
      noExternal: [
        "react-icons",
        "gsap",
        "react-helmet-async",
        "three",
        "@react-three/fiber",
        "@react-three/drei",
      ],
    },
  };
});
