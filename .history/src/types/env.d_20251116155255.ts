// src/types/env.d.ts

// This file declares the environment variables available to TypeScript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // The API URL we use in axios calls
      REACT_APP_API_URL: string;
      // You can add other env variables here:
      // NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// Ensure this file is included by your tsconfig.json (usually by default)
export {};