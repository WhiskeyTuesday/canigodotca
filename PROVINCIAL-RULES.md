# Provincial Healthcare Residency Rules — Research & Plan

## Status

- **BC**: Implemented (corrected)
- **All others**: Disabled (coming soon) — rules researched for AB, ON, QC; remaining provinces need research

## Plan

1. Ship with BC only, other provinces disabled in dropdown with "coming soon"
2. Research remaining provinces/territories (SK, MB, NB, NS, PE, NL, YT, NT, NU)
3. Implement each province with its actual rule (rolling vs calendar year, counting quirks)

---

## BC (British Columbia) — MSP

**Period type:** Calendar year (Jan 1–Dec 31)

**Rule:** Must be physically present in BC for at least 6 months in a calendar year.

**Vacation exception:** Eligible residents who are outside BC for vacation purposes only are allowed a total absence of up to 7 months in a calendar year (effective Jan 1, 2013). The 7 months can be cumulative (split across multiple trips), not necessarily consecutive.

This creates a dual rule:
- Statutory definition of resident: present at least 6 months per calendar year
- Vacation absence allowance: up to 7 months absent per calendar year (~5 months presence needed)

**Extended absence:** Up to 24 consecutive months once per 60-month period, with conditions (cannot combine with the 7-month vacation rule in the same or prior calendar year).

**What we implement:** 6 months (~183 days) present per calendar year. The vacation exception (7 months absent) is noted but not modeled as the primary threshold since it only applies to vacation-purpose absences.

**Sources:**
- Medicare Protection Act, Section 1: https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96286_01
- MSP Eligibility: https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/eligibility-and-enrolment/are-you-eligible
- Medical and Health Care Services Regulation (426/97): https://www.bclaws.gov.bc.ca/civix/document/id/loo63/loo63/426_97

---

## Alberta — AHCIP

**Period type:** Rolling 12-month period (NOT calendar year)

**Rule:** Must be physically present in Alberta for at least 183 days in any 12-month period.

**Vacation exception:** For recurring vacation absences, you can be away up to 212 days in a 12-month period (also rolling). This effectively lowers the minimum presence to 153 days for vacationers.

**Consecutive limits:** Temporary absences outside Canada limited to less than 6 consecutive months; within Canada, less than 12 consecutive months.

**Sources:**
- https://www.alberta.ca/ahcip-absence-from-alberta
- https://www.alberta.ca/ahcip-eligibility

---

## Ontario — OHIP

**Period type:** Rolling 12-month period (NOT calendar year)

**Rule:** Must be physically present in Ontario for 153 days in any given 12-month period (equivalently: must not be absent more than 212 days).

**Initial residency:** New/returning residents must be present at least 153 of the first 183 days after establishing residence.

**Sources:**
- https://www.ontario.ca/page/ohip-coverage-while-outside-canada
- https://www.ontario.ca/page/ohip-coverage-outside-ontario

---

## Quebec — RAMQ

**Period type:** Calendar year (Jan 1–Dec 31)

**Rule:** Must not be absent from Quebec 183 days or more per calendar year.

**21-day exclusion:** Absences of 21 consecutive days or less are NOT counted toward the 183-day limit. Day of departure and day of return are also excluded. This is a major practical difference for frequent short-trip travelers.

**7-year exception:** Once every 7 years, a resident can exceed 183 days of absence and still remain eligible (conditions apply).

**Sources:**
- https://www.ramq.gouv.qc.ca/en/citizens/absence-quebec
- https://www.ramq.gouv.qc.ca/en/citizens/absence-quebec/tally

---

## Not Yet Researched

- Saskatchewan
- Manitoba
- New Brunswick
- Nova Scotia
- Prince Edward Island
- Newfoundland & Labrador
- Yukon
- Northwest Territories
- Nunavut
