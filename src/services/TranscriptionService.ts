import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY as string);
const MAX_CHUNK_SIZE = 20 * 1024 * 1024; // 20MB in bytes

export class TranscriptionService {
  static async transcribeChunk(chunkPath: string): Promise<string> {
    const chunk = await fs.readFile(chunkPath);
    const base64Audio = chunk.toString('base64');

    if (base64Audio.length > MAX_CHUNK_SIZE) {
      console.warn(`Chunk size (${base64Audio.length} bytes) exceeds limit. Skipping transcription.`);
      return '';
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent([
      "Transcribe the following podcast audio file accurately with timestamps:",
      {
        inlineData: {
          mimeType: "audio/mpeg",
          data: base64Audio
        }
      }
    ]);

    const response = await result.response;
    return response.text();
  }

  static async transcribeChunks(chunks: string[], onProgress: (progress: number) => void): Promise<string> {
    let fullTranscription = '';
    for (let i = 0; i < chunks.length; i++) {
      const transcription = await this.transcribeChunk(chunks[i]);
      fullTranscription += transcription + ' ';
      onProgress(Math.round(((i + 1) / chunks.length) * 100));
    }
    return fullTranscription.trim();
  }
}