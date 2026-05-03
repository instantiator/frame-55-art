import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

/**
 * Pauses execution for a specified number of milliseconds.
 * 
 * @param ms The duration to sleep in milliseconds.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wraps fetch to automatically retry on 429 and 50x errors.
 * Respects the Retry-After header if present, otherwise uses exponential backoff.
 * 
 * @param url The URL to fetch.
 * @param options Fetch options.
 * @param maxRetries Maximum number of times to retry (default: 3).
 */
export async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const response = await fetch(url, options);
    
    // If successful, or if it's a client error like 404/403, just return
    if (response.ok || (response.status !== 429 && response.status < 500)) {
      return response;
    }

    if (attempt === maxRetries) {
      return response;
    }

    // Default to exponential backoff (1s, 2s, 4s...)
    let delay = Math.pow(2, attempt) * 1000; 

    // Check if the server explicitly told us how long to wait
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) {
      const parsedDelay = parseInt(retryAfter, 10);
      if (!isNaN(parsedDelay)) {
        delay = parsedDelay * 1000;
      }
    }

    console.warn(`\n[Retry] HTTP ${response.status} for ${url.substring(0, 50)}... Retrying in ${delay / 1000}s (Attempt ${attempt + 1}/${maxRetries})`);
    await sleep(delay);
    attempt++;
  }
  
  throw new Error('Unreachable retry state');
}

/**
 * Downloads a file from a given URL to a local destination.
 * 
 * @param url The HTTP/HTTPS URL of the file to download.
 * @param dest The local filesystem path where the file should be saved.
 */
export async function downloadFile(url: string, dest: string) {
  const response = await fetchWithRetry(url, {
    headers: { 'User-Agent': 'Frame55ArtRetriever/1.0 (https://github.com/lewiswestbury/frame-55-art)' },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Failed to download ${url}: HTTP ${response.status} ${response.statusText}`);
  if (!response.body) throw new Error(`No body for ${url}`);
  
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileStream = fs.createWriteStream(dest);
  await streamPipeline(response.body, fileStream);
}
