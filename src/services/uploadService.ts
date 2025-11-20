import api from './api';

// The response shape from our Go Backend
interface UploadResponse {
  url: string;
}

export const uploadService = {
  /**
   * Uploads a single file to the backend and returns the public URL.
   * @param file The File object from an <input type="file">
   */
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file); // Matches 'c.FormFile("file")' in Go

    // We use 'multipart/form-data' automatically when sending FormData
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  },
};