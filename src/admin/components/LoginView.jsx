import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import brandLogo from '../../assets/Logo_AC-removebg-preview.png';

export default function LoginView() {
  const { login, loginWithGoogle, status, error } = useAuth();
  const [formState, setFormState] = useState({
    identifier: '',
    password: '',
  });
  const [formError, setFormError] = useState(null);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleEnabled = Boolean(googleClientId);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  const isSubmitting = status === 'loading';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.identifier || !formState.password) {
      setFormError('Ingresá usuario/email y contraseña');
      return;
    }

    try {
      await login({
        identifier: formState.identifier,
        password: formState.password,
      });
    } catch (submitError) {
      setFormError(submitError.message || 'No se pudo iniciar sesión');
    }
  };

  useEffect(() => {
    if (!isGoogleEnabled) return;

    if (window.google?.accounts?.id) {
      setIsGoogleReady(true);
      return;
    }

    const existingScript = document.querySelector('script[data-google-identity]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => setIsGoogleReady(true);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [isGoogleEnabled]);

  useEffect(() => {
    if (!isGoogleReady || !googleButtonRef.current || !isGoogleEnabled) return;

    googleButtonRef.current.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        setFormError(null);
        if (!response?.credential) {
          setFormError('No se pudo obtener la credencial de Google.');
          return;
        }
        try {
          await loginWithGoogle({ idToken: response.credential });
        } catch (submitError) {
          setFormError(submitError.message || 'No se pudo iniciar sesión con Google');
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 320,
    });
  }, [isGoogleReady, isGoogleEnabled, googleClientId, loginWithGoogle]);

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <header>
          <img src={brandLogo} alt="Turnapp" />
          <div>
            <h1>Panel administrativo</h1>
            <p>Ingresá con tu usuario admin o superadmin.</p>
          </div>
        </header>

        <div className="form-field">
          <label htmlFor="identifier">Usuario o email</label>
          <input
            id="identifier"
            name="identifier"
            placeholder="superadmin"
            autoComplete="username"
            value={formState.identifier}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={formState.password}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        {(formError || error) && <p className="form-error">{formError || error}</p>}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>

        {isGoogleEnabled && (
          <>
            <div className="login-divider">
              <span>o</span>
            </div>
            <div
              className={`google-login ${isSubmitting ? 'is-disabled' : ''}`}
              ref={googleButtonRef}
            />
          </>
        )}
      </form>
    </div>
  );
}
