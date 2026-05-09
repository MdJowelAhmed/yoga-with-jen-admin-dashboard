import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { getConfigUrl } from "./src/redux/api/baseUrl";
import { isProduction } from "./src/redux/api/baseApi";

export default defineConfig({
  plugins: [react()],
  server: {
    host: getConfigUrl(isProduction),
    // host: "69.62.67.86",
    port: 3007,
  },
});
