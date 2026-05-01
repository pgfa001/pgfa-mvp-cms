import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setErrorMessage('Please enter your username and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to log in.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Proving Ground CMS</p>
          <h1>Log in</h1>
          <p className="subtext">
            Superadmins, club admins, and coaches can sign in to manage their CMS workflows.
          </p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>

          {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
