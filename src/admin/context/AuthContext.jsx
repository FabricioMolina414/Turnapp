import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { login as apiLogin, loginWithGoogle as apiLoginWithGoogle, fetchCurrentUser } from '../api/auth.js';

const TOKEN_STORAGE_KEY = 'turnapp_admin_token';

const AuthContext = createContext(null);

const initialState = {
  status: 'idle',
  user: null,
  token: null,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, status: 'loading', error: null };
    case 'RESTORE_SESSION_SUCCESS':
      return { ...state, status: 'authenticated', user: action.payload.user, token: action.payload.token };
    case 'LOGIN_SUCCESS':
      return { ...state, status: 'authenticated', user: action.payload.user, token: action.payload.token, error: null };
    case 'LOGOUT':
      return { ...initialState, status: 'idle' };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      return;
    }

    let isCancelled = false;
    dispatch({ type: 'INIT' });

    fetchCurrentUser(storedToken)
      .then((response) => {
        if (isCancelled) return;
        dispatch({
          type: 'RESTORE_SESSION_SUCCESS',
          payload: { user: response.user, token: storedToken },
        });
      })
      .catch((error) => {
        console.warn('[Auth] No se pudo restaurar la sesión', error);
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (!isCancelled) {
          dispatch({ type: 'ERROR', payload: 'Sesión expirada. Iniciá sesión nuevamente.' });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLogin = useCallback(async ({ identifier, password }) => {
    dispatch({ type: 'INIT' });
    try {
      const { token, user } = await apiLogin({ identifier, password });
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return { token, user };
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error.message || 'No se pudo iniciar sesión' });
      throw error;
    }
  }, []);

  const handleGoogleLogin = useCallback(async ({ idToken }) => {
    dispatch({ type: 'INIT' });
    try {
      const { token, user } = await apiLoginWithGoogle({ idToken });
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return { token, user };
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error.message || 'No se pudo iniciar sesión con Google' });
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      token: state.token,
      error: state.error,
      login: handleLogin,
      loginWithGoogle: handleGoogleLogin,
      logout: handleLogout,
    }),
    [state, handleLogin, handleGoogleLogin, handleLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
