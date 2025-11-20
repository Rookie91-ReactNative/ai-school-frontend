
/**
 * Map of ActivityType display names to translation keys
 * 活动类型显示名称到翻译键的映射
 * Pemetaan nama paparan ActivityType ke kunci terjemahan
 */
export const ActivityTypeTranslationKeys: Record<string, string> = {
    'Football/Soccer': 'football',
    'Basketball': 'basketball',
    'Badminton': 'badminton',
    'Table Tennis': 'tableTennis',
    'Volleyball': 'volleyball',
    'Netball': 'netball',
    'Athletics': 'athletics',
    'Swimming': 'swimming',
    'Cricket': 'cricket',
    'Rugby': 'rugby',
    'Hockey': 'hockey',
    'Sepak Takraw': 'sepakTakraw',
    'Martial Arts': 'martialArts',
    'Gymnastics': 'gymnastics',
    '24 Festive Drums': '_24FestiveDrums',
    'Choir': 'choir',
    'Orchestra': 'orchestra',
    'Dance': 'dance',
    'Drama': 'drama',
    'Traditional Music': 'traditionalMusic',
    'Debate': 'debate',
    'Science Club': 'scienceClub',
    'Mathematics Club': 'mathematicsClub',
    'Language Club': 'languageClub',
    'History Club': 'historyClub',
    'Geography Club': 'geographyClub',
    'Robotics Club': 'roboticsClub',
    'IT Club': 'itClub',
    'Photography Club': 'photographyClub',
    'Chess': 'chess',
    'Art & Craft': 'artAndCraft',
    'Painting': 'painting',
    'Sculpture': 'sculpture',
    'Calligraphy': 'calligraphy',
    'Scouts': 'scouts',
    'Girl Guides': 'girlGuides',
    'Cadet': 'cadet',
    'St. John Ambulance': 'stJohnAmbulance',
    'Red Crescent': 'redCrescent',
    'Prefect': 'prefect',
    'Student Council': 'studentCouncil',
    'Library Club': 'libraryClub',
    'Environmental Club': 'environmentalClub',
    'Other': 'other'
};

/**
 * Get translated activity type name
 * 获取翻译的活动类型名称
 * Dapatkan nama jenis aktiviti yang diterjemahkan
 * 
 * @param activityTypeName - The English activity type name from backend
 * @param t - The translation function from useTranslation hook
 * @returns Translated activity type name
 * 
 * @example
 * const translated = getTranslatedActivityType('Basketball', t);
 * // English: "Basketball"
 * // Chinese: "篮球"
 * // Malay: "Bola Keranjang"
 */
export const getTranslatedActivityType = (
    activityTypeName: string,
    t: (key: string) => string
): string => {
    const key = ActivityTypeTranslationKeys[activityTypeName];
    return key ? t(`activityTypes.${key}`) : activityTypeName;
};

/**
 * Get all translated activity type names for a specific language
 * 获取特定语言的所有翻译活动类型名称
 * Dapatkan semua nama jenis aktiviti yang diterjemahkan untuk bahasa tertentu
 * 
 * @param t - The translation function from useTranslation hook
 * @returns Object mapping English names to translated names
 */
export const getAllTranslatedActivityTypes = (
    t: (key: string) => string
): Record<string, string> => {
    const translations: Record<string, string> = {};

    for (const [englishName, translationKey] of Object.entries(ActivityTypeTranslationKeys)) {
        translations[englishName] = t(`activityTypes.${translationKey}`);
    }

    return translations;
};

/**
 * Get translation key from activity type name
 * 从活动类型名称获取翻译键
 * Dapatkan kunci terjemahan daripada nama jenis aktiviti
 * 
 * @param activityTypeName - The English activity type name
 * @returns Translation key or null if not found
 */
export const getActivityTypeTranslationKey = (activityTypeName: string): string | null => {
    return ActivityTypeTranslationKeys[activityTypeName] || null;
};