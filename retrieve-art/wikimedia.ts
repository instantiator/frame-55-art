import { ArtistMatch, ArtPiece } from './types';

/**
 * Searches Wikidata for an artist by name.
 * 
 * @param name The name of the artist to search for.
 * @param fullMatch If true, filters results to exact label matches only.
 */
export async function searchArtists(name: string, fullMatch: boolean): Promise<ArtistMatch[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&type=item`;
  const response = await fetch(url);
  const data = await response.json() as any;

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
  const artistResponse = await fetch(artistUrl);
  const artistData = await artistResponse.json() as any;
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
  
  const response = await fetch(sparqlUrl, {
    headers: { 'User-Agent': 'Frame55ArtRetriever/1.0 (https://github.com/lewiswestbury/frame-55-art)' }
  });
  
  if (!response.ok) {
    throw new Error(`SPARQL query failed: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const pieces = data.results.bindings.map((binding: any) => ({
    name: binding.workLabel.value,
    url: binding.image.value,
  }));

  return { artistName, pieces };
}
