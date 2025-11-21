const config = {
  plugins: {
    "@tailwindcss/postcss": {
      content: [
        "./app/**/*.{ts,tsx}",
        "../../packages/ui/source/**/*.{ts,tsx}",
        "../../packages/utilities/source/**/*.{ts,tsx}",
      ],
    },
  },
};

export default config;
