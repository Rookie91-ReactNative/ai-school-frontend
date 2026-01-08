import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gray-50 px-4 py-6 sm:py-8">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="flex justify-center mb-5 sm:mb-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldX className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
                    </div>
                </div>

                {/* Error Code */}
                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">403</h1>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {t('unauthorized.title')}
                </h2>

                {/* Description */}
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-2">
                    {t('unauthorized.description')}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 
                                 border border-gray-300 text-gray-700 rounded-lg 
                                 hover:bg-gray-50 active:bg-gray-100
                                 transition-colors touch-manipulation
                                 text-sm sm:text-base"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('unauthorized.goBack')}
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 
                                 bg-blue-600 text-white rounded-lg 
                                 hover:bg-blue-700 active:bg-blue-800
                                 transition-colors touch-manipulation
                                 text-sm sm:text-base"
                    >
                        <Home className="w-4 h-4" />
                        {t('unauthorized.goToDashboard')}
                    </button>
                </div>

                {/* Contact Info */}
                <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg mx-2 sm:mx-0">
                    <p className="text-xs sm:text-sm text-blue-900">
                        {t('unauthorized.needAccess')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;