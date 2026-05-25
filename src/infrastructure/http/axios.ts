import axios from 'axios';

// Extend AxiosRequestConfig to support metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export { axios };
