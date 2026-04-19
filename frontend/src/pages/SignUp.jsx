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
  Group, 
  Anchor 
} from '@mantine/core';
import { IconLibrary, IconUserPlus, IconPhone } from '@tabler/icons-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axiosInstance';

export default function SignUp() {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      
      const { data } = await API.post('/auth/register', formData);
      login(data); 
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] flex flex-col justify-center py-12 px-6">
      <Container size={480}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-900 p-3 rounded-full">
              <IconLibrary size={28} color="#fdfaf6" />
            </div>
          </div>
          <Title order={1} className="font-serif text-3xl italic text-slate-800">
            Create Library Account
          </Title>
          <Text c="dimmed" size="sm" mt={5}>
            Join the university's digital collection
          </Text>
        </div>

        <Paper withBorder shadow="md" p={40} radius="sm" className="bg-white border-slate-200">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Group grow>
                <TextInput
                  label="First Name"
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
                <TextInput
                  label="Last Name"
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </Group>

              <TextInput
                label="Email"
                placeholder="student@university.edu"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />

              {/* NEW PHONE FIELD */}
              <TextInput
                label="Phone Number"
                placeholder="(555) 000-0000"
                required
                leftSection={<IconPhone size={16} />}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />

              <PasswordInput
                label="Create Password"
                placeholder="Minimum 6 characters"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />

              {error && (
                <Text color="red" size="xs" fw={700} ta="center" className="bg-red-50 py-2 rounded">
                  {error}
                </Text>
              )}

              <Button 
                fullWidth 
                size="md" 
                type="submit" 
                loading={loading}
                color="dark"
                className="mt-2"
                rightSection={<IconUserPlus size={18} />}
              >
                Register for Access
              </Button>
            </Stack>
          </form>

          <Text ta="center" mt="xl" size="sm">
            Already have an account?{' '}
            <Anchor component={Link} to="/login" fw={700} color="indigo">
              Sign in here
            </Anchor>
          </Text>
        </Paper>
      </Container>
    </div>
  );
}