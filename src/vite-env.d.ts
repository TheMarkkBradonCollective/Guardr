/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}
