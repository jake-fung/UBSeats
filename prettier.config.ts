import { type Config } from 'prettier';

const config: Config & { tailwindStylesheet: string } = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  tabWidth: 2,
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind v4 has no tailwind.config.js — the plugin must be pointed at the
  // stylesheet that owns `@import "tailwindcss"` to learn this project's theme.
  tailwindStylesheet: './src/index.css',
};

export default config;
