import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

/**
 * Downloads a file from a given URL to a local destination.
 * 
 * @param url The HTTP/HTTPS URL of the file to download.
 * @param dest The local filesystem path where the file should be saved.
 */
export async function downloadFile(url: string, dest: string) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Frame55ArtRetriever/1.0 (https://github.com/lewiswestbury/frame-55-art)' },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`);
  if (!response.body) throw new Error(`No body for ${url}`);
  
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileStream = fs.createWriteStream(dest);
  await streamPipeline(response.body, fileStream);
}

/**
 * Pauses execution for a specified number of milliseconds.
 * 
 * @param ms The duration to sleep in milliseconds.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
