/**
 * BookMetadataService.ts
 * Fetches authoritative book metadata from the Open Library API using an ISBN.
 * No API key or authentication required.
 * Docs: https://openlibrary.org/dev/docs/api/books
 */

export interface BookMetadata {
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishDate?: string;
  coverUrl?: string;
  pageCount?: number;
}

interface FetchResult {
  data?: BookMetadata;
  error?: string;
}

export async function fetchBookMetadata(isbn: string): Promise<FetchResult> {
  if (!isbn) return { error: 'No ISBN provided.' };

  const key = `ISBN:${isbn}`;
  const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(key)}&format=json&jscmd=data`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { error: `Open Library returned ${response.status}.` };
    }

    const json = await response.json();
    const entry = json?.[key];

    if (!entry) {
      return { error: `Book not found for ISBN ${isbn}.` };
    }

    const data: BookMetadata = {
      isbn,
      title: entry.title ?? '',
      authors: Array.isArray(entry.authors)
        ? entry.authors.map((a: { name: string }) => a.name).filter(Boolean)
        : [],
      publisher: Array.isArray(entry.publishers) && entry.publishers[0]
        ? entry.publishers[0].name
        : undefined,
      publishDate: entry.publish_date,
      coverUrl: entry.cover?.medium ?? entry.cover?.large ?? entry.cover?.small,
      pageCount: typeof entry.number_of_pages === 'number' ? entry.number_of_pages : undefined,
    };

    return { data };
  } catch (err) {
    console.error('[BookMetadataService]', err);
    return { error: 'Could not reach Open Library. Check your internet connection.' };
  }
}
