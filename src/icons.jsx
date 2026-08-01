import React from 'react';

function Icon({ size = 24, children, fill = 'none', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

const grid = (props) => <Icon {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>;
const calendar = (props) => <Icon {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M7 14h2M12 14h2M17 14h1M7 18h2M12 18h2"/></Icon>;
const spark = (props) => <Icon {...props}><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></Icon>;
const people = (props) => <Icon {...props}><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6"/><circle cx="17" cy="9" r="2.2"/><path d="M15.5 15.3c3.2-.5 5 1.2 5 4.7"/></Icon>;
const chart = (props) => <Icon {...props}><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="M2 21h20"/></Icon>;
const handshake = (props) => <Icon {...props}><path d="M4 13l4-4 4 3 3-2 5 4"/><path d="M3 8l4 1-4 7H1M21 8l-4 1 4 7h2"/><path d="M8 15l2 2M11 14l2 2M14 13l2 2"/></Icon>;
const megaphone = (props) => <Icon {...props}><path d="M3 11v4h4l8 4V7l-8 4H3z"/><path d="M7 15l1 5h3l-1-4M18 9c2 2 2 6 0 8"/></Icon>;
const line = (props) => <Icon {...props}><path d="M3 19l5-6 4 3 7-10"/><path d="M15 6h4v4"/><path d="M3 21h18"/></Icon>;
const gear = (props) => <Icon {...props}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></Icon>;
const paper = (props) => <Icon {...props}><path d="M5 3h11l3 3v15H5z"/><path d="M16 3v4h4M8 11h8M8 15h8M8 19h5"/></Icon>;
const bell = (props) => <Icon {...props}><path d="M6 9a6 6 0 0112 0c0 7 3 7 3 7H3s3 0 3-7"/><path d="M10 20h4"/></Icon>;
const play = (props) => <Icon {...props}><path d="M8 5l11 7-11 7z" fill={props.fill === 'currentColor' ? 'currentColor' : 'none'}/></Icon>;
const money = (props) => <Icon {...props}><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.6-1-3-1-1.7 0-3 .9-3 2s1 1.8 3.2 2.3c2.2.5 3.3 1.3 3.3 2.5s-1.3 2.2-3.3 2.2c-1.4 0-2.6-.4-3.5-1.2M12 5v14"/></Icon>;
const tv = (props) => <Icon {...props}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 3l4 3 4-3M8 22h8"/></Icon>;
const star = (props) => <Icon {...props}><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></Icon>;
const alert = (props) => <Icon {...props}><path d="M12 3L2 21h20L12 3z"/><path d="M12 9v5M12 18h.01"/></Icon>;
const chevronRight = (props) => <Icon {...props}><path d="M9 5l7 7-7 7"/></Icon>;
const chevronDown = (props) => <Icon {...props}><path d="M5 9l7 7 7-7"/></Icon>;
const arrowUp = (props) => <Icon {...props}><path d="M7 17L17 7M8 7h9v9"/></Icon>;
const arrowDown = (props) => <Icon {...props}><path d="M7 7l10 10M8 17h9V8"/></Icon>;
const menu = (props) => <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16"/></Icon>;
const x = (props) => <Icon {...props}><path d="M6 6l12 12M18 6L6 18"/></Icon>;
const check = (props) => <Icon {...props}><path d="M5 12l4 4L19 6"/></Icon>;
const plus = (props) => <Icon {...props}><path d="M12 5v14M5 12h14"/></Icon>;
const search = (props) => <Icon {...props}><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></Icon>;
const clock = (props) => <Icon {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></Icon>;
const building = (props) => <Icon {...props}><path d="M4 21V5h10v16M14 9h6v12M7 8h4M7 12h4M7 16h4M17 12h1M17 16h1"/></Icon>;
const film = (props) => <Icon {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/></Icon>;
const trophy = (props) => <Icon {...props}><path d="M8 4h8v5a4 4 0 01-8 0V4z"/><path d="M8 6H4v2c0 2 1.5 3 4 3M16 6h4v2c0 2-1.5 3-4 3M12 13v5M8 21h8M9 18h6"/></Icon>;
const target = (props) => <Icon {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></Icon>;
const activity = (props) => <Icon {...props}><path d="M3 12h4l2-6 4 12 2-6h6"/></Icon>;
const radio = (props) => <Icon {...props}><circle cx="12" cy="12" r="3"/><path d="M7.8 7.8a6 6 0 000 8.4M16.2 7.8a6 6 0 010 8.4M4.9 4.9a10 10 0 000 14.2M19.1 4.9a10 10 0 010 14.2"/></Icon>;

export const Activity = activity;
export const AlertTriangle = alert;
export const ArrowDownRight = arrowDown;
export const ArrowUpRight = arrowUp;
export const BarChart3 = chart;
export const Bell = bell;
export const BriefcaseBusiness = building;
export const Building2 = building;
export const CalendarDays = calendar;
export const Check = check;
export const ChevronDown = chevronDown;
export const ChevronRight = chevronRight;
export const CircleDollarSign = money;
export const Clapperboard = film;
export const Clock3 = clock;
export const DollarSign = money;
export const FileText = paper;
export const Film = film;
export const Gauge = target;
export const Handshake = handshake;
export const LayoutDashboard = grid;
export const Lightbulb = spark;
export const LineChart = line;
export const Megaphone = megaphone;
export const Menu = menu;
export const Newspaper = paper;
export const PackageCheck = check;
export const Play = play;
export const Plus = plus;
export const Radio = radio;
export const Search = search;
export const Settings2 = gear;
export const Sparkles = spark;
export const Star = star;
export const Target = target;
export const TrendingUp = line;
export const Trophy = trophy;
export const Tv = tv;
export const UserRoundSearch = people;
export const UsersRound = people;
export const WalletCards = money;
export const X = x;
