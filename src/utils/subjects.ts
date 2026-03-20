// ─────────────────────────────────────────────────────────────────────────────
// src/utils/subjects.ts
//
// Shared subject list used across:
//   - HomeWorkPage.tsx
//   - PencerapanPage.tsx
//   - TelegramHomeWorkPage.tsx
//   - (any future page that needs a subject dropdown)
//
// Usage:
//   import { SUBJECTS, getSubjectLabel } from '../utils/subjects';
//   const { i18n } = useTranslation();
//   <option value={s.value}>{getSubjectLabel(s, i18n.language)}</option>
// ─────────────────────────────────────────────────────────────────────────────

export interface SubjectOption {
    value: string;   // stored value in DB (Bahasa Malaysia canonical name)
    en: string;   // English display label
    zh: string;   // Chinese display label
    ms: string;   // Bahasa Malaysia display label
}

export const SUBJECTS: SubjectOption[] = [
    { value: 'Bahasa Malaysia', en: 'Malay Language', zh: '国语', ms: 'Bahasa Malaysia' },
    { value: 'Bahasa Cina', en: 'Chinese Language', zh: '华文', ms: 'Bahasa Cina' },
    { value: 'Bahasa Inggeris', en: 'English Language', zh: '英文', ms: 'Bahasa Inggeris' },
    { value: 'Matematik', en: 'Mathematics', zh: '数学', ms: 'Matematik' },
    { value: 'Sains', en: 'Science', zh: '科学', ms: 'Sains' },
    { value: 'Pendidikan Islam', en: 'Islamic Education', zh: '伊斯兰教育', ms: 'Pendidikan Islam' },
    { value: 'Pendidikan Moral', en: 'Moral Education', zh: '道德教育', ms: 'Pendidikan Moral' },
    { value: 'Sejarah', en: 'History', zh: '历史', ms: 'Sejarah' },
    { value: 'Geografi', en: 'Geography', zh: '地理', ms: 'Geografi' },
    { value: 'Pendidikan Jasmani & Kesihatan', en: 'Physical & Health Education', zh: '体育与健康', ms: 'Pendidikan Jasmani & Kesihatan' },
    { value: 'Pendidikan Seni Visual', en: 'Visual Art Education', zh: '美术教育', ms: 'Pendidikan Seni Visual' },
    { value: 'Muzik', en: 'Music', zh: '音乐', ms: 'Muzik' },
    { value: 'RBT', en: 'Design & Technology (RBT)', zh: '设计与技术 (RBT)', ms: 'Reka Bentuk & Teknologi (RBT)' },
    { value: 'Pendidikan Kesenian', en: 'Arts Education', zh: '艺术教育', ms: 'Pendidikan Kesenian' },
    { value: 'Teknologi Maklumat & Komunikasi', en: 'ICT', zh: '信息科技', ms: 'Teknologi Maklumat & Komunikasi' },
    { value: 'Sivik', en: 'Civic Studies', zh: '公民教育', ms: 'Sivik' },
    { value: 'Lain-lain', en: 'Other', zh: '其他', ms: 'Lain-lain' },
];

/**
 * Returns the display label for a subject based on the current UI language.
 * Falls back to the value (BM name) if language is not recognised.
 *
 * @param subject  - SubjectOption object
 * @param language - i18n.language string, e.g. 'en', 'zh', 'ms', 'zh-CN'
 */
export const getSubjectLabel = (subject: SubjectOption, language: string): string => {
    const lang = language.toLowerCase();
    if (lang.startsWith('zh')) return subject.zh;
    if (lang === 'ms' || lang === 'bm') return subject.ms;
    if (lang === 'en') return subject.en;
    return subject.value;
};