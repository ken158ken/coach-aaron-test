import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ isSsrBuild }) => {
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
    build: isSsrBuild
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
      // SSR 執行時配置 - 僅打包必要的 ESM-only 套件
      noExternal: ["react-icons", "gsap", "react-helmet-async"],
      // Three.js 生態系僅在客戶端 useEffect 中執行，SSR 時不需要
      external: ["three", "@react-three/fiber", "@react-three/drei"],
    },
  };
});
