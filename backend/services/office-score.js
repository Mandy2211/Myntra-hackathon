// Rule-based Office Suitability scoring.
// Runs instantly at search time — no catalog re-tagging or extra LLM calls.

// Signals that make a garment more office-appropriate (covered, professional)
const POSITIVE = [
  { token: 'formal', label: 'formal cut' },
  { token: 'office', label: 'office-ready' },
  { token: 'work', label: 'workwear' },
  { token: 'full sleeve', label: 'full sleeves' },
  { token: 'full-sleeve', label: 'full sleeves' },
  { token: 'long sleeve', label: 'long sleeves' },
  { token: 'straight', label: 'straight fit' },
  { token: 'trouser', label: 'trousers' },
  { token: 'palazzo', label: 'palazzo' },
  { token: 'kurta', label: 'kurta' },
  { token: 'kurti', label: 'kurti' },
  { token: 'blazer', label: 'blazer' },
  { token: 'collar', label: 'collared' },
  { token: 'high neck', label: 'high neck' },
  { token: 'turtle', label: 'turtle neck' },
  { token: 'cotton', label: 'breathable cotton' },
  { token: 'linen', label: 'linen' }
];

// Signals that make a garment less office-appropriate (revealing / party / casual)
const NEGATIVE = [
  'crop', 'sleeveless', 'deep neck', 'deep-neck', 'off shoulder', 'off-shoulder',
  'backless', 'halter', 'tube', 'party', 'bodycon', 'mini', 'spaghetti',
  'noodle strap', 'plunge', 'cut out', 'cut-out', 'strappy'
];

function haystack(p) {
  return [p.name, p.category, p.type, p.ethnic_style, p.occasion, p.material]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

// Returns { score, reason, blocked } for one product.
// exclusions: array of user-stated "don't want" phrases (hard block).
function scoreProduct(p, exclusions = []) {
  const text = haystack(p);

  // Hard block on anything the user explicitly excluded
  for (const ex of exclusions) {
    const term = String(ex || '').toLowerCase().trim();
    if (term && text.includes(term)) {
      return { score: 0, reason: `Excluded: ${ex}`, blocked: true };
    }
  }

  let score = 60;
  const reasons = [];

  for (const pos of POSITIVE) {
    if (text.includes(pos.token)) {
      score += 12;
      if (reasons.length < 2) reasons.push(pos.label);
    }
  }

  let negativeHit = false;
  for (const neg of NEGATIVE) {
    if (text.includes(neg)) {
      score -= 25;
      negativeHit = true;
    }
  }

  score = Math.max(5, Math.min(99, score));

  let reason;
  if (reasons.length) reason = reasons.join(', ');
  else if (negativeHit) reason = 'may be too casual for office';
  else reason = 'neutral, workplace-safe';

  return { score, reason, blocked: false };
}

module.exports = { scoreProduct };
