import { useState, useContext } from 'react';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Text, 
  Container, 
  Stack,
  Anchor,   // Added this
  Divider   // Added this
} from '@mantine/core';
import { IconBook2, IconArrowRight } from '@tabler/icons-react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link here
import { AuthContext } from '../context/AuthContext';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message?.includes('invalid-credential') || err.message?.includes('wrong-password')
        ? 'Invalid email or password'
        : (err.message || 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col justify-center py-12 px-6 lg:px-8">
      <Container size={420} my={40}>
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
              <IconBook2 size={32} color="white" />
            </div>
          </div>
          <Title order={1} className="text-3xl font-black tracking-tight text-slate-900">
            Library Management System
          </Title>
          <Text c="dimmed" size="sm" mt={5}>
            Enter your credentials to access the collection
          </Text>
        </div>

        <Paper withBorder shadow="xl" p={40} radius="md" className="bg-white border-slate-200">
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Email"
                placeholder="student@university.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                classNames={{ input: 'focus:border-indigo-500' }}
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                classNames={{ input: 'focus:border-indigo-500' }}
              />

              {error && (
                <Text color="red" size="xs" fw={500} className="bg-red-50 p-2 rounded border border-red-100">
                  {error}
                </Text>
              )}

              <Button 
                fullWidth 
                mt="xl" 
                size="md" 
                type="submit" 
                loading={loading}
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
                rightSection={<IconArrowRight size={16} />}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Text ta="center" mt="xl" size="sm" c="dimmed">
            Don't have an account?{' '}
            <Anchor component={Link} to="/signup" fw={700} color="indigo">
              Sign up here
            </Anchor>
          </Text>

          <Divider my="xl" label="Notice" labelPosition="center" />
          
          <Text size="xs" c="dimmed" ta="center">
            Authorized access only. Please contact the librarian for credential issues.
          </Text>
        </Paper>

        <Text ta="center" mt="xl" size="sm" c="dimmed">
          Forgot your password? Please contact the head librarian.
        </Text>
      </Container>
    </div>
  );
}