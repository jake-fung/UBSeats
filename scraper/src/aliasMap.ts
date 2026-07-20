// Scientia "location by zone" building display name -> UBSeats buildings.bldg_code.
export const SCIENTIA_BUILDING_TO_CODE: Record<string, string> = {
  'Allard Hall': 'ALRD',
  'Anthropology and Sociology': 'ANSO',
  'Aquatic Ecosystems Resrch Lab': 'AERL',
  'Asian Centre': 'ACEN',
  'Auditorium': 'AUDI',
  'Auditorium Annex': 'AUDX',
  'B.C. Binnings Studio': 'BINN',
  'Biological Sciences': 'BIOL',
  'Buchanan': 'BUCH',
  'Buchanan Tower': 'BUTO',
  'Centre for Brain Health': 'CBH',
  'Chan Ctr Performing Arts': 'CHAN',
  'Chemical and Biological Eng': 'CHBE',
  'Chemistry': 'CHEM',
  'CIRS': 'CIRS',
  'Civil and Mechanical Eng.': 'CEME',
  'Civil and Mechanical Eng. Labs': 'CEML',
  'CK Choi': 'CHOI',
  'Coal and Mineral Processing': 'MINL',
  'David Lam Building': 'DLAM',
  'Detwiller Pavilion': 'DPAV',
  'Dorothy Somerset Studio': 'DSOM',
  'Douglas Kenny': 'KENN',
  'Earth and Ocean Sciences': 'EOS',
  'Earth Sciences': 'ESB',
  'Food, Nutrition and Health': 'FNH',
  'Forest Sciences Centre': 'FSC',
  'Frank Forward': 'FORW',
  'Fred Kaiser': 'KAIS',
  'Frederic Wood Theatre': 'FRWO',
  'Friedman': 'FRDM',
  'Greenhouse(Horticultural Bldg)': 'HORT',
  'Geography': 'GEOG',
  'Hebb': 'HEBB',
  'Hennings': 'HENN',
  'Henry Angus': 'ANGU',
  'ICCS': 'ICCS',
  'Hugh Dempster Pavilion': 'DMP',
  'Iona': 'IONA',
  'Irving K. Barber Learning Ctr': 'IBLC',
  'Koerner Pavilion': 'KPAV',
  'Landscape Architecture Annex': 'LAX',
  'Lasserre': 'LASR',
  'Leonard S Klinck': 'LSK',
  'Life Sciences Centre': 'LSC',
  'Liu Institute': 'LIU',
  'Lower Mall Research Station': 'LMRS',
  'Macdonald': 'MCDN',
  'MacLeod Building': 'MCLD',
  'MacMillan': 'MCML',
  'Mathematics': 'MATH',
  'Mathematics Annex': 'MATX',
  'Medical Block C': 'MEDC',
  'Memorial Gymnasium': 'MGYM',
  'Michael Smith Laboratories': 'MSL',
  'Music': 'MUSC',
  'Neville Scarfe': 'SCRF',
  'Orchard Commons': 'ORCH',
  'Osborne Centre': 'OSB2',
  'Pharmaceutical Sciences': 'PHRM',
  'Ponderosa Annex E': 'PONE',
  'Ponderosa Commons North': 'PCN',
  'Ponderosa Commons East Audain Art': 'PCE',
  'Ritsumeikan-UBC House': 'RITS',
  'School Populatn & Publc Hlth': 'SPPH',
  'Sing Tao School of Journalism': 'STAO',
  'Theatre-Film Production Building': 'TFPB',
  'Totem Field Studios': 'TFS',
  'Leon & Thea Koerner University Centre': 'UCEN',
  'UBC Life Building': 'LIFE',
  'Wayne & William White Engineering Design Centre': 'EDC',
  'Wesbrook': 'WESB',
  'West Mall Swing Space': 'SWNG',
  'Woodward IRC': 'IRC',
};

// Longest name first so 'Mathematics Annex' wins over 'Mathematics'.
const NAMES_BY_LENGTH = Object.keys(SCIENTIA_BUILDING_TO_CODE).sort((a, b) => b.length - a.length);

export interface ResolvedLocation {
  bldgCode: string;
  roomNumber: string;
}

export function resolveLocation(scientiaName: string): ResolvedLocation | null {
  const trimmed = scientiaName.trim();
  for (const name of NAMES_BY_LENGTH) {
    if (!trimmed.startsWith(name)) continue;
    const rest = trimmed
      .slice(name.length)
      .replace(/^[\s–—-]+/, '')
      .trim();
    if (rest) return { bldgCode: SCIENTIA_BUILDING_TO_CODE[name], roomNumber: rest.toUpperCase() };
  }
  return null;
}
