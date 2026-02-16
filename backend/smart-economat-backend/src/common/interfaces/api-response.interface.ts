export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  error?: unknown;
  meta: {
    app: string;
    version: string;
    timestamp: string;
    environment: string;
    requestId: string;
  };
}
