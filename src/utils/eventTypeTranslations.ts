/**
 * Map of EventType display names to translation keys
 * 活动类型显示名称到翻译键的映射
 * Pemetaan nama paparan EventType ke kunci terjemahan
 */
export const EventTypeTranslationKeys: Record<string, string> = {
    'Training Session': 'trainingSession',
    'School Competition': 'schoolCompetition',
    'District Competition': 'districtCompetition',
    'State Competition': 'stateCompetition',
    'National Competition': 'nationalCompetition',
    'International Competition': 'internationalCompetition',
    'Friendly Match': 'friendlyMatch',
    'Performance': 'performance',
    'Workshop': 'workshop',
    'Camp': 'camp',
    'Other': 'other'
};

/**
 * Get translated event type name
 * 获取翻译的活动类型名称
 * Dapatkan nama jenis acara yang diterjemahkan
 * 
 * @param eventTypeName - The English event type name from backend
 * @param t - The translation function from useTranslation hook
 * @returns Translated event type name
 * 
 * @example
 * const translated = getTranslatedEventType('Training Session', t);
 * // English: "Training Session"
 * // Chinese: "训练课程"
 * // Malay: "Sesi Latihan"
 */
export const getTranslatedEventType = (
    eventTypeName: string,
    t: (key: string) => string
): string => {
    const key = EventTypeTranslationKeys[eventTypeName];
    return key ? t(`eventTypes.${key}`) : eventTypeName;
};

/**
 * Get all translated event type names for a specific language
 * 获取特定语言的所有翻译活动类型名称
 * Dapatkan semua nama jenis acara yang diterjemahkan untuk bahasa tertentu
 * 
 * @param t - The translation function from useTranslation hook
 * @returns Object mapping English names to translated names
 */
export const getAllTranslatedEventTypes = (
    t: (key: string) => string
): Record<string, string> => {
    const translations: Record<string, string> = {};

    for (const [englishName, translationKey] of Object.entries(EventTypeTranslationKeys)) {
        translations[englishName] = t(`eventTypes.${translationKey}`);
    }

    return translations;
};

/**
 * Get translation key from event type name
 * 从活动类型名称获取翻译键
 * Dapatkan kunci terjemahan daripada nama jenis acara
 * 
 * @param eventTypeName - The English event type name
 * @returns Translation key or null if not found
 */
export const getEventTypeTranslationKey = (eventTypeName: string): string | null => {
    return EventTypeTranslationKeys[eventTypeName] || null;
};