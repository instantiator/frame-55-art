import { ArtistMatch, ArtPiece } from './types';
import { fetchWithRetry } from './io';

/**
 * Helper function to fetch and safely parse JSON.
 * If parsing fails, it throws an error containing the raw response body.
 */
async function fetchAndParseJson(url: string, options?: RequestInit): Promise<any> {
  const response = await fetchWithRetry(url, options);
  const text = await response.text();

  
  if (!response.ok) {
    const errorMsg = `HTTP Error ${response.status}: ${response.statusText}\nRaw response:\n${text.substring(0, 2000)}`;
    throw new Error(errorMsg);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON. Raw response:\n${text.substring(0, 2000)}`, { cause: err });
  }
}

/**
 * Searches Wikidata for an artist by name.
 * 
 * @param name The name of the artist to search for.
 * @param fullMatch If true, filters results to exact label matches only.
 */
export async function searchArtists(name: string, fullMatch: boolean): Promise<ArtistMatch[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&type=item`;
  const data = await fetchAndParseJson(url, {
    headers: { 'User-Agent': 'Frame55ArtRetriever/1.0 (https://github.com/lewiswestbury/frame-55-art)' }
  });

  let results = data.search.map((item: any) => ({
    id: item.id,
    label: item.label,
    description: item.description || '',
  }));

  if (fullMatch) {
    results = results.filter((item: ArtistMatch) => item.label.toLowerCase() === name.toLowerCase());
  }

  return results;
}

/**
 * Retrieves an artist's name and their associated artworks from Wikidata via SPARQL.
 * 
 * @param artistId The Wikidata ID of the artist (e.g., Q41264).
 */
export async function getArtistArt(artistId: string): Promise<{ artistName: string; pieces: ArtPiece[] }> {
  // Query to get artist name
  const artistUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${artistId}&props=labels&languages=en&format=json`;
  const artistData = await fetchAndParseJson(artistUrl, {
    headers: { 'User-Agent': 'Frame55ArtRetriever/1.0 (https://github.com/lewiswestbury/frame-55-art)' }
  });
  const artistName = artistData.entities[artistId]?.labels?.en?.value || artistId;

  // SPARQL query to find works by artist (P170) with images (P18)
  const sparqlQuery = `
    SELECT ?work ?workLabel ?image WHERE {
      ?work wdt:P170 wd:${artistId}.
      ?work wdt:P18 ?image.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const sparqlUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
  
  const data = await fetchAndParseJson(sparqlUrl, {
    headers: { 'User-Agent': 'Frame55ArtRetriever/1.0 (https://github.com/lewiswestbury/frame-55-art)' }
  });

  const pieces = data.results.bindings.map((binding: any) => ({
    name: binding.workLabel.value,
    url: binding.image.value,
  }));

  return { artistName, pieces };
}
