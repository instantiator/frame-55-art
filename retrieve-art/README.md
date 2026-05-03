# retrieve-art

A Node.js command-line application to retrieve data about artists and download their artwork from Wikimedia Commons.

## Description

The `retrieve-art` module allows you to:
1. **Search for artists:** Query Wikidata to find the specific Wikidata ID for an artist.
2. **Download artwork:** Given an artist's Wikidata ID, the script runs a SPARQL query to find all associated artwork with an image, and downloads those high-resolution images from Wikimedia Commons to a local directory.
3. **Generate a summary:** It creates a JSON summary (`art.json`) of all downloaded pieces in the target directory.

## Prerequisites

- Node.js (v18 or higher recommended)
- The dependencies listed in `package.json`

## Installation

Navigate to the `retrieve-art` directory and install the dependencies:

```bash
cd retrieve-art
npm install
```

## Usage

You can run the script using the provided npm script or directly via `ts-node`:

```bash
# Using npm
npm start -- [options]

# Using ts-node directly
npx ts-node app.ts [options]
```

### Options

| Option | Alias | Description |
| :--- | :--- | :--- |
| `-i <id>` | `--id <id>` | **Required (or `-n`)**. The Wikidata ID of the artist to download art for. |
| `-n <name>` | `--name <name>` | **Required (or `-i`)**. The name to search for to find an artist's ID. |
| | `--full-match` | If set alongside a name search, only return exact name matches (default: `false`). |
| `-t <path>` | `--target <path>` | The target directory to save downloaded art. (default: `./art/source/<id> <artist_name>`) |
| `-l <limit>`| `--limit <limit>` | Maximum number of files to download. |
| `-f <format>`| `--format <format>`| The output format for search results and summaries. Can be `table`, `json`, or `csv`. (default: `table`) |
| `-h` | `--help` | Show the help message and exit. |

### Examples

**Search for an artist by name:**
```bash
npm start -- -n "Vincent van Gogh"
```

**Download art for Johannes Vermeer (Wikidata ID: Q41264):**
```bash
npm start -- -i Q41264 -t ../art/source/Vermeer
```

## Rate Limiting

The application includes a built-in 500ms delay between image downloads and a descriptive User-Agent to respect [Wikimedia's API etiquette and usage policies](https://www.mediawiki.org/wiki/API:Etiquette).
