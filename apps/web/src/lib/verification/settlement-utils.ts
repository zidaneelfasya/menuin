/**
 * Pure Utility Helpers for Settlement Accounts (Pilar 2)
 * Decoupled from Server Actions so they can be safely executed on both
 * client and server without triggering Next.js 'use server' async restrictions.
 */

/**
 * Masks a bank account number showing only the last 4 digits.
 * e.g., "1234567890" -> "•••••• 7890"
 */
export function maskBankAccountNumber(accountNumber: string): string {
  if (!accountNumber) return '••••';
  const clean = accountNumber.replace(/[\s-]+/g, '');
  if (clean.length <= 4) return '••••';
  const last4 = clean.slice(-4);
  return `•••••• ${last4}`;
}

/**
 * Normalizes text for name matching (lowercases, removes punctuation, common corporate titles).
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(pt|cv|tbk|ud|firma|yayasan|koperasi)\b/gi, '')
    .replace(/\b(s\.t\.|s\.e\.|s\.kom\.|s\.h\.|m\.m\.|dr\.|drs\.)/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates a similarity score (0 to 100) between two names.
 * Uses token overlap and Levenshtein character sequence matching.
 */
export function calculateNameMatchScore(nameA: string, nameB: string): number {
  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 100;

  const tokensA = normA.split(' ').filter(Boolean);
  const tokensB = normB.split(' ').filter(Boolean);

  // Check if one name is an exact subset of the other
  const allAInB = tokensA.every((t) => tokensB.includes(t));
  const allBInA = tokensB.every((t) => tokensA.includes(t));
  if (allAInB || allBInA) return 95;

  // Calculate token overlap
  let matchingTokens = 0;
  for (const t of tokensA) {
    if (tokensB.some((tb) => tb === t || tb.startsWith(t) || t.startsWith(tb))) {
      matchingTokens++;
    }
  }

  const tokenScore = (matchingTokens / Math.max(tokensA.length, tokensB.length)) * 100;

  // Levenshtein distance on full string
  const m = normA.length;
  const n = normB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normA[i - 1] === normB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const editDist = dp[m][n];
  const charScore = Math.max(0, (1 - editDist / Math.max(m, n)) * 100);

  return Math.round(Math.max(tokenScore, charScore));
}
