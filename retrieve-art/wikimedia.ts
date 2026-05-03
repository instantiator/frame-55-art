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

/**
 * Retrieves the license information for a specific file from Wikimedia Commons.
 * 
 * @param fileName The raw filename on Wikimedia Commons (e.g., 'Johannes_Vermeer_-_Diana_and_her_Nymphs.jpg')
 */
export async function getFileLicense(fileName: string): Promise<{ name: string; url: string }> {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${encodeURIComponent(fileName)}&format=json`;
  
  const data = await fetchAndParseJson(apiUrl, {
    headers: { 'User-Agent': 'Frame55ArtRetriever/1.0 (https://github.com/lewiswestbury/frame-55-art)' }
  });

  try {
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return { name: 'Unknown', url: '' };
    
    const extmetadata = pages[pageId].imageinfo[0].extmetadata;
    const name = extmetadata.LicenseShortName?.value || extmetadata.License?.value || 'Unknown';
    
    // Wikimedia provides a LicenseUrl for Creative Commons licenses
    let url = extmetadata.LicenseUrl?.value || '';
    
    // If there is no specific URL but it is public domain, provide the CC Public Domain Mark as a fallback reference
    if (!url && name.toLowerCase().includes('public domain')) {
      url = 'https://creativecommons.org/publicdomain/mark/1.0/';
    }
    
    return { name, url };
  } catch {
    return { name: 'Unknown', url: '' };
  }
}
