import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LogIn, Eye, EyeOff, Shield } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error
                ? err.message
                : t('login.loginFailed');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
            {/* Header - Language Switcher */}
            <div className="w-full px-4 py-3 sm:py-4 flex justify-end">
                <LanguageSwitcher />
            </div>

            {/* Main Content - Centered */}
            <div className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
                    {/* Logo & Title */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4">
                            <LogIn className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                            {t('login.title')}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            {t('login.subtitle')}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        {/* Username Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {t('login.username')}
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 sm:py-2.5 text-base sm:text-sm 
                                         border border-gray-300 rounded-lg 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         transition-all duration-200
                                         placeholder:text-gray-400"
                                placeholder={t('login.usernamePlaceholder')}
                                required
                                autoComplete="username"
                                autoCapitalize="none"
                                autoCorrect="off"
                            />
                        </div>

                        {/* Password Field with Show/Hide Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {t('login.password')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 sm:py-2.5 pr-12 text-base sm:text-sm 
                                             border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                             transition-all duration-200
                                             placeholder:text-gray-400"
                                    placeholder={t('login.passwordPlaceholder')}
                                    required
                                    autoComplete="current-password"
                                />
                                {/* Show/Hide Password Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 
                                             text-gray-400 hover:text-gray-600
                                             focus:outline-none
                                             touch-manipulation"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 sm:py-3 px-4 
                                     bg-blue-600 text-white font-semibold rounded-lg
                                     hover:bg-blue-700 active:bg-blue-800
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-all duration-200
                                     flex items-center justify-center gap-2
                                     text-base sm:text-sm
                                     touch-manipulation"
                        >
                            {isLoading ? (
                                <>
                                    <svg 
                                        className="animate-spin h-5 w-5 text-white" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill="none" 
                                        viewBox="0 0 24 24"
                                    >
                                        <circle 
                                            className="opacity-25" 
                                            cx="12" 
                                            cy="12" 
                                            r="10" 
                                            stroke="currentColor" 
                                            strokeWidth="4"
                                        />
                                        <path 
                                            className="opacity-75" 
                                            fill="currentColor" 
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    <span>{t('login.loggingIn')}</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    <span>{t('login.loginButton')}</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Shield className="w-4 h-4" />
                            <p className="text-xs sm:text-sm">
                                {t('login.secureLogin', 'Secure login with encryption')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full px-4 py-3 text-center">
                <p className="text-xs sm:text-sm text-white/70">
                    © 2025 AI School Attendance System
                </p>
            </div>
        </div>
    );
};

export default LoginPage;