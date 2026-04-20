import { notifications } from '@mantine/notifications';
import { useState, useEffect, useContext } from 'react';
import { 
  AppShell, Group, Title, Text, Button, 
  Image, Badge, Container, TextInput, Loader, Center, Stack, Anchor,
  Modal, Divider, Drawer, ScrollArea, Paper, Alert, Pagination, Textarea,
  ActionIcon, Affix 
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { 
  IconSearch, IconLogout, IconLibrary, 
  IconChevronRight, IconClock, IconUserCircle, IconAlertCircle,
  IconPlus, IconTrash, IconEdit, IconBarcode 
} from '@tabler/icons-react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axiosInstance';
import BarcodeScanner from '../components/BarcodeScanner';
import AdminReports from '../components/AdminReports';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  // --- LIBRARY DISPLAY STATES ---
  const [groupedBooks, setGroupedBooks] = useState({});
  const [paginatedBooks, setPaginatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [bookPage, setBookPage] = useState(1);
  const [totalBookPages, setTotalBookPages] = useState(1);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);

  // If there is text in the search bar OR a category is selected, switch to Paginated Mode
  const isPaginatedView = debouncedSearch !== '' || selectedCategory !== '';

  // --- MODALS & DRAWERS ---
  const [opened, { open, close }] = useDisclosure(false);
  const [accountOpened, { open: openAccount, close: closeAccount }] = useDisclosure(false); 
  const [addBookOpened, { open: openAddBook, close: closeAddBook }] = useDisclosure(false);
  const [editBookOpened, { open: openEditBook, close: closeEditBook }] = useDisclosure(false);
  const [logoutModalOpened, { open: openLogoutModal, close: closeLogoutModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [profileModalOpened, { open: openProfileModal, close: closeProfileModal }] = useDisclosure(false);
  const [resetPassModalOpened, { open: openResetPassModal, close: closeResetPassModal }] = useDisclosure(false);
  const [patronDashboardOpened, { open: openPatronDashboard, close: closePatronDashboard }] = useDisclosure(false);
  const [scannerOpened, { open: openScanner, close: closeScanner }] = useDisclosure(false);

  // --- ACTION STATES ---
  const [selectedBook, setSelectedBook] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newBookData, setNewBookData] = useState({ title: '', author: '', category: '', isbn: '', description: '' });
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editBookData, setEditBookData] = useState({ title: '', author: '', category: '', isbn: '', description: '' });
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [accountToDelete, setAccountToDelete] = useState(null); 
  const [profileData, setProfileData] = useState({ email: '', phone: '' });
  const [newPassword, setNewPassword] = useState('');

  // --- MY ACCOUNT STATES ---
  const [myBorrowed, setMyBorrowed] = useState([]);
  const [myHolds, setMyHolds] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);

  // --- PATRON LOOKUP STATES ---
  const [patronSearch, setPatronSearch] = useState('');
  const [patronResults, setPatronResults] = useState([]);
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [patronLoading, setPatronLoading] = useState(false);
  const [patronPage, setPatronPage] = useState(1);
  const itemsPerPage = 10;
  const [viewingPatron, setViewingPatron] = useState(null);
  const [patronBooks, setPatronBooks] = useState([]);
  const [patronHolds, setPatronHolds] = useState([]);
  const [patronDataLoading, setPatronDataLoading] = useState(false);

  const totalPages = Math.ceil(patronResults.length / itemsPerPage);
  const paginatedPatrons = patronResults.slice((patronPage - 1) * itemsPerPage, patronPage * itemsPerPage);

  // --- FETCHING LOGIC ---
  const fetchGroupedBooks = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data } = await API.get('/books/grouped');
      setGroupedBooks(data);
      if (selectedBook) updateSelectedBookFromList(Object.values(data).flat());
    } catch (err) { console.error("Library Error:", err); } 
    finally { if (!isSilent) setLoading(false); }
  };

  const fetchPaginatedBooks = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data } = await API.get(`/books?page=${bookPage}&limit=18&search=${encodeURIComponent(debouncedSearch)}&category=${encodeURIComponent(selectedCategory)}`);
      setPaginatedBooks(data.books);
      setTotalBookPages(data.totalPages);
      setBookPage(data.currentPage);
      if (selectedBook) updateSelectedBookFromList(data.books);
    } catch (err) { console.error("Library Error:", err); } 
    finally { if (!isSilent) setLoading(false); }
  };

  const updateSelectedBookFromList = (bookList) => {
    const updated = bookList.find(b => b._id === selectedBook._id);
    if (updated) setSelectedBook(updated);
  };

  const fetchAccountData = async () => {
    setAccountLoading(true);
    try {
      const [borrowedRes, holdsRes] = await Promise.all([
        API.get('/books/my-books'),
        API.get('/books/my-holds')
      ]);
      setMyBorrowed(borrowedRes.data);
      setMyHolds(holdsRes.data);
    } catch (err) {
      console.error("Error fetching account data", err);
    } finally {
      setAccountLoading(false);
    }
  };

  const searchPatrons = async () => {
    if (!patronSearch.trim() || user?.role !== 'admin') {
      setPatronResults([]);
      return;
    }
    setPatronLoading(true);
    try {
      const { data } = await API.get(`/auth/admin/search-users?query=${patronSearch}`);
      setPatronResults(data);
    } catch (err) {
      console.error("Patron search failed", err);
    } finally {
      setPatronLoading(false);
    }
  };

  const fetchSpecificPatronData = async (patron) => {
    setViewingPatron(patron);
    openPatronDashboard();
    setPatronDataLoading(true);
    try {
      const [borrowedRes, holdsRes] = await Promise.all([
        API.get(`/books/my-books?userId=${patron._id}`),
        API.get(`/books/my-holds?userId=${patron._id}`)
      ]);
      setPatronBooks(borrowedRes.data || []);
      setPatronHolds(holdsRes.data || []);
    } catch (err) {
      console.error("Error fetching patron data", err);
    } finally {
      setPatronDataLoading(false);
    }
  };

  // Determine which view to fetch when states change
  useEffect(() => {
    if (isPaginatedView) {
      fetchPaginatedBooks();
    } else {
      // Fetch silently if we already have the home page data to prevent scroll jumping
      fetchGroupedBooks(Object.keys(groupedBooks).length > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategory, bookPage]);

  useEffect(() => { if (accountOpened) fetchAccountData(); }, [accountOpened]);

  // --- SCANNER HANDLER ---
  const handleScanSuccess = async (isbn) => {
    closeScanner(); // Close the camera modal instantly
    notifications.show({ title: 'Scan Successful', message: `Looking up ISBN: ${isbn}...`, color: 'blue' });

    try {
      // Query your backend directly for that specific ISBN
      const { data } = await API.get(`/books?limit=1&search=${encodeURIComponent(isbn)}`);
      
      if (data.books && data.books.length > 0) {
        // We found the book! Set it as the active book and open the details modal
        setSelectedBook(data.books[0]);
        open(); 
      } else {
        // The book doesn't exist in your catalog yet
        notifications.show({ 
          title: 'Not Found', 
          message: `ISBN ${isbn} is not in the library catalog.`, 
          color: 'orange' 
        });
      }
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: 'Failed to look up the scanned book.', color: 'red' });
    }
  };

  // --- ACTION HANDLERS ---
  const handleAction = async (actionType, bookId = null, overrideUserId = null) => {
    const targetId = bookId || selectedBook?._id;
    if (!targetId) return;
    
    setActionLoading(true);
    try {
      const isAdminAction = user?.role === 'admin' && (overrideUserId || selectedPatron);
      let url = `/books/${actionType}/${targetId}`;
      let payload = {};

      if (isAdminAction) {
        payload.targetUserId = overrideUserId || selectedPatron._id;
      }

      const response = await API.put(url, payload);
      notifications.show({ title: 'Success', message: response.data.message, color: 'green' });
      
      if (isPaginatedView) {
        await fetchPaginatedBooks(true);
      } else {
        await fetchGroupedBooks(true);
      }

      if (bookId) {
        fetchAccountData();
        if (viewingPatron) fetchSpecificPatronData(viewingPatron);
      }

    } catch (err) {
      notifications.show({ title: 'Library Note', message: err.response?.data?.message || "Action failed", color: 'blue' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setIsAddingBook(true);
    try {
      await API.post('/books/add', newBookData);
      notifications.show({ title: 'Success', message: 'Book added to the catalog.', color: 'green' });
      closeAddBook();
      setNewBookData({ title: '', author: '', category: '', isbn: '', description: '' });
      isPaginatedView ? fetchPaginatedBooks(true) : fetchGroupedBooks(true);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to add book', color: 'red' });
    } finally {
      setIsAddingBook(false);
    }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();
    setIsEditingBook(true);
    try {
      const response = await API.put(`/books/update/${selectedBook._id}`, editBookData);
      notifications.show({ title: 'Success', message: response.data.message, color: 'green' });
      closeEditBook();
      setSelectedBook(response.data.book);
      isPaginatedView ? fetchPaginatedBooks(true) : fetchGroupedBooks(true);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to update book', color: 'red' });
    } finally {
      setIsEditingBook(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    if (!window.confirm(`Are you sure you want to permanently remove "${selectedBook.title}" from the catalog?`)) return;
    
    setActionLoading(true);
    try {
      const response = await API.delete(`/books/${selectedBook._id}`);
      notifications.show({ title: 'Success', message: response.data.message, color: 'green' });
      close(); 
      isPaginatedView ? fetchPaginatedBooks(true) : fetchGroupedBooks(true);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to delete book', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data } = await API.put('/auth/profile', profileData);
      notifications.show({ title: 'Success', message: data.message, color: 'green' });
      closeProfileModal();
      setProfileData({ email: '', phone: '' }); 
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Profile update failed', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data } = await API.put(`/auth/admin/reset-password/${viewingPatron._id}`, { newPassword });
      notifications.show({ title: 'Success', message: data.message, color: 'green' });
      closeResetPassModal();
      setNewPassword(''); 
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Password reset failed', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const triggerDeleteAccount = (targetUserId = null) => {
    setAccountToDelete(targetUserId);
    setDeleteConfirmText(''); 
    openDeleteModal();
  };

  const executeDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return; 

    const isSelfDelete = !accountToDelete;
    setActionLoading(true);
    
    try {
      const url = isSelfDelete 
        ? '/auth/delete-account' 
        : `/auth/admin/delete-account/${accountToDelete}`;
        
      const response = await API.delete(url);
      notifications.show({ title: 'Account Deleted', message: response.data.message, color: 'green' });
      
      closeDeleteModal();
      
      if (isSelfDelete) {
        logout(); 
      } else {
        closePatronDashboard();
        setPatronSearch('');
        setPatronResults([]);
      }
    } catch (err) {
      notifications.show({ 
        title: 'Deletion Failed', 
        message: err.response?.data?.message || 'Could not delete account. Ensure all books are returned.', 
        color: 'red' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --- DYNAMIC LOGIC VARIABLES ---
  const targetUserId = (user?.role === 'admin' && selectedPatron) ? selectedPatron._id : user?.id;

  const borrowerId = typeof selectedBook?.borrowedBy === 'object' 
    ? selectedBook?.borrowedBy?._id 
    : selectedBook?.borrowedBy;

  const isBorrower = borrowerId === targetUserId;
  const isFirstInHoldLine = selectedBook?.holds?.[0] === targetUserId && !selectedBook?.borrowedBy; 
  const hasActiveHold = selectedBook?.holds?.includes(targetUserId);

  const isCheckedOutToSomeoneElse = selectedBook?.borrowedBy && !isBorrower;
  const isReservedForSomeoneElse = !selectedBook?.isAvailable && !selectedBook?.borrowedBy && !isFirstInHoldLine;

  const holdExpiration = selectedBook?.holdStartedAt 
    ? new Date(new Date(selectedBook.holdStartedAt).getTime() + 172800000)
    : null;

  const formattedExpiration = holdExpiration 
    ? holdExpiration.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AppShell header={{ height: 70 }} padding="md" className="bg-[#fdfaf6]">
      <AppShell.Header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm px-2 sm:px-4">
        <Container size="lg" className="h-full px-0 sm:px-3">
          <Group justify="space-between" align="center" className="h-full flex-nowrap">
            <Group gap="xs" className="flex-nowrap shrink">
              <div className="bg-slate-900 p-1.5 rounded-lg shrink-0">
                <IconLibrary size={18} color="white" stroke={1.5} />
              </div>
              <Title order={3} className="font-serif italic text-slate-800 truncate text-lg sm:text-xl">The Archives</Title>
            </Group>
            
            <Group gap="xs" className="flex-nowrap">
             <Button 
                variant="subtle" 
                color="dark" 
                onClick={openAccount} 
                leftSection={<IconUserCircle size={20} />}
                px={{ base: 8, sm: 16 }}
              >
                <span className="hidden sm:inline">My Account</span>
              </Button>
              <div className="hidden md:flex flex-col items-end shrink-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user?.role === 'admin' ? 'Librarian' : 'Member'}</span>
                <Text size="sm" fw={600}>{user?.firstName}</Text>
              </div>
              <Button variant="light" color="red" onClick={openLogoutModal} size="xs" leftSection={<IconLogout size={14} />}>Log Out</Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        {/* Librarian Tools */}
        {user?.role === 'admin' && (
          <Container size="lg" mb="xl" mt="md">
            <Paper withBorder p="md" className="bg-slate-50 border-dashed border-slate-300">
              <Group justify="space-between" align="center" mb="xs">
                <Title order={4} c="indigo">Librarian Tools: Patron Lookup</Title>
                <Button size="xs" color="indigo" variant="outline" leftSection={<IconPlus size={14}/>} onClick={openAddBook}>
                  Add New Book
                </Button>
              </Group>

              <Group align="flex-end">
                <TextInput 
                  placeholder="Search Patron Name, Email, or Phone..." 
                  value={patronSearch} 
                  onChange={(e) => setPatronSearch(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <Button onClick={searchPatrons} loading={patronLoading} color="indigo">Search</Button>
              </Group>

              {patronResults.length > 0 && (
                <> 
                  <Stack gap="xs" mt="md">
                    {paginatedPatrons.map(p => (
                      <Paper 
                        key={p._id} 
                        withBorder 
                        p="xs" 
                        className={selectedPatron?._id === p._id ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-100'} 
                        onClick={() => setSelectedPatron(p)} 
                        style={{ cursor: 'pointer' }}
                      >
                        <Group justify="space-between">
                          <div>
                            <Anchor component="button" onClick={(e) => { e.stopPropagation(); fetchSpecificPatronData(p); }}>
                              <Text fw={700} size="sm" c="indigo">{p.firstName} {p.lastName}</Text>
                            </Anchor>
                            <Text size="xs" c="dimmed">{p.email} • {p.phone || 'No phone recorded'}</Text>
                          </div>
                          {selectedPatron?._id === p._id ? (
                            <Button size="compact-xs" color="red" variant="subtle" onClick={(e) => { e.stopPropagation(); setSelectedPatron(null); }}>Clear</Button>
                          ) : (
                            <Badge color="gray" variant="outline">Select for Action</Badge>
                          )}
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                  {totalPages > 1 && (
                    <Group justify="center" mt="md">
                      <Pagination 
                        total={totalPages} 
                        value={patronPage} 
                        onChange={setPatronPage} 
                        color="indigo" 
                        size="sm"
                        radius="xl"
                        withEdges
                      />  
                    </Group>
                  )}
                </>
              )}
            </Paper>
          </Container>
        )}

        {/* Sticky Search Bar */}
        <div className="sticky top-[70px] z-20 bg-[#fdfaf6]/95 backdrop-blur-md border-b border-slate-200 py-4 sm:py-6 mb-6 sm:mb-10 shadow-sm">
          <Container size="sm">
            <TextInput
              size="lg" radius="xl" placeholder="Search Title, Author, Genre..."
              leftSection={<IconSearch size={20} stroke={1.5} />}
              value={search} 
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedCategory(''); 
                setBookPage(1); 
              }}
              rightSection={search && <Anchor component="button" size="xs" onClick={() => { setSearch(''); setBookPage(1); }} pr="md">Clear</Anchor>}
            />
          </Container>
        </div>

        {/* --- MAIN CATALOG RENDERING --- */}
        <Container size="lg">
          {/* --- NEW ADMIN REPORTS SECTION --- */}
          {user?.role === 'admin' && !search && (
            <AdminReports />
          )}
          {/* --------------------------------- */}
          {loading ? (
            <Center h={300}><Loader color="dark" type="dots" /></Center>
          ) : isPaginatedView ? (
            /* --- PAGINATED VIEW (Search Results or "See More" Genre) --- */
            <>
              <Group justify="space-between" mb="lg" className="border-b border-slate-200 pb-3">
                <Title order={3} c="indigo">
                  {debouncedSearch ? `Search Results for "${debouncedSearch}"` : `Category: ${selectedCategory}`}
                </Title>
                <Button 
                  variant="subtle" 
                  onClick={() => { 
                    setSearch(''); 
                    setSelectedCategory(''); 
                    // Wait a tiny fraction of a second for React to render the books, then scroll down
                    setTimeout(() => window.scrollTo({ top: savedScrollPosition, behavior: 'auto' }), 10);
                  }}
                >
                  &larr; Back to Library Home
                </Button>
              </Group>

              {paginatedBooks.length === 0 ? (
                <Center h={200}><Text c="dimmed">No books found.</Text></Center>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-8">
                    {paginatedBooks.map(book => (
                      <BookItem key={book._id} book={book} onClick={() => { setSelectedBook(book); open(); }} />
                    ))}
                  </div>

                  {totalBookPages > 1 && (
                    <Group justify="center" mt="xl" mb="xl">
                      <Pagination total={totalBookPages} value={bookPage} onChange={setBookPage} color="dark" size="md" radius="xl" withEdges />
                    </Group>
                  )}
                </>
              )}
            </>
          ) : (
            /* --- DEFAULT GROUPED VIEW (Home Page) --- */
            Object.keys(groupedBooks).length === 0 ? (
              <Center h={300}><Text c="dimmed">The library is currently empty.</Text></Center>
            ) : (
              Object.keys(groupedBooks).map(genre => (
                <section key={genre} className="mb-12">
                  <Group justify="space-between" mb="md" className="border-b border-slate-200 pb-2">
                    <Title order={3} className="font-serif text-slate-700">{genre}</Title>
                    {groupedBooks[genre].length === 6 && (
                      <Button 
                        variant="subtle" 
                        size="xs" 
                        rightSection={<IconChevronRight size={14} />}
                        onClick={() => {
                          setSavedScrollPosition(window.scrollY); // Save their spot
                          setSelectedCategory(genre);
                          setBookPage(1);
                          window.scrollTo(0, 0); // Snap to the top for the new page
                        }}
                      >
                        See More
                      </Button>
                    )}
                  </Group>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {groupedBooks[genre].map(book => (
                      <BookItem key={book._id} book={book} onClick={() => { setSelectedBook(book); open(); }} />
                    ))}
                  </div>
                </section>
              ))
            )
          )}
        </Container>
      </AppShell.Main>

      {/* --- MY ACCOUNT DRAWER --- */}
      <Drawer opened={accountOpened} onClose={closeAccount} title={<Title order={4}>My Account</Title>} position="right" size="md">
        <ScrollArea h="calc(100vh - 80px)" offsetScrollbars>
          {accountLoading ? <Loader color="dark" mt="xl" /> : (
            <Stack gap="xl">
              <div>
                <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase">Current Borrowings</Text>
                {myBorrowed.length === 0 ? <Text size="sm" italic>No books checked out.</Text> : (
                  <Stack gap="sm">
                    {myBorrowed.map(book => {
                      const isOverdue = new Date(book.dueDate) < new Date();
                      return (
                        <Paper withBorder p="xs" key={book._id} className={isOverdue ? 'border-red-200 bg-red-50/30' : ''}>
                          <Group wrap="nowrap" align="flex-start">
                            <Image src={book.coverImage || `https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg`} w={45} h={65} radius="xs" fit="cover" className="border" />
                            <div style={{ flex: 1 }}>
                              <Text fw={600} size="sm" className="line-clamp-1">{book.title}</Text>
                              <Text size="xs" c={isOverdue ? "red" : "dimmed"}>{isOverdue ? "OVERDUE - Due: " : "Due: "} {new Date(book.dueDate).toLocaleDateString()}</Text>
                            </div>
                            <Group gap="xs">
                              <Button size="compact-xs" variant="light" color="blue" onClick={() => handleAction('renew', book._id)}>Renew</Button>
                              <Button size="compact-xs" variant="subtle" color="red" onClick={() => handleAction('return', book._id)}>Return</Button>
                            </Group>
                          </Group>
                          {isOverdue && <Alert color="red" icon={<IconAlertCircle size={14} />} p={4} mt={5} variant="transparent"><Text size="xs" fw={700}>Please return this immediately.</Text></Alert>}
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </div>
              <Divider />
              <div>
                <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase">Waitlist & Holds</Text>
                {myHolds.length === 0 ? <Text size="sm" italic>No active holds.</Text> : (
                  <Stack gap="sm">
                   {myHolds.map(hold => (
                    <Paper withBorder p="xs" key={hold.bookId}>
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Image src={hold.coverImage || `https://covers.openlibrary.org/b/isbn/${hold.isbn}-S.jpg`} w={35} h={50} radius="xs" fit="cover" className="border" />
                          <div>
                            <Text fw={600} size="sm">{hold.title}</Text>
                            <Text size="xs" c={hold.queuePosition === 1 && hold.formattedDeadline !== 'In Queue' ? "red.7" : "orange.8"} fw={700}>
                              {hold.queuePosition === 1 && hold.formattedDeadline !== 'In Queue' 
                                ? `Expires: ${hold.formattedDeadline}` 
                                : `Position in Queue: #${hold.queuePosition}`}
                            </Text>
                          </div>
                        </Group>
                        <Button size="compact-xs" color="red" variant="subtle" onClick={() => handleAction('undo-hold', hold.bookId)}>
                          Remove Hold
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                  </Stack>
                )}
              </div>
              
              <Divider mt="md" />
              <Button variant="light" color="blue" fullWidth mb="sm" onClick={openProfileModal}>
                Update Contact Info
              </Button>
              <Button variant="light" color="red" fullWidth leftSection={<IconTrash size={16} />} onClick={() => triggerDeleteAccount()} loading={actionLoading}>
                Delete My Account
              </Button>
            </Stack>
          )}
        </ScrollArea>
      </Drawer>

      {/* --- PATRON PROFILE DRAWER (ADMIN ONLY) --- */}
      <Drawer 
        opened={patronDashboardOpened} 
        onClose={closePatronDashboard} 
        position="right" 
        size="md"
        title={
          <Group gap="sm">
            <IconUserCircle size={24} color="#4f46e5" />
            <Title order={4}>{viewingPatron?.firstName}'s Profile</Title>
          </Group>
        }
      >
        <ScrollArea h="calc(100vh - 80px)" offsetScrollbars>
          {patronDataLoading ? <Loader color="indigo" mt="xl" /> : (
            <Stack gap="xl">
              <Paper withBorder p="sm" bg="slate.50">
                <Text size="sm" fw={700}>Contact Information</Text>
                <Text size="sm">Email: {viewingPatron?.email}</Text>
                <Text size="sm">Phone: {viewingPatron?.phone}</Text>
              </Paper>

              <div>
                <Text fw={700} size="sm" c="dimmed" mb="sm" tt="uppercase">Checked Out Books</Text>
                {patronBooks.length === 0 ? <Text size="sm" italic>No active checkouts.</Text> : (
                  <Stack gap="sm">
                    {patronBooks.map(book => {
                      const isOverdue = new Date(book.dueDate) < new Date();
                      return (
                        <Paper withBorder p="xs" key={book._id} className={isOverdue ? 'border-red-200 bg-red-50/30' : ''}>
                          <Group wrap="nowrap" align="center">
                            <div style={{ flex: 1 }}>
                              <Text fw={600} size="sm" className="line-clamp-1">{book.title}</Text>
                              <Text size="xs" c={isOverdue ? "red" : "dimmed"}>
                                {isOverdue ? "OVERDUE - Due: " : "Due: "} {new Date(book.dueDate).toLocaleDateString()}
                              </Text>
                            </div>
                            <Group gap="xs">
                              <Button size="compact-xs" variant="light" color="blue" onClick={() => handleAction('renew', book._id, viewingPatron._id)}>Renew</Button>
                              <Button size="compact-xs" color="red" variant="light" onClick={() => handleAction('return', book._id, viewingPatron._id)}>Force Return</Button>
                            </Group>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </div>
              
              <Divider />

              <div>
                <Text fw={700} size="sm" c="dimmed" mb="sm" tt="uppercase">Active Holds</Text>
                {patronHolds.length === 0 ? <Text size="sm" italic>No active holds.</Text> : (
                  <Stack gap="sm">
                    {patronHolds.map(hold => (
                      <Paper withBorder p="xs" key={hold.bookId}>
                        <Group justify="space-between" wrap="nowrap">
                          <div>
                            <Text fw={600} size="sm" className="line-clamp-1">{hold.title}</Text>
                            <Text size="xs" c="orange.8" fw={700}>
                              {hold.queuePosition === 1 && hold.formattedDeadline !== 'In Queue' 
                                ? `Expires: ${hold.formattedDeadline}` 
                                : `Queue Position: #${hold.queuePosition}`}
                            </Text>
                          </div>
                          <Button size="compact-xs" color="red" variant="subtle" onClick={() => handleAction('undo-hold', hold.bookId, viewingPatron._id)}>
                            Remove Hold
                          </Button>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </div>
              
              <Divider mt="md" />
              <Button variant="light" color="orange" fullWidth mb="sm" onClick={openResetPassModal}>
                Reset Patron Password
              </Button>
              <Button variant="light" color="red" fullWidth leftSection={<IconTrash size={16} />} onClick={() => triggerDeleteAccount(viewingPatron._id)} loading={actionLoading}>
                Delete Patron Account
              </Button>
            </Stack>
          )}
        </ScrollArea>
      </Drawer>

      {/* --- ADD NEW BOOK MODAL (ADMIN ONLY) --- */}
      <Modal opened={addBookOpened} onClose={closeAddBook} title={<Title order={4}>Add New Book to Catalog</Title>} centered>
        <form onSubmit={handleAddBook}>
          <Stack gap="sm">
            <TextInput required label="Book Title" placeholder="E.g., The Great Gatsby" value={newBookData.title} onChange={(e) => setNewBookData({...newBookData, title: e.target.value})} />
            <TextInput required label="Author" placeholder="E.g., F. Scott Fitzgerald" value={newBookData.author} onChange={(e) => setNewBookData({...newBookData, author: e.target.value})} />
            <Group grow>
              <TextInput required label="Category / Genre" placeholder="E.g., Classic" value={newBookData.category} onChange={(e) => setNewBookData({...newBookData, category: e.target.value})} />
              <TextInput required label="ISBN" placeholder="E.g., 9780743273565" value={newBookData.isbn} onChange={(e) => setNewBookData({...newBookData, isbn: e.target.value})} />
            </Group>
            <Text size="xs" c="dimmed" mt="-8px">Cover images will be fetched automatically using the ISBN.</Text>
            <Textarea required label="Description" placeholder="A brief summary of the book..." minRows={4} value={newBookData.description} onChange={(e) => setNewBookData({...newBookData, description: e.target.value})} />
            <Button type="submit" color="indigo" fullWidth mt="md" loading={isAddingBook}>
              Add Book to Collection
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* --- EDIT BOOK MODAL (ADMIN ONLY) --- */}
      <Modal opened={editBookOpened} onClose={closeEditBook} title={<Title order={4}>Edit Book Details</Title>} centered zIndex={2000}>
        <form onSubmit={handleEditBook}>
          <Stack gap="sm">
            <TextInput required label="Book Title" value={editBookData.title} onChange={(e) => setEditBookData({...editBookData, title: e.target.value})} />
            <TextInput required label="Author" value={editBookData.author} onChange={(e) => setEditBookData({...editBookData, author: e.target.value})} />
            <Group grow>
              <TextInput required label="Category / Genre" value={editBookData.category} onChange={(e) => setEditBookData({...editBookData, category: e.target.value})} />
              <TextInput required label="ISBN" value={editBookData.isbn} onChange={(e) => setEditBookData({...editBookData, isbn: e.target.value})} />
            </Group>
            <Textarea required label="Description" minRows={4} value={editBookData.description} onChange={(e) => setEditBookData({...editBookData, description: e.target.value})} />
            <Button type="submit" color="indigo" fullWidth mt="md" loading={isEditingBook}>
              Save Changes
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* --- BOOK DETAILS MODAL --- */}
      <Modal 
        opened={opened} 
        onClose={() => {
          close();
          setSelectedPatron(null); 
          setPatronSearch('');
        }} 
        title={<Text fw={700} size="lg">Librarian Action: {selectedBook?.title}</Text>} 
        centered 
        size="lg"
      >
        {selectedBook && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <Image
                src={selectedBook.coverImage || `https://covers.openlibrary.org/b/isbn/${selectedBook.isbn}-L.jpg`}
                alt={selectedBook.title} radius="md" h={250} fit="contain" className="bg-gray-50 p-2 border"
              />
            </div>

            <Stack className="flex-1" gap="xs">
              {/* --- ADMIN PATRON LOOKUP SECTION --- */}
              {user?.role === 'admin' && (
                <Paper withBorder p="xs" mb="sm" className="bg-indigo-50/50 border-indigo-200">
                  <Text size="xs" fw={700} c="indigo" mb={5} tt="uppercase">Perform Action For Patron:</Text>
                  
                  {!selectedPatron ? (
                    <Group gap="xs">
                      <TextInput 
                        placeholder="Search Patron Name/Email..." 
                        size="xs"
                        style={{ flex: 1 }}
                        value={patronSearch}
                        onChange={(e) => setPatronSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchPatrons()}
                      />
                      <Button size="xs" color="indigo" onClick={searchPatrons} loading={patronLoading}>Find</Button>
                    </Group>
                  ) : (
                    <Alert color="indigo" variant="light" p="xs">
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" fw={700}>{selectedPatron.firstName} {selectedPatron.lastName}</Text>
                          <Text size="xs">{selectedPatron.email}</Text>
                        </div>
                        <Button size="compact-xs" variant="subtle" color="red" onClick={() => setSelectedPatron(null)}>Change</Button>
                      </Group>
                    </Alert>
                  )}

                  {/* Quick dropdown for search results within the modal */}
                  {patronResults.length > 0 && !selectedPatron && (
                    <Paper withBorder mt="xs" shadow="xs" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {patronResults.map(p => (
                        <Group 
                          key={p._id} 
                          p="xs" 
                          className="hover:bg-white cursor-pointer border-b last:border-0"
                          onClick={() => {
                            setSelectedPatron(p);
                            setPatronResults([]);
                          }}
                        >
                          <Text size="xs" fw={600}>{p.firstName} {p.lastName}</Text>
                          <Text size="xs" c="dimmed">{p.email}</Text>
                        </Group>
                      ))}
                    </Paper>
                  )}
                </Paper>
              )}

              {/* --- BOOK INFO --- */}
              <div>
                <Badge color="blue" variant="light" mb="xs">{selectedBook.category}</Badge>
                <Title order={4}>{selectedBook.title}</Title>
                <Text size="sm" c="dimmed">by {selectedBook.author}</Text>
              </div>

              <Divider my="xs" />

              {/* --- DESCRIPTION (SCROLLABLE) --- */}
              <ScrollArea h={100} offsetScrollbars type="always" className="bg-slate-50 p-2 rounded border border-slate-100">
                <Text size="sm" c="slate.7">
                  {selectedBook.description || "No description available for this book."}
                </Text>
              </ScrollArea>

              {/* Inside your Modal Details section */}
              {selectedBook && !selectedBook.isAvailable && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 my-3">
                  <Text size="xs" fw={700} c="blue" tt="uppercase" mb={4}>Loan Information</Text>
                  
                  <Group gap="xs">
                    {selectedBook.borrowedBy ? <IconUserCircle size={18} color="#1c7ed6" /> : <IconClock size={18} color="#f59f00" />}
                    <Text size="sm" fw={600}>
                      {/* If someone has borrowed it, show who. Otherwise, show it's on hold. */}
                      {selectedBook.borrowedBy
                        ? (selectedBook.borrowedBy?.firstName 
                            ? `Currently with ${selectedBook.borrowedBy.firstName} ${selectedBook.borrowedBy.lastName}`
                            : (selectedPatron && selectedBook.borrowedBy === selectedPatron._id)
                            ? `Currently with ${selectedPatron.firstName} ${selectedPatron.lastName}`
                            : "Book is currently checked out")
                        : "Book is currently on hold awaiting pickup"}
                    </Text>
                  </Group>

                  {/* Only show due date if someone actually has it checked out */}
                  {selectedBook.dueDate && selectedBook.borrowedBy && (
                    <Group gap="xs" mt={4}>
                      <IconClock size={18} color="#e03131" />
                      <Text size="sm" fw={600} c="red.7">
                        Due Back: {new Date(selectedBook.dueDate).toLocaleDateString()}
                      </Text>
                    </Group>
                  )}

                  {/* --- HOLD EXPIRATION ALERT --- */}
                  {isFirstInHoldLine && formattedExpiration && (
                    <Alert color="yellow" icon={<IconClock size={16} />} mt="sm" variant="light" p="xs">
                      <Text size="xs" fw={600}>
                        Hold Available! You have until <strong>{formattedExpiration}</strong> to check this book out.
                      </Text>
                    </Alert>
                  )}
                </div>
              )}

              {/* --- ACTION BUTTONS --- */}
              <Stack gap="sm" mt="md">
                <Button 
                  color={isBorrower ? "blue" : "green"} 
                  fullWidth
                  loading={actionLoading}
                  onClick={() => handleAction(isBorrower ? 'renew' : 'borrow')}
                  disabled={
                    isBorrower 
                      ? selectedBook?.holds?.length > 0 
                      : (isCheckedOutToSomeoneElse || isReservedForSomeoneElse)
                  }
                >
                  {isBorrower 
                    ? 'Renew Book'
                    : selectedPatron 
                      ? `Check Out to ${selectedPatron.firstName}` 
                      : user?.role === 'admin' 
                        ? 'Borrow for Myself' 
                        : 'Borrow'}
                </Button>

                <Group grow>
                  {hasActiveHold ? (
                    <Button variant="outline" color="red" onClick={() => handleAction('undo-hold')} loading={actionLoading}>
                      {selectedPatron ? 'Remove Hold for Patron' : 'Remove Hold'}
                    </Button>
                  ) : (
                    <Button variant="outline" color="indigo" onClick={() => handleAction('hold')} loading={actionLoading} disabled={isBorrower || selectedBook?.isAvailable}>
                      {selectedPatron ? 'Place Hold for Patron' : 'Place Hold'}
                    </Button>
                  )}

                  <Button variant="subtle" color="red" onClick={() => handleAction('return')} loading={actionLoading} disabled={!isBorrower}>
                    Check In / Return
                  </Button>
                </Group>
                
                {/* --- ADMIN ONLY: EDIT & DELETE BUTTONS --- */}
                {user?.role === 'admin' && (
                  <Group grow mt="sm">
                    <Button 
                      variant="light" 
                      color="indigo" 
                      leftSection={<IconEdit size={16} />}
                      onClick={() => {
                        setEditBookData({
                          title: selectedBook.title,
                          author: selectedBook.author,
                          category: selectedBook.category,
                          isbn: selectedBook.isbn,
                          description: selectedBook.description
                        });
                        openEditBook();
                      }} 
                    >
                      Edit Details
                    </Button>

                    <Button 
                      variant="light" 
                      color="red" 
                      leftSection={<IconTrash size={16} />}
                      onClick={handleDeleteBook} 
                      loading={actionLoading}
                      disabled={!selectedBook.isAvailable} 
                    >
                      Archive / Remove
                    </Button>
                  </Group>
                )}
              </Stack>
            </Stack>
          </div>
        )}
      </Modal>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      <Modal opened={logoutModalOpened} onClose={closeLogoutModal} title={<Title order={4}>Confirm Logout</Title>} centered zIndex={3000}>
        <Text size="sm" mb="md" fw={500}>Would you like to log out?</Text>
        <Group grow>
          <Button variant="default" onClick={closeLogoutModal}>Cancel</Button>
          <Button color="red" onClick={logout}>Log Out</Button>
        </Group>
      </Modal>

      {/* --- ACCOUNT DELETION CONFIRMATION MODAL --- */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title={<Title order={4} c="red.7">Danger Zone: Confirm Deletion</Title>} centered zIndex={2500}>
        <Stack gap="md">
          <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
            This action is permanent and cannot be undone. All data, including borrowing history, will be erased.
            {!accountToDelete && " You will be logged out of the system immediately."}
          </Alert>
          <div>
            <Text size="sm" fw={600} mb="xs">Please type <Text span c="red" fw={800}>DELETE</Text> to confirm.</Text>
            <TextInput value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" data-autofocus />
          </div>
          <Group grow mt="sm">
            <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
            <Button color="red" onClick={executeDeleteAccount} loading={actionLoading} disabled={deleteConfirmText !== 'DELETE'}>
              Delete Account
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* --- UPDATE PROFILE MODAL (USER) --- */}
      <Modal opened={profileModalOpened} onClose={closeProfileModal} title={<Title order={4}>Update Contact Info</Title>} centered zIndex={2000}>
        <form onSubmit={handleUpdateProfile}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">Fill out the fields you wish to update. Leave blank to keep current data.</Text>
            <TextInput label="New Email Address" placeholder="new.email@example.com" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
            <TextInput label="New Phone Number" placeholder="(555) 000-0000" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
            <Button type="submit" color="blue" fullWidth mt="sm" loading={actionLoading}>Save Changes</Button>
          </Stack>
        </form>
      </Modal>

      {/* --- RESET PASSWORD MODAL (ADMIN) --- */}
      <Modal opened={resetPassModalOpened} onClose={closeResetPassModal} title={<Title order={4} c="orange.7">Reset Password for {viewingPatron?.firstName}</Title>} centered zIndex={2500}>
        <form onSubmit={handleResetPassword}>
          <Stack gap="md">
            <Alert color="orange" variant="light" icon={<IconAlertCircle size={16} />}>
              This will immediately overwrite the patron's current password.
            </Alert>
            <TextInput required label="Enter New Password" placeholder="Minimum 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Button type="submit" color="orange" fullWidth mt="sm" loading={actionLoading}>Force Reset Password</Button>
          </Stack>
        </form>
      </Modal>

      {/* --- BARCODE SCANNER MODAL --- */}
      <Modal opened={scannerOpened} onClose={closeScanner} title={<Title order={4}>Scan ISBN Barcode</Title>} centered zIndex={2000}>
        <Text size="sm" c="dimmed" mb="md">
          Point your device's camera at the barcode on the back of the book. It will scan automatically.
        </Text>
        {scannerOpened && <BarcodeScanner onScanSuccess={handleScanSuccess} />}
      </Modal>

      {/* --- FLOATING SCANNER BUTTON --- */}
      <Affix position={{ bottom: 30, right: 30 }} zIndex={100}>
        <ActionIcon 
          color="indigo" 
          variant="filled" 
          onClick={openScanner}
          style={{ width: 64, height: 64, borderRadius: '50%', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
          title="Scan Book Barcode"
          className="hover:scale-105 transition-transform"
        >
          <IconBarcode size={32} />
        </ActionIcon>
      </Affix>
    </AppShell>
  );
}

function BookItem({ book, onClick }) {
  // Check if today is past the due date
  const isOverdue = book.dueDate && new Date(book.dueDate) < new Date();
  
  // A book is on hold if it is not available, but nobody has it borrowed yet
  const isOnHold = !book.isAvailable && !book.borrowedBy && book.holds?.length > 0;

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-sm shadow-sm">
        <Image
          src={book.coverImage || `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
          height="100%" alt={book.title} className="object-cover"
        />
        
        {!book.isAvailable && (
          <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center p-2 text-center">
            {/* Change the badge color/text based on the status */}
            <Badge color={isOnHold ? "yellow" : (isOverdue ? "red" : "blue")} variant="filled" size="xs" mb={4}>
              {isOnHold ? 'On Hold' : (isOverdue ? 'Overdue' : 'On Loan')}
            </Badge>
            
            {/* Only show the due date if someone actually has it checked out */}
            {book.dueDate && !isOnHold && (
              <Text size="10px" c="white" fw={700}>
                Due: {new Date(book.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
              </Text>
            )}
            
            {/* Show first name only on card to save space, hide if it's just sitting on hold */}
            {!isOnHold && book.borrowedBy && (
              <Text size="10px" c="slate.200" mt={4}>
                {book.borrowedBy?.firstName}
              </Text>
            )}
          </div>
        )}
      </div>
      <Text fw={700} size="xs" className="line-clamp-1">{book.title}</Text>
      <Text size="xs" c="dimmed">{book.author}</Text>
    </div>
  );
}