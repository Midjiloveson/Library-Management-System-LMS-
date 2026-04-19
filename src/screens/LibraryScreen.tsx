import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLibraryBooks, removeBookFromLibrary, LibraryBook } from '../services/libraryService';

export default function LibraryScreen() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await getLibraryBooks();
    if (fetchError) setError(fetchError);
    else setBooks(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(loadBooks);

  const handleRemove = (book: LibraryBook) => {
    Alert.alert('Remove Book', `Remove "${book.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeBookFromLibrary(book.id);
          setBooks(prev => prev.filter(b => b.id !== book.id));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadBooks}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.centred}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No books yet.</Text>
        <Text style={styles.emptySubText}>Scan a book and tap "Add to Library".</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={books}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <BookRow book={item} onRemove={() => handleRemove(item)} />}
    />
  );
}

function BookRow({ book, onRemove }: { book: LibraryBook; onRemove: () => void }) {
  return (
    <View style={styles.row}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>📖</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title || 'Untitled'}</Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.authors.join(', ') || 'Unknown author'}
        </Text>
        {book.publishDate ? (
          <Text style={styles.meta}>{book.publishDate}</Text>
        ) : null}
        <Text style={styles.isbn}>ISBN: {book.isbn}</Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={10}>
        <Text style={styles.removeIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centred: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    padding: 24,
  },
  list: { backgroundColor: '#0F0F0F' },
  listContent: { padding: 16, gap: 12 },
  row: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cover: { width: 52, height: 72, borderRadius: 6 },
  coverPlaceholder: {
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: { fontSize: 22 },
  info: { flex: 1, gap: 3 },
  title: { color: '#F0F0F0', fontSize: 15, fontWeight: '600' },
  author: { color: '#aaa', fontSize: 13 },
  meta: { color: '#666', fontSize: 12 },
  isbn: { color: '#555', fontSize: 11 },
  removeBtn: { padding: 6 },
  removeIcon: { color: '#FF6B6B', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#FF6B6B', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#2C2C2E', padding: 12, borderRadius: 8 },
  retryText: { color: '#F0F0F0', fontWeight: '600' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#F0F0F0', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptySubText: { color: '#888', fontSize: 14, textAlign: 'center' },
});
