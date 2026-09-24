/**
 * Order Number & Prefix Generation Utilities
 * Format: [PREFIX][8 RANDOM CHARACTERS] (e.g., MG7B4K9X2M)
 */

// Unambiguous alphanumeric characters (omitting 0, O, 1, I for readability)
const SUFFIX_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Sanitize prefix string: strip non-alphanumeric, uppercase, trim.
 */
export function sanitizeOrderPrefix(prefix: string): string {
  return prefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Generates smart prefix suggestions from an outlet name.
 * e.g., "Mie Gacoan" -> ["MG", "MGC", "MIE", "GACOAN"]
 * e.g., "Kopi Kenangan" -> ["KK", "KPK", "KOPI", "KENANGAN"]
 */
export function generatePrefixSuggestions(outletName: string): string[] {
  if (!outletName || !outletName.trim()) {
    return ['ORD', 'MNU'];
  }

  const clean = outletName.trim().toUpperCase();
  const words = clean
    .split(/[\s\-_.,/&]+/)
    .map((w) => w.replace(/[^A-Z0-9]/g, ''))
    .filter(Boolean);

  const suggestions: string[] = [];

  if (words.length === 0) {
    return ['ORD', 'MNU'];
  }

  if (words.length >= 2) {
    // 1. Acronym of all words (up to 4 chars), e.g. "MG" or "KKM"
    const acronym = words.map((w) => w[0]).join('');
    if (acronym) suggestions.push(acronym);

    // 2. First 2 words acronym if more than 2 words, e.g. "MG"
    if (words.length > 2) {
      suggestions.push(words[0][0] + words[1][0]);
    }

    // 3. First word 2 chars + second word 1 char, e.g. "MIE" + "G" = "MIG" or "MGC"
    if (words[0].length >= 2 && words[1].length >= 1) {
      const blend = words[0].slice(0, 2) + words[1][0];
      if (!suggestions.includes(blend)) suggestions.push(blend);
    }

    // 4. First word (if not excessively long, up to 6 chars), e.g. "MIE"
    const firstWordClean = words[0].slice(0, 6);
    if (!suggestions.includes(firstWordClean)) suggestions.push(firstWordClean);

    // 5. Second word (up to 6 chars), e.g. "GACOAN"
    const secondWordClean = words[1].slice(0, 6);
    if (!suggestions.includes(secondWordClean)) suggestions.push(secondWordClean);
  } else {
    // Single word name, e.g. "GACOAN" or "KOPI"
    const word = words[0];
    
    // First 2 chars, e.g. "GA"
    if (word.length >= 2) {
      suggestions.push(word.slice(0, 2));
    }
    // First 3 chars, e.g. "GAC"
    if (word.length >= 3) {
      suggestions.push(word.slice(0, 3));
    }
    // Consonant abbreviation if available
    const consonants = word.replace(/[AEIOU]/g, '');
    if (consonants.length >= 2 && !suggestions.includes(consonants.slice(0, 3))) {
      suggestions.push(consonants.slice(0, 3));
    }
    // Full word up to 6 chars
    if (word.length <= 6 && !suggestions.includes(word)) {
      suggestions.push(word);
    }
  }

  // Deduplicate and filter out empty / too short (unless 2+ chars)
  const unique = Array.from(new Set(suggestions.map(sanitizeOrderPrefix))).filter((s) => s.length >= 2);
  
  if (unique.length === 0) {
    unique.push('ORD');
  }

  return unique;
}

/**
 * Resolves the active order prefix for a given tenant:
 * 1. Custom tenant.orderPrefix if defined
 * 2. Smart initials computed from tenant.name
 * 3. Fallback to 'ORD'
 */
export function resolveOrderPrefix(
  tenant?: { name?: string | null; orderPrefix?: string | null } | null
): string {
  if (tenant?.orderPrefix && tenant.orderPrefix.trim()) {
    const sanitized = sanitizeOrderPrefix(tenant.orderPrefix);
    if (sanitized.length > 0) return sanitized;
  }

  if (tenant?.name && tenant.name.trim()) {
    const suggestions = generatePrefixSuggestions(tenant.name);
    if (suggestions.length > 0) return suggestions[0];
  }

  return 'ORD';
}

/**
 * Generates an 8-character random alphanumeric string
 * e.g., "7B4K9X2M"
 */
export function generateOrderSuffix(length = 8): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SUFFIX_CHARSET.length);
    result += SUFFIX_CHARSET[randomIndex];
  }
  return result;
}

/**
 * Generates full Order Number for a tenant:
 * e.g., "MG7B4K9X2M"
 */
export function generateOrderNumber(
  tenant?: { name?: string | null; orderPrefix?: string | null } | null
): string {
  const prefix = resolveOrderPrefix(tenant);
  const suffix = generateOrderSuffix(8);
  return `${prefix}${suffix}`;
}
