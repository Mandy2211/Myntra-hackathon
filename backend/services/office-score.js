// Occasion-aware preference scoring.
// Runs instantly at search time — no catalog re-tagging or extra LLM calls.
// Two independent parts:
//   1. Exclusions  -> universal hard filter ("no X" removes X for ANY query)
//   2. Profile     -> occasion-specific suitability score (office/party/wedding/...)

const PROFILES = {
  office: {
    label: 'Office',
    keywords: ['office', 'work', 'formal', 'corporate', 'professional', 'workplace', 'intern', 'engineer', 'teacher', 'doctor', 'lawyer', 'manager'],
    poolCats: ['top', 'kurta', 'kurti', 'trouser', 'blazer', 'shirt', 'palazzo', 'dress', 'pants', 'skirt'],
    positive: [
      { token: 'formal', label: 'formal cut' },
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
      { token: 'cotton', label: 'breathable cotton' },
      { token: 'linen', label: 'linen' }
    ],
    negative: ['crop', 'sleeveless', 'deep neck', 'deep-neck', 'off shoulder', 'off-shoulder', 'backless', 'halter', 'tube', 'party', 'bodycon', 'mini', 'spaghetti', 'plunge', 'strappy'],
    neutralReason: 'workplace-safe',
    negReason: 'may be too casual for office'
  },
  party: {
    label: 'Party',
    keywords: ['party', 'club', 'clubbing', 'cocktail', 'night out', 'nightout', 'birthday', 'celebration'],
    poolCats: ['dress', 'top', 'saree', 'skirt', 'gown', 'heels', 'jumpsuit', 'lehenga'],
    positive: [
      { token: 'bodycon', label: 'bodycon' },
      { token: 'sequin', label: 'sequins' },
      { token: 'party', label: 'party style' },
      { token: 'off shoulder', label: 'off-shoulder' },
      { token: 'off-shoulder', label: 'off-shoulder' },
      { token: 'one shoulder', label: 'one-shoulder' },
      { token: 'halter', label: 'halter neck' },
      { token: 'satin', label: 'satin' },
      { token: 'sleeveless', label: 'sleeveless' },
      { token: 'mini', label: 'mini length' },
      { token: 'dress', label: 'dress' }
    ],
    negative: ['formal', 'full sleeve', 'high neck', 'office', 'sport', 'track'],
    neutralReason: 'party-ready',
    negReason: 'a bit plain for a party'
  },
  wedding: {
    label: 'Wedding',
    keywords: ['wedding', 'festive', 'festival', 'ethnic', 'traditional', 'reception', 'sangeet', 'diwali', 'ceremony'],
    poolCats: ['saree', 'lehenga', 'kurta', 'sherwani', 'palazzo', 'dress', 'anarkali', 'gown', 'kurti'],
    positive: [
      { token: 'saree', label: 'saree' },
      { token: 'lehenga', label: 'lehenga' },
      { token: 'anarkali', label: 'anarkali' },
      { token: 'embroidered', label: 'embroidery' },
      { token: 'zari', label: 'zari work' },
      { token: 'banarasi', label: 'banarasi' },
      { token: 'silk', label: 'silk' },
      { token: 'sherwani', label: 'sherwani' },
      { token: 'kurta', label: 'kurta' },
      { token: 'ethnic', label: 'ethnic wear' }
    ],
    negative: ['sport', 'track', 'denim', 'shorts', 't-shirt', 'tshirt', 'casual'],
    neutralReason: 'festive-appropriate',
    negReason: 'too casual for a wedding'
  },
  sports: {
    label: 'Activewear',
    keywords: ['sport', 'sports', 'gym', 'workout', 'running', 'jogging', 'yoga', 'training', 'active', 'fitness'],
    poolCats: ['track', 'jogger', 'legging', 'sneaker', 'running', 'shorts', 't-shirt', 'pants', 'shoe'],
    positive: [
      { token: 'sport', label: 'sportswear' },
      { token: 'track', label: 'track fit' },
      { token: 'jogger', label: 'joggers' },
      { token: 'legging', label: 'leggings' },
      { token: 'dry fit', label: 'dry-fit' },
      { token: 'dryfit', label: 'dry-fit' },
      { token: 'active', label: 'activewear' },
      { token: 'flexible', label: 'flexible fit' },
      { token: 'shorts', label: 'shorts' },
      { token: 't-shirt', label: 'tee' }
    ],
    negative: ['saree', 'silk', 'formal', 'blazer', 'lehenga', 'embroidered', 'denim'],
    neutralReason: 'okay for movement',
    negReason: 'not built for a workout'
  },
  casual: {
    label: 'Casual',
    keywords: ['casual', 'daily', 'everyday', 'college', 'outing', 'comfortable', 'comfort', 'lounge'],
    poolCats: ['t-shirt', 'top', 'jeans', 'kurti', 'shorts', 'dress', 'shirt', 'skirt'],
    positive: [
      { token: 'cotton', label: 'comfy cotton' },
      { token: 't-shirt', label: 'tee' },
      { token: 'tshirt', label: 'tee' },
      { token: 'jeans', label: 'jeans' },
      { token: 'casual', label: 'casual fit' },
      { token: 'relaxed', label: 'relaxed fit' },
      { token: 'kurti', label: 'kurti' },
      { token: 'top', label: 'top' }
    ],
    negative: ['formal', 'saree', 'lehenga', 'sherwani', 'gown'],
    neutralReason: 'easy everyday pick',
    negReason: 'dressier than casual'
  }
};

// Pick the best-matching occasion profile from the parsed query text.
// Returns a profile key (e.g. 'office') or null if none apply.
function detectProfile(parsed, rawQuery = '') {
  const text = [parsed.occasion, parsed.occupation, rawQuery]
    .filter(v => v && v !== 'NA')
    .join(' ')
    .toLowerCase();
  for (const key of Object.keys(PROFILES)) {
    if (PROFILES[key].keywords.some(k => text.includes(k))) return key;
  }
  return null;
}

function haystack(p) {
  return [p.name, p.category, p.type, p.ethnic_style, p.occasion, p.material]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

// Returns { score, reason, blocked } for one product.
//   exclusions: array of user-stated "don't want" phrases (universal hard block)
//   profileKey: occasion profile to score against, or null for filter-only
function scoreProduct(p, exclusions = [], profileKey = null) {
  const text = haystack(p);

  // Universal hard block on anything the user explicitly excluded
  for (const ex of exclusions) {
    const term = String(ex || '').toLowerCase().trim();
    if (term && text.includes(term)) {
      return { score: 0, reason: `Excluded: ${ex}`, blocked: true };
    }
  }

  // No occasion profile -> keep the item, no suitability score
  const profile = profileKey && PROFILES[profileKey];
  if (!profile) return { score: null, reason: null, blocked: false };

  let score = 60;
  const reasons = [];

  for (const pos of profile.positive) {
    if (text.includes(pos.token)) {
      score += 12;
      if (reasons.length < 2) reasons.push(pos.label);
    }
  }

  let negativeHit = false;
  for (const neg of profile.negative) {
    if (text.includes(neg)) {
      score -= 25;
      negativeHit = true;
    }
  }

  score = Math.max(5, Math.min(99, score));

  let reason;
  if (reasons.length) reason = reasons.join(', ');
  else if (negativeHit) reason = profile.negReason;
  else reason = profile.neutralReason;

  return { score, reason, blocked: false };
}

function profileLabel(profileKey) {
  return (profileKey && PROFILES[profileKey] && PROFILES[profileKey].label) || null;
}

// Real catalog categories to pull as candidates for a given occasion profile.
function getPoolCats(profileKey) {
  return (profileKey && PROFILES[profileKey] && PROFILES[profileKey].poolCats) || [];
}

module.exports = { scoreProduct, detectProfile, profileLabel, getPoolCats };
