export interface Topic {
  id: string;
  name: string;
  icon: string;
  /** Format id → fit stars (1–3). Formats not listed can't use this topic. */
  fits: Record<string, 1 | 2 | 3>;
  /** Words used to generate show titles. */
  words: string[];
}

const t = (x: Topic) => x;

export const TOPICS: Topic[] = [
  // News only
  t({ id: 'local-news', name: 'Local News', icon: '🏙️', fits: { news: 3 }, words: ['Eyewitness', 'Hometown', 'Action', 'City Desk'] }),
  t({ id: 'weather', name: 'Weather & Traffic', icon: '⛅', fits: { news: 3 }, words: ['Forecast', 'Storm Watch', 'Sky', 'Rush Hour'] }),
  t({ id: 'sports-news', name: 'Sports News', icon: '🏟️', fits: { news: 3 }, words: ['Scoreboard', 'Sports Desk', 'Highlights', 'Final Whistle'] }),
  t({ id: 'political-news', name: 'Political News', icon: '🏛️', fits: { news: 3 }, words: ['Capitol', 'Ballot', 'Town Hall', 'Debate Desk'] }),
  t({ id: 'business-news', name: 'Business News', icon: '📈', fits: { news: 3 }, words: ['Market', 'Money', 'Ticker', 'Main Street'] }),
  t({ id: 'crime-beat', name: 'Crime Beat', icon: '🚨', fits: { news: 3 }, words: ['Crime Watch', 'Night Patrol', 'Hotline', 'Precinct'] }),

  // Semi-specific
  t({ id: 'cooking', name: 'Cooking', icon: '🍳', fits: { contest: 3, reality: 3, magazine: 3, talk: 2, documentary: 1 }, words: ['Kitchen', 'Chef', 'Recipe', 'Sizzle'] }),
  t({ id: 'martial-arts', name: 'Martial Arts', icon: '🥋', fits: { reality: 3, contest: 2, series: 2, documentary: 2, movie: 2 }, words: ['Dojo', 'Brawler', 'Black Belt', 'Kobra'] }),
  t({ id: 'music', name: 'Music', icon: '🎸', fits: { contest: 3, talk: 2, reality: 2, documentary: 2, sitcom: 1 }, words: ['Stage', 'Encore', 'Rhythm', 'Spotlight'] }),
  t({ id: 'trivia', name: 'Trivia', icon: '❓', fits: { contest: 3, talk: 1 }, words: ['Brainiac', 'Quiz', 'Answer', 'Know-It-All'] }),
  t({ id: 'dating', name: 'Dating', icon: '💘', fits: { reality: 3, contest: 2, sitcom: 2, talk: 1 }, words: ['Love', 'Match', 'Heart', 'Rose'] }),
  t({ id: 'home', name: 'Home Makeover', icon: '🏠', fits: { reality: 3, magazine: 3, contest: 2 }, words: ['Dream Home', 'Fixer', 'Flip', 'Curb Appeal'] }),
  t({ id: 'survival', name: 'Survival', icon: '🔥', fits: { reality: 3, contest: 2, documentary: 2, movie: 2 }, words: ['Castaways', 'Wild', 'Outlast', 'Island'] }),
  t({ id: 'celebrity', name: 'Celebrity', icon: '⭐', fits: { talk: 3, magazine: 3, reality: 2 }, words: ['Star', 'Red Carpet', 'Gossip', 'Famous'] }),
  t({ id: 'nature', name: 'Nature', icon: '🦉', fits: { documentary: 3, magazine: 2, reality: 1 }, words: ['Wild Planet', 'Creatures', 'Frontier', 'Untamed'] }),
  t({ id: 'true-crime', name: 'True Crime', icon: '🔍', fits: { documentary: 3, series: 2, movie: 2, magazine: 1 }, words: ['Cold Case', 'Evidence', 'Unsolved', 'Motive'] }),
  t({ id: 'medical', name: 'Medical', icon: '🩺', fits: { series: 3, reality: 2, documentary: 2, sitcom: 1 }, words: ['General', 'ER', 'Scrubs', 'Code Blue'] }),
  t({ id: 'police', name: 'Police', icon: '🚓', fits: { series: 3, sitcom: 2, reality: 2, movie: 2, documentary: 1 }, words: ['Badge', 'Precinct', 'Patrol', 'Detective'] }),
  t({ id: 'family', name: 'Family', icon: '👨‍👩‍👧', fits: { sitcom: 3, series: 2, reality: 2, movie: 2, talk: 1 }, words: ['Family', 'Home', 'Kids', 'Sunday'] }),
  t({ id: 'workplace', name: 'Workplace', icon: '💼', fits: { sitcom: 3, series: 2, reality: 1 }, words: ['Office', 'Shift', 'Nine to Five', 'Break Room'] }),
  t({ id: 'medieval', name: 'Medieval', icon: '🏰', fits: { series: 3, movie: 3, documentary: 1 }, words: ['Throne', 'Crown', 'Kingdom', 'Dragon'] }),
  t({ id: 'scifi', name: 'Sci-Fi', icon: '🚀', fits: { series: 3, movie: 3, sitcom: 1 }, words: ['Galaxy', 'Star', 'Orbit', 'Nebula'] }),
  t({ id: 'romance', name: 'Romance', icon: '🌹', fits: { movie: 3, series: 2, sitcom: 2, reality: 1 }, words: ['Hearts', 'Summer Love', 'Promise', 'Forever'] }),
  t({ id: 'wellness', name: 'Health & Wellness', icon: '🧘', fits: { talk: 3, magazine: 3, documentary: 2 }, words: ['Wellness', 'Healthy', 'Balance', 'Glow'] }),
  t({ id: 'travel', name: 'Travel', icon: '✈️', fits: { magazine: 3, documentary: 3, reality: 2, contest: 1 }, words: ['Passport', 'Getaway', 'Road Trip', 'Journey'] }),
  t({ id: 'local-life', name: 'Local Life', icon: '🌳', fits: { magazine: 3, talk: 2, documentary: 2 }, words: ['Neighbors', 'Our Town', 'Main Street', 'Corner'] }),
  t({ id: 'teen', name: 'High School', icon: '🎒', fits: { series: 3, sitcom: 2, movie: 2 }, words: ['Hallway', 'Prom', 'Varsity', 'Locker'] }),
  t({ id: 'fashion', name: 'Fashion', icon: '👗', fits: { contest: 3, reality: 2, magazine: 2 }, words: ['Runway', 'Style', 'Couture', 'Glam'] }),
  t({ id: 'pets', name: 'Pets', icon: '🐶', fits: { magazine: 3, reality: 2, contest: 2, sitcom: 1 }, words: ['Paws', 'Puppy', 'Best Friend', 'Tails'] }),
  t({ id: 'history', name: 'History', icon: '📜', fits: { documentary: 3, series: 2, movie: 2, contest: 1 }, words: ['Legends', 'Empire', 'Chronicles', 'Lost'] }),
  t({ id: 'politics', name: 'Politics', icon: '🗳️', fits: { talk: 3, documentary: 2, series: 2, sitcom: 1 }, words: ['Power', 'Office', 'Campaign', 'Spin'] }),
  t({ id: 'business', name: 'Business', icon: '💰', fits: { reality: 3, talk: 2, documentary: 2 }, words: ['Shark', 'Deal', 'Pitch', 'Boss'] }),
  t({ id: 'sports', name: 'Sports', icon: '⚽', fits: { talk: 3, contest: 2, reality: 2, documentary: 2, series: 1 }, words: ['Locker Room', 'Game Day', 'Overtime', 'Champions'] }),
];

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((x) => [x.id, x]));
export const topicById = (id: string) => TOPIC_BY_ID[id];

export const topicsForFormat = (formatId: string) => TOPICS.filter((x) => x.fits[formatId]);

/** Script multiplier for topic fit stars. */
export const FIT_MULT: Record<number, number> = { 1: 0.72, 2: 0.87, 3: 1 };
