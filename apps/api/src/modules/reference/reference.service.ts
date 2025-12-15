import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferenceService {
    constructor(private readonly prisma: PrismaService) { }

    private readonly currencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
        { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
        { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
        { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'dh' },
        { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' },
        { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
        { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
        { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ' },
        { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
        { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
        { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ' },
        { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
        { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM' },
        { code: 'BBD', name: 'Barbadian Dollar', symbol: '$' },
        { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
        { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
        { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
        { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu' },
        { code: 'BMD', name: 'Bermudan Dollar', symbol: '$' },
        { code: 'BND', name: 'Brunei Dollar', symbol: '$' },
        { code: 'BOB', name: 'Bolivian Boliviano', symbol: '$b' },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
        { code: 'BSD', name: 'Bahamian Dollar', symbol: '$' },
        { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
        { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
        { code: 'BWP', name: 'Botswanan Pula', symbol: 'P' },
        { code: 'BYN', name: 'New Belarusian Ruble', symbol: 'Br' },
        { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$' },
        { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
        { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
        { code: 'COP', name: 'Colombian Peso', symbol: '$' },
        { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
        { code: 'CUC', name: 'Cuban Convertible Peso', symbol: '$' },
        { code: 'CUP', name: 'Cuban Peso', symbol: '₱' },
        { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$' },
        { code: 'CZK', name: 'Czech Republic Koruna', symbol: 'Kč' },
        { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj' },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
        { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$' },
        { code: 'DZD', name: 'Algerian Dinar', symbol: 'دج' },
        { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
        { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk' },
        { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
        { code: 'FJD', name: 'Fijian Dollar', symbol: '$' },
        { code: 'FKP', name: 'Falkland Islands Pound', symbol: '£' },
        { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
        { code: 'GGP', name: 'Guernsey Pound', symbol: '£' },
        { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
        { code: 'GIP', name: 'Gibraltar Pound', symbol: '£' },
        { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
        { code: 'GNF', name: 'Guinean Franc', symbol: 'FG' },
        { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
        { code: 'GYD', name: 'Guyanaese Dollar', symbol: '$' },
        { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
        { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
        { code: 'HTG', name: 'Haitian Gourde', symbol: 'G' },
        { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
        { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
        { code: 'ILS', name: 'Israeli New Sheqel', symbol: '₪' },
        { code: 'IMP', name: 'Manx pound', symbol: '£' },
        { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د' },
        { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
        { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr' },
        { code: 'JEP', name: 'Jersey Pound', symbol: '£' },
        { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
        { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
        { code: 'KGS', name: 'Kyrgystani Som', symbol: 'с' },
        { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
        { code: 'KMF', name: 'Comorian Franc', symbol: 'CF' },
        { code: 'KPW', name: 'North Korean Won', symbol: '₩' },
        { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
        { code: 'KYD', name: 'Cayman Islands Dollar', symbol: '$' },
        { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
        { code: 'LAK', name: 'Laotian Kip', symbol: '₭' },
        { code: 'LBP', name: 'Lebanese Pound', symbol: '£' },
        { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
        { code: 'LRD', name: 'Liberian Dollar', symbol: '$' },
        { code: 'LSL', name: 'Lesotho Loti', symbol: 'M' },
        { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD' },
        { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
        { code: 'MDL', name: 'Moldovan Leu', symbol: 'lei' },
        { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar' },
        { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден' },
        { code: 'MMK', name: 'Myanma Kyat', symbol: 'K' },
        { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮' },
        { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$' },
        { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM' },
        { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
        { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
        { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
        { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
        { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
        { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
        { code: 'NAD', name: 'Namibian Dollar', symbol: '$' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
        { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$' },
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
        { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
        { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
        { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
        { code: 'PEN', name: 'Peruvian Nuevo Sol', symbol: 'S/.' },
        { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
        { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
        { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
        { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
        { code: 'PYG', name: 'Paraguayan Guarani', symbol: 'Gs' },
        { code: 'QAR', name: 'Qatari Rial', symbol: '﷼' },
        { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
        { code: 'RSD', name: 'Serbian Dinar', symbol: 'Дин.' },
        { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
        { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
        { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
        { code: 'SBD', name: 'Solomon Islands Dollar', symbol: '$' },
        { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨' },
        { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.' },
        { code: 'SHP', name: 'Saint Helena Pound', symbol: '£' },
        { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le' },
        { code: 'SOS', name: 'Somali Shilling', symbol: 'S' },
        { code: 'SRD', name: 'Surinamese Dollar', symbol: '$' },
        { code: 'SSP', name: 'South Sudanese Pound', symbol: '£' },
        { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db' },
        { code: 'SVC', name: 'Salvadoran Colón', symbol: '$' },
        { code: 'SYP', name: 'Syrian Pound', symbol: '£' },
        { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'E' },
        { code: 'THB', name: 'Thai Baht', symbol: '฿' },
        { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM' },
        { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T' },
        { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
        { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$' },
        { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
        { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: 'TT$' },
        { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
        { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
        { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
        { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
        { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
        { code: 'UZS', name: 'Uzbekistan Som', symbol: 'лв' },
        { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs' },
        { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
        { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
        { code: 'WST', name: 'Samoan Tala', symbol: 'WS$' },
        { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'FCFA' },
        { code: 'XCD', name: 'East Caribbean Dollar', symbol: '$' },
        { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA' },
        { code: 'XPF', name: 'CFP Franc', symbol: '₣' },
        { code: 'YER', name: 'Yemeni Rial', symbol: '﷼' },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
        { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
        { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: '$' }
    ];

    private readonly timezones = [
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
        { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
        { value: 'Europe/Paris', label: 'Central European Time (CET)' },
        { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
        { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
        { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
        { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
        { value: 'Pacific/Auckland', label: 'New Zealand Standard Time (NZST)' },
        { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
        { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)' },
    ];

    getCurrencies() {
        return this.currencies;
    }

    getTimezones() {
        return this.timezones;
    }

    // Locations CRUD
    async getLocations(tenantId: string) {
        return this.prisma.location.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }

    async createLocation(tenantId: string, data: { name: string; address?: string; city?: string; state?: string; country: string; timezone?: string }) {
        return this.prisma.location.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async updateLocation(id: string, data: Partial<{ name: string; address?: string; city?: string; state?: string; country: string; timezone?: string }>) {
        return this.prisma.location.update({
            where: { id },
            data,
        });
    }

    async deleteLocation(id: string) {
        return this.prisma.location.delete({
            where: { id },
        });
    }

    // Departments CRUD
    async getDepartments(tenantId: string) {
        return this.prisma.department.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                parent: true,
                children: true,
            },
        });
    }

    async createDepartment(tenantId: string, data: { name: string; code?: string; parentId?: string }) {
        return this.prisma.department.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async updateDepartment(id: string, data: Partial<{ name: string; code?: string; parentId?: string }>) {
        return this.prisma.department.update({
            where: { id },
            data,
        });
    }

    async deleteDepartment(id: string) {
        return this.prisma.department.delete({
            where: { id },
        });
    }
}
