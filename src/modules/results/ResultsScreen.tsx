import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { fetchBookMetadata, BookMetadata } from '../metadata/BookMetadataService';
import {
  addBookToLibrary,
  findBookByIsbn,
  updateBookStatus,
  LibraryBook,
} from '../../services/libraryService';

export default function ResultsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const isbn: string = route.params?.isbn ?? '';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [existingBook, setExistingBook] = useState<LibraryBook | null | undefined>(undefined);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [addedToLibrary, setAddedToLibrary] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data, error: fetchError }, { data: existing }] = await Promise.all([
        fetchBookMetadata(isbn),
        findBookByIsbn(isbn),
      ]);
      if (cancelled) return;
      if (fetchError) setError(fetchError);
      else if (data) setBook(data);
      setExistingBook(existing ?? null);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isbn]);

  const handleAddToLibrary = async () => {
    if (!book) return;
    setAddingToLibrary(true);
    const { error: saveError } = await addBookToLibrary(book);
    setAddingToLibrary(false);
    if (saveError) {
      Alert.alert('Error', saveError);
    } else {
      setAddedToLibrary(true);
      const { data: updated } = await findBookByIsbn(isbn);
      setExistingBook(updated ?? null);
    }
  };

  const handleLoan = () => {
    if (!existingBook) return;
    Alert.prompt(
      'Loan Book',
      `Who is borrowing "${existingBook.title}"?`,
      async (name) => {
        if (!name?.trim()) return;
        setUpdatingStatus(true);
        const { error: updateError } = await updateBookStatus(existingBook.id, 'loaned', name.trim());
        setUpdatingStatus(false);
        if (updateError) {
          Alert.alert('Error', updateError);
        } else {
          setExistingBook({ ...existingBook, status: 'loaned', borrowerName: name.trim() });
        }
      },
      'plain-text',
    );
  };

  const handleReturn = async () => {
    if (!existingBook) return;
    setUpdatingStatus(true);
    const { error: updateError } = await updateBookStatus(existingBook.id, 'in_library');
    setUpdatingStatus(false);
    if (updateError) {
      Alert.alert('Error', updateError);
    } else {
      setExistingBook({ ...existingBook, status: 'in_library', borrowerName: undefined });
    }
  };

  const handleShare = () => {
    if (!book) return;
    const text = [
      book.title && `Title: ${book.title}`,
      book.authors.length > 0 && `Author: ${book.authors.join(', ')}`,
      book.publisher && `Publisher: ${book.publisher}`,
      book.publishDate && `Published: ${book.publishDate}`,
      `ISBN: ${book.isbn}`,
    ]
      .filter(Boolean)
      .join('\n');
    Share.share({ message: text });
  };

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Looking up book…</Text>
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorText}>{error || 'No book info available.'}</Text>
        <Text style={styles.errorSub}>ISBN: {isbn || '—'}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.popToTop()}>
          <Text style={styles.btnText}>Scan Another Book</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const loanBadge = existingBook?.status === 'loaned'
    ? { label: `Loaned to ${existingBook.borrowerName || 'Unknown'}`, color: '#E67E22' }
    : existingBook?.status === 'in_library'
    ? { label: 'In Library', color: '#27AE60' }
    : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="contain" />
      ) : null}

      {loanBadge ? (
        <View style={[styles.statusBadge, { backgroundColor: loanBadge.color + '22', borderColor: loanBadge.color }]}>
          <Text style={[styles.statusBadgeText, { color: loanBadge.color }]}>{loanBadge.label}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Field label="Title" value={book.title} />
        <Field label="Author" value={book.authors.join(', ')} />
        <Field label="Publisher" value={book.publisher ?? ''} />
        <Field label="Published" value={book.publishDate ?? ''} />
        <Field label="Pages" value={book.pageCount ? String(book.pageCount) : ''} />
        <Field label="ISBN" value={book.isbn} />
      </View>

      <View style={styles.actions}>
        {existingBook === null && (
          <TouchableOpacity
            style={[styles.btn, styles.btnGreen, (addingToLibrary || addedToLibrary) && styles.btnDisabled]}
            onPress={handleAddToLibrary}
            disabled={addingToLibrary || addedToLibrary}
          >
            {addingToLibrary ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                {addedToLibrary ? '✓ Added to Library' : 'Add to Library'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {existingBook?.status === 'in_library' && (
          <TouchableOpacity
            style={[styles.btn, styles.btnOrange, updatingStatus && styles.btnDisabled]}
            onPress={handleLoan}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Loan Book</Text>
            )}
          </TouchableOpacity>
        )}

        {existingBook?.status === 'loaned' && (
          <TouchableOpacity
            style={[styles.btn, styles.btnGreen, updatingStatus && styles.btnDisabled]}
            onPress={handleReturn}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Return to Library</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleShare}>
          <Text style={styles.btnText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.btnText}>Scan Another Book</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, !value && styles.fieldEmpty]}>
        {value || 'Not available'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0F0F0F', padding: 20 },
  centred: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    padding: 24,
  },
  cover: { width: '100%', height: 260, marginBottom: 16, borderRadius: 8 },
  statusBadge: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  statusBadgeText: { fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 20, gap: 18 },
  field: { gap: 4 },
  fieldLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldValue: { color: '#F0F0F0', fontSize: 17, fontWeight: '500' },
  fieldEmpty: { color: '#555', fontStyle: 'italic' },
  actions: { marginTop: 24, gap: 12 },
  btn: { backgroundColor: '#4A90D9', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnGreen: { backgroundColor: '#27AE60' },
  btnOrange: { backgroundColor: '#E67E22' },
  btnSecondary: { backgroundColor: '#2C2C2E' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  loadingText: { color: '#aaa', marginTop: 14, fontSize: 15 },
  errorText: { color: '#FF6B6B', textAlign: 'center', marginBottom: 8, fontSize: 16 },
  errorSub: { color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 13 },
});
