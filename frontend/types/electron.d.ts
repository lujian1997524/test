// 为Electron API提供TypeScript类型声明

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      openFile: (filePath: string) => Promise<void>;
      detectCADSoftware: () => Promise<{
        success: boolean;
        software?: any[];
        supportedExtensions?: string[];
        error?: string;
      }>;
      openCADFile: (filePath: string) => Promise<{
        success: boolean;
        software?: string;
        message?: string;
        error?: string;
      }>;
      getDetectedCADSoftware: () => Promise<{
        success: boolean;
        software?: any[];
        supportedExtensions?: string[];
        error?: string;
      }>;
      isCADFile: (filePath: string) => Promise<{
        success: boolean;
        isCADFile?: boolean;
        extension?: string;
        supportedExtensions?: string[];
        error?: string;
      }>;
    };
  }
}

export {};