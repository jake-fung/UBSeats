import { type Config } from 'prettier';

const config: Config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  tabWidth: 2,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
