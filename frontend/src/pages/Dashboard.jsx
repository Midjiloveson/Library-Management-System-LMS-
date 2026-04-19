import { useState, useEffect, useContext, useMemo } from 'react';
import {
  AppShell, Group, Title, Text, Button,
  Image, Badge, Container, TextInput, Loader, Center, Stack, Anchor,
  SegmentedControl
} from '@mantine/core';
import { 
  IconSearch, IconLogout, IconLibrary, 
  IconChevronRight, IconBookOff 
} from '@tabler/icons-react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axiosInstance';

function getOpenLibraryCover(isbn) {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user, logout } = useContext(AuthContext);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/books');
      setBooks(data);
    } catch (err) {
      console.error("Library Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  // 0. STATUS FILTER
  const filteredBooks = useMemo(() => {
    if (statusFilter === 'available') return books.filter(b => b.isAvailable);
    if (statusFilter === 'checked-out') return books.filter(b => !b.isAvailable);
    return books;
  }, [books, statusFilter]);

  // 1. UNIVERSAL SEARCH LOGIC (Title, Author, Category, ISBN)
  const searchResults = useMemo(() => {
    if (!search) return [];
    const query = search.toLowerCase().trim();

    return filteredBooks.filter(book => {
      const titleMatch    = book.title?.toLowerCase().includes(query);
      const authorMatch   = book.author?.toLowerCase().includes(query);
      const categoryMatch = book.category?.toLowerCase().includes(query);
      const isbnMatch     = book.isbn?.includes(query);

      return titleMatch || authorMatch || categoryMatch || isbnMatch;
    });
  }, [search, filteredBooks]);

  // 2. GENRE GROUPING LOGIC
  const groupedBooks = useMemo(() => {
    const groups = {};
    filteredBooks.forEach(book => {
      const genre = book.category || 'General Collection';
      if (!groups[genre]) groups[genre] = [];
      groups[genre].push(book);
    });
    return groups;
  }, [filteredBooks]);

  const handleSeeMore = (genreName) => {
    setSearch(genreName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppShell 
      header={{ height: 70 }} 
      padding="md" 
      className="bg-[#fdfaf6]"
    >
      {/* RESPONSIVE HEADER WITH ROLE LOGIC */}
      <AppShell.Header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm px-2 sm:px-4">
        <Container size="lg" className="h-full px-0 sm:px-3">
          <Group justify="space-between" align="center" className="h-full flex-nowrap">
            
            {/* LEFT: Logo & Title */}
            <Group gap="xs" className="flex-nowrap shrink">
              <div className="bg-slate-900 p-1.5 rounded-lg shrink-0">
                <IconLibrary size={18} color="white" stroke={1.5} />
              </div>
              <Title 
                order={3} 
                className="font-serif italic text-slate-800 truncate text-lg sm:text-xl"
              >
                The Archives
              </Title>
            </Group>
            
            {/* RIGHT: User & Exit */}
            <Group gap="xs" className="flex-nowrap">
              <div className="hidden md:flex flex-col items-end shrink-0">
                <Text size="xs" c="dimmed" fw={700} className="uppercase tracking-widest">
                  {user?.role === 'admin' ? 'Librarian' : 'Member'}
                </Text>
                <Text size="sm" fw={600}>{user?.firstName}</Text>
              </div>

              <Button 
                variant="light" 
                color="red" 
                onClick={logout} 
                size="xs"
                className="px-2 sm:px-3"
                leftSection={<IconLogout size={14} />}
              >
                <span className="hidden sm:inline">Exit Archives</span>
                <span className="inline sm:hidden">Exit</span>
              </Button>
            </Group>

          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        {/* STICKY FLOATING SEARCH BAR */}
        <div className="sticky top-[70px] z-20 bg-[#fdfaf6]/95 backdrop-blur-md border-b border-slate-200 py-4 sm:py-6 mb-6 sm:mb-10 shadow-sm">
          <Container size="sm">
            <TextInput
              size="lg"
              radius="xl"
              placeholder="Search Title, Author, Genre, or ISBN..."
              leftSection={<IconSearch size={20} stroke={1.5} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="shadow-md"
              rightSection={search && (
                <Anchor component="button" size="xs" onClick={() => setSearch('')} pr="md">
                  Clear
                </Anchor>
              )}
            />
            <Group justify="center" mt="sm">
              <SegmentedControl
                value={statusFilter}
                onChange={setStatusFilter}
                data={[
                  { label: `All (${books.length})`, value: 'all' },
                  { label: `Available (${books.filter(b => b.isAvailable).length})`, value: 'available' },
                  { label: `On Loan (${books.filter(b => !b.isAvailable).length})`, value: 'checked-out' },
                ]}
                size="sm"
                radius="xl"
              />
            </Group>
          </Container>
        </div>

        <Container size="lg">
          {loading ? (
            <Center h={300}><Loader color="dark" type="dots" /></Center>
          ) : search ? (
            /* SEARCH RESULTS VIEW */
            <>
              <Group justify="space-between" mb="xl" px="xs">
                <Title order={2} className="font-serif italic text-slate-800 text-xl sm:text-2xl">
                  Results for "{search}"
                </Title>
                <Text size="xs" c="dimmed" fw={700}>{searchResults.length} FOUND</Text>
              </Group>
              
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-8 pb-20">
                  {searchResults.map(book => <BookItem key={book._id} book={book} />)}
                </div>
              ) : (
                <Center h={200}>
                  <Stack align="center" gap="xs">
                    <IconBookOff size={48} color="#cbd5e1" />
                    <Text c="dimmed" fs="italic">No records match your query.</Text>
                  </Stack>
                </Center>
              )}
            </>
          ) : (
            /* GROUPED GENRE VIEW */
            Object.keys(groupedBooks).map(genre => (
              <section key={genre} className="mb-12 sm:mb-20">
                <Group justify="space-between" mb="lg" px="xs" className="border-b border-slate-200 pb-2">
                  <Title order={3} className="font-serif text-slate-700 text-lg sm:text-2xl">{genre}</Title>
                  <Button 
                    variant="subtle" 
                    color="indigo" 
                    size="xs"
                    rightSection={<IconChevronRight size={14} />}
                    onClick={() => handleSeeMore(genre)}
                  >
                    See More
                  </Button>
                </Group>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-8">
                  {groupedBooks[genre].slice(0, 6).map(book => (
                    <BookItem key={book._id} book={book} />
                  ))}
                </div>
              </section>
            ))
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

/* REUSABLE BOOK COMPONENT */
function BookItem({ book }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-sm shadow-sm group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 border-l-[4px] sm:border-l-[6px] border-slate-900/10">
        <Image
          src={getOpenLibraryCover(book.isbn)}
          fallbackSrc="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400"
          height="100%"
          alt={book.title}
          className="object-cover"
        />
        {!book.isAvailable && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <Badge color="red" variant="filled" size="xs">On Loan</Badge>
          </div>
        )}
      </div>

      <div className="px-1">
        <Text fw={700} size="xs" className="line-clamp-2 text-slate-900 leading-tight mb-0.5 sm:text-sm">
          {book.title}
        </Text>
        <Text size="xs" c="dimmed" className="italic truncate">
          {book.author}
        </Text>
      </div>
    </div>
  );
}