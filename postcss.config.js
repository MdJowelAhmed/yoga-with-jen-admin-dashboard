import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute config path so Tailwind always resolves content (Windows / varying cwd). */
const tailwindConfigPath = path.join(__dirname, "tailwind.config.js");

export default {
  plugins: [tailwindcss({ config: tailwindConfigPath }), autoprefixer()],
};
