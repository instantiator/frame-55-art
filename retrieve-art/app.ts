import fs from 'fs';
import path from 'path';
import { downloadFile, sleep } from './io';
import { formatOutput } from './format';
import { searchArtists, getArtistArt, getFileLicense } from './wikimedia';

/**
 * Command-line arguments parsed for the application.
 */
interface AppArgs {
  /** The Wikidata ID of the artist to process. */
  id?: string;
  /** The name of the artist to search for. */
  name?: string;
  /** Whether to enforce an exact name match during search. */
  fullMatch: boolean;
  /** The directory where artwork should be saved. */
  target?: string;
  /** The format for console output. */
  format: 'table' | 'json' | 'csv';
  /** The maximum number of artworks to download. */
  limit?: number;
}

/**
 * Prints the CLI usage help message to the console.
 */
function printHelp() {
  console.log(`
Usage:
  node app.js [options]

Options:
  -i <id>,      --id <id>          If provided, use this artist's id to download art
  -n <name>,    --name <name>      If provided, use this name to search for artists
                --full-match       If set, the return exactly matches on name, only (default: false)
  -t <path>,    --target <path>    Target directory to save art (default: ./art/source/<id> <artist_name>)
  -l <limit>,   --limit <limit>    Maximum number of files to download
  -f <format>,  --format <format>  Output format for search results (table, json, or csv format - default: table)
  -h,           --help             Show this help message and exit
`);
}

/**
 * Parses command-line arguments into an AppArgs object.
 */
function parseArgs(): AppArgs {
  const args: AppArgs = {
    fullMatch: false,
    format: 'table',
  };

  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-i':
      case '--id':
        args.id = argv[++i];
        break;
      case '-n':
      case '--name':
        args.name = argv[++i];
        break;
      case '--full-match':
        args.fullMatch = true;
        break;
      case '-t':
      case '--target':
        args.target = argv[++i];
        break;
      case '-l':
      case '--limit':
        args.limit = parseInt(argv[++i], 10);
        break;
      case '-f':
      case '--format': {
        const formatArg = argv[++i] as any;
        if (['table', 'json', 'csv'].includes(formatArg)) {
          args.format = formatArg;
        }
        break;
      }
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  if (!args.id && !args.name) {
    console.error('Error: Either artist ID or name must be provided.');
    printHelp();
    process.exit(1);
  }

  return args;
}

/**
 * The main entry point for the CLI application.
 * Orchestrates argument parsing, searching, downloading, and summarizing.
 */
async function main() {
  const args = parseArgs();

  try {
    if (args.name) {
      const artists = await searchArtists(args.name, args.fullMatch);
      formatOutput(artists, args.format);
    } else if (args.id) {
      const { artistName, pieces: allPieces } = await getArtistArt(args.id);
      const safeArtistName = artistName.replace(/[/?<>\\:*|"]/g, '_');
      const targetDir = args.target || `./art/source/${args.id} ${safeArtistName}`;
      
      const pieces = args.limit && args.limit > 0 ? allPieces.slice(0, args.limit) : allPieces;
      
      console.log(`Found ${pieces.length} pieces for artist: ${artistName}`);
      
      const summary: any[] = [];
      
      for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        const rawFileName = path.basename(new URL(piece.url).pathname);
        const decodedFileName = decodeURIComponent(rawFileName);
        // Replace illegal filesystem characters with an underscore
        const fileName = decodedFileName.replace(/[/?<>\\:*|"]/g, '_');
        const localPath = path.join(targetDir, fileName);
        
        // Retrieve license information using the true Commons title
        const licenseInfo = await getFileLicense(decodedFileName);
        
        if (fs.existsSync(localPath)) {
          console.log(`[${i + 1}/${pieces.length}] Skipping (already exists): ${piece.name}`);
          summary.push({
            artistName,
            pieceName: piece.name,
            path: localPath,
            sourceUrl: piece.url,
            license: licenseInfo.name,
            licenseUrl: licenseInfo.url
          });
          continue;
        }

        console.log(`[${i + 1}/${pieces.length}] Downloading: ${piece.name} ...`);
        try {
          await downloadFile(piece.url, localPath);
          summary.push({
            artistName,
            pieceName: piece.name,
            path: localPath,
            sourceUrl: piece.url,
            license: licenseInfo.name,
            licenseUrl: licenseInfo.url
          });
          // Be respectful to Wikimedia servers
          await sleep(500); 
        } catch (err) {
          console.error(`Failed to download ${piece.name}:`, (err as Error).message);
        }
      }
      
      // Save summary to art.json
      const jsonSummaryPath = path.join(targetDir, 'art.json');
      fs.writeFileSync(jsonSummaryPath, JSON.stringify(summary, null, 2));
      
      // Save summary to art.csv
      if (summary.length > 0) {
        const csvSummaryPath = path.join(targetDir, 'art.csv');
        const keys = Object.keys(summary[0]);
        const csvLines = [
          keys.join(','),
          ...summary.map(item => keys.map(key => `"${String(item[key]).replace(/"/g, '""')}"`).join(','))
        ];
        fs.writeFileSync(csvSummaryPath, csvLines.join('\n'));
      }
      
      console.log(`\nSummary of downloaded art:`);
      formatOutput(summary, args.format);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main();
