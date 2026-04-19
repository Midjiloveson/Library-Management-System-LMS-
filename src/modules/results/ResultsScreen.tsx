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
import { addBookToLibrary } from '../../services/libraryService';

export default function ResultsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const isbn: string = route.params?.isbn ?? '';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [addedToLibrary, setAddedToLibrary] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await fetchBookMetadata(isbn);
      if (cancelled) return;
      if (fetchError) setError(fetchError);
      else if (data) setBook(data);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="contain" />
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
  cover: { width: '100%', height: 260, marginBottom: 20, borderRadius: 8 },
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
  btnSecondary: { backgroundColor: '#2C2C2E' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  loadingText: { color: '#aaa', marginTop: 14, fontSize: 15 },
  errorText: { color: '#FF6B6B', textAlign: 'center', marginBottom: 8, fontSize: 16 },
  errorSub: { color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 13 },
});
