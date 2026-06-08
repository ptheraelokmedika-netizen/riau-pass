import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emeraldDeep: "#075D54",
        emeraldSoft: "#E7F3F0",
        champagne: "#C9A45C",
        ivory: "#FBFAF5",
        ink: "#1F2933"
      },
      boxShadow: {
        soft: "0 10px 35px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
