import { useState, useEffect } from 'react';
import { Settings, Save, /*Bell,*/ Clock, Video, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { authService } from '../services/authService';

interface SystemSetting {
    schoolID: number;
    settingKey: string;
    settingValue: string;
    description: string;
}

const SettingsPage = () => {
    const [settings, setSettings] = useState<{ [key: string]: string }>({
        RecognitionThreshold: '0.65',
        SchoolStartTime: '07:30',
        SchoolEndTime: '15:30',
        LateThreshold: '15',
        ProcessFrameInterval: '3',
        EnableParentNotification: '1',
        AbsentNotificationTime: '08:30'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser?.schoolID) {
                console.error('No school ID found');
                return;
            }

            const response = await api.get(`/settings/school/${currentUser.schoolID}`);
            const settingsData = response.data.data;

            // Convert array of settings to object
            const settingsObj: { [key: string]: string } = {};
            settingsData.forEach((setting: SystemSetting) => {
                settingsObj[setting.settingKey] = setting.settingValue;
            });

            setSettings(settingsObj);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings({
            ...settings,
            [key]: value
        });
        setSaveMessage(''); // Clear message when user makes changes
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser?.schoolID) {
                setSaveMessage('Error: No school ID found');
                return;
            }

            // Convert settings object to array format for API
            const settingsArray = Object.entries(settings).map(([key, value]) => ({
                settingKey: key,
                settingValue: value
            }));

            await api.put(`/settings/school/${currentUser.schoolID}`, {
                settings: settingsArray
            });

            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveMessage('Error: Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-600" />
                        System Settings
                    </h1>
                    <p className="text-gray-600 mt-1">Configure system parameters and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`p-4 rounded-lg ${saveMessage.includes('Error')
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-green-50 border border-green-200 text-green-800'
                    }`}>
                    {saveMessage}
                </div>
            )}

            {/* Settings Sections */}
            <div className="space-y-6">
                {/* Face Recognition Settings */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Video className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Face Recognition</h2>
                            <p className="text-sm text-gray-600">Configure face detection parameters</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Recognition Threshold */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recognition Threshold
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="0.95"
                                    step="0.05"
                                    value={settings.RecognitionThreshold}
                                    onChange={(e) => handleChange('RecognitionThreshold', e.target.value)}
                                    className="flex-1"
                                />
                                <span className="text-lg font-semibold text-gray-900 min-w-[60px] text-right">
                                    {(parseFloat(settings.RecognitionThreshold) * 100).toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Higher values require more accurate matches (recommended: 65-75%)
                            </p>
                        </div>

                        {/* Process Frame Interval */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Process Frame Interval
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={settings.ProcessFrameInterval}
                                    onChange={(e) => handleChange('ProcessFrameInterval', e.target.value)}
                                    className="input-field w-24"
                                />
                                <span className="text-sm text-gray-600">frames</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Process every Nth frame (higher = faster but less accurate)
                            </p>
                        </div>
                    </div>
                </div>

                {/* School Hours */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">School Hours</h2>
                            <p className="text-sm text-gray-600">Set school operating hours</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                School Start Time
                            </label>
                            <input
                                type="time"
                                value={settings.SchoolStartTime}
                                onChange={(e) => handleChange('SchoolStartTime', e.target.value)}
                                className="input-field"
                            />
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                School End Time
                            </label>
                            <input
                                type="time"
                                value={settings.SchoolEndTime}
                                onChange={(e) => handleChange('SchoolEndTime', e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {/* Attendance Rules */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Attendance Rules</h2>
                            <p className="text-sm text-gray-600">Configure attendance marking rules</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Late Threshold (minutes)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="5"
                                max="60"
                                value={settings.LateThreshold}
                                onChange={(e) => handleChange('LateThreshold', e.target.value)}
                                className="input-field w-32"
                            />
                            <span className="text-sm text-gray-600">
                                minutes after start time
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Students arriving after this time will be marked as late
                        </p>
                    </div>
                </div>

                {/* Notifications */}
                {/*<div className="card">*/}
                {/*    <div className="flex items-center gap-3 mb-4">*/}
                {/*        <div className="p-2 bg-green-100 rounded-lg">*/}
                {/*            <Bell className="w-6 h-6 text-green-600" />*/}
                {/*        </div>*/}
                {/*        <div>*/}
                {/*            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>*/}
                {/*            <p className="text-sm text-gray-600">Manage parent notification settings</p>*/}
                {/*        </div>*/}
                {/*    </div>*/}

                {/*    <div className="space-y-4">*/}
                {/*        */}{/* Enable Notifications */}
                {/*        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">*/}
                {/*            <div>*/}
                {/*                <h3 className="font-medium text-gray-900">Enable Parent Notifications</h3>*/}
                {/*                <p className="text-sm text-gray-600">Send notifications to parents about attendance</p>*/}
                {/*            </div>*/}
                {/*            <label className="relative inline-flex items-center cursor-pointer">*/}
                {/*                <input*/}
                {/*                    type="checkbox"*/}
                {/*                    checked={settings.EnableParentNotification === '1'}*/}
                {/*                    onChange={(e) => handleChange('EnableParentNotification', e.target.checked ? '1' : '0')}*/}
                {/*                    className="sr-only peer"*/}
                {/*                />*/}
                {/*                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>*/}
                {/*            </label>*/}
                {/*        </div>*/}

                {/*        */}{/* Absent Notification Time */}
                {/*        {settings.EnableParentNotification === '1' && (*/}
                {/*            <div>*/}
                {/*                <label className="block text-sm font-medium text-gray-700 mb-2">*/}
                {/*                    Absent Notification Time*/}
                {/*                </label>*/}
                {/*                <input*/}
                {/*                    type="time"*/}
                {/*                    value={settings.AbsentNotificationTime}*/}
                {/*                    onChange={(e) => handleChange('AbsentNotificationTime', e.target.value)}*/}
                {/*                    className="input-field w-48"*/}
                {/*                />*/}
                {/*                <p className="text-xs text-gray-500 mt-1">*/}
                {/*                    Time to send notifications for absent students*/}
                {/*                </p>*/}
                {/*            </div>*/}
                {/*        )}*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </div>
    );
};

export default SettingsPage;