import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(); // ✅ Add this

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
                : t('login.loginFailed'); // ✅ Use translation
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            {/* Language Switcher - Top Right */}
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <LogIn className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('login.title')} {/* ✅ Translated */}
                    </h1>
                    <p className="text-gray-600">
                        {t('login.subtitle')} {/* ✅ Translated */}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('login.username')} {/* ✅ Translated */}
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field"
                            placeholder={t('login.usernamePlaceholder')} /* ✅ Translated */
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('login.password')} {/* ✅ Translated */}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder={t('login.passwordPlaceholder')} /* ✅ Translated */
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            t('login.loggingIn') /* ✅ Translated */
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                {t('login.loginButton')} {/* ✅ Translated */}
                            </>
                        )}
                    </button>
                </form>

                {/*<div className="mt-6 text-center text-sm text-gray-600">*/}
                {/*    <p>{t('login.demoCredentials')}</p> */}{/* ✅ Translated */}
                {/*    <p className="font-mono mt-1">superadmin / admin123</p>*/}
                {/*</div>*/}
            </div>
        </div>
    );
};

export default LoginPage;