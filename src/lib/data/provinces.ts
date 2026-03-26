import type { Province } from '$lib/types';

export interface ProvinceInfo {
	code: Province;
	label: string;
	threshold: number;
	color: string;
	sourceUrl: string;
	sourceLabel: string;
}

export const PROVINCES: ProvinceInfo[] = [
	{
		code: 'bc',
		label: 'British Columbia',
		threshold: 183,
		color: '#0077b6',
		sourceUrl:
			'https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/eligibility-and-enrolment/are-you-eligible',
		sourceLabel: 'gov.bc.ca/msp'
	},
	{
		code: 'ab',
		label: 'Alberta',
		threshold: 212,
		color: '#ff8c00',
		sourceUrl: 'https://www.alberta.ca/ahcip-absence-from-alberta',
		sourceLabel: 'alberta.ca'
	},
	{
		code: 'sk',
		label: 'Saskatchewan',
		threshold: 183,
		color: '#2e8b57',
		sourceUrl: 'https://www.saskatchewan.ca/',
		sourceLabel: 'saskatchewan.ca'
	},
	{
		code: 'mb',
		label: 'Manitoba',
		threshold: 183,
		color: '#dc143c',
		sourceUrl: 'https://www.gov.mb.ca/health/',
		sourceLabel: 'gov.mb.ca'
	},
	{
		code: 'on',
		label: 'Ontario',
		threshold: 212,
		color: '#ce1126',
		sourceUrl: 'https://www.ontario.ca/page/ohip-coverage-while-outside-canada',
		sourceLabel: 'ontario.ca'
	},
	{
		code: 'qc',
		label: 'Quebec',
		threshold: 183,
		color: '#ed2939',
		sourceUrl: 'https://www.quebec.ca/sante/systeme-et-services-de-sante/sejours-hors-du-quebec',
		sourceLabel: 'quebec.ca'
	},
	{
		code: 'nb',
		label: 'New Brunswick',
		threshold: 183,
		color: '#ff0000',
		sourceUrl: 'https://www2.gnb.ca/',
		sourceLabel: 'gnb.ca'
	},
	{
		code: 'ns',
		label: 'Nova Scotia',
		threshold: 183,
		color: '#ff0000',
		sourceUrl: 'https://novascotia.ca/dhw/',
		sourceLabel: 'novascotia.ca'
	},
	{
		code: 'pe',
		label: 'Prince Edward Island',
		threshold: 183,
		color: '#ff0000',
		sourceUrl: 'https://www.princeedwardisland.ca/',
		sourceLabel: 'princeedwardisland.ca'
	},
	{
		code: 'nl',
		label: 'Newfoundland & Labrador',
		threshold: 183,
		color: '#ff0000',
		sourceUrl: 'https://www.gov.nl.ca/health/',
		sourceLabel: 'gov.nl.ca'
	},
	{
		code: 'yt',
		label: 'Yukon',
		threshold: 212,
		color: '#ff0000',
		sourceUrl: 'https://yukon.ca/en/health',
		sourceLabel: 'yukon.ca'
	},
	{
		code: 'nt',
		label: 'Northwest Territories',
		threshold: 183,
		color: '#ff0000',
		sourceUrl: 'https://www.hss.gov.nt.ca/',
		sourceLabel: 'hss.gov.nt.ca'
	},
	{
		code: 'nu',
		label: 'Nunavut',
		threshold: 183,
		color: '#ff0000',
		sourceUrl: 'https://www.gov.nu.ca/health',
		sourceLabel: 'gov.nu.ca'
	}
];

export function getProvinceInfo(code: Province): ProvinceInfo {
	return PROVINCES.find((p) => p.code === code)!;
}

export function getThreshold(code: Province): number {
	return getProvinceInfo(code).threshold;
}
