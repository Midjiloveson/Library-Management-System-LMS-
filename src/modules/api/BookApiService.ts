import { API_BASE_URL } from '../../config/apiConfig';
import { getToken, refreshToken } from './AuthService';
import type { BookMetadata } from '../metadata/BookMetadataService';

const BASE_HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': 'true',
};

export type SaveStatus = 'saved' | 'exists' | 'error';

export interface SaveResult {
  status: SaveStatus;
  message: string;
  bookId?: string;
}

export interface UserSearchResult {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CheckoutResult {
  success: boolean;
  message: string;
}

async function authedFetch(
  url: string,
  options: RequestInit,
  retryOn401 = true,
): Promise<Response> {
  const token = await getToken();
  const res = await fetch(url, {
    ...options,
    headers: { ...BASE_HEADERS, ...(options.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 && retryOn401) {
    const newToken = await refreshToken();
    if (!newToken) return res;
    return fetch(url, {
      ...options,
      headers: { ...BASE_HEADERS, ...(options.headers as Record<string, string>), Authorization: `Bearer ${newToken}` },
    });
  }

  return res;
}

// --------------- Save book to library ---------------

export async function saveBookToLibrary(book: BookMetadata): Promise<SaveResult> {
  const body = {
    title: book.title,
    author: book.authors.join(', ') || 'Unknown',
    isbn: book.isbn,
    category: 'General',
    isAvailable: true,
  };

  try {
    const res = await authedFetch(`${API_BASE_URL}/books/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) return { status: 'saved', message: 'Book has been added to the library catalog.' };

    if (res.status === 400) {
      const bookId = await findBookByIsbn(book.isbn);
      if (bookId) return { status: 'exists', message: 'This ISBN is already in the library.', bookId };
      return { status: 'exists', message: 'This book may already exist in the library.' };
    }

    return { status: 'error', message: `Server returned ${res.status}.` };
  } catch (err) {
    console.error('[BookApiService]', err);
    return { status: 'error', message: 'Could not reach the server. Check your network connection.' };
  }
}

// --------------- Find book by ISBN ---------------

async function findBookByIsbn(isbn: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/books/search?query=${encodeURIComponent(isbn)}`,
      { headers: BASE_HEADERS },
    );
    if (!res.ok) return null;
    const books: Array<{ _id: string; isbn: string }> = await res.json();
    return books.find((b) => b.isbn === isbn)?._id ?? null;
  } catch {
    return null;
  }
}

// --------------- Search users (patron lookup) ---------------

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  try {
    const res = await authedFetch(
      `${API_BASE_URL}/auth/admin/search-users?query=${encodeURIComponent(query)}`,
      {},
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// --------------- Checkout book to patron ---------------

export async function checkoutBook(bookId: string, userId: string): Promise<CheckoutResult> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/books/borrow/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId }),
    });

    const json = await res.json().catch(() => null);

    if (res.ok) return { success: true, message: json?.message ?? 'Book checked out successfully.' };
    return { success: false, message: json?.message ?? `Server returned ${res.status}.` };
  } catch (err) {
    console.error('[BookApiService]', err);
    return { success: false, message: 'Could not reach the server.' };
  }
}
