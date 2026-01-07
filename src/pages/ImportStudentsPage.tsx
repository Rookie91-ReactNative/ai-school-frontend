import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle,
    X, Users, FileWarning, Loader2, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

// Interface for import row data
interface ImportStudentRow {
    rowNumber: number;
    studentCode: string;
    fullName: string;
    otherName?: string;
    dateOfBirth: string;
    gender: string;
    academicYear: string;
    className: string;
    email?: string;
    phoneNumber?: string;
    parentName?: string;
    parentContact?: string;
    parentEmail?: string;
    address?: string;
    isValid: boolean;
    errors: string[];
}

// Interface for import result
interface ImportResult {
    success: boolean;
    totalRows: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    errors: { row: number; message: string }[];
}

// Interface for validation data from backend
interface ValidationData {
    academicYears: { academicYearID: number; yearName: string }[];
    grades: { gradeID: number; gradeName: string }[];
    classes: { classID: number; className: string; gradeID: number; academicYearID: number }[];
}

const ImportStudentsPage = () => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ImportStudentRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [validationData, setValidationData] = useState<ValidationData | null>(null);
    const [loadingValidation, setLoadingValidation] = useState(true);

    // Load validation data on mount
    useEffect(() => {
        loadValidationData();
    }, []);

    const loadValidationData = async () => {
        try {
            setLoadingValidation(true);
            const response = await api.get('/student/import/validation-data');
            setValidationData(response.data.data);
        } catch (err) {
            console.error('Error loading validation data:', err);
            setError(t('import.errors.loadValidationFailed'));
        } finally {
            setLoadingValidation(false);
        }
    };

    // Expected columns in the Excel file
    const expectedColumns = [
        { key: 'studentCode', label: t('import.columns.studentCode'), required: true },
        { key: 'academicYear', label: t('import.columns.academicYear'), required: true },
        { key: 'className', label: t('import.columns.class'), required: true },
        { key: 'fullName', label: t('import.columns.fullName'), required: true },
        { key: 'otherName', label: t('import.columns.otherName'), required: false },
        { key: 'dateOfBirth', label: t('import.columns.dateOfBirth'), required: false },
        { key: 'gender', label: t('import.columns.gender'), required: true },
        { key: 'email', label: t('import.columns.email'), required: false },
        { key: 'phoneNumber', label: t('import.columns.phoneNumber'), required: false },
        { key: 'parentName', label: t('import.columns.parentName'), required: false },
        { key: 'parentContact', label: t('import.columns.parentContact'), required: false },
        { key: 'parentEmail', label: t('import.columns.parentEmail'), required: false },
        { key: 'address', label: t('import.columns.address'), required: false }
    ];

    // Download template
    const handleDownloadTemplate = () => {
        // Get first active academic year for template
        const activeYear = validationData?.academicYears[0]?.yearName || '2024/2025';
        const sampleClass1 = validationData?.classes[0]?.className || '1J';
        const sampleClass2 = validationData?.classes[1]?.className || '2S';

        const templateData = [
            {
                'Student Code': 'STU001',
                'Academic Year': activeYear,
                'Full Name': 'Ahmad bin Ali',
                'Other Name': '阿末',
                'Date of Birth': '2010-05-15',
                'Gender': 'Male',
                'Email': 'ahmad@example.com',
                'Phone Number': '0123456789',
                'Parent Name': 'Ali bin Abu',
                'Parent Contact': '0198765432',
                'Parent Email': 'ali@example.com',
                'Address': '123, Jalan ABC, 50000 Kuala Lumpur',
                'Class': sampleClass1
            },
            {
                'Student Code': 'STU002',
                'Academic Year': activeYear,
                'Full Name': 'Siti binti Rahman',
                'Other Name': '茜蒂',
                'Date of Birth': '2011-08-20',
                'Gender': 'Female',
                'Email': '',
                'Phone Number': '',
                'Parent Name': 'Rahman bin Hassan',
                'Parent Contact': '0177654321',
                'Parent Email': 'rahman@example.com',
                'Address': '456, Jalan XYZ, 40000 Shah Alam',
                'Class': sampleClass2
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // Student Code
            { wch: 12 }, // Academic Year
            { wch: 25 }, // Full Name
            { wch: 15 }, // Other Name
            { wch: 15 }, // Date of Birth
            { wch: 10 }, // Gender
            { wch: 25 }, // Email
            { wch: 15 }, // Phone Number
            { wch: 25 }, // Parent Name
            { wch: 15 }, // Parent Contact
            { wch: 25 }, // Parent Email
            { wch: 40 }, // Address
            { wch: 10 }  // Class
        ];

        XLSX.writeFile(wb, 'student_import_template.xlsx');
    };

    // Validate a single row
    const validateRow = (row: Partial<ImportStudentRow>, rowNumber: number): ImportStudentRow => {
        const errors: string[] = [];

        // Required field validations
        if (!row.studentCode?.trim()) {
            errors.push(t('import.validation.studentCodeRequired'));
        }
        if (!row.fullName?.trim()) {
            errors.push(t('import.validation.fullNameRequired'));
        }
        // DateOfBirth is optional - only validate format if provided
        if (row.dateOfBirth?.trim()) {
            const date = new Date(row.dateOfBirth);
            if (isNaN(date.getTime())) {
                errors.push(t('import.validation.invalidDateFormat'));
            }
        }
        if (!row.gender?.trim()) {
            errors.push(t('import.validation.genderRequired'));
        } else if (!isValidGender(row.gender.trim())) {
            errors.push(t('import.validation.invalidGender'));
        }

        // Academic Year validation
        if (!row.academicYear?.trim()) {
            errors.push(t('import.validation.academicYearRequired'));
        } else if (validationData) {
            const yearExists = validationData.academicYears.some(
                y => y.yearName.toLowerCase() === row.academicYear?.trim().toLowerCase()
            );
            if (!yearExists) {
                errors.push(t('import.validation.invalidAcademicYear', { year: row.academicYear }));
            }
        }

        // Class validation
        if (!row.className?.trim()) {
            errors.push(t('import.validation.classRequired'));
        } else if (validationData) {
            const classExists = validationData.classes.some(
                c => c.className.toLowerCase() === row.className?.trim().toLowerCase()
            );
            if (!classExists) {
                errors.push(t('import.validation.invalidClass', { className: row.className }));
            }
        }

        // Optional field validations
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(t('import.validation.invalidEmail'));
        }
        if (row.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.parentEmail)) {
            errors.push(t('import.validation.invalidParentEmail'));
        }

        return {
            rowNumber,
            studentCode: row.studentCode?.trim() || '',
            fullName: row.fullName?.trim() || '',
            otherName: row.otherName?.trim() || undefined,
            dateOfBirth: row.dateOfBirth?.trim() || '',
            gender: normalizeGender(row.gender?.trim() || ''),
            academicYear: row.academicYear?.trim() || '',
            className: row.className?.trim() || '',
            email: row.email?.trim() || undefined,
            phoneNumber: row.phoneNumber?.trim() || undefined,
            parentName: row.parentName?.trim() || undefined,
            parentContact: row.parentContact?.trim() || undefined,
            parentEmail: row.parentEmail?.trim() || undefined,
            address: row.address?.trim() || undefined,
            isValid: errors.length === 0,
            errors
        };
    };

    // Check if gender value is valid (English, Malay, or Chinese)
    const isValidGender = (gender: string): boolean => {
        const validValues = [
            // English
            'male', 'female', 'm', 'f',
            // Bahasa Melayu
            'lelaki', 'perempuan', 'l', 'p',
            // 华语 (Chinese)
            '男', '女'
        ];
        return validValues.includes(gender.toLowerCase());
    };

    // Normalize gender value to English (Male/Female)
    const normalizeGender = (gender: string): string => {
        const g = gender.toLowerCase();
        // English
        if (g === 'm' || g === 'male') return 'Male';
        if (g === 'f' || g === 'female') return 'Female';
        // Bahasa Melayu
        if (g === 'l' || g === 'lelaki') return 'Male';
        if (g === 'p' || g === 'perempuan') return 'Female';
        // 华语 (Chinese)
        if (gender === '男') return 'Male';
        if (gender === '女') return 'Female';
        return gender;
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (!validTypes.includes(selectedFile.type) &&
            !selectedFile.name.endsWith('.xlsx') &&
            !selectedFile.name.endsWith('.xls') &&
            !selectedFile.name.endsWith('.csv')) {
            setError(t('import.errors.invalidFileType'));
            return;
        }

        setFile(selectedFile);
        setError(null);
        parseFile(selectedFile);
    };

    // Parse the uploaded file
    const parseFile = (file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    setError(t('import.errors.emptyFile'));
                    return;
                }

                // Get headers (first row)
                const headers = jsonData[0] as string[];

                // Map headers to our expected format
                const headerMap: Record<string, string> = {
                    'Student Code': 'studentCode',
                    'StudentCode': 'studentCode',
                    'student_code': 'studentCode',
                    'Academic Year': 'academicYear',
                    'AcademicYear': 'academicYear',
                    'academic_year': 'academicYear',
                    'Year': 'academicYear',
                    'Full Name': 'fullName',
                    'FullName': 'fullName',
                    'full_name': 'fullName',
                    'Name': 'fullName',
                    'Other Name': 'otherName',
                    'OtherName': 'otherName',
                    'other_name': 'otherName',
                    '中文名': 'otherName',
                    'Chinese Name': 'otherName',
                    'Nama Lain': 'otherName',
                    'Tamil Name': 'otherName',
                    'Date of Birth': 'dateOfBirth',
                    'DateOfBirth': 'dateOfBirth',
                    'date_of_birth': 'dateOfBirth',
                    'DOB': 'dateOfBirth',
                    'Gender': 'gender',
                    'Email': 'email',
                    'Phone Number': 'phoneNumber',
                    'PhoneNumber': 'phoneNumber',
                    'phone_number': 'phoneNumber',
                    'Phone': 'phoneNumber',
                    'Parent Name': 'parentName',
                    'ParentName': 'parentName',
                    'parent_name': 'parentName',
                    'Parent Contact': 'parentContact',
                    'ParentContact': 'parentContact',
                    'parent_contact': 'parentContact',
                    'Parent Email': 'parentEmail',
                    'ParentEmail': 'parentEmail',
                    'parent_email': 'parentEmail',
                    'Address': 'address',
                    'Class': 'className',
                    'ClassName': 'className',
                    'class_name': 'className',
                    'Classes': 'className'
                };

                // Parse data rows
                const parsedRows: ImportStudentRow[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as unknown[];
                    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
                        continue; // Skip empty rows
                    }

                    const rowData: Record<string, string> = {};
                    headers.forEach((header, index) => {
                        const mappedKey = headerMap[header] || header.toLowerCase().replace(/\s+/g, '');
                        let cellValue = row[index];

                        // Handle date values from Excel
                        if (mappedKey === 'dateOfBirth' && typeof cellValue === 'number') {
                            // Excel date serial number to JS date
                            const date = XLSX.SSF.parse_date_code(cellValue);
                            cellValue = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                        }

                        rowData[mappedKey] = cellValue?.toString() || '';
                    });

                    const validatedRow = validateRow(rowData as Partial<ImportStudentRow>, i + 1);
                    parsedRows.push(validatedRow);
                }

                if (parsedRows.length === 0) {
                    setError(t('import.errors.noValidData'));
                    return;
                }

                setParsedData(parsedRows);
                setStep('preview');
            } catch (err) {
                console.error('Error parsing file:', err);
                setError(t('import.errors.parseError'));
            }
        };

        reader.onerror = () => {
            setError(t('import.errors.readError'));
        };

        reader.readAsBinaryString(file);
    };

    // Remove a row from preview
    const handleRemoveRow = (rowNumber: number) => {
        setParsedData(prev => prev.filter(row => row.rowNumber !== rowNumber));
    };

    // Handle import
    const handleImport = async () => {
        const validRows = parsedData.filter(row => row.isValid);

        if (validRows.length === 0) {
            setError(t('import.errors.noValidRows'));
            return;
        }

        setImporting(true);
        setError(null);

        try {
            // Build the payload
            const payload = {
                students: validRows.map(row => ({
                    studentCode: row.studentCode,
                    fullName: row.fullName,
                    otherName: row.otherName || null,
                    dateOfBirth: row.dateOfBirth || null,
                    gender: row.gender,
                    academicYear: row.academicYear,
                    className: row.className,
                    email: row.email || null,
                    phoneNumber: row.phoneNumber || null,
                    parentName: row.parentName || null,
                    parentContact: row.parentContact || null,
                    parentEmail: row.parentEmail || null,
                    address: row.address || null
                }))
            };

            // Log the payload for debugging
            //console.log('📤 Import payload:', JSON.stringify(payload, null, 2));

            const response = await api.post('/student/import', payload);

            setImportResult(response.data.data);
            setStep('result');
        } catch (err: unknown) {
            console.error('❌ Import error:', err);

            // Enhanced error handling to show detailed error
            const axiosError = err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                        title?: string;
                    };
                    status?: number;
                }
            };

            // Log full error details
            console.error('📋 Error details:', {
                status: axiosError.response?.status,
                data: axiosError.response?.data,
                errors: axiosError.response?.data?.errors,
                title: axiosError.response?.data?.title
            });

            // Build error message
            let errorMessage = t('import.errors.importFailed');

            if (axiosError.response?.data) {
                const data = axiosError.response.data;

                if (data.message) {
                    errorMessage = data.message;
                } else if (data.title) {
                    errorMessage = data.title;
                }

                // If there are validation errors, show them
                if (data.errors) {
                    const errorDetails = Object.entries(data.errors)
                        .map(([field, messages]) => {
                            const messageText = Array.isArray(messages)
                                ? messages.join(', ')
                                : String(messages);
                            return `${field}: ${messageText}`;
                        })
                        .join('; ');
                    errorMessage = `${errorMessage}: ${errorDetails}`;
                }
            }

            setError(errorMessage);
        } finally {
            setImporting(false);
        }
    };

    // Reset to start over
    const handleReset = () => {
        setFile(null);
        setParsedData([]);
        setImportResult(null);
        setError(null);
        setStep('upload');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Count valid/invalid rows
    const validCount = parsedData.filter(row => row.isValid).length;
    const invalidCount = parsedData.filter(row => !row.isValid).length;

    if (loadingValidation) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">{t('import.loadingValidation')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('import.title')}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{t('import.subtitle')}</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-center">
                    <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${step === 'upload' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'
                            }`}>
                            {step === 'upload' ? '1' : <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden sm:inline">{t('import.steps.upload')}</span>
                    </div>
                    <div className={`w-8 sm:w-24 h-1 mx-2 sm:mx-4 ${step !== 'upload' ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : step === 'result' ? 'text-green-600' : 'text-gray-400'
                        }`}>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${step === 'preview' ? 'bg-blue-100 border-2 border-blue-600' :
                            step === 'result' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                            {step === 'result' ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : '2'}
                        </div>
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden sm:inline">{t('import.steps.preview')}</span>
                    </div>
                    <div className={`w-8 sm:w-24 h-1 mx-2 sm:mx-4 ${step === 'result' ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`flex items-center ${step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${step === 'result' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                            {step === 'result' ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : '3'}
                        </div>
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden sm:inline">{t('import.steps.result')}</span>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs sm:text-sm text-red-700">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
                    {/* Available Data Info */}
                    {validationData && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('import.availableData.title')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600 mb-1 text-xs sm:text-sm">{t('import.availableData.academicYears')}:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {validationData.academicYears.map(y => (
                                            <span key={y.academicYearID} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                {y.yearName}
                                            </span>
                                        ))}
                                        {validationData.academicYears.length === 0 && (
                                            <span className="text-gray-400 italic">{t('import.availableData.none')}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1 text-xs sm:text-sm">{t('import.availableData.grades')}:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {validationData.grades.map(g => (
                                            <span key={g.gradeID} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                                {g.gradeName}
                                            </span>
                                        ))}
                                        {validationData.grades.length === 0 && (
                                            <span className="text-gray-400 italic">{t('import.availableData.none')}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1 text-xs sm:text-sm">{t('import.availableData.classes')}:</p>
                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                        {validationData.classes.slice(0, 15).map(c => (
                                            <span key={c.classID} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                                {c.className}
                                            </span>
                                        ))}
                                        {validationData.classes.length > 15 && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                +{validationData.classes.length - 15} {t('import.availableData.more')}
                                            </span>
                                        )}
                                        {validationData.classes.length === 0 && (
                                            <span className="text-gray-400 italic">{t('import.availableData.none')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Download Template */}
                    <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                            <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-medium text-blue-900 text-sm sm:text-base">{t('import.template.title')}</h3>
                                <p className="text-xs sm:text-sm text-blue-700 mt-1">{t('import.template.description')}</p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    {t('import.template.download')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile) {
                                setFile(droppedFile);
                                parseFile(droppedFile);
                            }
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mb-3 sm:mb-4" />
                                <p className="text-base sm:text-lg font-medium text-gray-900 break-all px-2">{file.name}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="mt-4 text-sm text-red-600 hover:text-red-800 py-2"
                                >
                                    {t('import.upload.removeFile')}
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                <p className="text-base sm:text-lg font-medium text-gray-700">{t('import.upload.dragDrop')}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-2">{t('import.upload.or')}</p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-4 px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                                >
                                    {t('import.upload.browse')}
                                </button>
                                <p className="text-xs text-gray-400 mt-4">{t('import.upload.supportedFormats')}</p>
                            </label>
                        )}
                    </div>

                    {/* Column Info */}
                    <div className="mt-6 sm:mt-8">
                        <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">{t('import.columns.title')}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                            {expectedColumns.map(col => (
                                <div
                                    key={col.key}
                                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm ${col.required
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                                        }`}
                                >
                                    {col.label}
                                    {col.required && <span className="text-red-500 ml-1">*</span>}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            <span className="text-red-500">*</span> {t('import.columns.requiredNote')}
                        </p>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Summary */}
                    <div className="p-3 sm:p-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                    <span className="text-xs sm:text-sm text-gray-700">
                                        {t('import.preview.totalRows')}: <strong>{parsedData.length}</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                    <span className="text-xs sm:text-sm text-green-700">
                                        {t('import.preview.valid')}: <strong>{validCount}</strong>
                                    </span>
                                </div>
                                {invalidCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <FileWarning className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                        <span className="text-xs sm:text-sm text-red-700">
                                            {t('import.preview.invalid')}: <strong>{invalidCount}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 text-sm"
                                >
                                    {t('import.preview.cancel')}
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing || validCount === 0}
                                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="hidden sm:inline">{t('import.preview.importing')}</span>
                                            <span className="sm:hidden">...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t('import.preview.importValid', { count: validCount })}</span>
                                            <span className="sm:hidden">Import ({validCount})</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('import.columns.studentCode')}</th>
                                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('import.columns.fullName')}</th>
                                    <th className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('import.columns.academicYear')}</th>
                                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('import.columns.class')}</th>
                                    <th className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('import.columns.gender')}</th>
                                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('import.preview.status')}</th>
                                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('import.preview.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {parsedData.map((row) => (
                                    <tr key={row.rowNumber} className={row.isValid ? '' : 'bg-red-50'}>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">{row.rowNumber}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{row.studentCode}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                                            {row.fullName}
                                            {/* Show class on mobile */}
                                            <span className="sm:hidden block text-xs text-gray-400 mt-0.5">{row.academicYear}</span>
                                        </td>
                                        <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">{row.academicYear}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">{row.className}</td>
                                        <td className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">{row.gender}</td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                                            {row.isValid ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span className="hidden sm:inline">{t('import.preview.valid')}</span>
                                                </span>
                                            ) : (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span className="hidden sm:inline">{t('import.preview.invalid')}</span>
                                                    </span>
                                                    <div className="mt-1 text-xs text-red-600 max-w-[150px] sm:max-w-none truncate sm:whitespace-normal">
                                                        {row.errors.join(', ')}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                                            <button
                                                onClick={() => handleRemoveRow(row.rowNumber)}
                                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                title={t('import.preview.remove')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Step 3: Result */}
            {step === 'result' && importResult && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        {importResult.successCount > 0 ? (
                            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-3 sm:mb-4" />
                        ) : (
                            <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 mx-auto mb-3 sm:mb-4" />
                        )}
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {importResult.successCount > 0
                                ? t('import.result.successTitle')
                                : t('import.result.failedTitle')}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 mt-2">{t('import.result.summary')}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-green-50 rounded-lg p-3 sm:p-6 text-center">
                            <p className="text-xl sm:text-3xl font-bold text-green-600">{importResult.successCount}</p>
                            <p className="text-xs sm:text-sm text-green-700 mt-1">{t('import.result.imported')}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 sm:p-6 text-center">
                            <p className="text-xl sm:text-3xl font-bold text-red-600">{importResult.failedCount}</p>
                            <p className="text-xs sm:text-sm text-red-700 mt-1">{t('import.result.failed')}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-6 text-center">
                            <p className="text-xl sm:text-3xl font-bold text-gray-600">{importResult.skippedCount}</p>
                            <p className="text-xs sm:text-sm text-gray-700 mt-1">{t('import.result.skipped')}</p>
                        </div>
                    </div>

                    {/* Errors */}
                    {importResult.errors.length > 0 && (
                        <div className="mb-6 sm:mb-8">
                            <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('import.result.errorDetails')}</h3>
                            <div className="bg-red-50 rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto">
                                {importResult.errors.map((error, index) => (
                                    <div key={index} className="text-xs sm:text-sm text-red-700 py-1">
                                        <span className="font-medium">{t('import.result.row')} {error.row}:</span> {error.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                        <button
                            onClick={handleReset}
                            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800"
                        >
                            {t('import.result.importMore')}
                        </button>
                        <button
                            onClick={() => window.location.href = '/students'}
                            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                        >
                            {t('import.result.viewStudents')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportStudentsPage;