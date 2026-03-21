import api from './api';

// ============================================================
//  TYPES
// ============================================================

export type SessionType =
    | 'PENCERAPAN PERTAMA'
    | 'PENCERAPAN KEDUA'
    | 'PENCERAPAN KETIGA';

export type RatingType =
    | 'CEMERLANG'
    | 'BAIK'
    | 'SEDERHANA'
    | 'PERLU TINDAKAN SEGERA';

export interface MyPdpScoreItem {
    scoreItemID: number;
    assessmentID: number;
    standardCode: string;   // e.g. "4.1.1"
    itemCode: string;       // e.g. "4.1.1a"
    score: number;          // 0�4
}

export interface MyPdpAssessmentList {
    assessmentID: number;
    schoolID: number;
    teacherID: number;
    teacherName: string;
    classID: number;
    className: string;
    subject: string;
    academicYearID: number;
    academicYear: string;
    sessionType: SessionType;
    assessmentDate: string;
    totalScore: number;
    rating: RatingType;
    createdByName: string;
    createdDate: string;
    updatedDate?: string;
    isLocked: boolean;
}

export interface MyPdpAssessmentDetail extends MyPdpAssessmentList {
    ulasan?: string;
    score_4_1_1: number;
    score_4_2_1: number;
    score_4_2_2: number;
    score_4_3_1: number;
    score_4_4_1: number;
    score_4_4_2: number;
    score_4_5_1: number;
    score_4_6_1: number;
    scoreItems: MyPdpScoreItem[];
}

export interface MyPdpCreateDto {
    teacherID: number;
    classID: number;
    subject: string;
    academicYearID: number;
    sessionType: SessionType;
    assessmentDate: string;
    ulasan?: string;
    scoreItems: MyPdpScoreItem[];
}

export interface MyPdpUpdateDto extends MyPdpCreateDto {
    assessmentID: number;
}

export interface MyPdpSchoolStats {
    teacherID: number;
    teacherName: string;
    totalAssessments: number;
    avgScore?: number;
    maxScore?: number;
    minScore?: number;
    cemerlang: number;
    baik: number;
    sederhana: number;
    perluTindakan: number;
}

// ============================================================
//  CONSTANTS � 38 sub-items definition (mirrors backend)
// ============================================================

export interface SubItemDef {
    itemCode: string;
    letter: string;
    description: string;
    criteriaType: 'A' | 'B' | 'C_H' | 'C_L';
}

export interface StandardDef {
    code: string;
    weight: number;
    title: string;
    items: SubItemDef[];
}

// ── Criteria text per Standard (index 0 = score 4 … index 4 = score 0) ──
// Each standard has its own score-4 description; scores 3-0 follow type patterns.
// Source: Official SKPM Standard 4 PdPc form (Jemaah Nazir)
export const CRITERIA_TEXT: Record<'A' | 'B' | 'C_H' | 'C_L', [string, string, string, string, string]> = {
    // Type A — scores 3-0 shared; score 4 varies per standard (handled via SCORE4_TEXT)
    A: [
        '',  // score 4 — use SCORE4_TEXT[standardCode] instead
        'dengan mengambil kira perkara (i) dan (ii) atau perkara (i) dan (iii)',
        'dengan mengambil kira perkara (ii) dan (iii)',
        'dengan mengambil kira mana-mana satu (1) perkara',
        'tidak mengambil kira mana-mana perkara',
    ],
    B: [
        '',  // score 4 — use SCORE4_TEXT[standardCode] instead
        'dengan mengambil kira mana-mana tiga (3) perkara',
        'dengan mengambil kira mana-mana dua (2) perkara',
        'dengan mengambil kira mana-mana satu (1) perkara',
        'tidak mengambil kira mana-mana perkara',
    ],
    C_H: [
        'i. dengan pelibatan 90% hingga 100% murid ii. selaras dengan objektif pelajaran iii. dengan yakin iv. secara berhemah/bersungguh-sungguh',
        'i. dengan pelibatan 80% hingga 89% murid ii. dengan memenuhi sekurang-kurangnya dua (2) daripada perkara (ii), (iii) dan (iv)',
        'i. dengan pelibatan 50% hingga 79% murid ii. dengan memenuhi sekurang-kurangnya satu (1) daripada perkara (ii), (iii) dan (iv)',
        'i. dengan pelibatan 1% hingga 49% murid ii. dengan memenuhi sekurang-kurangnya satu (1) daripada perkara (ii), (iii) dan (iv)',
        'tidak memenuhi mana-mana perkara',
    ],
    C_L: [
        'i. dengan pelibatan 50% hingga 100% murid ii. selaras dengan objektif pelajaran iii. dengan yakin iv. secara berhemah/bersungguh-sungguh',
        'i. dengan pelibatan 25% hingga 49% murid ii. dengan memenuhi sekurang-kurangnya dua (2) daripada perkara (ii), (iii) dan (iv)',
        'i. dengan pelibatan 10% hingga 24% murid ii. dengan memenuhi sekurang-kurangnya satu (1) daripada perkara (ii), (iii) dan (iv)',
        'i. dengan pelibatan kurang daripada 10% murid ii. dengan memenuhi sekurang-kurangnya satu (1) daripada perkara (ii), (iii) dan (iv)',
        'tidak memenuhi mana-mana perkara',
    ],
};

// Score 4 criteria text — unique per standard (from official PDF)
export const SCORE4_TEXT: Record<string, string> = {
    '4.1.1': 'i. mengikut pelbagai aras keupayaan murid ii. mengikut peruntukan masa yang ditetapkan iii. dengan mematuhi arahan yang berkuat kuasa/ketetapan kurikulum',
    '4.2.1': 'i. dengan menepati objektif pelajaran ii. mengikut pelbagai aras keupayaan murid/pembelajaran terbeza iii. dari semasa ke semasa',
    '4.2.2': 'i. secara berhemah/mengikut kesesuaian ii. secara menyeluruh meliputi semua murid iii. dari semasa ke semasa',
    '4.3.1': 'i. mengikut keperluan/pelbagai aras keupayaan murid ii. dengan betul dan tepat iii. secara berhemah iv. bersungguh-sungguh',
    '4.4.1': 'i. berdasarkan objektif pelajaran ii. mengikut pelbagai aras keupayaan murid iii. dari semasa ke semasa',
    '4.4.2': 'i. secara berhemah ii. secara menyeluruh meliputi semua murid iii. dari semasa ke semasa',
    '4.5.1': 'i. berdasarkan objektif pelajaran ii. mengikut arahan pelaksanaan pentaksiran yang berkuat kuasa/ketetapan kurikulum iii. secara menyeluruh kepada semua murid iv. dari semasa ke semasa',
    // 4.6.1 uses C_H / C_L directly (already correct above)
};

export const STANDARDS: StandardDef[] = [
    {
        code: '4.1.1', weight: 10,
        title: 'STANDARD KUALITI Guru merancang pelaksanaan PdPc secara profesional dan sistematik',
        items: [
            { itemCode: '4.1.1a', letter: 'a', description: 'Menyediakan RPH yang mengandungi objektif yang boleh diukur dan aktiviti pembelajaran yang sesuai', criteriaType: 'A' },
            { itemCode: '4.1.1b', letter: 'b', description: 'Menentukan kaedah pentaksiran', criteriaType: 'A' },
            { itemCode: '4.1.1c', letter: 'c', description: 'Menyediakan ABM/BBM/BBB/TMK', criteriaType: 'A' },
        ],
    },
    {
        code: '4.2.1', weight: 10,
        title: 'STANDARD KUALITI Guru mengawal proses pembelajaran secara profesional dan terancang.',
        items: [
            { itemCode: '4.2.1a', letter: 'a', description: 'Mengelola isi pelajaran/skop pembelajaran yang dirancang', criteriaType: 'A' },
            { itemCode: '4.2.1b', letter: 'b', description: 'Mengelola masa PdPc selaras dengan aktiviti pembelajaran', criteriaType: 'A' },
            { itemCode: '4.2.1c', letter: 'c', description: 'Memberi peluang kepada penyertaan aktif murid', criteriaType: 'A' },
        ],
    },
    {
        code: '4.2.2', weight: 5,
        title: 'STANDARD KUALITI Guru mengawal suasana pembelajaran secara profesional dan terancang.',
        items: [
            { itemCode: '4.2.2a', letter: 'a', description: 'Mengawasi komunikasi murid dalam PdPc', criteriaType: 'A' },
            { itemCode: '4.2.2b', letter: 'b', description: 'Mengawasi perlakuan murid dalam PdPc', criteriaType: 'A' },
            { itemCode: '4.2.2c', letter: 'c', description: 'Menyusun atur kedudukan murid', criteriaType: 'A' },
            { itemCode: '4.2.2d', letter: 'd', description: 'Melaksanakan aktiviti pembelajaran yang menyeronokkan', criteriaType: 'A' },
        ],
    },
    {
        code: '4.3.1', weight: 15,
        title: 'STANDARD KUALITI Guru membimbing murid secara profesional dan terancang.',
        items: [
            { itemCode: '4.3.1a', letter: 'a', description: 'Memberi tunjuk ajar/tunjuk cara/panduan menguasai isi pelajaran/konsep/fakta berkaitan pelajaran', criteriaType: 'B' },
            { itemCode: '4.3.1b', letter: 'b', description: 'Memberi tunjuk ajar/tunjuk cara/panduan menguasai kemahiran dalam aktiviti pembelajaran', criteriaType: 'B' },
            { itemCode: '4.3.1c', letter: 'c', description: 'Memandu murid membuat keputusan dan menyelesaikan masalah dalam aktiviti pembelajaran', criteriaType: 'B' },
            { itemCode: '4.3.1d', letter: 'd', description: 'Memandu murid menggunakan/memanfaatkan sumber Pendidikan berkaitan pelajaran', criteriaType: 'B' },
            { itemCode: '4.3.1e', letter: 'e', description: 'Menggabung/merentas/mengaitkan isi pelajaran dengan tajuk/unit/tema/nilai/kemahiran/mata pelajaran lain', criteriaType: 'B' },
        ],
    },
    {
        code: '4.4.1', weight: 25,
        title: 'STANDARD KUALITI Guru mendorong minda murid dalam melaksanakan aktiviti pembelajaran secara profesional dan terancang.',
        items: [
            { itemCode: '4.4.1a', letter: 'a', description: 'Merangsang murid berkomunikasi', criteriaType: 'A' },
            { itemCode: '4.4.1b', letter: 'b', description: 'Merangsang murid berkolaboratif dalam aktiviti pembelajaran', criteriaType: 'A' },
            { itemCode: '4.4.1c', letter: 'c', description: 'Mengemukakan soalan yang menjurus ke arah pemikiran kritis dan kreatif', criteriaType: 'A' },
            { itemCode: '4.4.1d', letter: 'd', description: 'Mengajukan soalan/mewujudkan situasi yang menjurus ke arah membuat keputusan dan menyelesaikan masalah', criteriaType: 'A' },
            { itemCode: '4.4.1e', letter: 'e', description: 'Mewujudkan peluang untuk murid memimpin', criteriaType: 'A' },
            { itemCode: '4.4.1f', letter: 'f', description: 'Menggalakkan murid mengemukakan soalan berkaitan isi pelajaran', criteriaType: 'A' },
            { itemCode: '4.4.1g', letter: 'g', description: 'Menggalakkan murid memperoleh pengetahuan dan kemahiran secara kendiri', criteriaType: 'A' },
        ],
    },
    {
        code: '4.4.2', weight: 5,
        title: 'STANDARD KUALITI Guru mendorong emosi murid dalam melaksanakan aktiviti pembelajaran secara profesional dan terancang.',
        items: [
            { itemCode: '4.4.2a', letter: 'a', description: 'Memberi pujian/galakan terhadap perlakuan positif', criteriaType: 'A' },
            { itemCode: '4.4.2b', letter: 'b', description: 'Memberi penghargaan terhadap hasil kerja/idea yang bernas', criteriaType: 'A' },
            { itemCode: '4.4.2c', letter: 'c', description: 'Memberi keyakinan dalam mengemukakan soalan/memberi respons', criteriaType: 'A' },
            { itemCode: '4.4.2d', letter: 'd', description: 'Prihatin terhadap keperluan murid', criteriaType: 'A' },
        ],
    },
    {
        code: '4.5.1', weight: 10,
        title: 'STANDARD KUALITI Guru melaksanakan penilaian secara sistematik dan terancang.',
        items: [
            { itemCode: '4.5.1a', letter: 'a', description: 'Menggunakan pelbagai kaedah pentaksiran dalam PdPc', criteriaType: 'B' },
            { itemCode: '4.5.1b', letter: 'b', description: 'Menjalankan aktiviti pemulihan/pengayaan dalam PdPc', criteriaType: 'B' },
            { itemCode: '4.5.1c', letter: 'c', description: 'Memberi latihan/tugasan berkaitan pelajaran', criteriaType: 'B' },
            { itemCode: '4.5.1d', letter: 'd', description: 'Membuat refleksi PdPc', criteriaType: 'B' },
            { itemCode: '4.5.1e', letter: 'e', description: 'Menyemak/menilai hasil kerja/gerak kerja/latihan/tugasan', criteriaType: 'B' },
        ],
    },
    {
        code: '4.6.1', weight: 20,
        title: 'STANDARD KUALITI Murid melibatkan diri dalam proses pembelajaran secara berkesan.',
        items: [
            { itemCode: '4.6.1a', letter: 'a', description: 'Memberi respons berkaitan isi pelajaran', criteriaType: 'C_H' },
            { itemCode: '4.6.1b', letter: 'b', description: 'Berkomunikasi dalam melaksanakan aktiviti pembelajaran', criteriaType: 'C_H' },
            { itemCode: '4.6.1c', letter: 'c', description: 'Melaksanakan aktiviti pembelajaran secara kolaboratif', criteriaType: 'C_H' },
            { itemCode: '4.6.1d', letter: 'd', description: 'Memberi respons yang menjurus ke arah pemikiran kritis dan kreatif berkaitan isi pelajaran', criteriaType: 'C_L' },
            { itemCode: '4.6.1e', letter: 'e', description: 'Mengemukakan soalan berkaitan isi pelajaran', criteriaType: 'C_L' },
            { itemCode: '4.6.1f', letter: 'f', description: 'Mengaitkan isi pelajaran dengan kehidupan murid/isu lokal/global', criteriaType: 'C_L' },
            { itemCode: '4.6.1g', letter: 'g', description: 'Membuat keputusan menyelesaikan masalah berkaitan aktiviti pembelajaran', criteriaType: 'C_L' },
        ],
    },
];

// Build a fresh set of 38 blank score items (score = 0)
export const buildDefaultScoreItems = (): MyPdpScoreItem[] =>
    STANDARDS.flatMap(std =>
        std.items.map(item => ({
            scoreItemID: 0,
            assessmentID: 0,
            standardCode: std.code,
            itemCode: item.itemCode,
            score: 0,
        }))
    );

// Rating helpers
export const RATING_CONFIG: Record<RatingType, { color: string; bg: string; label: string }> = {
    'CEMERLANG': { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Cemerlang' },
    'BAIK': { color: 'text-blue-700', bg: 'bg-blue-50', label: 'Baik' },
    'SEDERHANA': { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Sederhana' },
    'PERLU TINDAKAN SEGERA': { color: 'text-red-700', bg: 'bg-red-50', label: 'Perlu Tindakan' },
};

export const getRating = (score: number): RatingType => {
    if (score >= 85) return 'CEMERLANG';
    if (score >= 70) return 'BAIK';
    if (score >= 55) return 'SEDERHANA';
    return 'PERLU TINDAKAN SEGERA';
};

// Calculate standard score: (sum / (itemCount x 4)) x weight
export const calcStandardScore = (
    items: MyPdpScoreItem[],
    standardCode: string,
    weight: number,
): number => {
    const std = STANDARDS.find(s => s.code === standardCode);
    if (!std) return 0;
    const relevant = items.filter(i => i.standardCode === standardCode);
    if (relevant.length === 0) return 0;
    const sum = relevant.reduce((acc, i) => acc + i.score, 0);
    const max = std.items.length * 4;
    return Math.round((sum / max) * weight * 100) / 100;
};

export const calcTotalScore = (items: MyPdpScoreItem[]): number => {
    const total = STANDARDS.reduce((acc, std) =>
        acc + calcStandardScore(items, std.code, std.weight), 0);
    return Math.round(total * 100) / 100;
};

// ============================================================
//  SERVICE
// ============================================================

export const myPdpService = {

    getAll: async (params?: {
        academicYearId?: number;
        sessionType?: string;
    }): Promise<{ items: MyPdpAssessmentList[]; totalCount: number }> => {
        const query = new URLSearchParams();
        if (params?.academicYearId) query.append('academicYearId', String(params.academicYearId));
        if (params?.sessionType) query.append('sessionType', params.sessionType);
        const response = await api.get(`/mypdp?${query.toString()}`);
        return response.data.data;
    },

    getById: async (id: number): Promise<MyPdpAssessmentDetail> => {
        const response = await api.get(`/mypdp/${id}`);
        return response.data.data;
    },

    getStats: async (academicYearId?: number): Promise<{ stats: MyPdpSchoolStats[]; totalTeachers: number }> => {
        const query = new URLSearchParams();
        if (academicYearId) query.append('academicYearId', String(academicYearId));
        const response = await api.get(`/mypdp/stats?${query.toString()}`);
        return response.data.data;
    },

    create: async (dto: MyPdpCreateDto): Promise<MyPdpAssessmentDetail> => {
        const response = await api.post('/mypdp', dto);
        return response.data.data;
    },

    update: async (id: number, dto: MyPdpUpdateDto): Promise<MyPdpAssessmentDetail> => {
        const response = await api.put(`/mypdp/${id}`, dto);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/mypdp/${id}`);
    },

    exportWord: async (id: number, filename: string): Promise<void> => {
        const response = await api.get(`/mypdp/${id}/export/word`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    exportPdf: async (id: number, filename: string): Promise<void> => {
        const response = await api.get(`/mypdp/${id}/export/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};