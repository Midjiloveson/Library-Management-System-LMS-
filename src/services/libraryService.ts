import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { BookMetadata } from '../modules/metadata/BookMetadataService';

export type LoanStatus = 'in_library' | 'loaned';

export interface LibraryBook extends BookMetadata {
  id: string;
  addedAt: Date;
  status: LoanStatus;
  borrowerName?: string;
  loanedAt?: Date;
}

function booksCollection() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not logged in');
  return collection(db, 'users', uid, 'books');
}

export async function addBookToLibrary(book: BookMetadata): Promise<{ error?: string }> {
  try {
    const data: Record<string, unknown> = {
      isbn: book.isbn,
      title: book.title,
      authors: book.authors,
      addedAt: Timestamp.now(),
      status: 'in_library',
    };
    if (book.publisher !== undefined) data.publisher = book.publisher;
    if (book.publishDate !== undefined) data.publishDate = book.publishDate;
    if (book.coverUrl !== undefined) data.coverUrl = book.coverUrl;
    if (book.pageCount !== undefined) data.pageCount = book.pageCount;
    await addDoc(booksCollection(), data);
    return {};
  } catch (e: any) {
    return { error: e.message ?? 'Failed to save book.' };
  }
}

export async function findBookByIsbn(isbn: string): Promise<{ data?: LibraryBook; error?: string }> {
  try {
    const q = query(booksCollection(), where('isbn', '==', isbn));
    const snap = await getDocs(q);
    if (snap.empty) return {};
    const d = snap.docs[0];
    const raw = d.data();
    return {
      data: {
        id: d.id,
        addedAt: (raw.addedAt as Timestamp).toDate(),
        isbn: raw.isbn,
        title: raw.title,
        authors: raw.authors ?? [],
        publisher: raw.publisher,
        publishDate: raw.publishDate,
        coverUrl: raw.coverUrl,
        pageCount: raw.pageCount,
        status: (raw.status as LoanStatus) ?? 'in_library',
        borrowerName: raw.borrowerName ?? undefined,
        loanedAt: raw.loanedAt ? (raw.loanedAt as Timestamp).toDate() : undefined,
      },
    };
  } catch (e: any) {
    return { error: e.message ?? 'Failed to check library.' };
  }
}

export async function updateBookStatus(
  id: string,
  status: LoanStatus,
  borrowerName?: string,
): Promise<{ error?: string }> {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { error: 'Not logged in' };
    const ref = doc(db, 'users', uid, 'books', id);
    const updates: Record<string, unknown> = { status };
    if (status === 'loaned') {
      updates.borrowerName = borrowerName ?? '';
      updates.loanedAt = Timestamp.now();
    } else {
      updates.borrowerName = null;
      updates.loanedAt = null;
    }
    await updateDoc(ref, updates);
    return {};
  } catch (e: any) {
    return { error: e.message ?? 'Failed to update status.' };
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
        status: (raw.status as LoanStatus) ?? 'in_library',
        borrowerName: raw.borrowerName ?? undefined,
        loanedAt: raw.loanedAt ? (raw.loanedAt as Timestamp).toDate() : undefined,
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
