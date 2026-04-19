import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { BookMetadata } from '../modules/metadata/BookMetadataService';

export interface LibraryBook extends BookMetadata {
  id: string;
  addedAt: Date;
}

function booksCollection() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not logged in');
  return collection(db, 'users', uid, 'books');
}

export async function addBookToLibrary(book: BookMetadata): Promise<{ error?: string }> {
  try {
    const doc: Record<string, unknown> = {
      isbn: book.isbn,
      title: book.title,
      authors: book.authors,
      addedAt: Timestamp.now(),
    };
    if (book.publisher !== undefined) doc.publisher = book.publisher;
    if (book.publishDate !== undefined) doc.publishDate = book.publishDate;
    if (book.coverUrl !== undefined) doc.coverUrl = book.coverUrl;
    if (book.pageCount !== undefined) doc.pageCount = book.pageCount;
    await addDoc(booksCollection(), doc);
    return {};
  } catch (e: any) {
    return { error: e.message ?? 'Failed to save book.' };
  }
}

export async function getLibraryBooks(): Promise<{ data?: LibraryBook[]; error?: string }> {
  try {
    const q = query(booksCollection(), orderBy('addedAt', 'desc'));
    const snap = await getDocs(q);
    const data: LibraryBook[] = snap.docs.map(d => {
      const raw = d.data();
      return {
        id: d.id,
        addedAt: (raw.addedAt as Timestamp).toDate(),
        isbn: raw.isbn,
        title: raw.title,
        authors: raw.authors ?? [],
        publisher: raw.publisher,
        publishDate: raw.publishDate,
        coverUrl: raw.coverUrl,
        pageCount: raw.pageCount,
      };
    });
    return { data };
  } catch (e: any) {
    return { error: e.message ?? 'Failed to load library.' };
  }
}

export async function removeBookFromLibrary(id: string): Promise<{ error?: string }> {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { error: 'Not logged in' };
    await deleteDoc(doc(db, 'users', uid, 'books', id));
    return {};
  } catch (e: any) {
    return { error: e.message ?? 'Failed to remove book.' };
  }
}
