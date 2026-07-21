declare module "madge" {
  interface MadgeResult {
    obj(): Record<string, string[]>;
    circular(): string[][];
    depends(): Record<string, string[]>;
    dot(): string;
    image(path: string): Promise<void>;
    svg(): Promise<string>;
  }

  interface MadgeOptions {
    baseDir?: string;
    excludeRegExp?: RegExp[];
    extensions?: string[];
    fileExtensions?: string[];
    detectiveOptions?: Record<string, unknown>;
    includeNpm?: boolean;
    tsConfig?: string;
    webpackConfig?: string;
    layout?: string;
    threshold?: number;
    format?: string;
  }

  function madge(path: string, options?: MadgeOptions): Promise<MadgeResult>;
  export default madge;
}
