import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

const MAX_CHUNK_SIZE = 16 * 1024 * 1024; // 19MB to leave some room for encoding overhead

export class AudioSplitService {
  static async splitAudio(audioBuffer: Buffer, onProgress: (progress: number) => void): Promise<string[]> {
    console.log('AudioSplitService: Starting audio split');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-'));
    const inputPath = path.join(tempDir, 'input.mp3');
    await fs.writeFile(inputPath, audioBuffer);

    try {
      const fileSize = audioBuffer.length;
      const totalChunks = Math.ceil(fileSize / MAX_CHUNK_SIZE);
      console.log(`AudioSplitService: File size: ${fileSize} bytes, Total chunks: ${totalChunks}`);

      const duration = await this.getAudioDuration(inputPath);
      console.log(`AudioSplitService: Total audio duration: ${duration} seconds`);

      const chunks: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = (i / totalChunks) * duration;
        const end = ((i + 1) / totalChunks) * duration;
        const chunkDuration = end - start;

        const outputPath = path.join(tempDir, `chunk_${i}.mp3`);
        await this.createChunk(inputPath, outputPath, start, chunkDuration);
        
        const chunkSize = (await fs.stat(outputPath)).size;
        if (chunkSize > MAX_CHUNK_SIZE) {
          console.warn(`Chunk ${i + 1} exceeds max size. Splitting further.`);
          const subChunks = await this.splitLargeChunk(outputPath, MAX_CHUNK_SIZE);
          chunks.push(...subChunks);
        } else {
          chunks.push(outputPath);
        }

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        onProgress(progress);
        console.log(`AudioSplitService: Created chunk ${i + 1}/${totalChunks}, progress: ${progress}%`);
      }

      console.log(`AudioSplitService: Splitting complete. Total chunks: ${chunks.length}`);
      return chunks;
    } catch (error) {
      console.error('Error in splitAudio:', error);
      throw error;
    }
  }

  private static async splitLargeChunk(chunkPath: string, maxSize: number): Promise<string[]> {
    const chunkSize = (await fs.stat(chunkPath)).size;
    const subChunks: string[] = [];
    const subChunkCount = Math.ceil(chunkSize / maxSize);
    const chunkDuration = await this.getAudioDuration(chunkPath);
    const subChunkDuration = chunkDuration / subChunkCount;

    for (let i = 0; i < subChunkCount; i++) {
      const start = i * subChunkDuration;
      const outputPath = `${chunkPath}_sub_${i}.mp3`;
      await this.createChunk(chunkPath, outputPath, start, subChunkDuration);
      subChunks.push(outputPath);
    }

    return subChunks;
  }

  private static createChunk(inputPath: string, outputPath: string, start: number, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(duration)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  static async cleanup(chunks: string[]): Promise<void> {
    for (const chunk of chunks) {
      try {
        await fs.unlink(chunk);
      } catch (error) {
        console.error(`Error deleting chunk ${chunk}:`, error);
      }
    }
    if (chunks.length > 0) {
      const tempDir = path.dirname(chunks[0]);
      try {
        await fs.rmdir(tempDir, { recursive: true });
      } catch (error) {
        console.error(`Error deleting temp directory ${tempDir}:`, error);
      }
    }
  }

  private static getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          if (typeof duration === 'number') {
            resolve(duration);
          } else {
            reject(new Error('Unable to determine audio duration'));
          }
        }
      });
    });
  }
}