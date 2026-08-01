export const NETWORK = {
  name: 'Northstar Broadcasting Group',
  shortName: 'NBG',
  channel: 'Northstar 8',
  slogan: 'Northern Illinois, live and local.',
};

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const dayparts = ['Morning', 'Afternoon', 'Evening', 'Prime Time', 'Late Night'];

export const navItems = [
  ['home', 'Executive Home'],
  ['universe', 'Industry Universe'],
  ['coverage', 'Coverage & Growth'],
  ['programming', 'Programming'],
  ['development', 'Creative Studio'],
  ['rights', 'Rights Market'],
  ['talent', 'People & Talent'],
  ['research', 'Research & Facilities'],
  ['ratings', 'Nielsen Center'],
  ['commercial', 'Commercial'],
  ['finance', 'Finance & ERP'],
  ['chronicle', 'The Chronicle'],
];

export const categoryTree = {
  Drama: [
    { name: 'Police procedural', research: null },
    { name: 'Medical drama', research: 'medical-production' },
    { name: 'Young adult drama', research: null },
    { name: 'Political drama', research: null },
    { name: 'Historical / medieval', research: 'period-production' },
    { name: 'Science fiction', research: 'advanced-vfx' },
    { name: 'Family saga', research: null },
  ],
  Comedy: [
    { name: 'Workplace comedy', research: null },
    { name: 'Family comedy', research: null },
    { name: 'Romantic comedy', research: null },
    { name: 'Sketch comedy', research: 'multi-camera-studio' },
    { name: 'Animated comedy', research: 'animation-pipeline' },
  ],
  Contest: [
    { name: 'Culture quiz', research: 'quiz-formats' },
    { name: 'Physical challenge', research: 'physical-contest' },
    { name: 'Family game show', research: 'quiz-formats' },
    { name: 'Talent competition', research: 'live-event-production' },
    { name: 'Cooking competition', research: 'reality-production' },
  ],
  Reality: [
    { name: 'Social / house', research: 'reality-production' },
    { name: 'Survival', research: 'survival-logistics' },
    { name: 'Love / dating', research: 'reality-production' },
    { name: 'Transformation', research: 'reality-production' },
    { name: 'Business / entrepreneur', research: 'reality-production' },
  ],
  'News & Factual': [
    { name: 'Daily local news', research: null },
    { name: 'Investigative current affairs', research: 'investigative-desk' },
    { name: 'Nature documentary', research: 'documentary-unit' },
    { name: 'Sports news', research: 'sports-desk' },
    { name: 'Local magazine', research: null },
    { name: 'True crime documentary', research: 'documentary-unit' },
  ],
  Talk: [
    { name: 'Morning talk', research: null },
    { name: 'Daytime talk', research: null },
    { name: 'Late-night talk', research: 'late-night-studio' },
    { name: 'Political debate', research: 'investigative-desk' },
    { name: 'Sports debate', research: 'sports-desk' },
  ],
};

export const initialNetwork = {
  week: 6,
  year: 2027,
  cash: 24.8,
  debt: 11.5,
  reputation: 42,
  boardConfidence: 61,
  researchPoints: 8,
  weeklyResearch: 4,
  reachHouseholds: 0.74,
  subscribers: 0,
  identity: 'Local service broadcaster',
  specializations: [
    { name: 'Local News', xp: 68, level: 2 },
    { name: 'Affordable Comedy', xp: 24, level: 1 },
    { name: 'Live Production', xp: 18, level: 1 },
    { name: 'Regional Sports', xp: 0, level: 0 },
  ],
};

export const initialMarkets = [
  {
    id: 'rockford', name: 'Rockford & Northern Illinois', region: 'Northern Illinois', households: 0.74,
    income: 'Mid', adDemand: 61, competition: 48, affinity: ['Local news', 'Family', 'Baseball'],
    status: 'Active', method: 'Owned station + tower', coverage: 91, awareness: 69, share: 17.8,
    description: 'Northstar’s home market. Strong trust, aging transmission equipment, and limited growth without Chicago spillover.',
    options: [],
  },
  {
    id: 'chicago', name: 'Chicago', region: 'Northern Illinois', households: 3.48,
    income: 'High', adDemand: 94, competition: 96, affinity: ['Sports', 'News', 'Prestige drama'],
    status: 'Available', method: null, coverage: 0, awareness: 8, share: 0,
    description: 'A transformational market with brutal competition. Entry brings major advertisers and talent, but weak content will disappear.',
    options: [
      { id: 'chi-affiliate', label: 'Sign suburban affiliate', method: 'Affiliate', cost: 8.5, weekly: 0.28, weeks: 6, coverage: 31, reach: 1.08, requirement: 'affiliate-systems' },
      { id: 'chi-cable', label: 'Regional cable carriage', method: 'Cable carriage', cost: 5.6, weekly: 0.42, weeks: 4, coverage: 44, reach: 1.53, requirement: 'cable-desk' },
      { id: 'chi-station', label: 'Acquire independent station', method: 'Owned station', cost: 52, weekly: 0.7, weeks: 14, coverage: 83, reach: 2.89, requirement: 'station-acquisitions' },
    ],
  },
  {
    id: 'madison', name: 'Madison', region: 'Wisconsin', households: 0.46,
    income: 'High', adDemand: 66, competition: 55, affinity: ['College sports', 'News', 'Documentary'],
    status: 'Available', method: null, coverage: 0, awareness: 5, share: 0,
    description: 'An educated, high-value market where college sports and factual content can accelerate adoption.',
    options: [
      { id: 'mad-repeater', label: 'Build northern repeater chain', method: 'Repeaters', cost: 7.2, weekly: 0.18, weeks: 8, coverage: 38, reach: 0.17, requirement: 'transmission-II' },
      { id: 'mad-affiliate', label: 'Recruit Madison affiliate', method: 'Affiliate', cost: 4.4, weekly: 0.17, weeks: 5, coverage: 68, reach: 0.31, requirement: 'affiliate-systems' },
    ],
  },
  {
    id: 'milwaukee', name: 'Milwaukee', region: 'Wisconsin', households: 0.92,
    income: 'Mid', adDemand: 73, competition: 72, affinity: ['Local sports', 'Crime drama', 'Talk'],
    status: 'Available', method: null, coverage: 0, awareness: 4, share: 0,
    description: 'A natural regional step, especially for a network with baseball, basketball, or a recognizable Midwest identity.',
    options: [
      { id: 'mil-affiliate', label: 'Recruit Milwaukee affiliate', method: 'Affiliate', cost: 6.9, weekly: 0.24, weeks: 6, coverage: 64, reach: 0.59, requirement: 'affiliate-systems' },
      { id: 'mil-cable', label: 'Negotiate basic cable tier', method: 'Cable carriage', cost: 4.2, weekly: 0.34, weeks: 4, coverage: 49, reach: 0.45, requirement: 'cable-desk' },
    ],
  },
  {
    id: 'indianapolis', name: 'Indianapolis', region: 'Indiana', households: 1.19,
    income: 'Mid', adDemand: 77, competition: 70, affinity: ['Sports', 'Family', 'Procedural'],
    status: 'Locked', method: null, coverage: 0, awareness: 1, share: 0,
    description: 'A large Midwest market that requires a credible multi-state operating organization.',
    unlock: 'regional-operations',
    options: [
      { id: 'ind-affiliate', label: 'Affiliate partnership', method: 'Affiliate', cost: 8.8, weekly: 0.3, weeks: 7, coverage: 61, reach: 0.73, requirement: 'regional-operations' },
    ],
  },
  {
    id: 'stlouis', name: 'St. Louis', region: 'Missouri', households: 1.25,
    income: 'Mid', adDemand: 79, competition: 74, affinity: ['Baseball', 'News', 'Reality'],
    status: 'Locked', method: null, coverage: 0, awareness: 0, share: 0,
    description: 'Profitable but culturally distinct. Generic regional programming performs poorly without local investment.',
    unlock: 'regional-operations',
    options: [
      { id: 'stl-cable', label: 'Regional cable launch', method: 'Cable carriage', cost: 7.4, weekly: 0.41, weeks: 6, coverage: 47, reach: 0.59, requirement: 'regional-operations' },
    ],
  },
  {
    id: 'national-cable', name: 'National Cable Distribution', region: 'United States', households: 74,
    income: 'Mixed', adDemand: 97, competition: 100, affinity: ['Distinctive brands', 'Live events', 'News'],
    status: 'Locked', method: null, coverage: 0, awareness: 0, share: 0,
    description: 'A national carriage negotiation. Operators will only consider a focused channel with demonstrated demand and sufficient content depth.',
    unlock: 'national-carriage',
    options: [
      { id: 'nat-cable', label: 'Launch national cable feed', method: 'National cable', cost: 34, weekly: 1.6, weeks: 16, coverage: 22, reach: 16.3, requirement: 'national-carriage' },
    ],
  },
];

export const initialInfrastructure = [
  { id: 'tower', name: 'Rockford Transmission Tower', level: 2, max: 5, condition: 73, specialty: 'Terrestrial reach', upgradeCost: 4.8 },
  { id: 'studio-a', name: 'Studio A', level: 1, max: 5, condition: 82, specialty: 'News and talk', upgradeCost: 3.6 },
  { id: 'newsroom', name: 'Northern Illinois Newsroom', level: 2, max: 5, condition: 77, specialty: 'Local reporting', upgradeCost: 4.2 },
  { id: 'post', name: 'Post-production Suite', level: 1, max: 5, condition: 68, specialty: 'Editing and audio', upgradeCost: 2.9 },
  { id: 'sales', name: 'Local Sales Office', level: 1, max: 5, condition: 86, specialty: 'Local advertisers', upgradeCost: 2.4 },
];

export const initialCompetitors = [
  { id: 'northstar', name: 'Northstar 8', type: 'Local broadcast', reach: 0.74, mtdShare: 17.8, ytdShare: 16.9, mtdRevenue: 2.4, ytdRevenue: 13.1, momentum: 3.2, identity: 'Local service', flagship: 'Northern Illinois Tonight', color: '#2f6f91', player: true },
  { id: 'heartland', name: 'Heartland Media', type: 'Regional broadcast', reach: 8.4, mtdShare: 21.6, ytdShare: 20.2, mtdRevenue: 18.7, ytdRevenue: 103.4, momentum: 5.1, identity: 'Midwest entertainment', flagship: 'Heartland Hospital', color: '#85552f' },
  { id: 'greatlakes', name: 'Great Lakes Broadcasting', type: 'Regional broadcast', reach: 5.9, mtdShare: 14.4, ytdShare: 15.7, mtdRevenue: 13.9, ytdRevenue: 81.2, momentum: -2.8, identity: 'Sports and procedurals', flagship: 'Lakeside Baseball', color: '#4d6d61' },
  { id: 'apex', name: 'Apex Network', type: 'National broadcast', reach: 119, mtdShare: 12.7, ytdShare: 13.1, mtdRevenue: 426, ytdRevenue: 2410, momentum: 1.2, identity: 'Broad premium', flagship: 'Mercy General', color: '#5b4b79' },
  { id: 'united', name: 'United Television', type: 'National broadcast', reach: 116, mtdShare: 11.4, ytdShare: 12.2, mtdRevenue: 398, ytdRevenue: 2290, momentum: -1.1, identity: 'Family and live events', flagship: 'American Stage', color: '#8c3f4c' },
  { id: 'newsline', name: 'NewsLine 24', type: 'National cable news', reach: 67, mtdShare: 4.8, ytdShare: 4.4, mtdRevenue: 92, ytdRevenue: 508, momentum: 7.3, identity: 'Breaking news', flagship: 'The National Desk', color: '#3d526d' },
  { id: 'vista', name: 'Vista+', type: 'Streaming', reach: 41, mtdShare: 8.2, ytdShare: 7.6, mtdRevenue: 261, ytdRevenue: 1480, momentum: 8.8, identity: 'Prestige streaming', flagship: 'The Republic', color: '#7a4876' },
];

export const initialShows = [
  {
    id: 'morning', title: 'Northstar Morning', source: 'Original', category: 'Talk', subtype: 'Morning talk', status: 'On air',
    cadence: 'Weekdays', duration: 120, episodes: 240, quality: 62, buzz: 48, viewers: 0.092, share: 12.6,
    critic: 58, audience: 71, cost: 0.11, revenue: 0.19, trend: 1.8, target: 'Adults 25–54', lead: 'Lauren Kim',
    identity: { color: '#d29a3b', accent: '#f2d39b', shape: 'circle', icon: '☀' },
    notes: 'Reliable local integrations and weather. The format is dated but profitable.', specialties: ['Local', 'Warm', 'Live'],
  },
  {
    id: 'local-news', title: 'Northern Illinois Tonight', source: 'Original', category: 'News & Factual', subtype: 'Daily local news', status: 'On air',
    cadence: 'Daily', duration: 60, episodes: 310, quality: 73, buzz: 59, viewers: 0.184, share: 19.4,
    critic: 70, audience: 82, cost: 0.16, revenue: 0.29, trend: 3.4, target: 'Adults 25–64', lead: 'Andre Lewis',
    identity: { color: '#2d5876', accent: '#9cc3d8', shape: 'shield', icon: 'N8' },
    notes: 'The company’s strongest asset. Weather coverage and public trust drive its lead.', specialties: ['Local', 'News', 'Live'],
  },
  {
    id: 'second-chances', title: 'Second Chances', source: 'Original', category: 'Comedy', subtype: 'Workplace comedy', status: 'On air',
    cadence: 'Weekly', duration: 30, episodes: 13, quality: 78, buzz: 67, viewers: 0.141, share: 14.8,
    critic: 81, audience: 85, cost: 0.24, revenue: 0.28, trend: 9.2, target: 'Adults 18–49', lead: 'Nia Brooks',
    identity: { color: '#2f7a6b', accent: '#a9dfcf', shape: 'rounded', icon: '2C' },
    notes: 'A genuine local breakout with syndication potential if season two holds.', specialties: ['Comedy', 'Young', 'Warm'],
  },
  {
    id: 'district', title: 'District 9-1', source: 'Syndicated', category: 'Drama', subtype: 'Police procedural', status: 'Acquired',
    cadence: 'Strip', duration: 60, episodes: 132, quality: 69, buzz: 36, viewers: 0.118, share: 11.9,
    critic: 62, audience: 76, cost: 0.08, revenue: 0.17, trend: -1.4, target: 'Adults 35–64', lead: 'Derek Hall',
    identity: { color: '#65506b', accent: '#bca7c4', shape: 'diamond', icon: '91' },
    notes: 'Cheap, dependable library programming. The current package expires in 31 weeks.', specialties: ['Procedural', 'Familiar'],
  },
  {
    id: 'great-lakes', title: 'Great Lakes Outdoors', source: 'Original', category: 'News & Factual', subtype: 'Local magazine', status: 'On air',
    cadence: 'Weekly', duration: 60, episodes: 34, quality: 67, buzz: 41, viewers: 0.106, share: 10.8,
    critic: 66, audience: 79, cost: 0.09, revenue: 0.15, trend: 2.1, target: 'Adults 35–64', lead: 'Caleb Moss',
    identity: { color: '#54704c', accent: '#b6c8a9', shape: 'hex', icon: 'GL' },
    notes: 'Strong sponsor fit and regional potential, but modest urban appeal.', specialties: ['Outdoors', 'Regional', 'Factual'],
  },
  {
    id: 'late-local', title: 'After Ten', source: 'Original', category: 'Talk', subtype: 'Late-night talk', status: 'On air',
    cadence: 'Weekdays', duration: 60, episodes: 96, quality: 58, buzz: 53, viewers: 0.061, share: 8.3,
    critic: 55, audience: 64, cost: 0.12, revenue: 0.1, trend: -3.7, target: 'Adults 18–49', lead: 'Devon Price',
    identity: { color: '#783d54', accent: '#d5a7b7', shape: 'pill', icon: '10' },
    notes: 'Good digital clips, weak full-episode retention. The host is improving quickly.', specialties: ['Comedy', 'Live', 'Local'],
  },
];

export const initialSchedule = {
  Monday: { Morning: 'morning', Afternoon: 'district', Evening: 'local-news', 'Prime Time': 'second-chances', 'Late Night': 'late-local' },
  Tuesday: { Morning: 'morning', Afternoon: 'district', Evening: 'local-news', 'Prime Time': 'district', 'Late Night': 'late-local' },
  Wednesday: { Morning: 'morning', Afternoon: 'district', Evening: 'local-news', 'Prime Time': 'great-lakes', 'Late Night': 'late-local' },
  Thursday: { Morning: 'morning', Afternoon: 'district', Evening: 'local-news', 'Prime Time': 'second-chances', 'Late Night': 'late-local' },
  Friday: { Morning: 'morning', Afternoon: 'district', Evening: 'local-news', 'Prime Time': 'district', 'Late Night': 'late-local' },
  Saturday: { Morning: 'great-lakes', Afternoon: 'district', Evening: 'local-news', 'Prime Time': 'district', 'Late Night': 'late-local' },
  Sunday: { Morning: 'great-lakes', Afternoon: 'district', Evening: 'local-news', 'Prime Time': 'great-lakes', 'Late Night': 'late-local' },
};

export const initialPeople = [
  {
    id: 'p1', name: 'Yumi Tanaka', profession: 'Producer', rarity: 'Epic', age: 39, status: 'Employee', salary: 0.42,
    style: ['Efficient', 'International', 'Unscripted'], reliability: 94, prestige: 78, commercial: 88,
    skills: { Producing: 91, Directing: 58, Hosting: 24, Acting: 18, Writing: 61, Journalism: 35 },
    specialties: { 'Reality producer': 88, 'Contest producer': 76, 'Drama producer': 60 }, xp: { Producing: 620 },
    credits: 'Global Kitchen, House Rules', awards: 'Regional Emmy', availability: 'Internal',
  },
  {
    id: 'p2', name: 'Andre Lewis', profession: 'Anchor', rarity: 'Rare', age: 44, status: 'Employee', salary: 0.24,
    style: ['Authoritative', 'Calm', 'Public-service'], reliability: 96, prestige: 83, commercial: 72,
    skills: { Producing: 31, Directing: 20, Hosting: 82, Acting: 33, Writing: 54, Journalism: 89 },
    specialties: { 'Local news anchor': 91, 'Political interviewer': 72, 'Show host': 55 }, xp: { Journalism: 780, Hosting: 310 },
    credits: 'Northern Illinois Tonight, The Brief', awards: 'Peabody team award', availability: 'Internal',
  },
  {
    id: 'p3', name: 'Lauren Kim', profession: 'Host', rarity: 'Rare', age: 37, status: 'Employee', salary: 0.2,
    style: ['Warm', 'Spontaneous', 'Family'], reliability: 92, prestige: 69, commercial: 84,
    skills: { Producing: 28, Directing: 18, Hosting: 88, Acting: 45, Writing: 38, Journalism: 63 },
    specialties: { 'Morning host': 92, 'Lifestyle presenter': 83, 'Contest host': 58 }, xp: { Hosting: 690 },
    credits: 'Northstar Morning, Weekend Life', awards: 'Local viewers choice', availability: 'Internal',
  },
  {
    id: 'p4', name: 'Nia Brooks', profession: 'Actor', rarity: 'Epic', age: 27, status: 'Contracted', salary: 0.31,
    style: ['Naturalistic', 'Warm', 'Quick comedy'], reliability: 91, prestige: 76, commercial: 89,
    skills: { Producing: 22, Directing: 17, Hosting: 49, Acting: 89, Writing: 32, Journalism: 15 },
    specialties: { 'Comedy lead': 91, 'Romantic lead': 81, 'Drama lead': 62, 'Show host': 42 }, xp: { Acting: 710, Hosting: 80 },
    credits: 'Second Chances, Roommates', awards: 'Breakthrough nominee', availability: 'Northstar option',
  },
  {
    id: 'p5', name: 'Priya Shah', profession: 'Writer', rarity: 'Rare', age: 31, status: 'Employee', salary: 0.18,
    style: ['Character-first', 'Optimistic', 'Fast'], reliability: 95, prestige: 78, commercial: 76,
    skills: { Producing: 41, Directing: 22, Hosting: 18, Acting: 16, Writing: 88, Journalism: 36 },
    specialties: { 'Comedy writer': 91, 'Family writer': 84, 'Drama writer': 58, 'Format writer': 51 }, xp: { Writing: 840 },
    credits: 'Second Chances, Family Table', awards: 'WGA regional nominee', availability: 'Internal',
  },
  {
    id: 'p6', name: 'Mara Ellison', profession: 'Director', rarity: 'Rare', age: 46, status: 'Employee', salary: 0.23,
    style: ['Actor-friendly', 'Grounded', 'Efficient'], reliability: 88, prestige: 80, commercial: 69,
    skills: { Producing: 55, Directing: 87, Hosting: 12, Acting: 26, Writing: 44, Journalism: 18 },
    specialties: { 'Comedy director': 84, 'Drama director': 78, 'Live director': 45 }, xp: { Directing: 670 },
    credits: 'Second Chances, County Lines', awards: 'None', availability: 'Internal',
  },
  {
    id: 'p7', name: 'Devon Price', profession: 'Host', rarity: 'Uncommon', age: 34, status: 'Contracted', salary: 0.14,
    style: ['Irreverent', 'Digital-first', 'Improviser'], reliability: 71, prestige: 55, commercial: 74,
    skills: { Producing: 20, Directing: 12, Hosting: 76, Acting: 58, Writing: 61, Journalism: 22 },
    specialties: { 'Late-night host': 81, 'Comedy performer': 69, 'Contest host': 48 }, xp: { Hosting: 410, Acting: 170 },
    credits: 'After Ten, Price Online', awards: 'None', availability: 'Northstar contract',
  },
  {
    id: 'p8', name: 'Elena Cruz', profession: 'Actor', rarity: 'Legend', age: 38, status: 'Market', fee: 2.8,
    style: ['Prestige', 'Intense', 'Selective'], reliability: 82, prestige: 97, commercial: 90,
    skills: { Producing: 52, Directing: 32, Hosting: 31, Acting: 96, Writing: 26, Journalism: 10 },
    specialties: { 'Drama lead': 98, 'Historical lead': 92, 'Comedy lead': 57, 'Show host': 36 }, xp: { Acting: 1320 },
    credits: 'The Republic, A Quiet Winter', awards: '2 national Emmys', availability: '8 weeks', agency: 'Atlas Artists',
  },
  {
    id: 'p9', name: 'Marcus Vale', profession: 'Showrunner', rarity: 'Legend', age: 51, status: 'Market', fee: 3.4,
    style: ['Serialized', 'Dark', 'Franchise-minded'], reliability: 76, prestige: 94, commercial: 86,
    skills: { Producing: 93, Directing: 68, Hosting: 9, Acting: 8, Writing: 96, Journalism: 17 },
    specialties: { 'Drama showrunner': 98, 'Thriller writer': 95, 'Comedy writer': 41 }, xp: { Writing: 1440, Producing: 1100 },
    credits: 'Blacksite, Dominion', awards: '3 national Emmys', availability: 'Now', agency: 'Independent',
  },
  {
    id: 'p10', name: 'Leila Haddad', profession: 'Actor', rarity: 'Rare', age: 24, status: 'Market', fee: 0.58,
    style: ['Energetic', 'Young', 'Social'], reliability: 89, prestige: 66, commercial: 84,
    skills: { Producing: 12, Directing: 8, Hosting: 52, Acting: 83, Writing: 19, Journalism: 9 },
    specialties: { 'Young adult lead': 89, 'Drama supporting': 78, 'Contest host': 55 }, xp: { Acting: 440, Hosting: 90 },
    credits: 'After School, Redline', awards: 'None', availability: 'Now', agency: 'Meridian',
  },
  {
    id: 'p11', name: 'Theo Grant', profession: 'Director', rarity: 'Epic', age: 43, status: 'Market', fee: 1.25,
    style: ['Visual', 'Prestige', 'Demanding'], reliability: 84, prestige: 92, commercial: 79,
    skills: { Producing: 70, Directing: 93, Hosting: 8, Acting: 12, Writing: 46, Journalism: 11 },
    specialties: { 'Drama director': 96, 'Pilot director': 94, 'Comedy director': 57 }, xp: { Directing: 1150 },
    credits: 'Crown Point, The Harbor', awards: 'DGA award', availability: '5 weeks', agency: 'Atlas Artists',
  },
  {
    id: 'p12', name: 'Sofia Vega', profession: 'Host', rarity: 'Epic', age: 32, status: 'Market', fee: 0.92,
    style: ['Competitive', 'Polished', 'High-energy'], reliability: 86, prestige: 70, commercial: 93,
    skills: { Producing: 38, Directing: 16, Hosting: 94, Acting: 62, Writing: 26, Journalism: 27 },
    specialties: { 'Reality host': 97, 'Contest host': 93, 'Morning host': 66 }, xp: { Hosting: 980 },
    credits: 'Island House, Final Answer', awards: 'Audience award', availability: 'Now', agency: 'Capital Talent',
  },
  {
    id: 'p13', name: 'Gabriel Stone', profession: 'Composer', rarity: 'Rare', age: 36, status: 'Market', fee: 0.36,
    style: ['Atmospheric', 'Orchestral', 'Prestige'], reliability: 92, prestige: 88, commercial: 68,
    skills: { Producing: 29, Directing: 7, Hosting: 5, Acting: 4, Writing: 21, Journalism: 5, Music: 91 },
    specialties: { 'Drama composer': 94, 'Documentary composer': 86, 'Contest music': 47 }, xp: { Music: 790 },
    credits: 'Orbit, Winter Sun', awards: '2 national nominations', availability: 'Now', agency: 'Sound & Vision',
  },
  {
    id: 'p14', name: 'Caleb Moss', profession: 'Presenter', rarity: 'Uncommon', age: 48, status: 'Employee', salary: 0.12,
    style: ['Authentic', 'Regional', 'Outdoors'], reliability: 94, prestige: 62, commercial: 70,
    skills: { Producing: 39, Directing: 15, Hosting: 78, Acting: 30, Writing: 35, Journalism: 57 },
    specialties: { 'Outdoor presenter': 93, 'Documentary voice-over': 73, 'Contest host': 44 }, xp: { Hosting: 560 },
    credits: 'Great Lakes Outdoors', awards: 'Regional press award', availability: 'Internal',
  },
  {
    id: 'p15', name: 'Rafael Ortiz', profession: 'Cinematographer', rarity: 'Rare', age: 48, status: 'Market', fee: 0.49,
    style: ['Natural light', 'Period', 'Patient'], reliability: 85, prestige: 93, commercial: 61,
    skills: { Producing: 31, Directing: 61, Hosting: 4, Acting: 4, Writing: 6, Journalism: 7, Cinematography: 94 },
    specialties: { 'Historical cinematography': 97, 'Drama cinematography': 91, 'Documentary camera': 76 }, xp: { Cinematography: 1060 },
    credits: 'The Republic, Winter Sun', awards: '2 ASC awards', availability: '4 weeks', agency: 'Lens Collective',
  },
];

export const initialProjects = [
  {
    id: 'proj-prairie', title: 'Prairie Justice', category: 'Drama', subtype: 'Police procedural', stage: 'Writing',
    cadence: 'Weekly', episodes: 12, duration: 60, structure: 'Each episode tells an individual story', closure: 'Mostly closed with a continuing character arc',
    tone: 'Grounded', audience: 'Adults 25–54', weeksRemaining: 3, progress: 48, writerId: 'p5',
    choices: { music: 'Original theme', vfx: 'Practical only', sets: 'Standing local sets', locations: 'Local locations', wardrobe: 'Curated contemporary', writing: 'Experienced room' },
    identity: { color: '#8a5636', accent: '#d4ad91', shape: 'shield', icon: 'PJ' }, estimatedEpisodeCost: 0.46,
    script: null, production: null, note: 'A county prosecutor and sheriff confront cases shaped by the region’s economic changes.',
  },
  {
    id: 'proj-quiz', title: 'Quiz the Midwest', category: 'Contest', subtype: 'Culture quiz', stage: 'Script Ready',
    cadence: 'Weekly', episodes: 18, duration: 60, structure: 'Self-contained episodes', closure: 'Complete winner each episode',
    tone: 'Warm and competitive', audience: 'Families', weeksRemaining: 0, progress: 100, writerId: 'p5',
    choices: { music: 'Library package', vfx: 'Studio graphics', sets: 'Signature contest set', locations: 'Studio only', wardrobe: 'Basic', writing: 'Format team' },
    identity: { color: '#b07a26', accent: '#f0d08b', shape: 'hex', icon: '?' }, estimatedEpisodeCost: 0.21,
    script: { quality: 4, primaryRoles: ['Host'], secondaryRoles: ['Announcer / voice-over'], recommended: { music: 'Original theme', vfx: 'Studio graphics', sets: 'Signature contest set' }, strengths: ['Clear rounds', 'Strong family participation', 'Regional identity'], risks: ['Final round needs more tension'] },
    production: null, note: 'Local families compete across geography, history, food, sports, and culture.',
  },
  {
    id: 'proj-after-dark', title: 'Midwest After Dark', category: 'Talk', subtype: 'Late-night talk', stage: 'Production',
    cadence: 'Weekdays', episodes: 160, duration: 60, structure: 'Continuous production', closure: 'Daily topical show',
    tone: 'Smart and irreverent', audience: 'Adults 18–49', weeksRemaining: 2, progress: 62, writerId: 'p7',
    choices: { music: 'Live house band', vfx: 'Studio graphics', sets: 'Signature talk set', locations: 'Studio only', wardrobe: 'Curated contemporary', writing: 'Daily writers room' },
    identity: { color: '#492f62', accent: '#a88bc5', shape: 'pill', icon: 'MD' }, estimatedEpisodeCost: 0.19,
    script: { quality: 3, primaryRoles: ['Host'], secondaryRoles: ['Band leader', 'Sidekick'], recommended: { music: 'Live house band', vfx: 'Studio graphics', sets: 'Signature talk set' }, strengths: ['Distinct local voice', 'Strong clip potential'], risks: ['Host chemistry untested'] },
    production: { producerId: 'p1', directorId: 'p6', leadId: 'p7', supportingIds: [], cost: 1.8, weeks: 3, continuous: true },
    note: 'A larger, more ambitious replacement for After Ten that can begin airing while the team continues refining it.',
  },
];

export const initialRights = [
  {
    id: 'right-rivets', title: 'Rockford Rivets Baseball', type: 'Sports', subtype: 'Local baseball', territory: 'Northern Illinois',
    term: '2 seasons', events: 48, exclusivity: 'Local exclusive', upfront: 3.2, weekly: 0.08, demand: 64, bids: 1,
    deadline: 5, requirement: null, status: 'Available', description: 'Summer baseball with strong local identity and modest production requirements.',
    identity: { color: '#2e6a55', accent: '#99c4ad', shape: 'diamond', icon: '⚾' },
  },
  {
    id: 'right-college', title: 'Midwest College Basketball Package', type: 'Sports', subtype: 'College basketball', territory: 'Illinois + Wisconsin',
    term: '3 seasons', events: 36, exclusivity: 'Regional cable and broadcast', upfront: 9.8, weekly: 0.21, demand: 88, bids: 4,
    deadline: 8, requirement: 'regional-sports', status: 'Available', description: 'A distribution-changing package with live winter inventory and affiliate appeal.',
    identity: { color: '#8a4b2f', accent: '#d9a98b', shape: 'circle', icon: '🏀' },
  },
  {
    id: 'right-classics', title: 'American Classics — 80 Film Library', type: 'Movies', subtype: 'Classic film package', territory: 'Current footprint',
    term: '4 years', events: 80, exclusivity: 'Non-exclusive', upfront: 4.6, weekly: 0.04, demand: 51, bids: 1,
    deadline: 12, requirement: null, status: 'Available', description: 'Recognizable movies for afternoons, weekends, and late night. Low risk and dependable.',
    identity: { color: '#5d526a', accent: '#b9aec6', shape: 'rounded', icon: '▶' },
  },
  {
    id: 'right-premieres', title: 'Horizon Studio Premiere Window', type: 'Movies', subtype: 'Recent theatrical package', territory: 'Midwest',
    term: '2 years', events: 18, exclusivity: 'Regional first window', upfront: 11.5, weekly: 0.15, demand: 79, bids: 3,
    deadline: 7, requirement: 'premium-film-sales', status: 'Available', description: 'Recent films capable of anchoring Sunday prime time, with strict promotion commitments.',
    identity: { color: '#325d7a', accent: '#91bbd5', shape: 'hex', icon: 'H' },
  },
  {
    id: 'right-quiz-format', title: 'The Last Answer — Format Rights', type: 'Format', subtype: 'Culture quiz format', territory: 'Midwest',
    term: '5 seasons', events: 0, exclusivity: 'Regional exclusive', upfront: 1.35, weekly: 0.02, demand: 69, bids: 2,
    deadline: 9, requirement: 'quiz-formats', status: 'Available', description: 'A tested escalating quiz structure that reduces development risk but limits rule changes.',
    identity: { color: '#a06d21', accent: '#e7c36e', shape: 'shield', icon: '?' },
  },
  {
    id: 'right-football', title: 'European Football Weekend Highlights', type: 'Sports', subtype: 'International football highlights', territory: 'United States',
    term: '3 seasons', events: 90, exclusivity: 'Non-exclusive cable', upfront: 6.7, weekly: 0.11, demand: 74, bids: 3,
    deadline: 10, requirement: 'international-rights', status: 'Available', description: 'A younger audience and digital clips, but limited value without cable or streaming distribution.',
    identity: { color: '#3f7654', accent: '#a5d0b3', shape: 'circle', icon: '⚽' },
  },
];

export const initialOwnedRights = [
  {
    id: 'owned-highschool', title: 'Friday Night Illinois', type: 'Sports', subtype: 'High school football', territory: 'Northern Illinois',
    termWeeks: 38, events: 12, remaining: 9, upfront: 0, weekly: 0.04, status: 'Owned',
    quality: 61, viewers: 0.126, share: 13.9, cost: 0.07, revenue: 0.16, trend: 4.1, target: 'Families',
    identity: { color: '#74402f', accent: '#c99273', shape: 'shield', icon: '🏈' },
  },
];

export const initialResearch = [
  { id: 'quiz-formats', name: 'Quiz & Game Show Formats', domain: 'Creative', cost: 10, cash: 0.8, status: 'Complete', description: 'Unlocks culture quizzes, family games, and structured format development.' },
  { id: 'multi-camera-studio', name: 'Multi-camera Studio Workflow', domain: 'Production', cost: 12, cash: 1.2, status: 'Complete', description: 'Improves talk, comedy, and contest production speed.' },
  { id: 'affiliate-systems', name: 'Affiliate Management Systems', domain: 'Distribution', cost: 16, cash: 2.5, status: 'Available', description: 'Contracts, schedule feeds, ad splits, and support for independent affiliate stations.' },
  { id: 'cable-desk', name: 'Cable Distribution Desk', domain: 'Distribution', cost: 14, cash: 2.2, status: 'Available', description: 'Enables regional cable carriage negotiations and operator reporting.' },
  { id: 'transmission-II', name: 'Regional Transmission Engineering', domain: 'Infrastructure', cost: 13, cash: 2.8, status: 'Available', description: 'Unlocks multi-site repeater networks and improves terrestrial coverage.' },
  { id: 'regional-sports', name: 'Regional Sports Operations', domain: 'Rights', cost: 18, cash: 3.1, status: 'Locked', prerequisite: 'affiliate-systems', description: 'Outside broadcast crews, rights scheduling, sponsorship sales, and league servicing.' },
  { id: 'documentary-unit', name: 'Documentary Field Unit', domain: 'Creative', cost: 13, cash: 1.9, status: 'Available', description: 'Unlocks nature and true-crime documentaries with specialist production choices.' },
  { id: 'reality-production', name: 'Reality Production Systems', domain: 'Creative', cost: 11, cash: 1.5, status: 'Available', description: 'Unlocks social, romance, transformation, business, and cooking reality formats.' },
  { id: 'survival-logistics', name: 'Remote & Survival Logistics', domain: 'Production', cost: 17, cash: 3.5, status: 'Locked', prerequisite: 'reality-production', description: 'Medical, remote camera, insurance, and extraction systems for survival formats.' },
  { id: 'physical-contest', name: 'Physical Competition Safety', domain: 'Production', cost: 16, cash: 3.2, status: 'Locked', prerequisite: 'multi-camera-studio', description: 'Unlocks obstacle and physical competition shows.' },
  { id: 'period-production', name: 'Period Production Department', domain: 'Creative', cost: 20, cash: 4.8, status: 'Available', description: 'Costumes, historical sets, weapons, advisors, and large period productions.' },
  { id: 'advanced-vfx', name: 'Advanced VFX Pipeline', domain: 'Production', cost: 22, cash: 5.2, status: 'Available', description: 'Unlocks premium VFX and science-fiction production at controlled risk.' },
  { id: 'medical-production', name: 'Medical Drama Advisory', domain: 'Creative', cost: 9, cash: 0.9, status: 'Available', description: 'Medical consultants, hospital set packages, and credibility systems.' },
  { id: 'investigative-desk', name: 'Investigative News Desk', domain: 'News', cost: 15, cash: 2.4, status: 'Available', description: 'Long-form investigations, legal review, source protection, and political debate.' },
  { id: 'sports-desk', name: 'Sports News Desk', domain: 'News', cost: 10, cash: 1.4, status: 'Available', description: 'Daily highlights, analysts, statistics, and sports debate programming.' },
  { id: 'late-night-studio', name: 'Late-night Studio Capability', domain: 'Production', cost: 10, cash: 1.6, status: 'Available', description: 'House band, audience management, monologue workflow, and rapid clip editing.' },
  { id: 'regional-operations', name: 'Multi-state Regional Operations', domain: 'Distribution', cost: 24, cash: 6.5, status: 'Locked', prerequisite: 'affiliate-systems', description: 'Regional sales, compliance, scheduling, and market management.' },
  { id: 'national-carriage', name: 'National Carriage Organization', domain: 'Distribution', cost: 38, cash: 12, status: 'Locked', prerequisite: 'regional-operations', description: 'National operator negotiations, feeds, standards, and affiliate support.' },
  { id: 'station-acquisitions', name: 'Station Acquisition Capability', domain: 'Corporate', cost: 25, cash: 8, status: 'Available', description: 'Due diligence, integration, financing, and regulatory work for owned stations.' },
  { id: 'premium-film-sales', name: 'Premium Movie Sales', domain: 'Commercial', cost: 11, cash: 1.8, status: 'Available', description: 'National film advertisers, sponsorship packages, and premiere promotion.' },
  { id: 'international-rights', name: 'International Rights Desk', domain: 'Rights', cost: 15, cash: 2.6, status: 'Available', description: 'Currency, time-zone, clearance, and international rights negotiations.' },
  { id: 'animation-pipeline', name: 'Animation Production Pipeline', domain: 'Production', cost: 24, cash: 5.5, status: 'Available', description: 'Animation studios, voice casting, long lead times, and reusable assets.' },
  { id: 'live-event-production', name: 'Major Live Event Production', domain: 'Production', cost: 19, cash: 4, status: 'Locked', prerequisite: 'multi-camera-studio', description: 'Large live competitions, voting, redundancy, audience operations, and event control.' },
];

export const initialCommercial = {
  advertisers: [
    { id: 'a1', name: 'Midwest Auto Group', category: 'Automotive', budget: 2.4, fit: 88, preference: 'News, sports, adults 25–54', risk: 'Low' },
    { id: 'a2', name: 'Prairie Foods', category: 'Grocery', budget: 1.6, fit: 92, preference: 'Family, morning, local trust', risk: 'Low' },
    { id: 'a3', name: 'Halo Mobile', category: 'Technology', budget: 2.1, fit: 71, preference: 'Adults 18–34, comedy, digital clips', risk: 'Medium' },
    { id: 'a4', name: 'Great Lakes Bank', category: 'Financial', budget: 1.8, fit: 81, preference: 'News, affluent households', risk: 'Low' },
  ],
  deals: [
    { id: 'deal1', advertiser: 'Prairie Foods', package: 'Northstar Morning integrations', weeks: 18, value: 0.82, status: 'Active' },
    { id: 'deal2', advertiser: 'Midwest Auto Group', package: 'Local news weather sponsorship', weeks: 12, value: 0.76, status: 'Active' },
  ],
  campaigns: [
    { id: 'camp1', name: 'Second Chances — Local Breakout', showId: 'second-chances', objective: 'Tune-in', spend: 0.18, weeks: 3, lift: 5, status: 'Live' },
  ],
};

export const initialNews = [
  { id: 1, week: 6, tag: 'Strategy', headline: 'Northstar board asks management to define the next footprint', body: 'The station is profitable enough to consider Chicago cable carriage, a Wisconsin affiliate, or a deeper local strategy—but not all three at once.', importance: 'Lead' },
  { id: 2, week: 6, tag: 'Programming', headline: 'Second Chances gives Northstar its first credible original hit', body: 'The workplace comedy is outperforming acquired prime-time programming and has begun attracting calls from small-market syndication buyers.', importance: 'Major' },
  { id: 3, week: 6, tag: 'Rights', headline: 'Rockford Rivets open local baseball package to bidders', body: 'The package is affordable and could strengthen summer identity, although production costs will limit immediate profit.', importance: 'Watch' },
  { id: 4, week: 6, tag: 'Competition', headline: 'Heartland Media pursues Milwaukee affiliate expansion', body: 'The regional leader may close one of Northstar’s easiest expansion routes unless management develops affiliate capability quickly.', importance: 'Industry' },
];
