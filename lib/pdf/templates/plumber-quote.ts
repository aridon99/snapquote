// Plumber Quote PDF Template

export const plumberQuoteTemplate = {
  // Company branding
  colors: {
    primary: '#1e40af', // Professional blue
    secondary: '#3b82f6',
    accent: '#10b981', // Green for totals
    text: '#1f2937',
    lightGray: '#f3f4f6',
    borderGray: '#d1d5db'
  },

  // Standard service categories for plumbers
  categories: {
    'fixtures': 'Fixture Installation & Replacement',
    'repairs': 'Repairs & Maintenance',
    'water_heaters': 'Water Heaters',
    'drain': 'Drain Services',
    'emergency': 'Emergency Services',
    'inspection': 'Inspection & Testing',
    'other': 'Additional Services'
  },

  // Common plumbing items for quick reference
  standardItems: [
    { code: 'TOILET_INSTALL', description: 'Toilet Installation (Standard)', unit: 'each', category: 'fixtures' },
    { code: 'TOILET_COMFORT', description: 'Toilet Installation (Comfort Height)', unit: 'each', category: 'fixtures' },
    { code: 'FAUCET_KITCHEN', description: 'Kitchen Faucet Replacement', unit: 'each', category: 'fixtures' },
    { code: 'FAUCET_BATH', description: 'Bathroom Faucet Replacement', unit: 'each', category: 'fixtures' },
    { code: 'SINK_INSTALL', description: 'Sink Installation', unit: 'each', category: 'fixtures' },
    { code: 'DISPOSAL_INSTALL', description: 'Garbage Disposal Installation', unit: 'each', category: 'fixtures' },
    { code: 'SHUTOFF_VALVE', description: 'Shut-off Valve Replacement', unit: 'each', category: 'repairs' },
    { code: 'WAX_RING', description: 'Wax Ring Replacement', unit: 'each', category: 'repairs' },
    { code: 'DRAIN_CLEAR', description: 'Drain Clearing', unit: 'job', category: 'drain' },
    { code: 'PIPE_REPAIR', description: 'Pipe Repair (per section)', unit: 'each', category: 'repairs' },
    { code: 'WATER_HEATER_40', description: '40 Gallon Water Heater Installation', unit: 'each', category: 'water_heaters' },
    { code: 'WATER_HEATER_50', description: '50 Gallon Water Heater Installation', unit: 'each', category: 'water_heaters' },
    { code: 'LEAK_DETECTION', description: 'Leak Detection Service', unit: 'hour', category: 'inspection' },
    { code: 'EMERGENCY_CALL', description: 'Emergency Service Call', unit: 'job', category: 'emergency' }
  ],

  // Professional terms and conditions
  defaultTerms: `
TERMS AND CONDITIONS

1. PAYMENT TERMS: Payment is due upon completion unless otherwise arranged. We accept cash, check, and major credit cards.

2. WARRANTY: All labor is warranted for 1 year from date of service. Parts warranties vary by manufacturer.

3. PERMITS: Customer is responsible for obtaining necessary permits unless otherwise specified in quote.

4. CHANGE ORDERS: Any changes to the scope of work may result in additional charges.

5. ACCESS: Customer agrees to provide clear and safe access to work areas.

6. UNFORESEEN CONDITIONS: Quote is based on visible conditions. Hidden issues (e.g., pipe condition inside walls) may require additional work and charges.

7. CLEANUP: We will leave the work area in a clean and orderly condition.

8. CANCELLATION: Customer may cancel with 24 hours notice without penalty.
  `.trim(),

  // Professional warranty text
  defaultWarranty: '1 Year Labor Warranty • Manufacturer Parts Warranty • 24/7 Emergency Service Available',

  // Quote validity period
  validityDays: 30,

  // Formatting preferences
  formatting: {
    fontSize: {
      companyName: 20,
      heading: 16,
      subheading: 12,
      normal: 10,
      small: 8
    },
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    lineSpacing: 12
  }
}