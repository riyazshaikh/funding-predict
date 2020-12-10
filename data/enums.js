export const FUNDING = {
	SEED: 'Angel / Seed',
	VENTURE: 'Venture Round',
	NOTE: 'Convertible Note',
}

export const TOP_LEVEL_TAGS = [
'saas',
'infrastructure',
'e-commerce',
'child care',
'skincare',
'social media',
'xr',
'artificial intelligence',
'blockchain',
'security',
'health care',
'fintech',
'internet of things',
'cryptocurrency',
'real estate',
'marketing',
'manufacturing',
'legal',
'development',
'travel',
'b2b',
'education',
'consumer products',
'sharing economy',
'machine learning',
'food',
'agriculture',
'mobile',
'insurance',
'government',
'information technology',
'retail',
'sharing economy',
'productivity',
'robotics',
'politics',
'sales',
'customer support',
'space',
'media and entertainment',
'video',
'messaging',
'privacy',
'human resources',
'analytics',
'pet healthcare'
]

const ALIASES = {
'agriculture': ['farming', 'agriculture and farming'],
'cryptocurrency': ['cryptocurrencies', 'crypto'],
'blockchain': ['bitcoin'],
'consumer products': ['consumer', 'furniture', 'wi-fi', 'wellness', 'fashion', 'swimwear', 'bras', 'consumer goods', 'community and lifestyle', 'clothing and apparel'],
'customer support': ['customer service'],
'education': ['edtech'],
'e-commerce': ['marketplace', 'collectibles', 'commerce and shopping'],
'fintech': ['finance', 'payment', 'investing', 'venture capital', 'financial services', 'lending and investments'],
'food': ['food and beverage', 'food & beverage'],
'government': ['gov + tech', 'government and military'],
'health care': ['healthcare', 'personal health', 'biotechnology', 'life science', 'medical'],
'information technology': ['information services'],
'infrastructure': ['it infrastructure'],
'internet of things': ['iot'],
'messaging': ['messaging and telecommunications'],
'marketing': ['ad retargeting', 'email marketing', 'social media marketing', 'lead generation', 'marketing automation', 'advertising', 'sales and marketing'],
'media and entertainment': ['digital media', 'sport', 'esports', 'gaming', 'digital media and entertainment', 'digital media & entertainment', 'music and audio', 'platforms', 'video', 'content and publishing'],
'mobile': ['apps', 'mobile apps'],
'developer tools': ['prototyping', 'development', 'open source', 'design', 'virtual assistants', 'task management', 'developer platform'],
'privacy': ['privacy and security'],
'real estate': ['apartment rentals', 'commercial real estate'],
'retail': ['retail technology'],
'saas': ['enterprise software', 'email', 'apis', 'software'],
'security': ['cyber security', 'network security', 'cloud security'],
'social media': ['social network', 'social media tools'],
'space': ['aerospace'],
'travel': ['online travel', 'hospitality', 'travel and tourism', 'navigation and mapping'],
'transportation': ['shipping', 'autonomous vehicles', 'moving and storage'],
'video': ['video streaming'],
'xr': ['virtual reality', 'augmented reality', 'arkit', 'ar', 'vr']
}

// Reverse the aliases
export const ALIAS_MAP = Object.entries(ALIASES).reduce((set, keyVal) => {
	keyVal[1].forEach(val => {
		set[val] = keyVal[0];
	})
	return set;
}, {});

