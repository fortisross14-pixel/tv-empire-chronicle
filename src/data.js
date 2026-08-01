export const NETWORK = {
  name: 'Northstar Broadcasting Group',
  shortName: 'NBG',
  channel: 'Northstar',
  slogan: 'Stories worth staying for.',
};

export const navItems = [
  ['home', 'Executive Home'],
  ['programming', 'Programming'],
  ['development', 'Creative Studio'],
  ['talent', 'Talent Network'],
  ['ratings', 'Nielsen Center'],
  ['sales', 'Ad Sales'],
  ['marketing', 'Marketing'],
  ['finance', 'Finance'],
  ['operations', 'Operations'],
  ['chronicle', 'The Chronicle'],
];

export const initialShows = [
  {
    id: 'harbor', title: 'The Harbor', format: 'Drama', genre: 'Prestige drama', status: 'Returning',
    seasons: 3, episodes: 10, quality: 91, buzz: 83, viewers: 7.8, share: 12.9, critic: 93, audience: 86,
    cost: 4.4, revenue: 6.9, trend: 7, target: 'Adults 25–54', lead: 'Mara Voss', color: '#3d6f8f',
    notes: 'Awards contender; expensive ensemble contract renewals due in 8 weeks.',
  },
  {
    id: 'district', title: 'District 9-1', format: 'Procedural', genre: 'Crime procedural', status: 'Returning',
    seasons: 8, episodes: 22, quality: 77, buzz: 56, viewers: 8.9, share: 14.7, critic: 68, audience: 81,
    cost: 2.1, revenue: 7.2, trend: -2, target: 'Adults 35–64', lead: 'Jon Bell', color: '#654f65',
    notes: 'Reliable anchor with strong delayed viewing and syndication value.',
  },
  {
    id: 'late', title: 'Late Tonight', format: 'Late night', genre: 'Comedy / talk', status: 'Returning',
    seasons: 6, episodes: 160, quality: 72, buzz: 68, viewers: 2.6, share: 8.1, critic: 74, audience: 70,
    cost: 0.8, revenue: 1.7, trend: 4, target: 'Adults 18–49', lead: 'Devon Price', color: '#8b6538',
    notes: 'Social clips are growing faster than linear viewing.',
  },
  {
    id: 'second', title: 'Second Chances', format: 'Comedy', genre: 'Workplace comedy', status: 'Freshman',
    seasons: 1, episodes: 13, quality: 82, buzz: 76, viewers: 5.6, share: 9.4, critic: 84, audience: 88,
    cost: 1.5, revenue: 3.6, trend: 12, target: 'Adults 18–34', lead: 'Nia Brooks', color: '#39776e',
    notes: 'Breakout comedy; retention has improved for four consecutive weeks.',
  },
  {
    id: 'frontline', title: 'Frontline America', format: 'News', genre: 'Investigative news', status: 'Returning',
    seasons: 12, episodes: 45, quality: 86, buzz: 61, viewers: 4.4, share: 7.5, critic: 89, audience: 73,
    cost: 1.1, revenue: 2.2, trend: 1, target: 'Adults 25–64', lead: 'Amira Patel', color: '#345c78',
    notes: 'High prestige and trust; advertiser category restrictions apply.',
  },
  {
    id: 'island', title: 'Island House', format: 'Reality', genre: 'Competition reality', status: 'Returning',
    seasons: 5, episodes: 16, quality: 66, buzz: 81, viewers: 6.9, share: 11.5, critic: 48, audience: 76,
    cost: 0.9, revenue: 4.7, trend: 5, target: 'Adults 18–34', lead: 'Sofia Vega', color: '#a4644c',
    notes: 'Highly profitable; cast controversy is increasing social engagement.',
  },
  {
    id: 'legacy', title: 'Legacy Code', format: 'Drama', genre: 'Technology thriller', status: 'Freshman',
    seasons: 1, episodes: 10, quality: 74, buzz: 46, viewers: 3.4, share: 5.8, critic: 71, audience: 69,
    cost: 3.3, revenue: 2.2, trend: -14, target: 'Adults 18–49', lead: 'Cole Mercer', color: '#525f73',
    notes: 'Critical decision: reposition, move slots, or stop future spending.',
  },
  {
    id: 'morning', title: 'Northstar Morning', format: 'Daytime', genre: 'News / lifestyle', status: 'Returning',
    seasons: 15, episodes: 250, quality: 69, buzz: 42, viewers: 2.9, share: 10.2, critic: 63, audience: 74,
    cost: 0.6, revenue: 1.5, trend: -1, target: 'Adults 25–54', lead: 'Lauren Kim', color: '#b38b45',
    notes: 'Stable local affiliate performance and valuable retail integrations.',
  },
];

export const initialSchedule = {
  Monday: { '8:00': 'district', '9:00': 'harbor', '10:00': 'frontline' },
  Tuesday: { '8:00': 'second', '9:00': 'legacy', '10:00': 'late' },
  Wednesday: { '8:00': 'island', '9:00': 'district', '10:00': 'late' },
  Thursday: { '8:00': 'second', '9:00': 'harbor', '10:00': 'late' },
  Friday: { '8:00': 'island', '9:00': 'frontline', '10:00': 'late' },
  Saturday: { '8:00': 'district', '9:00': 'island', '10:00': 'late' },
  Sunday: { '8:00': 'frontline', '9:00': 'harbor', '10:00': 'district' },
};

export const initialPeople = [
  { id: 1, name: 'Elena Cruz', role: 'Actor', rarity: 'Legend', age: 38, craft: 94, commercial: 89, prestige: 96, reliability: 82, fee: 2.8, agency: 'Atlas Artists', availability: '8 weeks', specialties: ['Drama', 'Limited series'], credits: 'The Republic, A Quiet Winter', awards: '2 Emmys · 4 nominations', trend: 'Rising' },
  { id: 2, name: 'Marcus Vale', role: 'Showrunner', rarity: 'Legend', age: 51, craft: 95, commercial: 84, prestige: 92, reliability: 76, fee: 3.4, agency: 'Independent', availability: 'Now', specialties: ['Thriller', 'Franchise'], credits: 'Blacksite, Dominion', awards: '3 Emmys', trend: 'Stable' },
  { id: 3, name: 'Nia Brooks', role: 'Actor', rarity: 'Epic', age: 27, craft: 87, commercial: 91, prestige: 78, reliability: 91, fee: 1.5, agency: 'Meridian', availability: 'Under contract', specialties: ['Comedy', 'Romance'], credits: 'Second Chances', awards: 'Breakthrough nominee', trend: 'Surging' },
  { id: 4, name: 'Theo Grant', role: 'Director', rarity: 'Epic', age: 43, craft: 90, commercial: 78, prestige: 91, reliability: 88, fee: 1.2, agency: 'Atlas Artists', availability: '4 weeks', specialties: ['Drama', 'Pilot'], credits: 'Crown Point, The Harbor', awards: '1 DGA award', trend: 'Rising' },
  { id: 5, name: 'Priya Shah', role: 'Writer', rarity: 'Rare', age: 31, craft: 86, commercial: 74, prestige: 81, reliability: 93, fee: 0.42, agency: 'Story House', availability: 'Now', specialties: ['Comedy', 'Family'], credits: 'Home Team, Roommates', awards: 'WGA nominee', trend: 'Rising' },
  { id: 6, name: 'Derek Hall', role: 'Actor', rarity: 'Epic', age: 46, craft: 85, commercial: 88, prestige: 81, reliability: 70, fee: 1.9, agency: 'CAA North', availability: '12 weeks', specialties: ['Action', 'Procedural'], credits: 'The Unit, Last Command', awards: '2 audience awards', trend: 'Cooling' },
  { id: 7, name: 'Yumi Tanaka', role: 'Executive Producer', rarity: 'Epic', age: 39, craft: 89, commercial: 92, prestige: 83, reliability: 95, fee: 1.8, agency: 'Independent', availability: 'Now', specialties: ['Reality', 'International'], credits: 'Global Kitchen, House Rules', awards: '1 Emmy', trend: 'Surging' },
  { id: 8, name: 'Andre Lewis', role: 'Anchor', rarity: 'Rare', age: 44, craft: 82, commercial: 79, prestige: 87, reliability: 96, fee: 0.95, agency: 'Capital Talent', availability: '6 weeks', specialties: ['News', 'Politics'], credits: 'Night Report, The Brief', awards: 'Peabody team award', trend: 'Stable' },
  { id: 9, name: 'Leila Haddad', role: 'Actor', rarity: 'Rare', age: 24, craft: 81, commercial: 86, prestige: 68, reliability: 89, fee: 0.55, agency: 'Meridian', availability: 'Now', specialties: ['Young adult', 'Thriller'], credits: 'After School, Redline', awards: 'None', trend: 'Surging' },
  { id: 10, name: 'Gabriel Stone', role: 'Composer', rarity: 'Rare', age: 36, craft: 88, commercial: 67, prestige: 89, reliability: 92, fee: 0.35, agency: 'Sound & Vision', availability: 'Now', specialties: ['Drama', 'Sci-fi'], credits: 'Orbit, The Harbor', awards: '2 nominations', trend: 'Stable' },
  { id: 11, name: 'Alana Reed', role: 'Marketing Executive', rarity: 'Epic', age: 40, craft: 91, commercial: 94, prestige: 79, reliability: 89, fee: 0.8, agency: 'Northbridge Search', availability: 'Now', specialties: ['Launches', 'Streaming'], credits: 'Streamly, Vista+', awards: 'Brandweek 40 under 40', trend: 'Rising' },
  { id: 12, name: 'Rafael Ortiz', role: 'Cinematographer', rarity: 'Rare', age: 48, craft: 90, commercial: 61, prestige: 93, reliability: 85, fee: 0.48, agency: 'Lens Collective', availability: '4 weeks', specialties: ['Period', 'Drama'], credits: 'The Republic, Winter Sun', awards: '2 ASC awards', trend: 'Stable' },
];

export const initialDevelopment = [
  { id: 'dev1', title: 'Ashes of Tomorrow', stage: 'Pilot ordered', genre: 'Science-fiction drama', budget: 3.8, creative: 88, commercial: 76, progress: 64, owner: 'Drama', weeks: 7, note: 'Casting lead and finalizing pilot director.' },
  { id: 'dev2', title: 'Family Table', stage: 'Script development', genre: 'Family comedy', budget: 1.3, creative: 79, commercial: 84, progress: 36, owner: 'Comedy', weeks: 12, note: 'Strong testing concept; rewrite requested for the parents.' },
  { id: 'dev3', title: 'The Candidate', stage: 'Packaging', genre: 'Political limited series', budget: 4.6, creative: 93, commercial: 62, progress: 22, owner: 'Limited Series', weeks: 18, note: 'Prestige package depends on landing Elena Cruz.' },
  { id: 'dev4', title: 'Built Different', stage: 'Unscripted casting', genre: 'Entrepreneur reality', budget: 0.8, creative: 66, commercial: 88, progress: 48, owner: 'Unscripted', weeks: 9, note: 'Retail sponsorship interest is already strong.' },
];

export const advertisers = [
  { id: 'a1', name: 'Novus Automotive', category: 'Automotive', fit: 91, budget: 14.0, ask: 42, preference: 'Adults 25–54 · premium drama', risk: 'Low' },
  { id: 'a2', name: 'BrightMart', category: 'Retail', fit: 84, budget: 10.5, ask: 31, preference: 'Broad reach · family safe', risk: 'Low' },
  { id: 'a3', name: 'Halo Mobile', category: 'Technology', fit: 89, budget: 8.2, ask: 38, preference: 'Adults 18–34 · social buzz', risk: 'Medium' },
  { id: 'a4', name: 'Crestline Financial', category: 'Financial services', fit: 76, budget: 12.0, ask: 35, preference: 'Affluent 35+ · news', risk: 'Low' },
  { id: 'a5', name: 'PopFizz', category: 'Beverage', fit: 94, budget: 6.8, ask: 29, preference: 'Reality · comedy · live events', risk: 'Medium' },
];

export const competitorMoves = [
  { network: 'Apex', move: 'Orders 18 episodes of medical drama Mercy General after a strong pilot test.', impact: 'Competes directly with District 9-1 on Wednesdays.' },
  { network: 'Vista+', move: 'Raises annual content budget by $420M and signs director Theo Grant to a first-look deal.', impact: 'Premium talent market will tighten.' },
  { network: 'United', move: 'Cancels three freshman comedies and opens its Thursday 8 PM slot.', impact: 'Opportunity for Second Chances to own the night.' },
];

export const initialDeals = [
  { id: 'd1', advertiser: 'Novus Automotive', package: 'The Harbor premiere + digital', weeks: 6, value: 3.6, cpm: 41, status: 'Active' },
  { id: 'd2', advertiser: 'BrightMart', package: 'Family programming rotation', weeks: 12, value: 4.2, cpm: 30, status: 'Active' },
  { id: 'd3', advertiser: 'PopFizz', package: 'Island House presenting sponsor', weeks: 8, value: 2.1, cpm: 34, status: 'Active' },
];

export const initialCampaigns = [
  { id: 'c1', name: 'The Harbor — For Your Consideration', show: 'The Harbor', type: 'Awards', spend: 1.2, weeks: 4, lift: 5, status: 'Live' },
  { id: 'c2', name: 'Second Chances Social Cutdowns', show: 'Second Chances', type: 'Tune-in', spend: 0.45, weeks: 2, lift: 7, status: 'Live' },
];

export const initialNews = [
  { id: 1, tag: 'Ratings', headline: 'Second Chances becomes Northstar’s fastest-growing comedy in seven years', body: 'The freshman series added 12% week over week and retained 89% of its lead-in audience. Internal projections now place renewal probability above 90%.', importance: 'Lead story' },
  { id: 2, tag: 'Talent', headline: 'Elena Cruz enters the market as prestige buyers circle', body: 'The two-time Emmy winner is seeking a limited-series package with meaningful producer authority. Northstar’s political project The Candidate is considered a credible fit.', importance: 'Major' },
  { id: 3, tag: 'Programming', headline: 'Legacy Code reaches its decision point after another soft Tuesday', body: 'Despite respectable reviews, the technology thriller remains 28% below the network’s time-slot average and has weak advertiser demand.', importance: 'Watch' },
  { id: 4, tag: 'Industry', headline: 'Streaming rivals accelerate spending while broadcast CPMs hold', body: 'Advertisers continue to reward live and appointment viewing, but talent and production costs are rising across premium scripted programming.', importance: 'Context' },
];
