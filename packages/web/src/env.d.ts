declare module "*.css";
declare module "@zcode/ui/styles.css";

interface ImportMetaEnv {
  // 本文件手写声明了 Vite env 形状，内置 BASE_URL 也需要显式补上。
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly VITE_DEV_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
