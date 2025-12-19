import { useState } from 'react';
import LogoSDQ from '../../../components/LogoSDQ';
import Button from '../../../components/Button';
import { login } from '../../../lib/auth';
import { User } from '../../../types';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow w-full max-w-md space-y-6"
      >
        <div className="flex justify-center">
          <LogoSDQ />
        </div>

        <h1 className="text-xl font-bold text-center">Login Sistem Halaqah</h1>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full border px-4 py-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border px-4 py-2 rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Masuk...' : 'Masuk'}
        </Button>
      </form>
    </div>
  );
}
