import axios from 'axios';

export class DownloadService {
  static async downloadAudio(audioUrl: string, onProgress: (progress: number) => void): Promise<Buffer> {
    console.log('DownloadService: Starting download from', audioUrl);
    try {
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
          onProgress(percentCompleted);
        },
      });
      console.log('DownloadService: Download completed successfully');
      return Buffer.from(response.data);
    } catch (error) {
      console.error('DownloadService: Error downloading audio:', error);
      if (axios.isAxiosError(error)) {
        console.error('DownloadService: Axios error details:', error.response?.data);
      }
      throw error;
    }
  }
}