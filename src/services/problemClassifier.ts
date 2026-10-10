import { ProvisionalClassification } from '../types/emergency';

export interface ClassificationRule {
  id: string;
  category: string;
  categoryLabel: string;
  keywords: string[];
  requiredCapabilities: string[];
  requiredSpecialists: string[];
  suggestedAmbulanceType: 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)' | 'Mobile ICU';
  isLifeThreatening: boolean;
  explanationTemplate: (matched: string[]) => string;
}

/**
 * CONFIGURABLE PREDEFINED CLINICAL PROBLEM RULES
 * Time Complexity of classification: O(K), where K is the number of configured rules.
 */
export const CLINICAL_RULES: ClassificationRule[] = [
  {
    id: 'RULE_CARDIAC_EMERGENCY',
    category: 'cardiac_emergency',
    categoryLabel: 'Provisional Cardiac Emergency Requirement',
    keywords: [
      'chest pain',
      'heart attack',
      'cardiac',
      'myocardial',
      'angina',
      'chest pressure',
      'tight chest',
      'tightness in chest',
      'crushing chest',
      'heart arrest',
      'chest discomfort',
      'left arm pain',
      'palpitations with collapse',
    ],
    requiredCapabilities: ['cardiac_care', 'emergency_room'],
    requiredSpecialists: ['cardiologist'],
    suggestedAmbulanceType: 'Advanced Life Support (ALS)',
    isLifeThreatening: true,
    explanationTemplate: (matched) =>
      `Matched rule RULE_CARDIAC_EMERGENCY for keywords [${matched.join(', ')}]. Provisional requirement: Cardiac cath lab / coronary care and on-duty cardiologist.`,
  },
  {
    id: 'RULE_ROAD_ACCIDENT_TRAUMA',
    category: 'trauma_emergency',
    categoryLabel: 'Provisional Trauma & Emergency Requirement',
    keywords: [
      'road accident',
      'accident',
      'car crash',
      'bike accident',
      'motorcycle',
      'fracture',
      'severe bleeding',
      'hemorrhage',
      'collision',
      'trauma',
      'hit and run',
      'stabbed',
      'deep wound',
      'crush injury',
      'head injury',
      'fall from height',
    ],
    requiredCapabilities: ['trauma_center', 'emergency_room'],
    requiredSpecialists: ['trauma_surgeon'],
    suggestedAmbulanceType: 'Advanced Life Support (ALS)',
    isLifeThreatening: true,
    explanationTemplate: (matched) =>
      `Matched rule RULE_ROAD_ACCIDENT_TRAUMA for keywords [${matched.join(', ')}]. Provisional requirement: Designated trauma center with immediate trauma surgery suite.`,
  },
  {
    id: 'RULE_RESPIRATORY_EMERGENCY',
    category: 'respiratory_emergency',
    categoryLabel: 'Provisional Respiratory Emergency Requirement',
    keywords: [
      'breathing difficulty',
      'shortness of breath',
      'breathless',
      'breathlessness',
      'asthma',
      'suffocation',
      'choking',
      'gasping',
      'low oxygen',
      'respiratory distress',
      'severe wheezing',
      'cannot breathe',
    ],
    requiredCapabilities: ['icu_respiratory', 'emergency_room'],
    requiredSpecialists: ['pulmonologist'],
    suggestedAmbulanceType: 'Mobile ICU',
    isLifeThreatening: true,
    explanationTemplate: (matched) =>
      `Matched rule RULE_RESPIRATORY_EMERGENCY for keywords [${matched.join(', ')}]. Provisional requirement: Invasive respiratory ICU with ventilator and pulmonologist.`,
  },
  {
    id: 'RULE_STROKE_EMERGENCY',
    category: 'stroke_emergency',
    categoryLabel: 'Provisional Stroke-Capable Emergency Requirement',
    keywords: [
      'stroke',
      'paralysis',
      'slurred speech',
      'facial droop',
      'face drooping',
      'numbness one side',
      'sudden weakness',
      'brain attack',
      'aphasia',
      'loss of speech',
      'arm weakness',
    ],
    requiredCapabilities: ['stroke_unit', 'emergency_room'],
    requiredSpecialists: ['neurologist'],
    suggestedAmbulanceType: 'Advanced Life Support (ALS)',
    isLifeThreatening: true,
    explanationTemplate: (matched) =>
      `Matched rule RULE_STROKE_EMERGENCY for keywords [${matched.join(', ')}]. Provisional requirement: Comprehensive stroke center with CT/MRI perfusion and stroke neurologist.`,
  },
  {
    id: 'RULE_BURN_EMERGENCY',
    category: 'burn_emergency',
    categoryLabel: 'Provisional Burn-Care Requirement',
    keywords: [
      'burn injury',
      'burn',
      'burns',
      'fire',
      'scalding',
      'acid attack',
      'chemical burn',
      'electrical burn',
      'skin burns',
      'explosion burns',
    ],
    requiredCapabilities: ['burn_unit', 'emergency_room'],
    requiredSpecialists: ['burn_specialist'],
    suggestedAmbulanceType: 'Advanced Life Support (ALS)',
    isLifeThreatening: true,
    explanationTemplate: (matched) =>
      `Matched rule RULE_BURN_EMERGENCY for keywords [${matched.join(', ')}]. Provisional requirement: Dedicated sterile burn ICU with plastic and reconstructive surgical capability.`,
  },
  {
    id: 'RULE_PEDIATRIC_EMERGENCY',
    category: 'pediatric_emergency',
    categoryLabel: 'Provisional Pediatric Emergency Requirement',
    keywords: [
      'child',
      'baby',
      'infant',
      'toddler',
      'pediatric',
      'child convulsion',
      'febrile seizure',
      'child breathing',
    ],
    requiredCapabilities: ['pediatric_icu', 'emergency_room'],
    requiredSpecialists: ['pediatrician'],
    suggestedAmbulanceType: 'Mobile ICU',
    isLifeThreatening: true,
    explanationTemplate: (matched) =>
      `Matched rule RULE_PEDIATRIC_EMERGENCY for keywords [${matched.join(', ')}]. Provisional requirement: Specialized Pediatric ICU (PICU) with board-certified pediatrician.`,
  },
  {
    id: 'RULE_FEVER_INFECTION',
    category: 'general_fever_infection',
    categoryLabel: 'Provisional General Medical / Emergency Assessment Requirement',
    keywords: [
      'fever',
      'high temperature',
      'feverish',
      'shivering',
      'infection',
      'stomach pain',
      'vomiting',
      'dehydration',
      'diarrhea',
      'food poisoning',
      'headache',
      'dengue',
      'malaria',
      'body aches',
    ],
    requiredCapabilities: ['emergency_room'],
    requiredSpecialists: ['general_physician'],
    suggestedAmbulanceType: 'Basic Life Support (BLS)',
    isLifeThreatening: false,
    explanationTemplate: (matched) =>
      `Matched rule RULE_FEVER_INFECTION for keywords [${matched.join(', ')}]. Provisional requirement: Acute emergency assessment room and general internal medicine doctor.`,
  },
];

/**
 * Normalizes input text for resilient token-based matching:
 * lowercase, removes excessive punctuation, trims whitespace.
 */
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classifies a patient problem description using predefined documented rules.
 *
 * Requirements enforced:
 * - Case-insensitive matching
 * - Handles empty and unknown descriptions
 * - Multiple matching keywords
 * - Returns exact matched rule ID and plain-language explanation
 * - NEVER claims to be an AI diagnosis or clinical guarantor
 * - NEVER uses the urgency level alone to infer clinical requirements
 *
 * Time Complexity: O(K * W), where K is number of rules and W is keywords per rule.
 */
export function classifyPatientProblem(
  rawInput: string
): ProvisionalClassification {
  const normalized = normalizeText(rawInput);

  if (!normalized) {
    return {
      category: 'unknown_unspecified',
      categoryLabel: 'Unspecified Complaint (Requires Dispatcher Triage)',
      matchedRuleId: 'RULE_EMPTY_INPUT',
      matchedKeywords: [],
      requiredCapabilities: ['emergency_room'],
      requiredSpecialists: ['general_physician'],
      suggestedAmbulanceType: 'Basic Life Support (BLS)',
      isLifeThreatening: false,
      explanation:
        'No descriptive symptoms were provided. Falling back to baseline emergency room requirement pending dispatcher voice triage.',
    };
  }

  // Evaluate configured rules in deterministic priority order
  for (const rule of CLINICAL_RULES) {
    const matchedKeywords: string[] = [];
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      // Check full substring or regex word boundary
      if (
        normalized.includes(normalizedKeyword) ||
        new RegExp(`\\b${normalizedKeyword}\\b`, 'i').test(normalized)
      ) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      return {
        category: rule.category,
        categoryLabel: rule.categoryLabel,
        matchedRuleId: rule.id,
        matchedKeywords,
        requiredCapabilities: [...rule.requiredCapabilities],
        requiredSpecialists: [...rule.requiredSpecialists],
        suggestedAmbulanceType: rule.suggestedAmbulanceType,
        isLifeThreatening: rule.isLifeThreatening,
        explanation: rule.explanationTemplate(matchedKeywords),
      };
    }
  }

  // Fallback for unrecognized problems
  return {
    category: 'unrecognized_problem',
    categoryLabel: 'Unrecognized Problem (Requires Manual Clinical Review)',
    matchedRuleId: 'RULE_UNKNOWN_PROBLEM',
    matchedKeywords: [],
    requiredCapabilities: ['emergency_room'],
    requiredSpecialists: ['general_physician'],
    suggestedAmbulanceType: 'Basic Life Support (BLS)',
    isLifeThreatening: false,
    explanation:
      'The reported description did not match specific high-acuity specialty rules. Provisionally mapped to General Emergency Room assessment. Manual dispatcher confirmation recommended.',
  };
}
