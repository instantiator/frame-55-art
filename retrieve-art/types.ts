/**
 * Represents a matching artist found in Wikidata.
 */
export interface ArtistMatch {
  /** The Wikidata item ID (e.g., 'Q41264') */
  id: string;
  /** The display name of the artist */
  label: string;
  /** A short description of the artist from Wikidata */
  description: string;
}

/**
 * Represents a single piece of art by an artist.
 */
export interface ArtPiece {
  /** The title or name of the artwork */
  name: string;
  /** The direct URL to the high-resolution image on Wikimedia Commons */
  url: string;
  /** The local filesystem path where the image is saved (if downloaded) */
  localPath?: string;
}
