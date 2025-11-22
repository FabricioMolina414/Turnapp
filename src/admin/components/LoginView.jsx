import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import brandLogo from '../../assets/Logo_AC-removebg-preview.png';

export default function LoginView() {
  const { login, status, error } = useAuth();
  const [formState, setFormState] = useState({
    identifier: '',
    password: '',
  });
  const [formError, setFormError] = useState(null);

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
      </form>
    </div>
  );
}
