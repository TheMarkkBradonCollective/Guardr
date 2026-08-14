/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_NATIVE_FCM_CONFIGURED?: string;
  readonly VITE_PLAY_STORE_BUILD?: string;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}
