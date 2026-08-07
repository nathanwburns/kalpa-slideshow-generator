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
          paper: "#F4F4F4",
          mist: "#EAE7DF",
          ink: "#102132",
          frame: "#D9E2E8"
        }
      },
      fontFamily: {
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        panel: "0 18px 48px rgba(7, 30, 46, 0.10)",
        frame: "0 8px 24px rgba(7, 30, 46, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
