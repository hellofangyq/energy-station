import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        mist: "#f5f3ef",
        ember: "#c86b3c",
        leaf: "#2e5e4e",
        moon: "#f3e8d0",
        sky: "#d9e7f6"
      },
      boxShadow: {
        glow: "0 18px 60px rgba(200, 107, 60, 0.35)",
        soft: "0 16px 40px rgba(0, 0, 0, 0.12)"
      },
      borderRadius: {
        xl: "24px",
        xxl: "32px"
      }
    }
  },
  plugins: []
};

export default config;
