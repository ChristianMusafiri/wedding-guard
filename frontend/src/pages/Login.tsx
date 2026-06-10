import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // États pour le formulaire
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // NOUVEAU : État pour afficher/masquer le mot de passe
  const [showPassword, setShowPassword] = useState(false);
  
  // États de gestion
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page (garde les champs remplis)
    setError(null);
    setSuccess(null);
    setLoading(true);

    // 🌟 CORRECTION 2 : On force la minuscule sur l'username pour être insensible à la casse
    const cleanUsername = username.trim().toLowerCase();

    try {
      if (isRegister) {
        const response = await api.post('/auth/register', { 
          username: cleanUsername, 
          passwordPlain: password 
        });
        setSuccess(response.data.message);
        setIsRegister(false);
        setPassword(''); // On ne vide le mot de passe que si l'inscription réussit
      } else {
        const response = await api.post('/auth/login', { 
          username: cleanUsername, 
          passwordPlain: password 
        });
        const { access_token, user } = response.data;
        
        login(access_token, user);
        
        if (user.role === 'SCANNER') {
          navigate('/scan');
        } else if (user.role === 'MC') {
          navigate('/mc');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Une erreur est survenue.";
      setError(Array.isArray(errMsg) ? errMsg[0] : errMsg);
      // 🌟 CORRECTION 4 : On ne vide PLUS les champs en cas d'erreur. Ils restent remplis !
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambiance Mariage (Cercles dorés flous) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full bg-neutral-900/80 border border-neutral-800 backdrop-blur-md rounded-2xl p-8 shadow-2xl z-10">
        
        {/* Titre & Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-amber-400 tracking-wider">Wedding Guard</h1>
          <p className="text-neutral-400 text-xs uppercase tracking-widest mt-2">
            Sécurité & Accès Événementiel SaaS
          </p>
        </div>

        {/* Alertes d'Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 text-red-400 text-sm rounded-lg text-center animate-pulse">
            {error}
          </div>
        )}

        {/* Alertes de Succès */}
        {success && (
          <div className="mb-6 p-4 bg-green-950/40 border border-green-800/60 text-green-400 text-sm rounded-lg text-center">
            {success}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Champ Username */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)} // L'utilisateur peut taper en MAJUSCULES, le code s'adapte en arrière-plan
              // 🌟 CORRECTION 5 : "focus:placeholder-transparent" fait disparaître le placeholder instantanément au clic !
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 focus:placeholder-transparent transition-colors placeholder-neutral-600"
              placeholder="ex: sarah_accueil"
            />
          </div>

          {/* Champ Password avec Bouton Afficher/Masquer */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // 🌟 CORRECTION 3 : Type dynamique (text ou password)
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // 🌟 CORRECTION 5 : placeholder-transparent au clic
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:border-amber-500 focus:placeholder-transparent transition-colors placeholder-neutral-600"
                placeholder="••••••••"
              />
              
              {/* Bouton Œil (Toggle visibility) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-amber-400 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  // Icône Œil barré (Masquer)
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  // Icône Œil ouvert (Afficher)
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-lg shadow-amber-500/10"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-neutral-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement...
              </span>
            ) : isRegister ? (
              "Demander l'inscription"
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Sélecteur Connexion / Inscription */}
        <div className="text-center mt-8 pt-6 border-t border-neutral-800/60">
          <p className="text-neutral-400 text-sm">
            {isRegister ? "Vous avez déjà un compte ?" : "Vous êtes une nouvelle hôtesse ?"}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccess(null);
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold ml-2 underline focus:outline-none"
            >
              {isRegister ? "Connectez-vous" : "Inscrivez-vous ici"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;