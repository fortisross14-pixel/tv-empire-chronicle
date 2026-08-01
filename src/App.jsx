import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
  Building2, CalendarDays, Check, ChevronRight, CircleDollarSign, Clapperboard, Clock3,
  Film, Gauge, Handshake, LayoutDashboard, Lightbulb, LineChart, Megaphone, Menu,
  Newspaper, Play, Plus, Radio, Search, Settings2, Sparkles, Star, Target, TrendingUp,
  Trophy, Tv, UserRoundSearch, UsersRound, WalletCards, X,
} from './icons';
import {
  NETWORK, categoryTree, dayparts, days, initialCommercial, initialCompetitors, initialInfrastructure,
  initialMarkets, initialNetwork, initialNews, initialOwnedRights, initialPeople, initialProjects,
  initialResearch, initialRights, initialSchedule, initialShows, navItems,
} from './data';

const STORAGE_KEY = 'tv-empire-chronicle-v2';

const iconMap = {
  home: LayoutDashboard,
  universe: Building2,
  coverage: Radio,
  programming: CalendarDays,
  development: Clapperboard,
  rights: Film,
  talent: UserRoundSearch,
  research: Lightbulb,
  ratings: BarChart3,
  commercial: Handshake,
  finance: LineChart,
  chronicle: Newspaper,
};

const choiceOptions = {
  music: ['Library package', 'Original theme', 'Original score', 'Premium orchestral score', 'Live house band'],
  vfx: ['None', 'Studio graphics', 'Practical only', 'Standard VFX', 'Premium VFX'],
  sets: ['Adapted existing set', 'Standing local sets', 'Signature contest set', 'Signature talk set', 'Premium standing sets', 'Extensive custom world'],
  locations: ['Studio only', 'Local locations', 'Multiple US locations', 'International locations'],
  wardrobe: ['Basic', 'Curated contemporary', 'Premium contemporary', 'Period wardrobe'],
  writing: ['In-house writer', 'Format team', 'Daily writers room', 'Experienced room', 'Prestige writers room'],
};

const choiceCosts = {
  music: { 'Library package': 0.00, 'Original theme': 0.015, 'Original score': 0.035, 'Premium orchestral score': 0.09, 'Live house band': 0.055 },
  vfx: { None: 0.00, 'Studio graphics': 0.018, 'Practical only': 0.025, 'Standard VFX': 0.09, 'Premium VFX': 0.24 },
  sets: { 'Adapted existing set': 0.008, 'Standing local sets': 0.035, 'Signature contest set': 0.08, 'Signature talk set': 0.07, 'Premium standing sets': 0.13, 'Extensive custom world': 0.27 },
  locations: { 'Studio only': 0.00, 'Local locations': 0.025, 'Multiple US locations': 0.095, 'International locations': 0.22 },
  wardrobe: { Basic: 0.004, 'Curated contemporary': 0.018, 'Premium contemporary': 0.055, 'Period wardrobe': 0.15 },
  writing: { 'In-house writer': 0.018, 'Format team': 0.028, 'Daily writers room': 0.022, 'Experienced room': 0.055, 'Prestige writers room': 0.125 },
};

const baseEpisodeCost = {
  Drama: 0.18,
  Comedy: 0.10,
  Contest: 0.085,
  Reality: 0.07,
  'News & Factual': 0.06,
  Talk: 0.045,
};

const rarityScore = { Common: 0, Uncommon: 2, Rare: 5, Epic: 8, Legend: 12, Generational: 16 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const classNames = (...items) => items.filter(Boolean).join(' ');
const money = (value, digits = 1) => `$${Number(value || 0).toFixed(digits)}M`;
const viewers = (value) => value >= 1 ? `${value.toFixed(2)}M` : `${Math.round(value * 1000)}K`;
const households = (value) => value >= 1 ? `${value.toFixed(value >= 10 ? 0 : 2)}M` : `${Math.round(value * 1000)}K`;
const randomBetween = (min, max) => min + Math.random() * (max - min);
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

function loadState() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveState(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Saving is optional; the game remains playable if storage is unavailable.
  }
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Rarity({ value }) {
  return <span className={`rarity rarity-${String(value).toLowerCase()}`}>{value}</span>;
}

function Trend({ value, compact = false }) {
  const positive = Number(value) >= 0;
  return (
    <span className={classNames('trend', positive ? 'positive' : 'negative', compact && 'compact')}>
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(Number(value || 0)).toFixed(compact ? 0 : 1)}%
    </span>
  );
}

function Progress({ value, label = null, detail = null }) {
  return (
    <div className="progress-wrap">
      {(label || detail) && <div className="progress-label"><span>{label}</span><strong>{detail || `${Math.round(value)}%`}</strong></div>}
      <div className="progress-track"><div className="progress-fill" style={{ width: `${clamp(value, 0, 100)}%` }} /></div>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose, wide = false, extraWide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={classNames('modal', wide && 'modal-wide', extraWide && 'modal-extra-wide')} onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose}><X size={18} /></button>
        <div className="modal-heading"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {children}
      </div>
    </div>
  );
}

function Toast({ value }) {
  if (!value) return null;
  return (
    <div className={`toast ${value.tone || 'success'}`}>
      {value.tone === 'warning' ? <AlertTriangle size={18} /> : <Check size={18} />}
      <div><strong>{value.title}</strong><span>{value.body}</span></div>
    </div>
  );
}

function ContentMark({ identity, size = 'normal' }) {
  const item = identity || { color: '#60758a', accent: '#c2ced8', shape: 'rounded', icon: 'TV' };
  return (
    <div className={`content-mark mark-${item.shape || 'rounded'} mark-${size}`} style={{ '--mark': item.color, '--accent': item.accent }}>
      <span>{item.icon || 'TV'}</span>
    </div>
  );
}

function Stars({ value }) {
  return <span className="stars" aria-label={`${value} out of 5`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={13} fill={star <= value ? 'currentColor' : 'none'} />)}</span>;
}

function KpiCard({ label, value, sub, icon: Icon, trend = undefined }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top"><span>{label}</span>{Icon && <Icon size={17} />}</div>
      <strong>{value}</strong>
      <div className="kpi-bottom"><span>{sub}</span>{trend !== undefined && <Trend value={trend} compact />}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, copy, actions = null }) {
  return (
    <div className="page-intro">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function Panel({ title, subtitle, action = null, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && <div className="panel-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
      {children}
    </section>
  );
}

function estimateBudget(concept) {
  const base = baseEpisodeCost[concept.category] || 0.1;
  const lines = Object.entries(concept.choices || {}).map(([key, value]) => ({ key, label: value, cost: choiceCosts[key]?.[value] || 0 }));
  const perEpisode = base + lines.reduce((sum, line) => sum + line.cost, 0);
  const development = 0.12 + (concept.episodes || 1) * ((choiceCosts.writing[concept.choices?.writing] || 0) * 0.65);
  return { base, lines, perEpisode, development, total: perEpisode * (concept.episodes || 1) + development };
}

function scriptDuration(concept) {
  const categoryBase = { Drama: 5, Comedy: 4, Contest: 3, Reality: 3, 'News & Factual': 3, Talk: 2 }[concept.category] || 3;
  const episodeFactor = Math.ceil((concept.episodes || 1) / 10);
  const writing = concept.choices?.writing === 'Prestige writers room' ? 2 : concept.choices?.writing === 'In-house writer' ? 0 : 1;
  return clamp(categoryBase + episodeFactor + writing, 2, 14);
}

function isContinuousConcept(category, subtype, cadence) {
  return category === 'Talk' || subtype === 'Daily local news' || subtype === 'Sports news' || cadence === 'Daily' || cadence === 'Weekdays';
}

function requiredRoles(category, subtype) {
  if (category === 'Drama' || category === 'Comedy') return { primary: ['Lead actor', 'Second lead'], secondary: ['Supporting cast', 'Recurring roles'] };
  if (category === 'Contest') return { primary: ['Host'], secondary: ['Announcer / voice-over', 'Contestants'] };
  if (category === 'Reality') return { primary: subtype.includes('Love') ? ['Host / narrator'] : ['Host'], secondary: ['Participants', 'Voice-over'] };
  if (category === 'News & Factual') {
    if (subtype === 'Nature documentary' || subtype.includes('documentary')) return { primary: ['Narrator / presenter'], secondary: ['Experts', 'Field contributors'] };
    return { primary: ['Anchor / presenter'], secondary: ['Correspondents', 'Analysts'] };
  }
  return { primary: ['Host'], secondary: ['Sidekick / contributors', 'Guests'] };
}

function recommendedSetup(category, subtype) {
  if (subtype === 'Historical / medieval') return { music: 'Premium orchestral score', vfx: 'Standard VFX', sets: 'Extensive custom world', wardrobe: 'Period wardrobe' };
  if (subtype === 'Science fiction') return { music: 'Original score', vfx: 'Premium VFX', sets: 'Premium standing sets', wardrobe: 'Premium contemporary' };
  if (category === 'Contest') return { music: 'Original theme', vfx: 'Studio graphics', sets: 'Signature contest set', wardrobe: 'Curated contemporary' };
  if (category === 'Talk') return { music: subtype.includes('Late') ? 'Live house band' : 'Original theme', vfx: 'Studio graphics', sets: 'Signature talk set', wardrobe: 'Curated contemporary' };
  if (subtype === 'Nature documentary') return { music: 'Original score', vfx: 'None', sets: 'Adapted existing set', wardrobe: 'Basic' };
  if (category === 'Reality') return { music: 'Library package', vfx: 'Studio graphics', sets: 'Adapted existing set', wardrobe: 'Curated contemporary' };
  return { music: 'Original score', vfx: 'Practical only', sets: 'Standing local sets', wardrobe: 'Curated contemporary' };
}

function roleSkillFor(project) {
  if (project.category === 'Drama' || project.category === 'Comedy') return 'Acting';
  if (project.category === 'News & Factual' && !project.subtype.includes('documentary')) return 'Journalism';
  return 'Hosting';
}

function specialtyNeed(project, personRole = 'lead') {
  if (personRole === 'producer') return `${project.category} producer`;
  if (personRole === 'director') return project.category === 'Comedy' ? 'Comedy director' : project.category === 'Drama' ? 'Drama director' : 'Live director';
  if (project.category === 'Drama') return project.subtype.includes('Young') ? 'Young adult lead' : project.subtype.includes('Historical') ? 'Historical lead' : 'Drama lead';
  if (project.category === 'Comedy') return 'Comedy lead';
  if (project.category === 'Contest') return 'Contest host';
  if (project.category === 'Reality') return 'Reality host';
  if (project.subtype === 'Nature documentary') return 'Documentary voice-over';
  if (project.category === 'News & Factual') return 'Local news anchor';
  if (project.category === 'Talk') return project.subtype.includes('Morning') ? 'Morning host' : project.subtype.includes('Late') ? 'Late-night host' : 'Show host';
  return 'Show host';
}

function fitScore(person, project, role = 'lead') {
  if (!person || !project) return 0;
  const skill = role === 'producer' ? 'Producing' : role === 'director' ? 'Directing' : roleSkillFor(project);
  const base = person.skills?.[skill] || 20;
  const specialty = person.specialties?.[specialtyNeed(project, role)] || 35;
  const styleFit = (person.style || []).some((tag) => project.tone?.toLowerCase().includes(tag.toLowerCase())) ? 6 : 0;
  return clamp(Math.round(base * 0.58 + specialty * 0.34 + (person.reliability || 60) * 0.08 + styleFit), 1, 100);
}

export default function App() {
  const saved = useMemo(() => loadState(), []);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [network, setNetwork] = useState(saved?.network || initialNetwork);
  const [markets, setMarkets] = useState(saved?.markets || initialMarkets);
  const [infrastructure, setInfrastructure] = useState(saved?.infrastructure || initialInfrastructure);
  const [competitors, setCompetitors] = useState(saved?.competitors || initialCompetitors);
  const [shows, setShows] = useState(saved?.shows || initialShows);
  const [schedule, setSchedule] = useState(saved?.schedule || initialSchedule);
  const [people, setPeople] = useState(saved?.people || initialPeople);
  const [projects, setProjects] = useState(saved?.projects || initialProjects);
  const [rights, setRights] = useState(saved?.rights || initialRights);
  const [ownedRights, setOwnedRights] = useState(saved?.ownedRights || initialOwnedRights);
  const [research, setResearch] = useState(saved?.research || initialResearch);
  const [researchWork, setResearchWork] = useState(saved?.researchWork || { id: null, progress: 0 });
  const [expansions, setExpansions] = useState(saved?.expansions || []);
  const [commercial, setCommercial] = useState(saved?.commercial || initialCommercial);
  const [news, setNews] = useState(saved?.news || initialNews);
  const [toast, setToast] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [projectModal, setProjectModal] = useState(null);
  const [productionProject, setProductionProject] = useState(null);
  const [marketModal, setMarketModal] = useState(null);
  const [scheduleCell, setScheduleCell] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(people[0]?.id || null);
  const [talentSearch, setTalentSearch] = useState('');
  const [talentFilter, setTalentFilter] = useState('All');
  const [rightsFilter, setRightsFilter] = useState('All');
  const [selectedRanking, setSelectedRanking] = useState('MTD');
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [dragPayload, setDragPayload] = useState(null);

  const initialConcept = {
    title: '', category: 'Drama', subtype: 'Police procedural', cadence: 'Weekly', episodes: 10, duration: 60,
    structure: 'Each episode tells an individual story', closure: 'Mostly closed with a continuing character arc', tone: 'Grounded',
    audience: 'Adults 25–54', writerId: 'p5',
    choices: { music: 'Original theme', vfx: 'Practical only', sets: 'Standing local sets', locations: 'Local locations', wardrobe: 'Curated contemporary', writing: 'Experienced room' },
    identity: { color: '#496f8c', accent: '#a7c1d3', shape: 'rounded', icon: 'NEW' },
  };
  const [concept, setConcept] = useState(initialConcept);
  const [productionForm, setProductionForm] = useState({ producerId: 'p1', directorId: 'p6', leadId: 'p4', supportingId: '', promote: 'Standard launch' });
  const [campaignForm, setCampaignForm] = useState({ showId: 'second-chances', objective: 'Tune-in', spend: 0.18, weeks: 3 });

  const completedResearch = useMemo(() => new Set(research.filter((item) => item.status === 'Complete').map((item) => item.id)), [research]);
  const contentById = useMemo(() => {
    const map = {};
    shows.forEach((show) => { map[show.id] = { ...show, contentKind: 'show' }; });
    projects.forEach((project) => {
      if (['Ready', 'On air'].includes(project.stage) || (project.stage === 'Production' && project.production?.continuous)) {
        map[project.id] = {
          ...project,
          quality: project.script ? project.script.quality * 18 + 8 : 62,
          buzz: project.stage === 'On air' ? 58 : 43,
          viewers: 0.06,
          share: 7,
          trend: 0,
          cost: project.estimatedEpisodeCost,
          revenue: project.estimatedEpisodeCost * 1.1,
          target: project.audience,
          lead: people.find((person) => person.id === project.production?.leadId)?.name || 'To be announced',
          contentKind: 'project',
        };
      }
    });
    ownedRights.filter((right) => right.type !== 'Format').forEach((right) => {
      map[right.id] = { ...right, category: right.type, subtype: right.subtype, status: 'Rights package', buzz: 52, critic: 60, audience: 72, lead: right.territory, contentKind: 'right' };
    });
    return map;
  }, [shows, projects, ownedRights, people]);

  const availableContent = useMemo(() => Object.values(contentById), [contentById]);
  const scheduledIds = useMemo(() => new Set(days.flatMap((day) => dayparts.map((part) => schedule[day]?.[part]).filter(Boolean))), [schedule]);
  const activeMarkets = markets.filter((market) => market.status === 'Active');
  const totalReach = activeMarkets.reduce((sum, market) => sum + market.households * market.coverage / 100, 0);
  const payroll = people.filter((person) => person.status === 'Employee' || person.status === 'Contracted').reduce((sum, person) => sum + (person.salary || 0), 0) / 13;
  const rightsWeekly = ownedRights.reduce((sum, right) => sum + (right.weekly || 0), 0);
  const facilityWeekly = infrastructure.reduce((sum, asset) => sum + asset.level * 0.012, 0);
  const expansionWeekly = expansions.reduce((sum, expansion) => sum + expansion.weekly, 0);
  const campaignWeekly = commercial.campaigns.reduce((sum, campaign) => sum + campaign.spend / Math.max(campaign.weeks, 1), 0);
  const showRevenue = shows.reduce((sum, show) => sum + show.revenue, 0);
  const showCost = shows.reduce((sum, show) => sum + show.cost, 0);
  const dealRevenue = commercial.deals.reduce((sum, deal) => sum + deal.value / Math.max(deal.weeks, 1), 0);
  const weeklyRevenue = showRevenue + dealRevenue;
  const weeklyCost = showCost + payroll + rightsWeekly + facilityWeekly + expansionWeekly + campaignWeekly + 0.12;
  const weeklyProfit = weeklyRevenue - weeklyCost;

  const persist = (overrides = {}) => {
    saveState({
      network, markets, infrastructure, competitors, shows, schedule, people, projects, rights, ownedRights,
      research, researchWork, expansions, commercial, news,
      ...overrides,
    });
  };

  const notify = (title, body, tone = 'success') => {
    setToast({ title, body, tone });
    window.setTimeout(() => setToast(null), 3800);
  };

  const updateConcept = (key, value) => {
    setConcept((current) => {
      const next = { ...current, [key]: value };
      if (key === 'category') {
        const first = categoryTree[value].find((item) => !item.research || completedResearch.has(item.research)) || categoryTree[value][0];
        next.subtype = first.name;
      }
      return next;
    });
  };

  const updateChoice = (key, value) => setConcept((current) => ({ ...current, choices: { ...current.choices, [key]: value } }));

  const generateScript = (project, currentPeople = people) => {
    const writer = currentPeople.find((person) => person.id === project.writerId);
    const writingSkill = writer?.skills?.Writing || 55;
    const specialty = writer?.specialties?.[project.category === 'Comedy' ? 'Comedy writer' : project.category === 'Drama' ? 'Drama writer' : 'Format writer'] || 50;
    const roomBonus = { 'In-house writer': -3, 'Format team': 2, 'Daily writers room': 0, 'Experienced room': 6, 'Prestige writers room': 10 }[project.choices?.writing] || 0;
    const formatBonus = ownedRights.some((right) => right.type === 'Format' && project.category === 'Contest') ? 5 : 0;
    const score = writingSkill * 0.47 + specialty * 0.28 + (writer?.reliability || 70) * 0.12 + roomBonus + formatBonus + randomBetween(-8, 8);
    const quality = clamp(Math.round((score - 35) / 12), 1, 5);
    const roles = requiredRoles(project.category, project.subtype);
    const recommended = recommendedSetup(project.category, project.subtype);
    const strengthPool = [
      project.structure.includes('individual') ? 'Clear episode engine' : 'Strong serialized momentum',
      project.closure.includes('cliff') ? 'Powerful cliffhanger design' : 'Satisfying episode closure',
      quality >= 4 ? 'Distinctive central characters' : 'Commercially clear premise',
      project.category === 'Contest' ? 'Easy-to-understand rules' : project.category === 'Talk' ? 'Repeatable segment structure' : 'Strong audience promise',
    ];
    const riskPool = [
      project.episodes > 18 ? 'Later episodes may repeat ideas' : 'Pilot pacing requires care',
      project.choices.vfx === 'Premium VFX' ? 'Effects workload could delay delivery' : 'Visual identity depends on execution',
      quality <= 2 ? 'Dialogue and character motivations need revision' : 'Casting fit will materially affect quality',
    ];
    return { quality, primaryRoles: roles.primary, secondaryRoles: roles.secondary, recommended, strengths: strengthPool.slice(0, 3), risks: riskPool.slice(0, quality >= 4 ? 1 : 2) };
  };

  const createProject = () => {
    if (!concept.title.trim()) {
      notify('Project needs a title', 'Name the concept before opening a writers room.', 'warning');
      return;
    }
    const subtypeInfo = categoryTree[concept.category].find((item) => item.name === concept.subtype);
    if (subtypeInfo?.research && !completedResearch.has(subtypeInfo.research)) {
      notify('Format is not researched', 'Complete the required capability before commissioning this project.', 'warning');
      return;
    }
    const estimate = estimateBudget(concept);
    const deposit = estimate.development;
    if (network.cash < deposit) {
      notify('Insufficient cash', `Development requires ${money(deposit, 2)} to open the writers room.`, 'warning');
      return;
    }
    const weeks = scriptDuration(concept);
    const project = {
      id: uid('project'), ...concept, title: concept.title.trim(), stage: 'Writing', weeksRemaining: weeks, progress: 0,
      estimatedEpisodeCost: estimate.perEpisode, script: null, production: null,
      note: `${concept.subtype} for ${concept.audience.toLowerCase()}, designed as ${concept.structure.toLowerCase()}.`,
    };
    const nextProjects = [project, ...projects];
    const nextNetwork = { ...network, cash: network.cash - deposit };
    setProjects(nextProjects);
    setNetwork(nextNetwork);
    setCreateOpen(false);
    setConcept(initialConcept);
    persist({ projects: nextProjects, network: nextNetwork });
    notify('Project commissioned', `${project.title} enters script development. Expected first draft in ${weeks} weeks.`);
  };

  const beginProduction = () => {
    const project = projects.find((item) => item.id === productionProject);
    if (!project || !project.script) return;
    const producer = people.find((person) => person.id === productionForm.producerId);
    const director = people.find((person) => person.id === productionForm.directorId);
    const lead = people.find((person) => person.id === productionForm.leadId);
    const continuous = isContinuousConcept(project.category, project.subtype, project.cadence);
    const facilityLevel = infrastructure.find((asset) => asset.id === 'studio-a')?.level || 1;
    const productionWeeks = continuous ? clamp(4 - facilityLevel, 1, 3) : clamp(Math.ceil(project.episodes / 3) + (project.category === 'Drama' ? 4 : 2) - facilityLevel, 3, 24);
    const talentFees = [producer, director, lead].filter((person) => person?.status === 'Market').reduce((sum, person) => sum + (person.fee || 0), 0);
    const productionCost = project.estimatedEpisodeCost * project.episodes + talentFees + (productionForm.promote === 'Premium launch' ? 0.7 : productionForm.promote === 'Quiet launch' ? 0 : 0.25);
    const deposit = productionCost * 0.25;
    if (network.cash < deposit) {
      notify('Production cannot be funded', `A ${money(deposit, 2)} production deposit is required.`, 'warning');
      return;
    }
    const nextPeople = people.map((person) => {
      if ([producer?.id, director?.id, lead?.id].includes(person.id) && person.status === 'Market') {
        return { ...person, status: 'Contracted', salary: (person.fee || 0) / Math.max(project.episodes, 6), availability: project.title };
      }
      return person;
    });
    const nextProjects = projects.map((item) => item.id === project.id ? {
      ...item, stage: 'Production', weeksRemaining: productionWeeks, progress: 0,
      production: { ...productionForm, supportingIds: productionForm.supportingId ? [productionForm.supportingId] : [], cost: productionCost, weeks: productionWeeks, continuous },
    } : item);
    const nextNetwork = { ...network, cash: network.cash - deposit };
    setProjects(nextProjects);
    setPeople(nextPeople);
    setNetwork(nextNetwork);
    setProductionProject(null);
    persist({ projects: nextProjects, people: nextPeople, network: nextNetwork });
    notify('Production authorized', continuous ? `${project.title} can be placed in next week’s schedule while its permanent workflow is completed.` : `${project.title} begins a ${productionWeeks}-week production.`);
  };

  const buyRight = (rightId) => {
    const right = rights.find((item) => item.id === rightId);
    if (!right || right.status !== 'Available') return;
    if (right.requirement && !completedResearch.has(right.requirement)) {
      notify('Capability missing', 'Research the required rights or production organization before bidding.', 'warning');
      return;
    }
    const competitionPremium = 1 + Math.max(0, right.bids - 1) * 0.045;
    const price = right.upfront * competitionPremium;
    if (network.cash < price) {
      notify('Bid exceeds available cash', `Winning this package is expected to require ${money(price, 2)}.`, 'warning');
      return;
    }
    const owned = {
      ...right, id: `owned-${right.id}`, sourceRightId: right.id, status: 'Owned', termWeeks: right.term.includes('season') ? parseInt(right.term, 10) * 52 : parseInt(right.term, 10) * 52,
      remaining: right.events, quality: 64 + right.demand * 0.12, viewers: totalReach * (0.035 + right.demand / 3000), share: 8 + right.demand / 9,
      cost: right.weekly + (right.type === 'Sports' ? 0.05 : 0.015), revenue: right.weekly * 1.25 + right.demand * 0.0015,
      trend: 0, target: right.type === 'Sports' ? 'Adults 18–54' : 'Broad audience',
    };
    const nextRights = rights.map((item) => item.id === rightId ? { ...item, status: 'Won by Northstar' } : item);
    const nextOwned = [owned, ...ownedRights];
    const nextNetwork = { ...network, cash: network.cash - price, reputation: clamp(network.reputation + right.demand / 30, 0, 100) };
    setRights(nextRights);
    setOwnedRights(nextOwned);
    setNetwork(nextNetwork);
    persist({ rights: nextRights, ownedRights: nextOwned, network: nextNetwork });
    notify('Rights acquired', `${right.title} joins Northstar’s portfolio for ${money(price, 2)}.`);
  };

  const startExpansion = (market, option) => {
    if (option.requirement && !completedResearch.has(option.requirement)) {
      notify('Distribution capability missing', 'Complete the required research before entering this market through that route.', 'warning');
      return;
    }
    if (network.cash < option.cost) {
      notify('Expansion is not funded', `${option.label} requires ${money(option.cost)} up front.`, 'warning');
      return;
    }
    const nextExpansions = [...expansions, { id: uid('expansion'), marketId: market.id, optionId: option.id, label: option.label, method: option.method, coverage: option.coverage, reach: option.reach, weekly: option.weekly, weeksRemaining: option.weeks, totalWeeks: option.weeks }];
    const nextMarkets = markets.map((item) => item.id === market.id ? { ...item, status: 'Expanding', method: option.method } : item);
    const nextNetwork = { ...network, cash: network.cash - option.cost };
    setExpansions(nextExpansions);
    setMarkets(nextMarkets);
    setNetwork(nextNetwork);
    setMarketModal(null);
    persist({ expansions: nextExpansions, markets: nextMarkets, network: nextNetwork });
    notify('Market entry approved', `${option.label} will be operational in ${option.weeks} weeks.`);
  };

  const startResearch = (item) => {
    if (researchWork.id) {
      notify('Research team is occupied', 'Complete or cancel the current program before starting another.', 'warning');
      return;
    }
    if (item.status === 'Locked' || (item.prerequisite && !completedResearch.has(item.prerequisite))) {
      notify('Research is locked', 'Complete the prerequisite capability first.', 'warning');
      return;
    }
    if (network.cash < item.cash) {
      notify('Insufficient research budget', `This program requires ${money(item.cash, 1)} in setup funding.`, 'warning');
      return;
    }
    const nextWork = { id: item.id, progress: 0 };
    const nextResearch = research.map((entry) => entry.id === item.id ? { ...entry, status: 'Active' } : entry);
    const nextNetwork = { ...network, cash: network.cash - item.cash };
    setResearchWork(nextWork);
    setResearch(nextResearch);
    setNetwork(nextNetwork);
    persist({ researchWork: nextWork, research: nextResearch, network: nextNetwork });
    notify('Research started', `${item.name} now receives ${network.weeklyResearch} capability points each week.`);
  };

  const upgradeFacility = (assetId) => {
    const asset = infrastructure.find((item) => item.id === assetId);
    if (!asset || asset.level >= asset.max) return;
    const cost = asset.upgradeCost * (1 + (asset.level - 1) * 0.5);
    if (network.cash < cost) {
      notify('Upgrade is not funded', `${asset.name} requires ${money(cost, 1)}.`, 'warning');
      return;
    }
    const nextInfrastructure = infrastructure.map((item) => item.id === assetId ? { ...item, level: item.level + 1, condition: 100, upgradeCost: item.upgradeCost * 1.32 } : item);
    const nextNetwork = { ...network, cash: network.cash - cost, weeklyResearch: network.weeklyResearch + (assetId === 'post' || assetId === 'studio-a' ? 1 : 0) };
    setInfrastructure(nextInfrastructure);
    setNetwork(nextNetwork);
    persist({ infrastructure: nextInfrastructure, network: nextNetwork });
    notify('Facility upgraded', `${asset.name} is now level ${asset.level + 1}.`);
  };

  const hirePerson = (personId) => {
    const person = people.find((item) => item.id === personId);
    if (!person || person.status !== 'Market') return;
    const signing = (person.fee || 0) * 0.35;
    if (network.cash < signing) {
      notify('Offer cannot be funded', `A competitive signing payment is approximately ${money(signing, 2)}.`, 'warning');
      return;
    }
    const nextPeople = people.map((item) => item.id === personId ? { ...item, status: 'Contracted', salary: (item.fee || 0) / 8, availability: 'Northstar development deal' } : item);
    const nextNetwork = { ...network, cash: network.cash - signing, reputation: clamp(network.reputation + (rarityScore[person.rarity] || 0) * 0.4, 0, 100) };
    setPeople(nextPeople);
    setNetwork(nextNetwork);
    persist({ people: nextPeople, network: nextNetwork });
    notify('Talent signed', `${person.name} accepts a Northstar development agreement.`);
  };

  const assignCell = (contentId) => {
    if (!scheduleCell) return;
    const nextSchedule = { ...schedule, [scheduleCell.day]: { ...schedule[scheduleCell.day], [scheduleCell.part]: contentId } };
    setSchedule(nextSchedule);
    setScheduleCell(null);
    persist({ schedule: nextSchedule });
  };

  const removeCell = (day, part) => {
    const nextSchedule = { ...schedule, [day]: { ...schedule[day], [part]: null } };
    setSchedule(nextSchedule);
    persist({ schedule: nextSchedule });
  };

  const handleDrop = (event, day, part) => {
    event.preventDefault();
    let payload = dragPayload;
    try {
      payload = payload || JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch {
      payload = dragPayload;
    }
    if (!payload?.contentId) return;
    const nextSchedule = { ...schedule, [day]: { ...schedule[day], [part]: payload.contentId } };
    if (payload.day && payload.part && (payload.day !== day || payload.part !== part)) {
      nextSchedule[payload.day] = { ...nextSchedule[payload.day], [payload.part]: null };
    }
    setSchedule(nextSchedule);
    setDragPayload(null);
    persist({ schedule: nextSchedule });
  };

  const launchCampaign = () => {
    if (network.cash < Number(campaignForm.spend)) {
      notify('Campaign is not funded', 'Reduce the campaign budget or improve liquidity.', 'warning');
      return;
    }
    const content = contentById[campaignForm.showId];
    if (!content) return;
    const campaign = {
      id: uid('campaign'), name: `${content.title} — ${campaignForm.objective}`, showId: campaignForm.showId,
      objective: campaignForm.objective, spend: Number(campaignForm.spend), weeks: Number(campaignForm.weeks),
      lift: clamp(Math.round(Number(campaignForm.spend) * 22 + randomBetween(1, 4)), 2, 12), status: 'Live',
    };
    const nextCommercial = { ...commercial, campaigns: [campaign, ...commercial.campaigns] };
    const nextNetwork = { ...network, cash: network.cash - campaign.spend };
    setCommercial(nextCommercial);
    setNetwork(nextNetwork);
    setCampaignOpen(false);
    persist({ commercial: nextCommercial, network: nextNetwork });
    notify('Campaign launched', `${campaign.name} will run for ${campaign.weeks} weeks.`);
  };

  const buildShowFromProject = (project) => {
    const producer = people.find((person) => person.id === project.production?.producerId);
    const director = people.find((person) => person.id === project.production?.directorId);
    const lead = people.find((person) => person.id === project.production?.leadId);
    const talentFit = [fitScore(producer, project, 'producer'), fitScore(director, project, 'director'), fitScore(lead, project, 'lead')].reduce((sum, value) => sum + value, 0) / 3;
    const recommendationFit = Object.entries(project.script?.recommended || {}).reduce((sum, [key, value]) => sum + (project.choices?.[key] === value ? 1 : 0), 0);
    const quality = clamp(Math.round((project.script?.quality || 3) * 13 + talentFit * 0.35 + recommendationFit * 3 + randomBetween(-5, 5)), 45, 96);
    const launch = project.production?.promote === 'Premium launch' ? 12 : project.production?.promote === 'Quiet launch' ? -3 : 5;
    return {
      id: project.id, title: project.title, source: 'Original', category: project.category, subtype: project.subtype, status: 'On air',
      cadence: project.cadence, duration: project.duration, episodes: project.episodes, quality, buzz: clamp(44 + launch + network.reputation * 0.18, 25, 90),
      viewers: Math.max(0.025, totalReach * (0.055 + quality / 1800)), share: clamp(5 + quality / 7, 4, 28), critic: clamp(quality + randomBetween(-8, 8), 35, 98),
      audience: clamp(quality + randomBetween(-3, 12), 40, 98), cost: project.estimatedEpisodeCost, revenue: project.estimatedEpisodeCost * 1.12,
      trend: 0, target: project.audience, lead: lead?.name || 'Ensemble', identity: project.identity, notes: project.note,
      specialties: [project.category, project.subtype, project.tone],
    };
  };

  const simulateWeeks = async (count) => {
    if (simulating) return;
    setSimulating(true);
    await new Promise((resolve) => window.setTimeout(resolve, 280));

    let nextNetwork = { ...network };
    let nextMarkets = markets.map((item) => ({ ...item }));
    let nextInfrastructure = infrastructure.map((item) => ({ ...item }));
    let nextCompetitors = competitors.map((item) => ({ ...item }));
    let nextShows = shows.map((item) => ({ ...item }));
    let nextProjects = projects.map((item) => ({ ...item, choices: { ...item.choices }, production: item.production ? { ...item.production } : null }));
    let nextRights = rights.map((item) => ({ ...item }));
    let nextOwned = ownedRights.map((item) => ({ ...item }));
    let nextResearch = research.map((item) => ({ ...item }));
    let nextResearchWork = { ...researchWork };
    let nextExpansions = expansions.map((item) => ({ ...item }));
    let nextPeople = people.map((item) => ({ ...item, skills: { ...item.skills }, specialties: { ...item.specialties }, xp: { ...item.xp } }));
    let nextCommercial = { ...commercial, deals: commercial.deals.map((item) => ({ ...item })), campaigns: commercial.campaigns.map((item) => ({ ...item })) };
    let nextNews = [...news];

    for (let step = 0; step < count; step += 1) {
      nextNetwork.week += 1;
      if (nextNetwork.week > 52) {
        nextNetwork.week = 1;
        nextNetwork.year += 1;
      }

      /** @type {any[]} */
      const completedThisWeek = [];
      nextProjects = nextProjects.map((project) => {
        if (project.stage === 'Writing') {
          const weeksRemaining = Math.max(0, project.weeksRemaining - 1);
          const totalWeeks = Math.max(1, scriptDuration(project));
          const progress = clamp(100 - weeksRemaining / totalWeeks * 100, 0, 100);
          if (weeksRemaining === 0) {
            const script = generateScript(project, nextPeople);
            completedThisWeek.push({ type: 'script', title: project.title, quality: script.quality });
            return { ...project, stage: 'Script Ready', weeksRemaining: 0, progress: 100, script };
          }
          return { ...project, weeksRemaining, progress };
        }
        if (project.stage === 'Production') {
          const weeksRemaining = Math.max(0, project.weeksRemaining - 1);
          const totalWeeks = project.production?.weeks || 1;
          const progress = clamp(100 - weeksRemaining / totalWeeks * 100, 0, 100);
          if (weeksRemaining === 0) {
            completedThisWeek.push({ type: 'production', title: project.title });
            const assignment = [
              { id: project.production?.producerId, skill: 'Producing', specialty: `${project.category} producer` },
              { id: project.production?.directorId, skill: 'Directing', specialty: project.category === 'Comedy' ? 'Comedy director' : project.category === 'Drama' ? 'Drama director' : 'Live director' },
              { id: project.production?.leadId, skill: roleSkillFor(project), specialty: specialtyNeed(project, 'lead') },
            ];
            nextPeople = nextPeople.map((person) => {
              const use = assignment.find((entry) => entry.id === person.id);
              if (!use) return person;
              const currentXp = person.xp?.[use.skill] || 0;
              const gain = 35 + project.episodes * 2;
              const levelGain = Math.floor((currentXp + gain) / 500) - Math.floor(currentXp / 500);
              return {
                ...person,
                xp: { ...person.xp, [use.skill]: currentXp + gain },
                skills: { ...person.skills, [use.skill]: clamp((person.skills?.[use.skill] || 40) + levelGain, 1, 99) },
                specialties: { ...person.specialties, [use.specialty]: clamp((person.specialties?.[use.specialty] || 40) + 2 + levelGain, 1, 99) },
              };
            });
            return { ...project, stage: nextShows.some((show) => show.id === project.id) ? 'On air' : 'Ready', weeksRemaining: 0, progress: 100 };
          }
          return { ...project, weeksRemaining, progress };
        }
        return project;
      });

      const scheduledNow = new Set(days.flatMap((day) => dayparts.map((part) => schedule[day]?.[part]).filter(Boolean)));
      nextProjects = nextProjects.map((project) => {
        const canLaunch = project.stage === 'Ready' || (project.stage === 'Production' && project.production?.continuous);
        if (canLaunch && scheduledNow.has(project.id) && !nextShows.some((show) => show.id === project.id)) {
          nextShows.push(buildShowFromProject(project));
          completedThisWeek.push({ type: 'premiere', title: project.title });
          return project.stage === 'Production' && project.production?.continuous ? project : { ...project, stage: 'On air' };
        }
        return project;
      });

      nextExpansions = nextExpansions.map((expansion) => ({ ...expansion, weeksRemaining: expansion.weeksRemaining - 1 }));
      const finishedExpansions = nextExpansions.filter((expansion) => expansion.weeksRemaining <= 0);
      finishedExpansions.forEach((expansion) => {
        nextMarkets = nextMarkets.map((market) => market.id === expansion.marketId ? {
          ...market, status: 'Active', method: expansion.method, coverage: expansion.coverage,
          awareness: clamp(18 + nextNetwork.reputation * 0.25, 10, 60), share: clamp(3 + nextNetwork.reputation / 14, 2, 14),
        } : market);
        completedThisWeek.push({ type: 'expansion', title: nextMarkets.find((market) => market.id === expansion.marketId)?.name || 'New market' });
      });
      nextExpansions = nextExpansions.filter((expansion) => expansion.weeksRemaining > 0);

      if (nextResearchWork.id) {
        const researchItem = nextResearch.find((item) => item.id === nextResearchWork.id);
        const progress = nextResearchWork.progress + nextNetwork.weeklyResearch;
        if (researchItem && progress >= researchItem.cost) {
          nextResearch = nextResearch.map((item) => {
            if (item.id === researchItem.id) return { ...item, status: 'Complete' };
            if (item.status === 'Locked' && item.prerequisite === researchItem.id) return { ...item, status: 'Available' };
            return item;
          });
          nextMarkets = nextMarkets.map((market) => market.status === 'Locked' && market.unlock === researchItem.id ? { ...market, status: 'Available' } : market);
          completedThisWeek.push({ type: 'research', title: researchItem.name });
          nextResearchWork = { id: null, progress: 0 };
        } else {
          nextResearchWork = { ...nextResearchWork, progress };
        }
      }

      nextRights = nextRights.map((right) => right.status === 'Available' ? { ...right, deadline: Math.max(0, right.deadline - 1), status: right.deadline <= 1 ? 'Sold to competitor' : right.status } : right);
      nextOwned = nextOwned.map((right) => ({ ...right, termWeeks: Math.max(0, (right.termWeeks || 52) - 1) })).filter((right) => right.termWeeks > 0);
      nextInfrastructure = nextInfrastructure.map((asset) => ({ ...asset, condition: clamp(asset.condition - randomBetween(0.1, 0.55), 20, 100) }));

      nextCommercial.campaigns = nextCommercial.campaigns.map((campaign) => ({ ...campaign, weeks: campaign.weeks - 1 })).filter((campaign) => campaign.weeks > 0);
      const campaignLift = nextCommercial.campaigns.reduce((map, campaign) => ({ ...map, [campaign.showId]: (map[campaign.showId] || 0) + campaign.lift }), {});
      const currentReach = nextMarkets.filter((market) => market.status === 'Active').reduce((sum, market) => sum + market.households * market.coverage / 100, 0);
      const scheduleCounts = {};
      days.forEach((day) => dayparts.forEach((part) => {
        const id = schedule[day]?.[part];
        if (id) scheduleCounts[id] = (scheduleCounts[id] || 0) + (part === 'Prime Time' ? 1.4 : part === 'Evening' ? 1.15 : 0.8);
      }));

      const specializationGain = {
        'Local News': (scheduleCounts['local-news'] || 0) * 1.1,
        'Affordable Comedy': nextShows.filter((show) => show.category === 'Comedy').reduce((sum, show) => sum + (scheduleCounts[show.id] || 0), 0) * 0.8,
        'Live Production': [...nextShows, ...nextOwned].filter((content) => content.category === 'Talk' || content.category === 'News & Factual' || content.type === 'Sports').reduce((sum, content) => sum + (scheduleCounts[content.id] || 0), 0) * 0.45,
        'Regional Sports': nextOwned.filter((content) => content.type === 'Sports').reduce((sum, content) => sum + (scheduleCounts[content.id] || 0), 0) * 0.9,
      };
      nextNetwork.specializations = nextNetwork.specializations.map((specialization) => {
        const combined = specialization.xp + (specializationGain[specialization.name] || 0);
        return { ...specialization, level: specialization.level + Math.floor(combined / 100), xp: combined % 100 };
      });

      nextShows = nextShows.map((show) => {
        const exposure = scheduleCounts[show.id] || 0;
        const specializationName = show.category === 'Comedy' ? 'Affordable Comedy' : show.category === 'Talk' ? 'Live Production' : show.category === 'News & Factual' ? 'Local News' : null;
        const specializationLevel = nextNetwork.specializations.find((item) => item.name === specializationName)?.level || 0;
        const fundamentals = (show.quality - 65) * 0.035 + (show.buzz - 50) * 0.015 + specializationLevel * 0.13;
        const marketing = campaignLift[show.id] || 0;
        const saturation = exposure > 6 ? -(exposure - 6) * 0.4 : 0;
        const growth = fundamentals + marketing * 0.14 + saturation + randomBetween(-3.2, 3.2);
        const trend = clamp(growth, -22, 25);
        const viewerBase = currentReach * clamp(0.035 + show.quality / 1750 + show.buzz / 3500, 0.035, 0.16);
        const viewersValue = exposure > 0 ? Math.max(0.015, viewerBase * (0.82 + exposure / 8) * (1 + trend / 100)) : Math.max(0.008, show.viewers * 0.82);
        const buzz = clamp(show.buzz + trend * 0.22 + marketing * 0.3 + randomBetween(-1.2, 1.2), 15, 98);
        const revenue = viewersValue * (show.target?.includes('18') ? 1.18 : 1.03) + show.share * 0.003;
        return { ...show, viewers: viewersValue, trend, buzz, share: clamp(viewersValue / Math.max(currentReach, 0.1) * 100 * 1.6, 1.5, 32), revenue: Math.max(0.03, revenue) };
      });

      nextOwned = nextOwned.map((right) => {
        if (right.type === 'Format') return right;
        const exposure = scheduleCounts[right.id] || 0;
        const trend = exposure > 0 ? randomBetween(-4, 8) + right.demand * 0.015 : -6;
        const viewersValue = exposure > 0 ? Math.max(0.02, currentReach * (0.04 + right.demand / 1800) * (0.75 + exposure / 8)) : Math.max(0.01, (right.viewers || 0.05) * 0.8);
        return { ...right, trend, viewers: viewersValue, share: clamp(viewersValue / Math.max(currentReach, 0.1) * 140, 2, 30), revenue: Math.max(0.02, viewersValue * 1.06) };
      });

      const contentRevenue = nextShows.reduce((sum, show) => sum + show.revenue, 0) + nextOwned.reduce((sum, right) => sum + (right.revenue || 0), 0);
      const contentCost = nextShows.reduce((sum, show) => sum + show.cost, 0) + nextOwned.reduce((sum, right) => sum + (right.weekly || 0) + (right.type === 'Sports' ? 0.045 : 0.01), 0);
      const nextPayroll = nextPeople.filter((person) => person.status === 'Employee' || person.status === 'Contracted').reduce((sum, person) => sum + (person.salary || 0), 0) / 13;
      const nextFacilityCost = nextInfrastructure.reduce((sum, asset) => sum + asset.level * 0.012, 0);
      const nextExpansionCost = nextExpansions.reduce((sum, expansion) => sum + expansion.weekly, 0);
      const nextDealRevenue = nextCommercial.deals.reduce((sum, deal) => sum + deal.value / Math.max(deal.weeks, 1), 0);
      const nextCampaignCost = nextCommercial.campaigns.reduce((sum, campaign) => sum + campaign.spend / Math.max(campaign.weeks, 1), 0);
      const profit = contentRevenue + nextDealRevenue - contentCost - nextPayroll - nextFacilityCost - nextExpansionCost - nextCampaignCost - nextNetwork.debt * 0.0012 - 0.12;
      nextNetwork.cash += profit;
      nextNetwork.reachHouseholds = currentReach;
      const averageShare = [...nextShows, ...nextOwned.filter((right) => right.type !== 'Format')].reduce((sum, content) => sum + (content.share || 0), 0) / Math.max(1, nextShows.length + nextOwned.filter((right) => right.type !== 'Format').length);
      nextNetwork.reputation = clamp(nextNetwork.reputation + (averageShare - 10) * 0.03 + randomBetween(-0.25, 0.25), 10, 98);
      nextNetwork.boardConfidence = clamp(nextNetwork.boardConfidence + profit * 0.25 + (nextNetwork.cash < 5 ? -1.5 : 0), 5, 98);

      nextCompetitors = nextCompetitors.map((competitor) => {
        if (competitor.player) {
          const blend = 0.35;
          const mtdRevenue = contentRevenue + nextDealRevenue;
          return {
            ...competitor, reach: currentReach, mtdShare: competitor.mtdShare * (1 - blend) + averageShare * blend,
            ytdShare: competitor.ytdShare * 0.94 + averageShare * 0.06,
            mtdRevenue: competitor.mtdRevenue * 0.65 + mtdRevenue * 0.35,
            ytdRevenue: competitor.ytdRevenue + mtdRevenue,
            momentum: (averageShare - competitor.ytdShare) * 0.8,
          };
        }
        const drift = randomBetween(-1.1, 1.1) + competitor.momentum * 0.04;
        return {
          ...competitor,
          mtdShare: clamp(competitor.mtdShare + drift * 0.18, 1, 30),
          ytdShare: clamp(competitor.ytdShare + drift * 0.025, 1, 30),
          mtdRevenue: Math.max(0.5, competitor.mtdRevenue * (1 + drift / 200)),
          ytdRevenue: competitor.ytdRevenue + competitor.mtdRevenue * 0.24,
          momentum: clamp(competitor.momentum + randomBetween(-1.8, 1.8), -12, 15),
        };
      });

      const strongest = [...nextShows].sort((a, b) => b.trend - a.trend)[0];
      const weakest = [...nextShows].sort((a, b) => a.trend - b.trend)[0];
      const generated = completedThisWeek[0]
        ? completedThisWeek[0].type === 'script'
          ? { tag: 'Creative', headline: `${completedThisWeek[0].title} delivers a ${completedThisWeek[0].quality}-star script`, body: 'Development now moves to packaging, where the producer, director, cast, and production choices will determine whether the written promise survives execution.' }
          : completedThisWeek[0].type === 'production'
            ? { tag: 'Production', headline: `${completedThisWeek[0].title} completes production`, body: 'The finished program is now available to the scheduling team. Its premiere environment and marketing support will shape initial awareness.' }
            : completedThisWeek[0].type === 'expansion'
              ? { tag: 'Distribution', headline: `Northstar begins broadcasting in ${completedThisWeek[0].title}`, body: 'Sales, programming, and news teams now face the challenge of converting theoretical distribution into real audience share.' }
              : completedThisWeek[0].type === 'research'
                ? { tag: 'Capability', headline: `${completedThisWeek[0].title} becomes operational`, body: 'New program types, rights opportunities, and strategic routes are now available to management.' }
                : { tag: 'Premiere', headline: `${completedThisWeek[0].title} reaches the schedule`, body: 'Northstar’s newest program begins building an audience and a permanent history in the network almanac.' }
        : strongest && strongest.trend > 5
          ? { tag: 'Ratings', headline: `${strongest.title} gains ${Math.round(strongest.trend)}% as its audience expands`, body: 'The program is strengthening its slot and improving Northstar’s negotiating position with advertisers.' }
          : { tag: 'Programming', headline: `${weakest?.title || 'Northstar'} faces a difficult week`, body: 'Management must decide whether the answer is a stronger lead-in, marketing support, creative changes, or a different use of the slot.' };
      nextNews = [{ id: uid('news'), week: nextNetwork.week, importance: completedThisWeek.length ? 'Major' : 'Weekly', ...generated }, ...nextNews].slice(0, 30);
    }

    setNetwork(nextNetwork);
    setMarkets(nextMarkets);
    setInfrastructure(nextInfrastructure);
    setCompetitors(nextCompetitors);
    setShows(nextShows);
    setProjects(nextProjects);
    setRights(nextRights);
    setOwnedRights(nextOwned);
    setResearch(nextResearch);
    setResearchWork(nextResearchWork);
    setExpansions(nextExpansions);
    setPeople(nextPeople);
    setCommercial(nextCommercial);
    setNews(nextNews);
    persist({
      network: nextNetwork, markets: nextMarkets, infrastructure: nextInfrastructure, competitors: nextCompetitors,
      shows: nextShows, projects: nextProjects, rights: nextRights, ownedRights: nextOwned, research: nextResearch,
      researchWork: nextResearchWork, expansions: nextExpansions, people: nextPeople, commercial: nextCommercial, news: nextNews,
    });
    setSimulating(false);
    notify(`${count} week${count > 1 ? 's' : ''} simulated`, `Northstar is now in week ${nextNetwork.week}, ${nextNetwork.year}.`);
  };

  const rankedCompetitors = [...competitors].sort((a, b) => selectedRanking === 'MTD' ? b.mtdShare - a.mtdShare : b.ytdShare - a.ytdShare);
  const playerRank = rankedCompetitors.findIndex((item) => item.player) + 1;
  const selectedTalent = people.find((person) => person.id === selectedPerson) || people[0];
  const activeResearchItem = research.find((item) => item.id === researchWork.id);
  const currentResearchPercent = activeResearchItem ? researchWork.progress / activeResearchItem.cost * 100 : 0;
  const conceptBudget = estimateBudget(concept);
  const projectForProduction = projects.find((item) => item.id === productionProject);
  const projectForModal = projects.find((item) => item.id === projectModal);

  const filteredPeople = people.filter((person) => {
    const search = talentSearch.trim().toLowerCase();
    const matchesText = !search || `${person.name} ${person.profession} ${(person.style || []).join(' ')} ${Object.keys(person.specialties || {}).join(' ')}`.toLowerCase().includes(search);
    const matchesFilter = talentFilter === 'All' || (talentFilter === 'Our people' ? person.status !== 'Market' : person.profession === talentFilter);
    return matchesText && matchesFilter;
  });

  const renderRankTable = (mode) => {
    const sorted = [...competitors].sort((a, b) => mode === 'MTD' ? b.mtdShare - a.mtdShare : b.ytdShare - a.ytdShare);
    return (
      <div className="ranking-table">
        <div className="ranking-head"><span>#</span><span>Network</span><span>Reach</span><span>Share</span><span>Momentum</span></div>
        {sorted.map((item, index) => (
          <div className={classNames('ranking-row', item.player && 'player-row')} key={item.id}>
            <strong>{index + 1}</strong>
            <div className="network-cell"><i style={{ background: item.color }} /><span><b>{item.name}</b><small>{item.type}</small></span></div>
            <span>{households(item.reach)}</span>
            <b>{(mode === 'MTD' ? item.mtdShare : item.ytdShare).toFixed(1)}%</b>
            <Trend value={item.momentum} compact />
          </div>
        ))}
      </div>
    );
  };

  const renderHome = () => {
    const directCompetitors = competitors.filter((item) => ['northstar', 'heartland', 'greatlakes'].includes(item.id));
    const directRank = [...directCompetitors].sort((a, b) => b.mtdShare - a.mtdShare).findIndex((item) => item.player) + 1;
    const nextMilestone = network.reachHouseholds < 1 ? 'Reach one million households' : network.reachHouseholds < 5 ? 'Become a recognized Midwest network' : 'Build a national distribution route';
    const topShow = [...shows].sort((a, b) => b.viewers - a.viewers)[0];
    const decisionItems = [
      expansions.length ? { tone: 'blue', title: `${expansions[0].label} in progress`, copy: `${expansions[0].weeksRemaining} weeks remain before the new feed launches.`, tab: 'coverage' } : { tone: 'amber', title: 'The board wants a growth route', copy: 'Choose whether distribution, content, rights, or local dominance receives the next major investment.', tab: 'coverage' },
      projects.some((item) => item.stage === 'Script Ready') ? { tone: 'green', title: 'A script is ready to package', copy: `${projects.find((item) => item.stage === 'Script Ready')?.title} needs a producer, director, and lead talent.`, tab: 'development' } : { tone: 'blue', title: 'Development pipeline is active', copy: `${projects.filter((item) => item.stage === 'Writing' || item.stage === 'Production').length} projects are moving toward air.`, tab: 'development' },
      rights.some((item) => item.status === 'Available' && item.deadline <= 6) ? { tone: 'red', title: 'A rights deadline is approaching', copy: `${rights.filter((item) => item.status === 'Available').sort((a, b) => a.deadline - b.deadline)[0]?.title} closes soon.`, tab: 'rights' } : { tone: 'green', title: 'Rights market is stable', copy: 'Affordable movie and local sports packages remain available.', tab: 'rights' },
    ];
    return (
      <>
        <section className="hero-banner">
          <div className="hero-copy">
            <span className="eyebrow light">CEO BRIEFING · WEEK {network.week}</span>
            <h2>From a local station to a media institution.</h2>
            <p>Northstar reaches {households(totalReach)} households from northern Illinois. Every show, person, right, facility, and market decision now contributes to one persistent broadcast world.</p>
            <div className="hero-actions">
              <button className="button light" onClick={() => simulateWeeks(1)} disabled={simulating}><Play size={15} fill="currentColor" /> {simulating ? 'Simulating…' : 'Advance 1 week'}</button>
              <button className="button ghost-light" onClick={() => simulateWeeks(4)} disabled={simulating}>Advance 4 weeks</button>
            </div>
          </div>
          <div className="hero-score">
            <span>Current strategic milestone</span>
            <strong>{nextMilestone}</strong>
            <div className="hero-score-grid">
              <div><b>#{directRank}</b><small>Regional rank</small></div>
              <div><b>{network.reputation.toFixed(0)}</b><small>Industry reputation</small></div>
              <div><b>{network.boardConfidence.toFixed(0)}%</b><small>Board confidence</small></div>
            </div>
          </div>
        </section>

        <div className="kpi-grid four">
          <KpiCard label="Cash available" value={money(network.cash)} sub={`${money(network.debt)} debt`} icon={WalletCards} trend={weeklyProfit * 10} />
          <KpiCard label="Households reached" value={households(totalReach)} sub={`${activeMarkets.length} active market${activeMarkets.length === 1 ? '' : 's'}`} icon={Radio} trend={(totalReach / Math.max(initialNetwork.reachHouseholds, 0.1) - 1) * 100} />
          <KpiCard label="Weekly operating result" value={money(weeklyProfit, 2)} sub={`${money(weeklyRevenue, 2)} revenue`} icon={CircleDollarSign} trend={weeklyProfit >= 0 ? 4.2 : -7.8} />
          <KpiCard label="Top program" value={topShow?.title || '—'} sub={`${viewers(topShow?.viewers || 0)} average viewers`} icon={Trophy} trend={topShow?.trend || 0} />
        </div>

        <div className="home-layout">
          <div className="home-main">
            <Panel title="Executive decisions" subtitle="Items that meaningfully change Northstar’s identity or commitments.">
              <div className="decision-list">
                {decisionItems.map((item) => (
                  <button className="decision-row" key={item.title} onClick={() => setActiveTab(item.tab)}>
                    <i className={`decision-dot ${item.tone}`} />
                    <span><strong>{item.title}</strong><small>{item.copy}</small></span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Current content pipeline" subtitle="A show’s history begins before it reaches the schedule." action={<button className="text-button" onClick={() => setActiveTab('development')}>Open studio <ChevronRight size={14} /></button>}>
              <div className="pipeline-mini">
                {projects.slice(0, 4).map((project) => (
                  <button key={project.id} onClick={() => { setActiveTab('development'); setProjectModal(project.id); }}>
                    <ContentMark identity={project.identity} size="small" />
                    <span><b>{project.title}</b><small>{project.stage} · {project.subtype}</small></span>
                    <span className="pipeline-status">{project.stage === 'Script Ready' && project.script ? <Stars value={project.script.quality} /> : project.stage === 'On air' ? 'Airing' : `${Math.round(project.progress)}%`}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Competitive position" subtitle="Audience share in the markets where each service is distributed." action={<div className="segmented"><button className={selectedRanking === 'MTD' ? 'active' : ''} onClick={() => setSelectedRanking('MTD')}>MTD</button><button className={selectedRanking === 'YTD' ? 'active' : ''} onClick={() => setSelectedRanking('YTD')}>YTD</button></div>}>
              {renderRankTable(selectedRanking)}
            </Panel>
          </div>

          <aside className="home-side">
            <Panel title="Tonight on Northstar" subtitle="Prime time and late night">
              <div className="tonight-list">
                {days.slice(0, 4).map((day) => {
                  const id = schedule[day]?.['Prime Time'];
                  const content = contentById[id];
                  return <div key={day}><span>{day.slice(0, 3)}</span>{content ? <><ContentMark identity={content.identity} size="tiny" /><b>{content.title}</b></> : <i>Open slot</i>}</div>;
                })}
              </div>
            </Panel>
            <Panel title="Network identity" subtitle="Institutional expertise grows through repeated work.">
              <div className="specialization-list">
                {network.specializations.map((item) => <div key={item.name}><div><span>{item.name}</span><b>Lv. {item.level}</b></div><Progress value={item.xp % 100} /></div>)}
              </div>
            </Panel>
            <Panel title="Latest Chronicle" subtitle={`Week ${news[0]?.week || network.week}`}>
              <article className="home-story"><Badge tone="blue">{news[0]?.tag}</Badge><h4>{news[0]?.headline}</h4><p>{news[0]?.body}</p><button className="text-button" onClick={() => setActiveTab('chronicle')}>Read the Chronicle <ChevronRight size={14} /></button></article>
            </Panel>
          </aside>
        </div>
      </>
    );
  };

  const renderUniverse = () => (
    <>
      <SectionHeader eyebrow="INDUSTRY DATABASE" title="The broadcast universe" copy="Competitors expand, commission, acquire rights, and develop identities independently of Northstar. Their advantages are real, but their decisions are imperfect." />
      <div className="kpi-grid four">
        <KpiCard label="Networks tracked" value={competitors.length} sub="Broadcast, cable and streaming" icon={Building2} />
        <KpiCard label="Northstar MTD rank" value={`#${[...competitors].sort((a, b) => b.mtdShare - a.mtdShare).findIndex((item) => item.player) + 1}`} sub={`${competitors.find((item) => item.player)?.mtdShare.toFixed(1)}% market share`} icon={Trophy} />
        <KpiCard label="Fastest momentum" value={[...competitors].sort((a, b) => b.momentum - a.momentum)[0]?.name} sub={`${[...competitors].sort((a, b) => b.momentum - a.momentum)[0]?.momentum.toFixed(1)}% trend`} icon={TrendingUp} />
        <KpiCard label="Largest service" value={[...competitors].sort((a, b) => b.reach - a.reach)[0]?.name} sub={`${households([...competitors].sort((a, b) => b.reach - a.reach)[0]?.reach)} households`} icon={Radio} />
      </div>
      <Panel title="Industry rankings" subtitle="Switch between current-month momentum and the more stable year-to-date view." action={<div className="segmented"><button className={selectedRanking === 'MTD' ? 'active' : ''} onClick={() => setSelectedRanking('MTD')}>MTD</button><button className={selectedRanking === 'YTD' ? 'active' : ''} onClick={() => setSelectedRanking('YTD')}>YTD</button></div>}>
        {renderRankTable(selectedRanking)}
      </Panel>
      <div className="competitor-grid">
        {competitors.map((item) => (
          <article className={classNames('competitor-card', item.player && 'player-competitor')} key={item.id}>
            <div className="competitor-band" style={{ background: item.color }} />
            <div className="competitor-top"><div><Badge tone={item.player ? 'green' : 'neutral'}>{item.type}</Badge><h3>{item.name}</h3><p>{item.identity}</p></div><Trend value={item.momentum} /></div>
            <div className="competitor-stats"><div><span>Reach</span><b>{households(item.reach)}</b></div><div><span>MTD share</span><b>{item.mtdShare.toFixed(1)}%</b></div><div><span>YTD revenue</span><b>{money(item.ytdRevenue, 0)}</b></div></div>
            <div className="flagship"><span>Flagship property</span><strong>{item.flagship}</strong></div>
          </article>
        ))}
      </div>
      <Panel title="Recent competitor moves" subtitle="The world does not wait for the player.">
        <div className="industry-feed">
          <article><i style={{ background: '#85552f' }} /><span><b>Heartland Media</b><strong>opens talks with a Milwaukee affiliate group</strong><small>A completed agreement would make Northstar’s Wisconsin entry more expensive.</small></span><Badge tone="amber">Distribution</Badge></article>
          <article><i style={{ background: '#5b4b79' }} /><span><b>Apex Network</b><strong>orders 18 episodes of medical drama Mercy General</strong><small>Experienced medical writers and hospital production space are becoming more expensive.</small></span><Badge tone="blue">Creative</Badge></article>
          <article><i style={{ background: '#3d526d' }} /><span><b>NewsLine 24</b><strong>signs a former governor as evening analyst</strong><small>The move improves prestige but creates brand-safety concerns for several advertisers.</small></span><Badge tone="red">Talent</Badge></article>
        </div>
      </Panel>
    </>
  );

  const renderCoverage = () => (
    <>
      <SectionHeader eyebrow="DISTRIBUTION & INFRASTRUCTURE" title="Build reach, not an abstract level" copy="Northstar expands through owned stations, affiliates, repeaters, cable carriage, content rights, operating capability, and audience demand." actions={<button className="button secondary" onClick={() => setActiveTab('research')}><Lightbulb size={15} /> Distribution research</button>} />
      <div className="kpi-grid four">
        <KpiCard label="Effective household reach" value={households(totalReach)} sub={`${activeMarkets.length} active market${activeMarkets.length === 1 ? '' : 's'}`} icon={Radio} />
        <KpiCard label="Active expansion projects" value={expansions.length} sub={expansions.length ? `${expansions.reduce((sum, item) => sum + item.weeksRemaining, 0)} project-weeks remaining` : 'No expansion under construction'} icon={Activity} />
        <KpiCard label="Infrastructure condition" value={`${Math.round(infrastructure.reduce((sum, item) => sum + item.condition, 0) / infrastructure.length)}%`} sub="Maintenance affects reliability" icon={Settings2} />
        <KpiCard label="Weekly distribution cost" value={money(expansionWeekly + facilityWeekly, 2)} sub="Facilities and active projects" icon={CircleDollarSign} />
      </div>

      {expansions.length > 0 && <Panel title="Expansion work in progress" subtitle="These commitments continue charging weekly operating costs until launch.">
        <div className="expansion-strip">{expansions.map((item) => <div key={item.id}><div><Radio size={18} /><span><b>{item.label}</b><small>{markets.find((market) => market.id === item.marketId)?.name} · {item.method}</small></span></div><Progress value={(1 - item.weeksRemaining / item.totalWeeks) * 100} detail={`${item.weeksRemaining} weeks`} /></div>)}</div>
      </Panel>}

      <div className="market-grid">
        {markets.map((market) => {
          const locked = market.status === 'Locked' && market.unlock && !completedResearch.has(market.unlock);
          return (
            <article className={classNames('market-card', market.status === 'Active' && 'active-market', market.status === 'Expanding' && 'expanding-market', locked && 'locked-card')} key={market.id}>
              <div className="market-top"><div><span className="market-region">{market.region}</span><h3>{market.name}</h3></div><Badge tone={market.status === 'Active' ? 'green' : market.status === 'Expanding' ? 'blue' : locked ? 'red' : 'neutral'}>{locked ? 'Research locked' : market.status}</Badge></div>
              <p>{market.description}</p>
              <div className="market-stats"><div><span>Households</span><b>{households(market.households)}</b></div><div><span>Ad demand</span><b>{market.adDemand}</b></div><div><span>Competition</span><b>{market.competition}</b></div></div>
              <div className="affinity-row">{market.affinity.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {market.status === 'Active' ? <div className="market-active-details"><div><span>Distribution</span><b>{market.method}</b></div><div><span>Coverage</span><b>{market.coverage}%</b></div><div><span>Awareness</span><b>{market.awareness.toFixed(0)}%</b></div><div><span>Share</span><b>{market.share.toFixed(1)}%</b></div></div> : market.status === 'Expanding' ? <button className="button secondary full" disabled>Expansion underway</button> : <button className="button secondary full" onClick={() => !locked && setMarketModal(market.id)} disabled={locked}>{locked ? `Requires ${research.find((item) => item.id === market.unlock)?.name || 'research'}` : 'Review entry routes'}</button>}
            </article>
          );
        })}
      </div>

      <Panel title="Owned facilities" subtitle="Facilities create capacity, reliability, speed, and institutional expertise. They also decay over time.">
        <div className="facility-list">
          {infrastructure.map((asset) => {
            const upgrade = asset.upgradeCost * (1 + (asset.level - 1) * 0.5);
            return <div className="facility-row" key={asset.id}><div className="facility-icon"><Building2 size={19} /></div><div className="facility-copy"><b>{asset.name}</b><span>{asset.specialty}</span></div><div className="facility-level"><span>Level</span><b>{asset.level}/{asset.max}</b></div><div className="facility-condition"><Progress value={asset.condition} label="Condition" /></div><button className="button small secondary" onClick={() => upgradeFacility(asset.id)} disabled={asset.level >= asset.max}>{asset.level >= asset.max ? 'Max level' : `Upgrade ${money(upgrade, 1)}`}</button></div>;
          })}
        </div>
      </Panel>
    </>
  );

  const renderProgramming = () => (
    <>
      <SectionHeader eyebrow="PROGRAMMING OPERATIONS" title="Weekly schedule board" copy="A simplified Outlook-style calendar. Drag programs between cells, drag inventory from the content bank, or click any daypart to select an item." actions={<button className="button secondary" onClick={() => setCampaignOpen(true)}><Megaphone size={15} /> Support a premiere</button>} />
      <div className="programming-layout-v2">
        <div className="schedule-board-wrap">
          <div className="schedule-legend"><span><i className="legend-original" /> Original</span><span><i className="legend-acquired" /> Acquired / rights</span><span><i className="legend-ready" /> New or in production</span></div>
          <div className="outlook-grid">
            <div className="outlook-corner">Daypart</div>
            {days.map((day) => <div className="outlook-day" key={day}><strong>{day}</strong><small>{day === 'Saturday' || day === 'Sunday' ? 'Weekend' : 'Weekday'}</small></div>)}
            {dayparts.map((part) => (
              <React.Fragment key={part}>
                <div className="outlook-part"><strong>{part}</strong><small>{part === 'Prime Time' ? '8–10 PM' : part === 'Evening' ? '5–8 PM' : part === 'Late Night' ? '10 PM+' : part === 'Morning' ? '6 AM–12 PM' : '12–5 PM'}</small></div>
                {days.map((day) => {
                  const id = schedule[day]?.[part];
                  const content = contentById[id];
                  return (
                    <div className={classNames('outlook-cell', content && 'filled')} key={`${day}-${part}`} onClick={() => setScheduleCell({ day, part })} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, day, part)}>
                      {content ? <div className={classNames('schedule-block', content.contentKind === 'project' && 'new-block', content.source === 'Syndicated' || content.contentKind === 'right' ? 'acquired-block' : 'original-block')} draggable onDragStart={(event) => { const payload = { contentId: content.id, day, part }; setDragPayload(payload); event.dataTransfer.setData('text/plain', JSON.stringify(payload)); }}>
                        <ContentMark identity={content.identity} size="tiny" />
                        <span><b>{content.title}</b><small>{content.subtype || content.category}</small></span>
                        <button onClick={(event) => { event.stopPropagation(); removeCell(day, part); }} aria-label="Remove"><X size={12} /></button>
                      </div> : <button className="empty-slot"><Plus size={15} /><span>Add content</span></button>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <aside className="content-bank">
          <div className="content-bank-head"><span className="eyebrow">CONTENT BANK</span><h3>Available inventory</h3><p>Drag an item into the schedule. Continuous talk and news projects can air while the production workflow is still being finalized.</p></div>
          <div className="content-bank-list">
            {availableContent.map((content) => (
              <div className="bank-item" draggable key={content.id} onDragStart={(event) => { const payload = { contentId: content.id }; setDragPayload(payload); event.dataTransfer.setData('text/plain', JSON.stringify(payload)); }}>
                <ContentMark identity={content.identity} size="small" />
                <span><b>{content.title}</b><small>{content.subtype} · {content.source || (content.contentKind === 'right' ? 'Rights' : content.stage)}</small></span>
                <Badge tone={scheduledIds.has(content.id) ? 'green' : content.contentKind === 'project' ? 'blue' : 'neutral'}>{scheduledIds.has(content.id) ? 'Scheduled' : content.contentKind === 'project' ? 'New' : content.source || 'Rights'}</Badge>
              </div>
            ))}
          </div>
          <div className="programming-note"><AlertTriangle size={16} /><span><b>Audience flow matters</b><small>Prime-time originals benefit from strong evening lead-ins. Repetition can build habit, but overscheduling creates fatigue.</small></span></div>
        </aside>
      </div>
    </>
  );

  const renderDevelopment = () => {
    const stages = ['Writing', 'Script Ready', 'Production', 'Ready', 'On air'];
    return (
      <>
        <SectionHeader eyebrow="CREATIVE STUDIO" title="Create a program, then earn the finished show" copy="Costs are created by music, effects, sets, locations, wardrobe, writing, episode count, and talent—not by a generic budget slider." actions={<button className="button primary" onClick={() => setCreateOpen(true)}><Plus size={15} /> Create project</button>} />
        <div className="kpi-grid four">
          <KpiCard label="Projects in pipeline" value={projects.filter((item) => item.stage !== 'On air').length} sub={`${projects.filter((item) => item.stage === 'Writing').length} in script development`} icon={Clapperboard} />
          <KpiCard label="Scripts ready" value={projects.filter((item) => item.stage === 'Script Ready').length} sub="Waiting for production package" icon={Newspaper} />
          <KpiCard label="Production commitments" value={money(projects.filter((item) => item.production && item.stage === 'Production').reduce((sum, item) => sum + item.production.cost, 0), 1)} sub="Approved total production cost" icon={CircleDollarSign} />
          <KpiCard label="Originals on air" value={shows.filter((item) => item.source === 'Original').length} sub="Building Northstar’s library" icon={Tv} />
        </div>
        <div className="pipeline-board">
          {stages.map((stage) => (
            <section className="pipeline-column" key={stage}>
              <div className="pipeline-column-head"><h3>{stage}</h3><span>{projects.filter((item) => item.stage === stage).length}</span></div>
              <div className="pipeline-cards">
                {projects.filter((item) => item.stage === stage).map((project) => (
                  <article className="project-card" key={project.id} onClick={() => setProjectModal(project.id)}>
                    <div className="project-card-top"><ContentMark identity={project.identity} size="small" /><div><Badge tone={stage === 'Script Ready' ? 'green' : stage === 'Production' ? 'blue' : stage === 'Ready' ? 'amber' : 'neutral'}>{project.category}</Badge><h4>{project.title}</h4><span>{project.subtype}</span></div></div>
                    <p>{project.note}</p>
                    {project.script && <div className="script-line"><span>Script</span><Stars value={project.script.quality} /></div>}
                    {['Writing', 'Production'].includes(stage) && <Progress value={project.progress} detail={`${project.weeksRemaining} weeks`} />}
                    <div className="project-meta"><span>{project.episodes} episodes</span><span>{project.duration} min</span><span>{money(project.estimatedEpisodeCost, 2)}/ep</span></div>
                    {stage === 'Script Ready' && <button className="button small primary full" onClick={(event) => { event.stopPropagation(); setProductionProject(project.id); }}>Package production</button>}
                    {stage === 'Ready' && <button className="button small secondary full" onClick={(event) => { event.stopPropagation(); setActiveTab('programming'); }}>Place in schedule</button>}
                  </article>
                ))}
                {projects.filter((item) => item.stage === stage).length === 0 && <div className="pipeline-empty">No projects</div>}
              </div>
            </section>
          ))}
        </div>
        <Panel title="Creative taxonomy and current access" subtitle="Research determines which kinds of programs Northstar can credibly commission.">
          <div className="taxonomy-grid">
            {Object.entries(categoryTree).map(([category, subtypes]) => <div className="taxonomy-card" key={category}><h4>{category}</h4>{subtypes.map((subtype) => { const unlocked = !subtype.research || completedResearch.has(subtype.research); return <span key={subtype.name} className={!unlocked ? 'locked-taxonomy' : ''}>{unlocked ? <Check size={12} /> : <X size={12} />}{subtype.name}</span>; })}</div>)}
          </div>
        </Panel>
      </>
    );
  };

  const renderRights = () => {
    const filtered = rights.filter((item) => rightsFilter === 'All' || item.type === rightsFilter);
    return (
      <>
        <SectionHeader eyebrow="RIGHTS EXCHANGE" title="Sports, movies and proven formats" copy="Rights can accelerate distribution, stabilize weak dayparts, or reduce creative risk. They also create fixed commitments and territorial restrictions." actions={<div className="filter-buttons">{['All', 'Sports', 'Movies', 'Format'].map((filter) => <button key={filter} className={rightsFilter === filter ? 'active' : ''} onClick={() => setRightsFilter(filter)}>{filter}</button>)}</div>} />
        <div className="kpi-grid four">
          <KpiCard label="Owned packages" value={ownedRights.length} sub={`${ownedRights.filter((item) => item.type === 'Sports').length} sports properties`} icon={Trophy} />
          <KpiCard label="Weekly rights commitments" value={money(rightsWeekly, 2)} sub="Before event production" icon={CircleDollarSign} />
          <KpiCard label="Open opportunities" value={rights.filter((item) => item.status === 'Available').length} sub={`${rights.filter((item) => item.status === 'Available' && item.deadline <= 6).length} closing soon`} icon={Clock3} />
          <KpiCard label="Highest-demand package" value={[...rights].filter((item) => item.status === 'Available').sort((a, b) => b.demand - a.demand)[0]?.title || '—'} sub="Competition raises the final price" icon={TrendingUp} />
        </div>
        <div className="rights-layout">
          <div className="rights-market-grid">
            {filtered.map((right) => {
              const locked = right.requirement && !completedResearch.has(right.requirement);
              const expected = right.upfront * (1 + Math.max(0, right.bids - 1) * 0.045);
              return <article className={classNames('right-card', right.status !== 'Available' && 'right-unavailable')} key={right.id}>
                <div className="right-visual" style={{ background: `linear-gradient(140deg, ${right.identity.color}, ${right.identity.accent})` }}><ContentMark identity={right.identity} /><Badge tone="light">{right.type}</Badge></div>
                <div className="right-body"><span className="right-subtype">{right.subtype}</span><h3>{right.title}</h3><p>{right.description}</p><div className="right-tags"><span>{right.territory}</span><span>{right.term}</span><span>{right.exclusivity}</span></div><div className="right-stats"><div><span>Expected price</span><b>{money(expected, 2)}</b></div><div><span>Demand</span><b>{right.demand}/100</b></div><div><span>Competing bids</span><b>{right.bids}</b></div><div><span>Deadline</span><b>{right.deadline} wks</b></div></div>{right.status === 'Available' ? <button className="button primary full" onClick={() => buyRight(right.id)} disabled={locked}>{locked ? `Requires ${research.find((item) => item.id === right.requirement)?.name || 'research'}` : 'Submit winning bid'}</button> : <button className="button secondary full" disabled>{right.status}</button>}</div>
              </article>;
            })}
          </div>
          <aside>
            <Panel title="Northstar rights library" subtitle="Owned packages become schedulable inventory unless they are production formats.">
              <div className="owned-rights-list">{ownedRights.map((right) => <div key={right.id}><ContentMark identity={right.identity} size="small" /><span><b>{right.title}</b><small>{right.type} · {right.territory}</small></span><span><b>{right.termWeeks || '—'} wks</b><small>{right.remaining || 0} events</small></span></div>)}</div>
            </Panel>
            <Panel title="Rights strategy" subtitle="Current management guidance">
              <div className="strategy-note"><Trophy size={20} /><p><b>Sports can unlock distribution.</b> Operators and affiliates value live, exclusive content—but event production and rights fees can overwhelm a small station.</p></div>
              <div className="strategy-note"><Film size={20} /><p><b>Movie libraries stabilize the grid.</b> They are useful in afternoons, weekends, and weak prime-time nights while originals remain in production.</p></div>
            </Panel>
          </aside>
        </div>
      </>
    );
  };

  const renderTalent = () => {
    const roles = ['All', 'Our people', ...Array.from(new Set(people.map((person) => person.profession)))];
    return (
      <>
        <SectionHeader eyebrow="PEOPLE DATABASE" title="Talent, employees and developing expertise" copy="Rarity describes overall ceiling and market status. Actual performance depends on profession, role fit, style, specialty, reliability, and accumulated experience." />
        <div className="talent-toolbar"><div className="search-box"><Search size={16} /><input value={talentSearch} onChange={(event) => setTalentSearch(event.target.value)} placeholder="Search people, styles or specialties" /></div><div className="filter-scroll">{roles.map((role) => <button key={role} className={talentFilter === role ? 'active' : ''} onClick={() => setTalentFilter(role)}>{role}</button>)}</div></div>
        <div className="talent-layout-v2">
          <div className="people-list">
            {filteredPeople.map((person) => (
              <button className={classNames('person-row', selectedTalent?.id === person.id && 'selected')} key={person.id} onClick={() => setSelectedPerson(person.id)}>
                <div className={`person-avatar rarity-bg-${person.rarity.toLowerCase()}`}>{person.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div>
                <div className="person-main"><div><b>{person.name}</b><Rarity value={person.rarity} /></div><span>{person.profession} · {person.status}</span><small>{person.style.join(' · ')}</small></div>
                <div className="person-score"><strong>{Math.max(...Object.values(person.skills || {}))}</strong><span>Peak skill</span></div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          {selectedTalent && <aside className="talent-profile">
            <div className="profile-hero"><div className={`person-avatar large rarity-bg-${selectedTalent.rarity.toLowerCase()}`}>{selectedTalent.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div><Rarity value={selectedTalent.rarity} /><h3>{selectedTalent.name}</h3><p>{selectedTalent.profession} · Age {selectedTalent.age}</p></div></div>
            <div className="profile-tags">{selectedTalent.style.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="profile-summary"><div><span>Status</span><b>{selectedTalent.status}</b></div><div><span>Reliability</span><b>{selectedTalent.reliability}</b></div><div><span>Prestige</span><b>{selectedTalent.prestige}</b></div><div><span>Commercial</span><b>{selectedTalent.commercial}</b></div></div>
            <h4>Professional skills</h4>
            <div className="skill-list">{Object.entries(selectedTalent.skills || {}).sort((a, b) => b[1] - a[1]).map(([skill, value]) => <div key={skill}><Progress value={value} label={skill} detail={value} /></div>)}</div>
            <h4>Specialized experience</h4>
            <div className="specialty-table">{Object.entries(selectedTalent.specialties || {}).sort((a, b) => b[1] - a[1]).map(([specialty, value]) => <div key={specialty}><span>{specialty}</span><b>{value}</b></div>)}</div>
            <div className="profile-credit"><span>Selected credits</span><b>{selectedTalent.credits}</b><small>{selectedTalent.awards}</small></div>
            {selectedTalent.status === 'Market' ? <button className="button primary full" onClick={() => hirePerson(selectedTalent.id)}>Offer development deal · {money((selectedTalent.fee || 0) * 0.35, 2)}</button> : <button className="button secondary full" disabled>{selectedTalent.availability}</button>}
          </aside>}
        </div>
      </>
    );
  };

  const renderResearch = () => (
    <>
      <SectionHeader eyebrow="CAPABILITY DEVELOPMENT" title="Research, facilities and institutional memory" copy="Northstar cannot create every format or pursue every distribution route on day one. Capability is built with people, systems, facilities, and repeated work." />
      <div className="research-hero">
        <div><span className="eyebrow light">ACTIVE PROGRAM</span>{activeResearchItem ? <><h3>{activeResearchItem.name}</h3><p>{activeResearchItem.description}</p><Progress value={currentResearchPercent} detail={`${researchWork.progress}/${activeResearchItem.cost} points`} /></> : <><h3>No active capability program</h3><p>The research and transformation team is available. Select one program below.</p></>}</div>
        <div className="research-rate"><Lightbulb size={25} /><strong>{network.weeklyResearch}</strong><span>points per week</span></div>
      </div>
      <div className="research-domain-grid">
        {Array.from(new Set(research.map((item) => item.domain))).map((domain) => (
          <section className="research-domain" key={domain}><div className="research-domain-head"><h3>{domain}</h3><span>{research.filter((item) => item.domain === domain && item.status === 'Complete').length}/{research.filter((item) => item.domain === domain).length}</span></div>{research.filter((item) => item.domain === domain).map((item) => {
            const locked = item.status === 'Locked' || (item.prerequisite && !completedResearch.has(item.prerequisite));
            const active = researchWork.id === item.id;
            return <article className={classNames('research-card', item.status === 'Complete' && 'complete', active && 'active', locked && 'locked')} key={item.id}><div className="research-card-top"><span className="research-status">{item.status === 'Complete' ? <Check size={14} /> : locked ? <X size={14} /> : active ? <Activity size={14} /> : <Lightbulb size={14} />}{active ? 'Active' : item.status}</span><b>{item.cost} pts</b></div><h4>{item.name}</h4><p>{item.description}</p>{item.prerequisite && <small>Prerequisite: {research.find((entry) => entry.id === item.prerequisite)?.name}</small>}{item.status === 'Complete' ? <button className="button small secondary full" disabled>Operational</button> : active ? <Progress value={currentResearchPercent} detail={`${researchWork.progress}/${item.cost}`} /> : <button className="button small secondary full" disabled={locked || Boolean(researchWork.id)} onClick={() => startResearch(item)}>{locked ? 'Locked' : researchWork.id ? 'Team occupied' : `Research · ${money(item.cash, 1)}`}</button>}</article>;
          })}</section>
        ))}
      </div>
      <Panel title="Institutional specializations" subtitle="The network itself learns. Repeated success reduces cost, improves quality floors, and attracts matching talent and advertisers.">
        <div className="institution-grid">{network.specializations.map((item) => <div key={item.name}><div className="institution-level"><span>{item.name}</span><b>Level {item.level}</b></div><Progress value={item.xp % 100} detail={`${item.xp % 100}/100 XP`} /><small>{item.level === 0 ? 'No established capability' : item.level === 1 ? 'Emerging internal practice' : item.level === 2 ? 'Recognized regional strength' : 'Industry-leading expertise'}</small></div>)}</div>
      </Panel>
    </>
  );

  const renderRatings = () => {
    const rows = [...shows, ...ownedRights.filter((item) => item.type !== 'Format')].sort((a, b) => b.viewers - a.viewers);
    return (
      <>
        <SectionHeader eyebrow="NORTHSTAR AUDIENCE INTELLIGENCE" title="Nielsen Center" copy="Performance reflects program quality, awareness, slot, audience flow, market fit, reach, competition, marketing, fatigue, and the people attached to the show." />
        <div className="ratings-masthead-v2"><div><BarChart3 size={28} /><span><strong>Northstar Audience</strong><small>Week {network.week}, {network.year} · Effective reach {households(totalReach)}</small></span></div><div><span>Average network share</span><strong>{(rows.reduce((sum, row) => sum + (row.share || 0), 0) / Math.max(rows.length, 1)).toFixed(1)}%</strong></div></div>
        <div className="kpi-grid four">
          <KpiCard label="Largest audience" value={rows[0]?.title || '—'} sub={`${viewers(rows[0]?.viewers || 0)} viewers`} icon={Trophy} trend={rows[0]?.trend || 0} />
          <KpiCard label="Fastest growth" value={[...rows].sort((a, b) => b.trend - a.trend)[0]?.title || '—'} sub={`${[...rows].sort((a, b) => b.trend - a.trend)[0]?.trend.toFixed(1)}% week over week`} icon={TrendingUp} />
          <KpiCard label="Best audience score" value={[...shows].sort((a, b) => b.audience - a.audience)[0]?.title || '—'} sub={`${[...shows].sort((a, b) => b.audience - a.audience)[0]?.audience.toFixed(0)}/100`} icon={UsersRound} />
          <KpiCard label="Best critic score" value={[...shows].sort((a, b) => b.critic - a.critic)[0]?.title || '—'} sub={`${[...shows].sort((a, b) => b.critic - a.critic)[0]?.critic.toFixed(0)}/100`} icon={Star} />
        </div>
        <Panel title="Program performance" subtitle="Original, acquired, and rights inventory in one comparable view.">
          <div className="ratings-table">
            <div className="ratings-head"><span>Program</span><span>Type</span><span>Viewers</span><span>Share</span><span>Trend</span><span>Quality</span><span>Audience</span><span>Weekly economics</span></div>
            {rows.map((row) => <div className="ratings-row" key={row.id}><div className="ratings-program"><ContentMark identity={row.identity} size="small" /><span><b>{row.title}</b><small>{row.subtype || row.category}</small></span></div><span><Badge tone={row.source === 'Original' ? 'green' : row.type === 'Sports' ? 'amber' : 'neutral'}>{row.source || row.type}</Badge></span><b>{viewers(row.viewers)}</b><b>{(row.share || 0).toFixed(1)}%</b><Trend value={row.trend || 0} compact /><span>{Math.round(row.quality || 60)}</span><span>{Math.round(row.audience || 70)}</span><span className={(row.revenue || 0) - (row.cost || 0) >= 0 ? 'positive-text' : 'negative-text'}>{money((row.revenue || 0) - (row.cost || 0), 2)}</span></div>)}
          </div>
        </Panel>
        <div className="ratings-two-col">
          <Panel title="Market performance" subtitle="Distribution creates opportunity; awareness and local fit convert it into share."><div className="market-performance-list">{activeMarkets.map((market) => <div key={market.id}><span><b>{market.name}</b><small>{market.method}</small></span><div><Progress value={market.awareness} label="Awareness" detail={`${market.awareness.toFixed(0)}%`} /><Progress value={market.share * 4} label="Share" detail={`${market.share.toFixed(1)}%`} /></div></div>)}</div></Panel>
          <Panel title="Audience interpretation" subtitle="Why the current results look this way"><div className="insight-list"><article><Sparkles size={18} /><span><b>Second Chances is larger than Northstar</b><small>The comedy’s quality and young audience are generating interest outside the home footprint. Syndication could monetize that demand.</small></span></article><article><Radio size={18} /><span><b>Reach remains the ceiling</b><small>Even excellent content cannot produce national-scale viewing while Northstar serves fewer than one million households.</small></span></article><article><AlertTriangle size={18} /><span><b>After Ten is showing fatigue</b><small>Its digital clips help buzz, but the full show needs a stronger format, host development, or replacement by Midwest After Dark.</small></span></article></div></Panel>
        </div>
      </>
    );
  };

  const renderCommercial = () => (
    <>
      <SectionHeader eyebrow="AD SALES & MARKETING" title="Monetize attention without destroying the brand" copy="Advertisers buy audiences, environments, integrations, sponsorships, and regional access. Marketing creates awareness and sampling; program quality determines retention." actions={<button className="button primary" onClick={() => setCampaignOpen(true)}><Plus size={15} /> Launch campaign</button>} />
      <div className="kpi-grid four">
        <KpiCard label="Active ad agreements" value={commercial.deals.length} sub={`${money(dealRevenue, 2)} weekly recognized revenue`} icon={Handshake} />
        <KpiCard label="Live campaigns" value={commercial.campaigns.length} sub={`${money(campaignWeekly, 2)} weekly campaign spend`} icon={Megaphone} />
        <KpiCard label="Best advertiser fit" value={[...commercial.advertisers].sort((a, b) => b.fit - a.fit)[0]?.name} sub={`${[...commercial.advertisers].sort((a, b) => b.fit - a.fit)[0]?.fit}/100 fit`} icon={Target} />
        <KpiCard label="Commercial reach" value={households(totalReach)} sub="Available household inventory" icon={UsersRound} />
      </div>
      <div className="commercial-layout">
        <div>
          <Panel title="Advertiser market" subtitle="Fit reflects Northstar’s current audience, content, safety, geography, and scale.">
            <div className="advertiser-list">{commercial.advertisers.map((advertiser) => <article key={advertiser.id}><div className="advertiser-logo">{advertiser.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><span><b>{advertiser.name}</b><small>{advertiser.category} · {advertiser.preference}</small></span><div><span>Fit</span><b>{advertiser.fit}</b></div><div><span>Potential</span><b>{money(advertiser.budget, 1)}</b></div><Badge tone={advertiser.risk === 'Low' ? 'green' : 'amber'}>{advertiser.risk} risk</Badge><button className="button small secondary" onClick={() => notify('Sales lead created', `${advertiser.name} has been added to the sales team’s priority list.`)}>Pursue</button></article>)}</div>
          </Panel>
          <Panel title="Active advertising agreements" subtitle="Packages combine linear inventory, integrations, digital clips, and sponsorship rights.">
            <div className="deal-list">{commercial.deals.map((deal) => <div key={deal.id}><Handshake size={17} /><span><b>{deal.advertiser}</b><small>{deal.package}</small></span><span><b>{money(deal.value, 2)}</b><small>{deal.weeks} weeks</small></span><Badge tone="green">{deal.status}</Badge></div>)}</div>
          </Panel>
        </div>
        <aside>
          <Panel title="Live marketing campaigns" subtitle="Campaigns lift awareness; they do not permanently repair weak content.">
            <div className="campaign-list-v2">{commercial.campaigns.length ? commercial.campaigns.map((campaign) => <article key={campaign.id}><Megaphone size={18} /><span><b>{campaign.name}</b><small>{money(campaign.spend, 2)} · {campaign.weeks} weeks · +{campaign.lift} awareness</small></span><Progress value={campaign.weeks / Math.max(Number(campaignForm.weeks), 1) * 100} /></article>) : <div className="empty-panel">No campaign is live.</div>}</div>
          </Panel>
          <Panel title="Brand position" subtitle="What viewers and buyers currently associate with Northstar.">
            <div className="brand-radar"><div><span>Local trust</span><Progress value={78} detail="78" /></div><div><span>Original entertainment</span><Progress value={51} detail="51" /></div><div><span>Live events</span><Progress value={22} detail="22" /></div><div><span>Prestige</span><Progress value={38} detail="38" /></div><div><span>Young audience</span><Progress value={44} detail="44" /></div></div>
          </Panel>
        </aside>
      </div>
    </>
  );

  const renderFinance = () => {
    const contentCommitments = projects.filter((item) => item.production && item.stage === 'Production').reduce((sum, item) => sum + item.production.cost * (item.weeksRemaining / Math.max(item.production.weeks, 1)), 0);
    return (
      <>
        <SectionHeader eyebrow="FINANCE & ERP" title="Management reporting" copy="A simplified operating system for profitability, commitments, cash, facilities, rights, production, and distribution." />
        <section className="finance-hero-v2"><div><span className="eyebrow light">LIQUIDITY</span><h2>{money(network.cash)}</h2><p>Available cash after approved deposits and rights acquisitions.</p></div><div><span>Weekly revenue</span><b>{money(weeklyRevenue, 2)}</b></div><div><span>Weekly cost</span><b>{money(weeklyCost, 2)}</b></div><div><span>Operating result</span><b className={weeklyProfit >= 0 ? 'positive-text' : 'negative-text'}>{money(weeklyProfit, 2)}</b></div><div><span>Debt</span><b>{money(network.debt, 1)}</b></div></section>
        <div className="finance-layout-v2">
          <Panel title="Weekly management P&L" subtitle="Current run-rate, not audited accounting.">
            <div className="pnl-table">
              <div className="pnl-section"><b>Revenue</b></div><div><span>Program advertising and integrations</span><b>{money(showRevenue, 2)}</b></div><div><span>Rights inventory revenue</span><b>{money(ownedRights.reduce((sum, item) => sum + (item.revenue || 0), 0), 2)}</b></div><div><span>Contracted advertiser packages</span><b>{money(dealRevenue, 2)}</b></div><div className="pnl-total"><span>Total revenue</span><b>{money(weeklyRevenue, 2)}</b></div>
              <div className="pnl-section"><b>Operating costs</b></div><div><span>Original and acquired programming</span><b>{money(showCost, 2)}</b></div><div><span>People and contracted talent</span><b>{money(payroll, 2)}</b></div><div><span>Rights fees and event commitments</span><b>{money(rightsWeekly, 2)}</b></div><div><span>Facilities and distribution</span><b>{money(facilityWeekly + expansionWeekly, 2)}</b></div><div><span>Marketing campaigns</span><b>{money(campaignWeekly, 2)}</b></div><div><span>Corporate, interest and compliance</span><b>{money(0.12 + network.debt * 0.0012, 2)}</b></div><div className="pnl-total dark"><span>Operating result</span><b className={weeklyProfit >= 0 ? 'positive-text' : 'negative-text'}>{money(weeklyProfit, 2)}</b></div>
            </div>
          </Panel>
          <aside>
            <Panel title="Approved commitments" subtitle="Future cash already promised by management."><div className="commitment-list"><div><Clapperboard size={17} /><span><b>Content production</b><small>Remaining approved production work</small></span><strong>{money(contentCommitments, 1)}</strong></div><div><Film size={17} /><span><b>Rights portfolio</b><small>Weekly fees over current terms</small></span><strong>{money(rightsWeekly * 52, 1)}</strong></div><div><Radio size={17} /><span><b>Expansion projects</b><small>Remaining weekly build costs</small></span><strong>{money(expansions.reduce((sum, item) => sum + item.weekly * item.weeksRemaining, 0), 1)}</strong></div></div></Panel>
            <Panel title="Board risk flags" subtitle="Items that can threaten confidence or liquidity."><div className="risk-list"><article className={network.cash < 10 ? 'high-risk' : ''}><AlertTriangle size={17} /><span><b>Cash runway</b><small>{network.cash < 10 ? 'Low liquidity limits strategic options.' : 'Liquidity is adequate for current commitments.'}</small></span></article><article className={weeklyProfit < 0 ? 'high-risk' : ''}><AlertTriangle size={17} /><span><b>Operating profitability</b><small>{weeklyProfit < 0 ? 'Current weekly operations are consuming cash.' : 'The station is currently generating operating cash.'}</small></span></article><article><AlertTriangle size={17} /><span><b>Concentration</b><small>Local news and Second Chances generate a disproportionate share of value.</small></span></article></div></Panel>
          </aside>
        </div>
        <Panel title="Program-level economics" subtitle="Profit is not the only purpose: news can build trust, sports can unlock carriage, and prestige can attract talent.">
          <div className="program-economics"><div className="program-economics-head"><span>Program</span><span>Audience</span><span>Revenue</span><span>Cost</span><span>Contribution</span><span>Strategic role</span></div>{shows.map((show) => <div key={show.id}><div><ContentMark identity={show.identity} size="tiny" /><span><b>{show.title}</b><small>{show.subtype}</small></span></div><span>{viewers(show.viewers)}</span><span>{money(show.revenue, 2)}</span><span>{money(show.cost, 2)}</span><b className={show.revenue - show.cost >= 0 ? 'positive-text' : 'negative-text'}>{money(show.revenue - show.cost, 2)}</b><span>{show.category === 'News & Factual' ? 'Trust and public service' : show.source === 'Syndicated' ? 'Low-risk schedule filler' : show.quality >= 75 ? 'Original brand and library' : 'Audience / experimentation'}</span></div>)}</div>
        </Panel>
      </>
    );
  };

  const renderChronicle = () => (
    <div className="chronicle-page">
      <header className="chronicle-header"><div><span>THE MEDIA BUSINESS RECORD</span><small>Independent trade coverage since 1948</small></div><div>WEEK {network.week} · {network.year}</div></header>
      <div className="chronicle-brand"><Radio size={25} /><strong>THE NORTHSTAR CHRONICLE</strong><span>Ratings · Rights · Talent · Distribution · History</span></div>
      <section className="chronicle-lead-v2"><div className="lead-graphic" style={{ background: `linear-gradient(145deg, ${contentById[schedule.Monday?.['Prime Time']]?.identity?.color || '#315a73'}, #172d3b)` }}><ContentMark identity={contentById[schedule.Monday?.['Prime Time']]?.identity} /><span>THIS WEEK IN TELEVISION</span></div><div><Badge tone="blue">{news[0]?.tag}</Badge><h1>{news[0]?.headline}</h1><p>{news[0]?.body}</p><small>By the Chronicle industry desk · Week {news[0]?.week || network.week}</small></div></section>
      <div className="chronicle-columns-v2">
        <main>{news.slice(1, 13).map((story) => <article key={story.id}><span>{story.tag}</span><h3>{story.headline}</h3><p>{story.body}</p><small>Week {story.week || network.week} · {story.importance}</small></article>)}</main>
        <aside><div className="chronicle-box"><span>NETWORK WATCH</span><strong>Audience share leaders</strong><ol>{[...competitors].sort((a, b) => b.mtdShare - a.mtdShare).slice(0, 5).map((item) => <li key={item.id}><b>{item.name}</b><small>{item.mtdShare.toFixed(1)}% MTD · {item.momentum >= 0 ? '+' : ''}{item.momentum.toFixed(1)} trend</small></li>)}</ol></div><div className="chronicle-box dark"><span>NORTHSTAR ARCHIVE</span><strong>{shows.length} active programs</strong><p>{projects.length} original projects have entered Northstar’s recorded development history. Future almanac pages will retain creators, casts, ratings, awards, markets, and rights ownership by year.</p></div><div className="chronicle-box"><span>MARKET MAP</span><strong>{activeMarkets.length} active markets</strong>{activeMarkets.map((market) => <div className="chronicle-market" key={market.id}><b>{market.name}</b><span>{market.share.toFixed(1)}% share</span></div>)}</div></aside>
      </div>
      <footer className="chronicle-records"><div><Trophy size={18} /> Northstar records</div><div><small>Largest program</small><strong>{[...shows].sort((a, b) => b.viewers - a.viewers)[0]?.title}</strong></div><div><small>Highest-rated original</small><strong>{[...shows].filter((item) => item.source === 'Original').sort((a, b) => b.quality - a.quality)[0]?.title}</strong></div><div><small>Largest footprint</small><strong>{households(totalReach)} households</strong></div><div><small>Most experienced personality</small><strong>{[...people].sort((a, b) => Math.max(...Object.values(b.xp || { x: 0 })) - Math.max(...Object.values(a.xp || { x: 0 })))[0]?.name}</strong></div></footer>
    </div>
  );

  const renderActive = () => {
    if (activeTab === 'home') return renderHome();
    if (activeTab === 'universe') return renderUniverse();
    if (activeTab === 'coverage') return renderCoverage();
    if (activeTab === 'programming') return renderProgramming();
    if (activeTab === 'development') return renderDevelopment();
    if (activeTab === 'rights') return renderRights();
    if (activeTab === 'talent') return renderTalent();
    if (activeTab === 'research') return renderResearch();
    if (activeTab === 'ratings') return renderRatings();
    if (activeTab === 'commercial') return renderCommercial();
    if (activeTab === 'finance') return renderFinance();
    return renderChronicle();
  };

  return (
    <div className="app-shell">
      <aside className={classNames('sidebar', mobileOpen && 'mobile-open')}>
        <div className="brand-block"><div className="brand-icon"><Radio size={24} /></div><div><strong>{NETWORK.shortName}</strong><span>TV Empire Chronicle</span></div></div>
        <div className="station-card"><span>YOUR COMPANY</span><strong>{NETWORK.channel}</strong><small>{NETWORK.slogan}</small><div><Badge tone="green">Local broadcast</Badge><span>Week {network.week}, {network.year}</span></div></div>
        <nav>{navItems.map(([id, label]) => { const Icon = iconMap[id] || Tv; return <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => { setActiveTab(id); setMobileOpen(false); }}><Icon size={18} /><span>{label}</span>{id === 'development' && projects.some((item) => item.stage === 'Script Ready') && <i className="nav-alert" />}{id === 'rights' && rights.some((item) => item.status === 'Available' && item.deadline <= 5) && <i className="nav-alert amber" />}</button>; })}</nav>
        <div className="sidebar-footer"><div><span>Cash</span><b>{money(network.cash)}</b></div><div><span>Reach</span><b>{households(totalReach)}</b></div><button onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}>Reset universe</button></div>
      </aside>
      {mobileOpen && <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-title"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div><span>Northstar Corporate Portal</span><h1>{navItems.find(([id]) => id === activeTab)?.[1] || 'TV Empire Chronicle'}</h1></div></div>
          <div className="topbar-actions"><div className="period-chip"><CalendarDays size={15} /><span>Week {network.week}</span><b>{network.year}</b></div><button className="icon-button notification"><Bell size={18} /><i /></button><button className="button secondary compact-button" disabled={simulating} onClick={() => simulateWeeks(1)}><Play size={14} fill="currentColor" /> {simulating ? 'Running…' : 'Advance week'}</button><div className="avatar">OR</div></div>
        </header>
        <div className={classNames('content-area', activeTab === 'chronicle' && 'chronicle-bg')}>{renderActive()}</div>
      </main>

      {createOpen && <Modal title="Create a new program" subtitle="Define the creative product. The cost estimate below is calculated from concrete production choices." onClose={() => setCreateOpen(false)} extraWide>
        <div className="creator-layout-v2">
          <div className="creator-form">
            <div className="form-section"><h3>1. Program identity</h3><div className="form-row"><label>Working title<input value={concept.title} onChange={(event) => updateConcept('title', event.target.value)} placeholder="Untitled Northstar project" /></label><label>Category<select value={concept.category} onChange={(event) => updateConcept('category', event.target.value)}>{Object.keys(categoryTree).map((category) => <option key={category}>{category}</option>)}</select></label></div><div className="form-row"><label>Subtype<select value={concept.subtype} onChange={(event) => updateConcept('subtype', event.target.value)}>{categoryTree[concept.category].map((item) => <option key={item.name} value={item.name} disabled={Boolean(item.research && !completedResearch.has(item.research))}>{item.name}{item.research && !completedResearch.has(item.research) ? ' — locked' : ''}</option>)}</select></label><label>Target audience<select value={concept.audience} onChange={(event) => updateConcept('audience', event.target.value)}><option>Families</option><option>Adults 18–34</option><option>Adults 18–49</option><option>Adults 25–54</option><option>Adults 35–64</option><option>Broad audience</option></select></label></div><div className="form-row three"><label>Identity color<input type="color" value={concept.identity.color} onChange={(event) => setConcept((current) => ({ ...current, identity: { ...current.identity, color: event.target.value } }))} /></label><label>Shape<select value={concept.identity.shape} onChange={(event) => setConcept((current) => ({ ...current, identity: { ...current.identity, shape: event.target.value } }))}><option>rounded</option><option>circle</option><option>shield</option><option>diamond</option><option>hex</option><option>pill</option></select></label><label>Icon / initials<input maxLength={3} value={concept.identity.icon} onChange={(event) => setConcept((current) => ({ ...current, identity: { ...current.identity, icon: event.target.value.toUpperCase() } }))} /></label></div></div>
            <div className="form-section"><h3>2. Script and format</h3><div className="form-row three"><label>Cadence<select value={concept.cadence} onChange={(event) => updateConcept('cadence', event.target.value)}><option>Weekly</option><option>Weekdays</option><option>Daily</option><option>Limited event</option><option>Seasonal</option></select></label><label>Episodes<input type="number" min="1" max="260" value={concept.episodes} onChange={(event) => updateConcept('episodes', Number(event.target.value))} /></label><label>Minutes<select value={concept.duration} onChange={(event) => updateConcept('duration', Number(event.target.value))}><option value="30">30</option><option value="60">60</option><option value="90">90</option><option value="120">120</option></select></label></div><label>Story structure<select value={concept.structure} onChange={(event) => updateConcept('structure', event.target.value)}><option>Each episode tells an individual story</option><option>Each season tells one complete story</option><option>The entire show tells one long story</option><option>Continuous unscripted format</option></select></label><label>Closure and momentum<select value={concept.closure} onChange={(event) => updateConcept('closure', event.target.value)}><option>Complete closure every episode</option><option>Mostly closed with a continuing character arc</option><option>Balanced closure and cliffhangers</option><option>Frequent cliffhangers</option><option>One continuous season narrative</option></select></label><div className="form-row"><label>Tone<input value={concept.tone} onChange={(event) => updateConcept('tone', event.target.value)} placeholder="Grounded, warm, tense..." /></label><label>Lead writer / format developer<select value={concept.writerId} onChange={(event) => updateConcept('writerId', event.target.value)}>{people.filter((person) => (person.skills?.Writing || 0) >= 45).map((person) => <option value={person.id} key={person.id}>{person.name} · Writing {person.skills.Writing} · {person.status}</option>)}</select></label></div></div>
            <div className="form-section"><h3>3. Concrete production assumptions</h3><div className="choice-grid">{Object.entries(choiceOptions).map(([key, options]) => <label key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}<select value={concept.choices[key]} onChange={(event) => updateChoice(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></div>
          </div>
          <aside className="creator-preview-v2">
            <div className="preview-poster" style={{ background: `linear-gradient(145deg, ${concept.identity.color}, ${concept.identity.accent})` }}><ContentMark identity={concept.identity} /><Badge tone="light">{concept.category}</Badge><h2>{concept.title || 'Untitled project'}</h2><p>{concept.subtype}</p></div>
            <div className="preview-summary"><div><span>Writing time</span><b>{scriptDuration(concept)} weeks</b></div><div><span>Development spend</span><b>{money(conceptBudget.development, 2)}</b></div><div><span>Estimated cost / episode</span><b>{money(conceptBudget.perEpisode, 2)}</b></div><div><span>Estimated season cost</span><b>{money(conceptBudget.total, 2)}</b></div></div>
            <h4>Cost build-up per episode</h4><div className="cost-lines"><div><span>Category production base</span><b>{money(conceptBudget.base, 3)}</b></div>{conceptBudget.lines.map((line) => <div key={line.key}><span>{line.label}</span><b>+{money(line.cost, 3)}</b></div>)}<div className="cost-total"><span>Estimated episode</span><b>{money(conceptBudget.perEpisode, 3)}</b></div></div>
            <div className="continuous-note">{isContinuousConcept(concept.category, concept.subtype, concept.cadence) ? <><Radio size={16} /><span><b>Continuous production</b><small>Once production begins, this program can enter next week’s schedule while the permanent workflow is finalized.</small></span></> : <><Clapperboard size={16} /><span><b>Batch production</b><small>The season must complete production before it becomes available for programming.</small></span></>}</div>
            <button className="button primary full" onClick={createProject}>Open writers room · {money(conceptBudget.development, 2)}</button>
          </aside>
        </div>
      </Modal>}

      {projectForModal && <Modal title={projectForModal.title} subtitle={`${projectForModal.category} · ${projectForModal.subtype} · ${projectForModal.stage}`} onClose={() => setProjectModal(null)} wide>
        <div className="project-detail-hero"><ContentMark identity={projectForModal.identity} /><div><Badge tone="blue">{projectForModal.stage}</Badge><h3>{projectForModal.title}</h3><p>{projectForModal.note}</p></div></div>
        <div className="project-detail-grid"><div><span>Format</span><b>{projectForModal.cadence} · {projectForModal.episodes} × {projectForModal.duration} min</b></div><div><span>Audience</span><b>{projectForModal.audience}</b></div><div><span>Story structure</span><b>{projectForModal.structure}</b></div><div><span>Closure</span><b>{projectForModal.closure}</b></div><div><span>Writer / developer</span><b>{people.find((person) => person.id === projectForModal.writerId)?.name || 'Internal team'}</b></div><div><span>Estimated episode cost</span><b>{money(projectForModal.estimatedEpisodeCost, 2)}</b></div></div>
        <h4 className="modal-section-title">Creative and production definition</h4><div className="choice-summary">{Object.entries(projectForModal.choices || {}).map(([key, value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}</div>
        {projectForModal.script ? <><h4 className="modal-section-title">Delivered script package</h4><div className="script-report"><div className="script-score"><span>Overall script</span><Stars value={projectForModal.script.quality} /><b>{projectForModal.script.quality}/5</b></div><div><span>Primary roles required</span><b>{projectForModal.script.primaryRoles.join(' · ')}</b></div><div><span>Secondary roles</span><b>{projectForModal.script.secondaryRoles.join(' · ')}</b></div><div><span>Recommended setup</span><b>{Object.values(projectForModal.script.recommended).join(' · ')}</b></div><div className="report-columns"><article><span>Strengths</span>{projectForModal.script.strengths.map((value) => <p key={value}><Check size={13} />{value}</p>)}</article><article><span>Risks</span>{projectForModal.script.risks.map((value) => <p key={value}><AlertTriangle size={13} />{value}</p>)}</article></div></div></> : <div className="waiting-script"><Clock3 size={22} /><span><b>Script development in progress</b><small>{projectForModal.weeksRemaining} weeks remain before the team delivers roles, recommendations, strengths, risks, and a 1–5 quality assessment.</small></span></div>}
        {projectForModal.stage === 'Script Ready' && <button className="button primary full" onClick={() => { setProjectModal(null); setProductionProject(projectForModal.id); }}>Package and authorize production</button>}
        {projectForModal.stage === 'Ready' && <button className="button secondary full" onClick={() => { setProjectModal(null); setActiveTab('programming'); }}>Open programming grid</button>}
      </Modal>}

      {projectForProduction && <Modal title={`Package ${projectForProduction.title}`} subtitle="Select the people who must translate the script into a finished program. Fit matters more than rarity alone." onClose={() => setProductionProject(null)} extraWide>
        <div className="production-package-layout">
          <div className="production-form">
            <div className="script-package-summary"><ContentMark identity={projectForProduction.identity} size="small" /><span><b>{projectForProduction.title}</b><small>{projectForProduction.script.primaryRoles.join(' · ')} · Script {projectForProduction.script.quality}/5</small></span><Stars value={projectForProduction.script.quality} /></div>
            <label>Producer<select value={productionForm.producerId} onChange={(event) => setProductionForm((current) => ({ ...current, producerId: event.target.value }))}>{people.filter((person) => (person.skills?.Producing || 0) >= 45).map((person) => <option key={person.id} value={person.id}>{person.name} · Fit {fitScore(person, projectForProduction, 'producer')} · {person.status}</option>)}</select></label>
            <label>Director / production director<select value={productionForm.directorId} onChange={(event) => setProductionForm((current) => ({ ...current, directorId: event.target.value }))}>{people.filter((person) => (person.skills?.Directing || 0) >= 40).map((person) => <option key={person.id} value={person.id}>{person.name} · Fit {fitScore(person, projectForProduction, 'director')} · {person.status}</option>)}</select></label>
            <label>{projectForProduction.script.primaryRoles[0]}<select value={productionForm.leadId} onChange={(event) => setProductionForm((current) => ({ ...current, leadId: event.target.value }))}>{people.filter((person) => (person.skills?.[roleSkillFor(projectForProduction)] || 0) >= 40).map((person) => <option key={person.id} value={person.id}>{person.name} · Fit {fitScore(person, projectForProduction, 'lead')} · {person.status}</option>)}</select></label>
            <label>Secondary featured role<select value={productionForm.supportingId} onChange={(event) => setProductionForm((current) => ({ ...current, supportingId: event.target.value }))}><option value="">Use internal / procedural talent</option>{people.filter((person) => (person.skills?.[roleSkillFor(projectForProduction)] || 0) >= 35 && person.id !== productionForm.leadId).map((person) => <option key={person.id} value={person.id}>{person.name} · Fit {fitScore(person, projectForProduction, 'lead')}</option>)}</select></label>
            <label>Launch support<select value={productionForm.promote} onChange={(event) => setProductionForm((current) => ({ ...current, promote: event.target.value }))}><option>Quiet launch</option><option>Standard launch</option><option>Premium launch</option></select></label>
            <div className="fit-comparison"><div><span>Producer fit</span><b>{fitScore(people.find((person) => person.id === productionForm.producerId), projectForProduction, 'producer')}</b></div><div><span>Director fit</span><b>{fitScore(people.find((person) => person.id === productionForm.directorId), projectForProduction, 'director')}</b></div><div><span>Lead fit</span><b>{fitScore(people.find((person) => person.id === productionForm.leadId), projectForProduction, 'lead')}</b></div></div>
          </div>
          <aside className="production-preview">
            <h3>Production forecast</h3>
            <div className="production-forecast"><div><span>Format</span><b>{projectForProduction.episodes} × {projectForProduction.duration} min</b></div><div><span>Base season production</span><b>{money(projectForProduction.estimatedEpisodeCost * projectForProduction.episodes, 2)}</b></div><div><span>External talent fees</span><b>{money([productionForm.producerId, productionForm.directorId, productionForm.leadId].map((id) => people.find((person) => person.id === id)).filter((person) => person?.status === 'Market').reduce((sum, person) => sum + (person.fee || 0), 0), 2)}</b></div><div><span>Production behavior</span><b>{isContinuousConcept(projectForProduction.category, projectForProduction.subtype, projectForProduction.cadence) ? 'Can schedule next week' : 'Available after completion'}</b></div></div>
            <div className="recommendation-check"><h4>Script recommendations</h4>{Object.entries(projectForProduction.script.recommended).map(([key, value]) => { const followed = projectForProduction.choices?.[key] === value; return <div key={key} className={followed ? 'followed' : 'not-followed'}>{followed ? <Check size={14} /> : <AlertTriangle size={14} />}<span><b>{key}</b><small>{value} recommended · {projectForProduction.choices?.[key]} selected</small></span></div>; })}</div>
            <button className="button primary full" onClick={beginProduction}>Authorize production</button>
          </aside>
        </div>
      </Modal>}

      {marketModal && (() => { const market = markets.find((item) => item.id === marketModal); return market ? <Modal title={`Enter ${market.name}`} subtitle="Choose a distribution route. Reach, control, speed, cost, and ongoing obligations differ." onClose={() => setMarketModal(null)} wide><div className="market-modal-summary"><div><span>Households</span><b>{households(market.households)}</b></div><div><span>Advertiser demand</span><b>{market.adDemand}/100</b></div><div><span>Competition</span><b>{market.competition}/100</b></div><div><span>Current awareness</span><b>{market.awareness}%</b></div></div><div className="entry-options">{market.options.map((option) => { const locked = option.requirement && !completedResearch.has(option.requirement); return <article key={option.id}><div className="entry-option-head"><Radio size={20} /><div><h3>{option.label}</h3><span>{option.method}</span></div><Badge tone={locked ? 'red' : 'green'}>{locked ? 'Locked' : `${option.weeks} weeks`}</Badge></div><div className="entry-option-stats"><div><span>Upfront</span><b>{money(option.cost, 1)}</b></div><div><span>Weekly</span><b>{money(option.weekly, 2)}</b></div><div><span>Coverage</span><b>{option.coverage}%</b></div><div><span>Effective reach</span><b>{households(option.reach)}</b></div></div>{locked && <p>Requires {research.find((item) => item.id === option.requirement)?.name || option.requirement}.</p>}<button className="button primary full" disabled={locked} onClick={() => startExpansion(market, option)}>{locked ? 'Capability unavailable' : 'Approve market entry'}</button></article>; })}</div></Modal> : null; })()}

      {scheduleCell && <Modal title={`${scheduleCell.day} · ${scheduleCell.part}`} subtitle="Select one available program or rights package for this daypart." onClose={() => setScheduleCell(null)} wide><div className="content-picker">{availableContent.map((content) => <button key={content.id} onClick={() => assignCell(content.id)}><ContentMark identity={content.identity} size="small" /><span><b>{content.title}</b><small>{content.subtype} · {content.source || content.stage || content.type}</small></span><span><b>{content.quality ? Math.round(content.quality) : '—'}</b><small>quality</small></span><ChevronRight size={16} /></button>)}</div></Modal>}

      {campaignOpen && <Modal title="Launch a marketing campaign" subtitle="Marketing can create awareness and sampling. It cannot permanently compensate for poor quality or bad audience fit." onClose={() => setCampaignOpen(false)} wide><div className="campaign-modal-grid"><div><label>Program<select value={campaignForm.showId} onChange={(event) => setCampaignForm((current) => ({ ...current, showId: event.target.value }))}>{availableContent.map((content) => <option value={content.id} key={content.id}>{content.title}</option>)}</select></label><label>Objective<select value={campaignForm.objective} onChange={(event) => setCampaignForm((current) => ({ ...current, objective: event.target.value }))}><option>Tune-in</option><option>Premiere awareness</option><option>Regional launch</option><option>Brand repositioning</option><option>Awards and prestige</option><option>Digital clips</option></select></label><div className="form-row"><label>Total spend<input type="number" step="0.05" min="0.05" value={campaignForm.spend} onChange={(event) => setCampaignForm((current) => ({ ...current, spend: Number(event.target.value) }))} /></label><label>Weeks<input type="number" min="1" max="12" value={campaignForm.weeks} onChange={(event) => setCampaignForm((current) => ({ ...current, weeks: Number(event.target.value) }))} /></label></div><button className="button primary full" onClick={launchCampaign}>Launch campaign · {money(campaignForm.spend, 2)}</button></div><div className="campaign-preview"><Megaphone size={30} /><span>Estimated awareness lift</span><strong>+{clamp(Math.round(Number(campaignForm.spend) * 22 + 2), 2, 12)}</strong><p>The lift applies while the campaign is live. Strong premieres convert that sampling into lasting buzz; weak programs lose most of it.</p></div></div></Modal>}

      <Toast value={toast} />
    </div>
  );
}
