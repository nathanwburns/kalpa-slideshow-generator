import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kalpa: {
          blue: "#007ABE",
          navy: "#001A29",
          peach: "#ED854D",
          orange: "#FF8C00",
          support: "#7FBCDE",
          paper: "#F4F4F4"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        panel: "0 24px 64px rgba(0, 26, 41, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
