import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
  Building2, CalendarDays, Check, ChevronDown, ChevronRight, CircleDollarSign, Clapperboard,
  Clock3, DollarSign, FileText, Film, Gauge, Handshake, LayoutDashboard, Lightbulb, LineChart,
  Megaphone, Menu, Newspaper, PackageCheck, Play, Plus, Radio, Search, Settings2, Sparkles,
  Star, Target, TrendingUp, Trophy, Tv, UserRoundSearch, UsersRound, WalletCards, X,
} from './icons';
import {
  NETWORK, advertisers, competitorMoves, initialCampaigns, initialDeals, initialDevelopment,
  initialNews, initialPeople, initialSchedule, initialShows, navItems,
} from './data';

const STORAGE_KEY = 'tv-empire-chronicle-v1';

const iconMap = {
  home: LayoutDashboard,
  programming: CalendarDays,
  development: Lightbulb,
  talent: UserRoundSearch,
  ratings: BarChart3,
  sales: Handshake,
  marketing: Megaphone,
  finance: LineChart,
  operations: Settings2,
  chronicle: Newspaper,
};

const money = (value, digits = 1) => `$${Number(value).toFixed(digits)}M`;
const pct = (value) => `${Math.round(value)}%`;
const classNames = (...items) => items.filter(Boolean).join(' ');
const randomBetween = (min, max) => min + Math.random() * (max - min);

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveState(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // The prototype remains fully playable if browser storage is unavailable.
  }
}

function Trend({ value, compact = false }) {
  const positive = value >= 0;
  return (
    <span className={classNames('trend', positive ? 'positive' : 'negative', compact && 'compact')}>
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value).toFixed(compact ? 0 : 1)}%
    </span>
  );
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Rarity({ value }) {
  return <span className={`rarity rarity-${value.toLowerCase()}`}>{value}</span>;
}

function Progress({ value, label }) {
  return (
    <div className="progress-wrap">
      {label && <div className="progress-label"><span>{label}</span><strong>{Math.round(value)}%</strong></div>}
      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={classNames('modal', wide && 'modal-wide')} onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose}><X size={18} /></button>
        <div className="modal-heading">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.tone || 'success'}`}>
      {toast.tone === 'warning' ? <AlertTriangle size={18} /> : <Check size={18} />}
      <div><strong>{toast.title}</strong><span>{toast.body}</span></div>
    </div>
  );
}

export default function App() {
  const saved = useMemo(() => loadState(), []);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [week, setWeek] = useState(saved?.week || 14);
  const [year, setYear] = useState(saved?.year || 2026);
  const [cash, setCash] = useState(saved?.cash || 184.6);
  const [subscribers, setSubscribers] = useState(saved?.subscribers || 12.8);
  const [reputation, setReputation] = useState(saved?.reputation || 74);
  const [boardConfidence, setBoardConfidence] = useState(saved?.boardConfidence || 68);
  const [shows, setShows] = useState(saved?.shows || initialShows);
  const [schedule, setSchedule] = useState(saved?.schedule || initialSchedule);
  const [people, setPeople] = useState(saved?.people || initialPeople);
  const [development, setDevelopment] = useState(saved?.development || initialDevelopment);
  const [deals, setDeals] = useState(saved?.deals || initialDeals);
  const [campaigns, setCampaigns] = useState(saved?.campaigns || initialCampaigns);
  const [news, setNews] = useState(saved?.news || initialNews);
  const [pendingOffers, setPendingOffers] = useState(saved?.pendingOffers || []);
  const [talentFilter, setTalentFilter] = useState('All');
  const [talentSearch, setTalentSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [offerPerson, setOfferPerson] = useState(null);
  const [offerForm, setOfferForm] = useState({ fee: 1.5, years: 2, role: 'Lead role', control: false });
  const [showCreatorOpen, setShowCreatorOpen] = useState(false);
  const [concept, setConcept] = useState({ title: '', genre: 'Drama', format: 'One-hour scripted', tone: 'Prestige', audience: 'Adults 25–54', budget: 2.8 });
  const [salesAdvertiser, setSalesAdvertiser] = useState(null);
  const [salesForm, setSalesForm] = useState({ package: 'Prime-time rotation', cpm: 35, weeks: 8 });
  const [campaignModal, setCampaignModal] = useState(null);
  const [campaignForm, setCampaignForm] = useState({ show: 'Second Chances', type: 'Tune-in', spend: 0.6, weeks: 3 });
  const [toast, setToast] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const totalViewers = shows.reduce((sum, item) => sum + item.viewers, 0);
  const weeklyRevenue = shows.reduce((sum, item) => sum + item.revenue, 0) + deals.reduce((sum, item) => sum + item.value / Math.max(item.weeks, 1), 0);
  const weeklyCost = shows.reduce((sum, item) => sum + item.cost, 0) + campaigns.reduce((sum, item) => sum + item.spend / Math.max(item.weeks, 1), 0);
  const operatingProfit = weeklyRevenue - weeklyCost;
  const averageAudience = shows.reduce((sum, item) => sum + item.audience, 0) / shows.length;
  const averageCritic = shows.reduce((sum, item) => sum + item.critic, 0) / shows.length;

  const persist = (overrides = {}) => {
    saveState({
      week, year, cash, subscribers, reputation, boardConfidence, shows, schedule, people,
      development, deals, campaigns, news, pendingOffers,
      ...overrides,
    });
  };

  const notify = (title, body, tone = 'success') => {
    setToast({ title, body, tone });
    window.setTimeout(() => setToast(null), 3600);
  };

  const simulateWeeks = async (count) => {
    if (simulating) return;
    setSimulating(true);
    await new Promise((resolve) => window.setTimeout(resolve, 320));

    let newWeek = week;
    let newYear = year;
    let newCash = cash;
    let newSubscribers = subscribers;
    let newReputation = reputation;
    let newBoard = boardConfidence;
    let nextShows = [...shows];
    let nextDevelopment = [...development];
    let nextCampaigns = [...campaigns];
    let nextOffers = [...pendingOffers];
    let nextPeople = [...people];
    let generatedNews = [...news];

    for (let index = 0; index < count; index += 1) {
      newWeek += 1;
      if (newWeek > 52) {
        newWeek = 1;
        newYear += 1;
      }

      const campaignLiftByShow = nextCampaigns.reduce((map, campaign) => {
        map[campaign.show] = (map[campaign.show] || 0) + campaign.lift;
        return map;
      }, {});

      nextShows = nextShows.map((show) => {
        const campaignLift = campaignLiftByShow[show.title] || 0;
        const fundamentals = (show.quality - 75) * 0.015 + (show.buzz - 60) * 0.012;
        const volatility = randomBetween(-0.75, 0.75);
        const growth = fundamentals + campaignLift * 0.025 + volatility;
        const viewers = Math.max(0.7, show.viewers + growth);
        const trend = ((viewers - show.viewers) / show.viewers) * 100;
        const buzz = Math.max(20, Math.min(100, show.buzz + trend * 0.35 + randomBetween(-2, 2)));
        const revenue = Math.max(0.6, viewers * (show.target.includes('18–34') ? 0.63 : 0.56) + buzz * 0.018);
        return { ...show, viewers, trend, buzz, revenue, share: Math.max(2, viewers * 1.65 + randomBetween(-0.5, 0.5)) };
      });

      nextDevelopment = nextDevelopment.map((project) => ({
        ...project,
        progress: Math.min(100, project.progress + randomBetween(2, 7)),
        weeks: Math.max(0, project.weeks - 1),
      }));

      nextCampaigns = nextCampaigns
        .map((campaign) => ({ ...campaign, weeks: campaign.weeks - 1 }))
        .filter((campaign) => campaign.weeks > 0);

      nextOffers = nextOffers.map((offer) => {
        if (offer.status !== 'Pending' || offer.weeks > 1) return { ...offer, weeks: offer.weeks - 1 };
        const person = nextPeople.find((item) => item.id === offer.personId);
        const premium = offer.fee / Math.max(person?.fee || 1, 0.1);
        const chance = Math.min(0.9, 0.28 + premium * 0.34 + (offer.control ? 0.08 : 0));
        const accepted = Math.random() < chance;
        if (accepted && person) {
          nextPeople = nextPeople.map((item) => item.id === person.id ? { ...item, availability: `Signed to ${NETWORK.shortName}` } : item);
          newCash -= offer.fee * 0.25;
        }
        return { ...offer, status: accepted ? 'Accepted' : 'Declined', weeks: 0 };
      });

      const revenue = nextShows.reduce((sum, show) => sum + show.revenue, 0) + deals.reduce((sum, deal) => sum + deal.value / Math.max(deal.weeks, 1), 0) + subscribers * 0.21;
      const cost = nextShows.reduce((sum, show) => sum + show.cost, 0) + nextCampaigns.reduce((sum, campaign) => sum + campaign.spend / Math.max(campaign.weeks, 1), 0) + 4.8;
      newCash += (revenue - cost) * 0.14;
      const hit = [...nextShows].sort((a, b) => b.trend - a.trend)[0];
      const miss = [...nextShows].sort((a, b) => a.trend - b.trend)[0];
      newSubscribers = Math.max(5, newSubscribers + (hit.trend > 4 ? 0.08 : -0.02) + randomBetween(-0.03, 0.04));
      newReputation = Math.max(20, Math.min(100, newReputation + (averageCritic > 75 ? 0.25 : -0.1) + randomBetween(-0.25, 0.25)));
      newBoard = Math.max(10, Math.min(100, newBoard + ((revenue - cost) > 0 ? 0.5 : -1.1) + randomBetween(-0.4, 0.4)));

      generatedNews = [
        {
          id: Date.now() + index,
          tag: 'Weekly Briefing',
          headline: `${hit.title} leads Northstar’s week with a ${hit.trend >= 0 ? '+' : ''}${hit.trend.toFixed(0)}% audience move`,
          body: `${hit.title} reached ${hit.viewers.toFixed(1)}M viewers. ${miss.title} was the softest performer at ${miss.viewers.toFixed(1)}M and is now drawing a closer programming review.`,
          importance: 'Lead story',
        },
        ...generatedNews,
      ].slice(0, 12);
    }

    setWeek(newWeek);
    setYear(newYear);
    setCash(newCash);
    setSubscribers(newSubscribers);
    setReputation(newReputation);
    setBoardConfidence(newBoard);
    setShows(nextShows);
    setDevelopment(nextDevelopment);
    setCampaigns(nextCampaigns);
    setPendingOffers(nextOffers);
    setPeople(nextPeople);
    setNews(generatedNews);
    persist({
      week: newWeek, year: newYear, cash: newCash, subscribers: newSubscribers,
      reputation: newReputation, boardConfidence: newBoard, shows: nextShows,
      development: nextDevelopment, campaigns: nextCampaigns, pendingOffers: nextOffers,
      people: nextPeople, news: generatedNews,
    });
    setSimulating(false);
    notify('Simulation complete', `Advanced to Week ${newWeek}, ${newYear}. The executive briefing has been refreshed.`);
  };

  const updateSchedule = (day, time, showId) => {
    const next = { ...schedule, [day]: { ...schedule[day], [time]: showId } };
    setSchedule(next);
    persist({ schedule: next });
    notify('Schedule updated', `${day} at ${time} PM has been reassigned.`);
  };

  const submitOffer = () => {
    if (!offerPerson) return;
    const offer = {
      id: `offer-${Date.now()}`,
      personId: offerPerson.id,
      person: offerPerson.name,
      fee: Number(offerForm.fee),
      years: Number(offerForm.years),
      role: offerForm.role,
      control: offerForm.control,
      weeks: 1,
      status: 'Pending',
    };
    const next = [offer, ...pendingOffers];
    setPendingOffers(next);
    persist({ pendingOffers: next });
    setOfferPerson(null);
    notify('Offer delivered', `${offerPerson.name}'s representatives will respond after the next simulated week.`);
  };

  const conceptScores = useMemo(() => {
    const genreBase = { Drama: 84, Comedy: 79, Reality: 67, News: 76, 'Limited series': 90 }[concept.genre] || 76;
    const toneCreative = { Prestige: 8, Accessible: 1, Edgy: 4, Family: -2 }[concept.tone] || 0;
    const toneCommercial = { Prestige: -4, Accessible: 9, Edgy: 3, Family: 7 }[concept.tone] || 0;
    const budgetEffect = (Number(concept.budget) - 2.5) * 2.2;
    return {
      creative: Math.max(45, Math.min(97, genreBase + toneCreative + budgetEffect)),
      commercial: Math.max(40, Math.min(96, 73 + toneCommercial + (concept.audience.includes('18–34') ? 4 : 0) - Math.max(0, Number(concept.budget) - 4) * 2)),
      risk: Number(concept.budget) >= 4.5 ? 'High' : Number(concept.budget) >= 2.5 ? 'Medium' : 'Low',
    };
  }, [concept]);

  const greenlightConcept = () => {
    if (!concept.title.trim()) {
      notify('Title required', 'Give the project a working title before greenlighting.', 'warning');
      return;
    }
    const project = {
      id: `dev-${Date.now()}`,
      title: concept.title.trim(),
      stage: 'Concept approved',
      genre: `${concept.tone} ${concept.genre.toLowerCase()}`,
      budget: Number(concept.budget),
      creative: Math.round(conceptScores.creative),
      commercial: Math.round(conceptScores.commercial),
      progress: 8,
      owner: concept.genre,
      weeks: 20,
      note: `${concept.format}; targeting ${concept.audience}. Packaging has begun.`,
    };
    const next = [project, ...development];
    setDevelopment(next);
    setCash((value) => value - 0.35);
    persist({ development: next, cash: cash - 0.35 });
    setShowCreatorOpen(false);
    setConcept({ title: '', genre: 'Drama', format: 'One-hour scripted', tone: 'Prestige', audience: 'Adults 25–54', budget: 2.8 });
    notify('Project greenlit', `${project.title} has entered active development with an initial $350K commitment.`);
  };

  const closeDeal = () => {
    if (!salesAdvertiser) return;
    const requested = Number(salesForm.cpm);
    const threshold = salesAdvertiser.ask * randomBetween(0.94, 1.08);
    if (requested < threshold) {
      notify('Counteroffer received', `${salesAdvertiser.name} will not approve below a $${Math.ceil(threshold)} CPM.`, 'warning');
      return;
    }
    const value = requested * Number(salesForm.weeks) * 0.017 * (salesAdvertiser.fit / 80);
    const deal = {
      id: `deal-${Date.now()}`,
      advertiser: salesAdvertiser.name,
      package: salesForm.package,
      weeks: Number(salesForm.weeks),
      value,
      cpm: requested,
      status: 'Active',
    };
    const next = [deal, ...deals];
    setDeals(next);
    setSalesAdvertiser(null);
    persist({ deals: next });
    notify('Agreement signed', `${salesAdvertiser.name} committed ${money(value)} across ${deal.weeks} weeks.`);
  };

  const launchCampaign = () => {
    const template = campaignModal;
    const show = shows.find((item) => item.title === campaignForm.show);
    const lift = Math.round((Number(campaignForm.spend) * 7 + (template?.efficiency || 2)) * (show?.buzz < 60 ? 1.15 : 0.9));
    const campaign = {
      id: `campaign-${Date.now()}`,
      name: `${campaignForm.show} — ${template?.name || campaignForm.type}`,
      show: campaignForm.show,
      type: campaignForm.type,
      spend: Number(campaignForm.spend),
      weeks: Number(campaignForm.weeks),
      lift: Math.max(2, Math.min(14, lift)),
      status: 'Live',
    };
    const next = [campaign, ...campaigns];
    setCampaigns(next);
    setCash((value) => value - campaign.spend);
    persist({ campaigns: next, cash: cash - campaign.spend });
    setCampaignModal(null);
    notify('Campaign launched', `${campaign.name} is now live with a projected ${campaign.lift}% awareness lift.`);
  };

  const resetUniverse = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'programming': return <Programming shows={shows} schedule={schedule} updateSchedule={updateSchedule} />;
      case 'development': return <Development development={development} onCreate={() => setShowCreatorOpen(true)} />;
      case 'talent': return <Talent people={people} filter={talentFilter} setFilter={setTalentFilter} search={talentSearch} setSearch={setTalentSearch} selectedPerson={selectedPerson} setSelectedPerson={setSelectedPerson} setOfferPerson={setOfferPerson} offers={pendingOffers} />;
      case 'ratings': return <Ratings shows={shows} averageAudience={averageAudience} averageCritic={averageCritic} />;
      case 'sales': return <Sales deals={deals} setAdvertiser={setSalesAdvertiser} />;
      case 'marketing': return <Marketing campaigns={campaigns} setCampaignModal={setCampaignModal} />;
      case 'finance': return <Finance shows={shows} weeklyRevenue={weeklyRevenue} weeklyCost={weeklyCost} operatingProfit={operatingProfit} cash={cash} subscribers={subscribers} />;
      case 'operations': return <Operations development={development} shows={shows} />;
      case 'chronicle': return <Chronicle news={news} week={week} year={year} />;
      default: return <Home shows={shows} week={week} year={year} cash={cash} subscribers={subscribers} reputation={reputation} boardConfidence={boardConfidence} totalViewers={totalViewers} weeklyRevenue={weeklyRevenue} operatingProfit={operatingProfit} schedule={schedule} setActiveTab={setActiveTab} />;
    }
  };

  const activeLabel = navItems.find(([key]) => key === activeTab)?.[1] || 'Executive Home';

  return (
    <div className="app-shell">
      <Toast toast={toast} />
      <aside className={classNames('sidebar', mobileOpen && 'mobile-open')}>
        <div className="brand">
          <div className="brand-mark"><Radio size={22} /></div>
          <div><strong>{NETWORK.shortName}</strong><span>Executive Network</span></div>
        </div>
        <div className="network-card">
          <span>CEO workspace</span>
          <strong>{NETWORK.name}</strong>
          <small>Broadcast · Streaming · Studios</small>
        </div>
        <nav>
          {navItems.map(([key, label]) => {
            const Icon = iconMap[key];
            return (
              <button key={key} className={classNames('nav-item', activeTab === key && 'active')} onClick={() => { setActiveTab(key); setMobileOpen(false); }}>
                <Icon size={18} />
                <span>{label}</span>
                {key === 'home' && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="fiscal-card">
            <span>Board confidence</span>
            <strong>{Math.round(boardConfidence)}%</strong>
            <Progress value={boardConfidence} />
          </div>
          <button className="sidebar-link" onClick={resetUniverse}><Settings2 size={16} /> Reset prototype</button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileOpen((value) => !value)}><Menu size={21} /></button>
            <div>
              <span className="eyebrow">Northstar intranet</span>
              <h1>{activeLabel}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="period-chip"><CalendarDays size={16} /><span>Week {week}, {year}</span></div>
            <button className="icon-button notification"><Bell size={18} /><span>3</span></button>
            <div className="simulate-group">
              <button className="button button-primary" onClick={() => simulateWeeks(1)} disabled={simulating}>
                <Play size={16} fill="currentColor" /> {simulating ? 'Simulating…' : 'Next week'}
              </button>
              <button className="button button-secondary compact-button" onClick={() => simulateWeeks(4)} disabled={simulating}>+4 weeks</button>
            </div>
            <div className="avatar">OR</div>
          </div>
        </header>
        <div className="content-area">{renderContent()}</div>
      </main>

      {showCreatorOpen && (
        <Modal title="Create a new project" subtitle="Define the creative and commercial thesis. The studio will package the talent after approval." onClose={() => setShowCreatorOpen(false)} wide>
          <div className="creator-grid">
            <div className="form-panel">
              <label>Working title<input value={concept.title} onChange={(event) => setConcept({ ...concept, title: event.target.value })} placeholder="e.g. The Last Broadcast" /></label>
              <div className="form-row">
                <label>Genre<select value={concept.genre} onChange={(event) => setConcept({ ...concept, genre: event.target.value })}><option>Drama</option><option>Comedy</option><option>Reality</option><option>News</option><option>Limited series</option></select></label>
                <label>Format<select value={concept.format} onChange={(event) => setConcept({ ...concept, format: event.target.value })}><option>One-hour scripted</option><option>Half-hour scripted</option><option>Limited series</option><option>Unscripted competition</option><option>Daily strip</option></select></label>
              </div>
              <div className="form-row">
                <label>Tone<select value={concept.tone} onChange={(event) => setConcept({ ...concept, tone: event.target.value })}><option>Prestige</option><option>Accessible</option><option>Edgy</option><option>Family</option></select></label>
                <label>Target audience<select value={concept.audience} onChange={(event) => setConcept({ ...concept, audience: event.target.value })}><option>Adults 18–34</option><option>Adults 18–49</option><option>Adults 25–54</option><option>Adults 35–64</option><option>Families</option></select></label>
              </div>
              <label>Target cost per episode<div className="range-row"><input type="range" min="0.5" max="7" step="0.1" value={concept.budget} onChange={(event) => setConcept({ ...concept, budget: event.target.value })} /><strong>{money(concept.budget)}</strong></div></label>
            </div>
            <div className="concept-preview">
              <span className="eyebrow">Development assessment</span>
              <div className="concept-title">{concept.title || 'Untitled project'}</div>
              <p>{concept.tone} {concept.genre.toLowerCase()} · {concept.format}<br />Designed for {concept.audience}</p>
              <div className="score-orbs">
                <div><strong>{Math.round(conceptScores.creative)}</strong><span>Creative ceiling</span></div>
                <div><strong>{Math.round(conceptScores.commercial)}</strong><span>Commercial appeal</span></div>
              </div>
              <div className="preview-lines">
                <div><span>Risk profile</span><Badge tone={conceptScores.risk === 'High' ? 'danger' : conceptScores.risk === 'Medium' ? 'warning' : 'success'}>{conceptScores.risk}</Badge></div>
                <div><span>Initial commitment</span><strong>$350K</strong></div>
                <div><span>Est. packaging</span><strong>18–22 weeks</strong></div>
              </div>
              <button className="button button-primary full" onClick={greenlightConcept}><Sparkles size={16} /> Greenlight development</button>
            </div>
          </div>
        </Modal>
      )}

      {offerPerson && (
        <Modal title={`Make an offer to ${offerPerson.name}`} subtitle={`${offerPerson.agency} · Current quote ${money(offerPerson.fee)} per season/project`} onClose={() => setOfferPerson(null)}>
          <div className="offer-person-summary"><div className="person-avatar large">{offerPerson.name.split(' ').map((part) => part[0]).join('')}</div><div><Rarity value={offerPerson.rarity} /><h3>{offerPerson.role}</h3><p>{offerPerson.credits}</p></div></div>
          <div className="form-row">
            <label>Annual / project fee ($M)<input type="number" min="0.1" step="0.1" value={offerForm.fee} onChange={(event) => setOfferForm({ ...offerForm, fee: event.target.value })} /></label>
            <label>Term<select value={offerForm.years} onChange={(event) => setOfferForm({ ...offerForm, years: event.target.value })}><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option></select></label>
          </div>
          <label>Proposed role<input value={offerForm.role} onChange={(event) => setOfferForm({ ...offerForm, role: event.target.value })} /></label>
          <label className="check-row"><input type="checkbox" checked={offerForm.control} onChange={(event) => setOfferForm({ ...offerForm, control: event.target.checked })} /><span><strong>Include meaningful creative control</strong><small>Improves acceptance odds but limits later intervention.</small></span></label>
          <div className="deal-summary"><span>Guaranteed headline value</span><strong>{money(Number(offerForm.fee) * Number(offerForm.years))}</strong></div>
          <button className="button button-primary full" onClick={submitOffer}><Handshake size={16} /> Send formal offer</button>
        </Modal>
      )}

      {salesAdvertiser && (
        <Modal title={`Negotiate with ${salesAdvertiser.name}`} subtitle={`${salesAdvertiser.category} · ${salesAdvertiser.preference}`} onClose={() => setSalesAdvertiser(null)}>
          <div className="advertiser-header"><div className="company-logo">{salesAdvertiser.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><strong>{money(salesAdvertiser.budget)} available budget</strong><span>{salesAdvertiser.fit}% Northstar audience fit</span></div></div>
          <label>Inventory package<select value={salesForm.package} onChange={(event) => setSalesForm({ ...salesForm, package: event.target.value })}><option>Prime-time rotation</option><option>Prestige drama package</option><option>Comedy + social package</option><option>News and current affairs</option><option>Presenting sponsorship</option></select></label>
          <div className="form-row">
            <label>CPM proposal ($)<input type="number" min="15" max="80" value={salesForm.cpm} onChange={(event) => setSalesForm({ ...salesForm, cpm: event.target.value })} /></label>
            <label>Campaign length<select value={salesForm.weeks} onChange={(event) => setSalesForm({ ...salesForm, weeks: event.target.value })}><option value="4">4 weeks</option><option value="8">8 weeks</option><option value="12">12 weeks</option><option value="20">20 weeks</option></select></label>
          </div>
          <div className="negotiation-meter"><span>Buyer target: ${salesAdvertiser.ask} CPM</span><Progress value={(Number(salesForm.cpm) / salesAdvertiser.ask) * 70} /></div>
          <button className="button button-primary full" onClick={closeDeal}><CircleDollarSign size={16} /> Submit proposal</button>
        </Modal>
      )}

      {campaignModal && (
        <Modal title={`Launch ${campaignModal.name}`} subtitle={campaignModal.description} onClose={() => setCampaignModal(null)}>
          <label>Featured show<select value={campaignForm.show} onChange={(event) => setCampaignForm({ ...campaignForm, show: event.target.value })}>{shows.map((show) => <option key={show.id}>{show.title}</option>)}</select></label>
          <div className="form-row">
            <label>Objective<select value={campaignForm.type} onChange={(event) => setCampaignForm({ ...campaignForm, type: event.target.value })}><option>Tune-in</option><option>Awareness</option><option>Subscriber acquisition</option><option>Awards</option><option>Repositioning</option></select></label>
            <label>Length<select value={campaignForm.weeks} onChange={(event) => setCampaignForm({ ...campaignForm, weeks: event.target.value })}><option value="2">2 weeks</option><option value="3">3 weeks</option><option value="4">4 weeks</option><option value="6">6 weeks</option></select></label>
          </div>
          <label>Media spend<div className="range-row"><input type="range" min="0.2" max="3" step="0.1" value={campaignForm.spend} onChange={(event) => setCampaignForm({ ...campaignForm, spend: event.target.value })} /><strong>{money(campaignForm.spend)}</strong></div></label>
          <div className="deal-summary"><span>Projected awareness lift</span><strong>+{Math.round(Number(campaignForm.spend) * 7 + campaignModal.efficiency)}%</strong></div>
          <button className="button button-primary full" onClick={launchCampaign}><Megaphone size={16} /> Approve campaign</button>
        </Modal>
      )}
    </div>
  );
}

function Home({ shows, week, year, cash, subscribers, reputation, boardConfidence, totalViewers, weeklyRevenue, operatingProfit, schedule, setActiveTab }) {
  const topShows = [...shows].sort((a, b) => b.viewers - a.viewers).slice(0, 4);
  const breakout = [...shows].sort((a, b) => b.trend - a.trend)[0];
  const danger = [...shows].sort((a, b) => a.trend - b.trend)[0];
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const tonight = schedule[day] || schedule.Monday;
  const getShow = (id) => shows.find((show) => show.id === id);
  return (
    <div className="page-stack">
      <section className="hero-banner">
        <div>
          <span className="eyebrow light">Executive briefing · Week {week}</span>
          <h2>Northstar’s momentum is improving, but one expensive freshman drama needs a decision.</h2>
          <p>Second Chances is becoming a genuine comedy franchise while The Harbor remains the company’s prestige engine. Legacy Code is now below the renewal threshold.</p>
          <div className="hero-actions"><button className="button button-light" onClick={() => setActiveTab('programming')}>Review programming</button><button className="button button-ghost-light" onClick={() => setActiveTab('chronicle')}>Read full briefing <ChevronRight size={16} /></button></div>
        </div>
        <div className="hero-score">
          <span>Enterprise health</span>
          <strong>78</strong>
          <div className="hero-score-grid"><div><small>Creative</small><b>{Math.round(reputation)}</b></div><div><small>Board</small><b>{Math.round(boardConfidence)}</b></div><div><small>Growth</small><b>81</b></div></div>
        </div>
      </section>

      <section className="kpi-grid">
        <Kpi icon={WalletCards} label="Available cash" value={money(cash)} trend={4.8} note="vs. quarterly plan" />
        <Kpi icon={UsersRound} label="Streaming subscribers" value={`${subscribers.toFixed(1)}M`} trend={6.2} note="Northstar+ paid accounts" />
        <Kpi icon={Tv} label="Weekly audience" value={`${totalViewers.toFixed(1)}M`} trend={3.7} note="unduplicated reach" />
        <Kpi icon={CircleDollarSign} label="Operating contribution" value={money(operatingProfit)} trend={operatingProfit > 0 ? 8.4 : -8.4} note={`${money(weeklyRevenue)} gross revenue`} />
      </section>

      <section className="dashboard-grid">
        <div className="card span-2">
          <div className="card-header"><div><span className="eyebrow">Audience performance</span><h3>Top Northstar programs</h3></div><button className="text-button" onClick={() => setActiveTab('ratings')}>Open Nielsen Center <ChevronRight size={15} /></button></div>
          <div className="show-ranking">
            {topShows.map((show, index) => (
              <div className="show-rank-row" key={show.id}>
                <span className="rank-number">{index + 1}</span>
                <div className="show-swatch" style={{ background: show.color }}><span>{show.title.slice(0, 1)}</span></div>
                <div className="show-rank-copy"><strong>{show.title}</strong><span>{show.genre} · {show.target}</span></div>
                <div className="audience-bar"><div style={{ width: `${Math.min(100, show.viewers * 10)}%` }} /></div>
                <strong className="viewer-value">{show.viewers.toFixed(1)}M</strong>
                <Trend value={show.trend} compact />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><span className="eyebrow">Tonight on Northstar</span><h3>{day} lineup</h3></div><Radio size={19} /></div>
          <div className="tonight-list">
            {Object.entries(tonight).map(([time, id]) => {
              const show = getShow(id);
              return <div key={time}><span>{time} PM</span><div><strong>{show?.title}</strong><small>{show?.format} · {show?.viewers.toFixed(1)}M latest</small></div><ChevronRight size={15} /></div>;
            })}
          </div>
          <button className="button button-secondary full" onClick={() => setActiveTab('programming')}>Manage schedule</button>
        </div>

        <div className="card decision-card">
          <div className="card-header"><div><span className="eyebrow">CEO decision queue</span><h3>3 items require attention</h3></div><AlertTriangle size={19} /></div>
          <Decision tone="success" title={`Accelerate ${breakout.title}`} body={`Audience is up ${breakout.trend.toFixed(0)}%; additional marketing could lock in the breakout.`} />
          <Decision tone="danger" title={`Review ${danger.title}`} body={`${danger.viewers.toFixed(1)}M viewers and ${danger.trend.toFixed(0)}% weekly trend against a ${money(danger.cost)} episode cost.`} />
          <Decision tone="warning" title="Elena Cruz is available" body="Prestige limited-series package requires a formal offer before rival bids arrive." />
          <button className="text-button wide-link" onClick={() => setActiveTab('talent')}>Open all active decisions <ChevronRight size={15} /></button>
        </div>

        <div className="card span-2">
          <div className="card-header"><div><span className="eyebrow">Market intelligence</span><h3>Competitor moves</h3></div><Building2 size={19} /></div>
          <div className="competitor-list">
            {competitorMoves.map((item) => <div key={item.network}><div className="network-pill">{item.network}</div><div><strong>{item.move}</strong><span>{item.impact}</span></div></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, trend, note }) {
  return <div className="kpi-card"><div className="kpi-icon"><Icon size={20} /></div><div className="kpi-main"><span>{label}</span><strong>{value}</strong></div><div className="kpi-foot"><Trend value={trend} compact /><span>{note}</span></div></div>;
}

function Decision({ tone, title, body }) {
  return <div className="decision-row"><span className={`decision-dot ${tone}`} /><div><strong>{title}</strong><span>{body}</span></div><ChevronRight size={16} /></div>;
}

function Programming({ shows, schedule, updateSchedule }) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [editing, setEditing] = useState(false);
  const getShow = (id) => shows.find((show) => show.id === id);
  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Programming command center</span><h2>Build the schedule, protect franchises, and manage audience flow.</h2><p>Lead-ins, competition, audience compatibility, and cost all affect performance. Changes apply immediately to the next simulated week.</p></div><button className={classNames('button', editing ? 'button-primary' : 'button-secondary')} onClick={() => setEditing((value) => !value)}><Settings2 size={16} /> {editing ? 'Finish editing' : 'Edit schedule'}</button></section>
      <div className="day-tabs">{Object.keys(schedule).map((day) => <button className={selectedDay === day ? 'active' : ''} key={day} onClick={() => setSelectedDay(day)}>{day}</button>)}</div>
      <section className="programming-layout">
        <div className="card schedule-card">
          <div className="schedule-header"><div><span>Time</span><span>Program</span></div><div><span>Latest audience</span><span>Economics</span><span>Outlook</span></div></div>
          {Object.entries(schedule[selectedDay]).map(([time, id]) => {
            const show = getShow(id);
            return (
              <div className="schedule-row" key={time}>
                <div className="schedule-time"><strong>{time}</strong><small>PM</small></div>
                <div className="schedule-program">
                  <div className="show-poster mini" style={{ background: `linear-gradient(145deg, ${show.color}, #152234)` }}><span>{show.title}</span></div>
                  <div>{editing ? <select value={id} onChange={(event) => updateSchedule(selectedDay, time, event.target.value)}>{shows.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select> : <><strong>{show.title}</strong><span>{show.genre} · Season {show.seasons}</span></>}</div>
                </div>
                <div className="schedule-stat"><strong>{show.viewers.toFixed(1)}M</strong><span>{show.share.toFixed(1)} share</span></div>
                <div className="schedule-stat"><strong>{money(show.revenue - show.cost)}</strong><span>weekly contribution</span></div>
                <div className="schedule-outlook"><Trend value={show.trend} /><Badge tone={show.trend > 4 ? 'success' : show.trend < -5 ? 'danger' : 'neutral'}>{show.trend > 4 ? 'Growing' : show.trend < -5 ? 'At risk' : 'Stable'}</Badge></div>
              </div>
            );
          })}
        </div>
        <div className="side-stack">
          <div className="card"><div className="card-header"><div><span className="eyebrow">Audience flow</span><h3>{selectedDay} compatibility</h3></div><Gauge size={18} /></div><div className="flow-score"><strong>81</strong><span>Strong lineup</span></div><p className="muted-copy">The night has a clear adult audience, but the 9 PM slot loses younger viewers coming out of the opener.</p><div className="mini-metrics"><div><span>Lead-in retention</span><strong>86%</strong></div><div><span>Brand consistency</span><strong>91%</strong></div><div><span>Cost efficiency</span><strong>68%</strong></div></div></div>
          <div className="card"><div className="card-header"><div><span className="eyebrow">Competitive grid</span><h3>Key threats</h3></div><Target size={18} /></div><div className="threat-list"><div><span>8 PM</span><strong>Apex: Mercy General</strong><Badge tone="warning">Strong</Badge></div><div><span>9 PM</span><strong>Vista+: Crownfall</strong><Badge tone="danger">Very strong</Badge></div><div><span>10 PM</span><strong>United: Night Report</strong><Badge tone="neutral">Moderate</Badge></div></div></div>
        </div>
      </section>
      <section className="card"><div className="card-header"><div><span className="eyebrow">Portfolio review</span><h3>All active programs</h3></div><FileText size={18} /></div><div className="table-wrap"><table><thead><tr><th>Program</th><th>Status</th><th>Audience</th><th>Critic</th><th>Buzz</th><th>Cost / ep.</th><th>Contribution</th><th>Decision</th></tr></thead><tbody>{shows.map((show) => <tr key={show.id}><td><strong>{show.title}</strong><small>{show.genre}</small></td><td><Badge tone={show.status === 'Freshman' ? 'warning' : 'neutral'}>{show.status}</Badge></td><td>{show.viewers.toFixed(1)}M <Trend value={show.trend} compact /></td><td>{show.critic}</td><td>{Math.round(show.buzz)}</td><td>{money(show.cost)}</td><td className={show.revenue - show.cost > 0 ? 'positive-text' : 'negative-text'}>{money(show.revenue - show.cost)}</td><td><button className="small-action">Review</button></td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function Development({ development, onCreate }) {
  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Northstar Studios</span><h2>Develop original ideas into durable franchises.</h2><p>Balance creative ambition, commercial fit, talent packaging, budget, and the needs of the programming schedule.</p></div><button className="button button-primary" onClick={onCreate}><Plus size={16} /> Create new project</button></section>
      <section className="development-summary">
        <div><Clapperboard size={21} /><span>Active projects</span><strong>{development.length}</strong></div>
        <div><DollarSign size={21} /><span>Committed development</span><strong>{money(development.reduce((sum, item) => sum + item.budget * 0.16, 0))}</strong></div>
        <div><Sparkles size={21} /><span>Prestige candidates</span><strong>{development.filter((item) => item.creative >= 88).length}</strong></div>
        <div><Target size={21} /><span>Schedule needs filled</span><strong>3</strong></div>
      </section>
      <section className="pipeline-grid">
        {development.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-art"><Film size={28} /><Badge tone={project.stage.includes('Pilot') ? 'success' : 'neutral'}>{project.stage}</Badge></div>
            <div className="project-copy"><span className="eyebrow">{project.owner} development</span><h3>{project.title}</h3><p>{project.genre}</p><div className="project-scores"><div><strong>{project.creative}</strong><span>Creative</span></div><div><strong>{project.commercial}</strong><span>Commercial</span></div><div><strong>{money(project.budget)}</strong><span>Per episode</span></div></div><Progress value={project.progress} label={`${project.weeks} weeks to next gate`} /><div className="project-note"><Lightbulb size={15} /><span>{project.note}</span></div><div className="project-actions"><button className="button button-secondary">Open project</button><button className="icon-button"><ChevronRight size={17} /></button></div></div>
          </article>
        ))}
      </section>
      <section className="card"><div className="card-header"><div><span className="eyebrow">Strategic needs</span><h3>What programming is asking the studio to find</h3></div><Target size={18} /></div><div className="need-grid"><div><Badge tone="danger">Urgent</Badge><strong>Tuesday 9 PM replacement</strong><span>Accessible drama or event reality capable of 5.5M+ viewers.</span></div><div><Badge tone="warning">Next season</Badge><strong>Young-skewing comedy</strong><span>A companion for Second Chances with franchise potential.</span></div><div><Badge tone="neutral">Prestige</Badge><strong>Limited series event</strong><span>Awards-oriented package for Q4 with an established lead.</span></div></div></section>
    </div>
  );
}

function Talent({ people, filter, setFilter, search, setSearch, selectedPerson, setSelectedPerson, setOfferPerson, offers }) {
  const roles = ['All', ...new Set(people.map((person) => person.role))];
  const filtered = people.filter((person) => (filter === 'All' || person.role === filter) && person.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Northstar Talent Network</span><h2>Search the industry and build the people advantage.</h2><p>Talent evaluates role quality, compensation, creative control, collaborators, company momentum, and career fit before accepting.</p></div><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, agencies, credits…" /></div></section>
      <div className="filter-row">{roles.map((role) => <button key={role} className={filter === role ? 'active' : ''} onClick={() => setFilter(role)}>{role}</button>)}</div>
      <section className="talent-layout">
        <div className="talent-results">
          <div className="result-count"><strong>{filtered.length} people</strong><span>Sorted by strategic fit</span></div>
          {filtered.map((person) => (
            <article className={classNames('person-card', selectedPerson?.id === person.id && 'selected')} key={person.id} onClick={() => setSelectedPerson(person)}>
              <div className="person-avatar">{person.name.split(' ').map((part) => part[0]).join('')}</div>
              <div className="person-copy"><div className="person-title"><div><strong>{person.name}</strong><span>{person.role} · {person.agency}</span></div><Rarity value={person.rarity} /></div><div className="skill-strip"><span>Craft <b>{person.craft}</b></span><span>Commercial <b>{person.commercial}</b></span><span>Prestige <b>{person.prestige}</b></span><span>Reliable <b>{person.reliability}</b></span></div><div className="person-meta"><span><Clock3 size={14} /> {person.availability}</span><span><DollarSign size={14} /> Quote {money(person.fee)}</span><Badge tone={person.trend === 'Surging' ? 'success' : person.trend === 'Cooling' ? 'danger' : 'neutral'}>{person.trend}</Badge></div></div>
              <ChevronRight size={18} />
            </article>
          ))}
        </div>
        <aside className="talent-detail card">
          {selectedPerson ? <><div className="talent-profile-head"><div className="person-avatar xlarge">{selectedPerson.name.split(' ').map((part) => part[0]).join('')}</div><div><Rarity value={selectedPerson.rarity} /><h3>{selectedPerson.name}</h3><p>{selectedPerson.role} · Age {selectedPerson.age}</p></div></div><div className="profile-scores"><div><strong>{selectedPerson.craft}</strong><span>Craft</span></div><div><strong>{selectedPerson.commercial}</strong><span>Commercial</span></div><div><strong>{selectedPerson.prestige}</strong><span>Prestige</span></div></div><div className="profile-section"><span>Known for</span><strong>{selectedPerson.credits}</strong></div><div className="profile-section"><span>Recognition</span><strong>{selectedPerson.awards}</strong></div><div className="profile-section"><span>Specialties</span><div className="tag-list">{selectedPerson.specialties.map((item) => <Badge key={item}>{item}</Badge>)}</div></div><div className="profile-section"><span>Market status</span><strong>{selectedPerson.availability}</strong><small>Current quote: {money(selectedPerson.fee)}</small></div><button className="button button-primary full" onClick={() => setOfferPerson(selectedPerson)} disabled={selectedPerson.availability.includes('Northstar')}><Handshake size={16} /> {selectedPerson.availability.includes('Northstar') ? 'Signed to Northstar' : 'Prepare an offer'}</button></> : <div className="empty-detail"><UsersRound size={30} /><h3>Select a profile</h3><p>Review career history, ratings, availability, and negotiation expectations.</p></div>}
        </aside>
      </section>
      <section className="card"><div className="card-header"><div><span className="eyebrow">Negotiation desk</span><h3>Active offers</h3></div><Handshake size={18} /></div>{offers.length ? <div className="table-wrap"><table><thead><tr><th>Talent</th><th>Role</th><th>Term</th><th>Offer</th><th>Status</th></tr></thead><tbody>{offers.map((offer) => <tr key={offer.id}><td><strong>{offer.person}</strong></td><td>{offer.role}</td><td>{offer.years} years</td><td>{money(offer.fee)} / year</td><td><Badge tone={offer.status === 'Accepted' ? 'success' : offer.status === 'Declined' ? 'danger' : 'warning'}>{offer.status}</Badge></td></tr>)}</tbody></table></div> : <div className="empty-row">No formal offers are currently outstanding.</div>}</section>
    </div>
  );
}

function Ratings({ shows, averageAudience, averageCritic }) {
  const sorted = [...shows].sort((a, b) => b.viewers - a.viewers);
  return (
    <div className="page-stack">
      <section className="ratings-masthead"><div><span>NORTHSTAR</span><strong>Audience Intelligence</strong></div><div><small>Reporting period</small><b>Live + 7 · National panel</b></div></section>
      <section className="kpi-grid three"><Kpi icon={Tv} label="Prime-time average" value={`${(sorted.reduce((s, x) => s + x.viewers, 0) / sorted.length).toFixed(1)}M`} trend={3.1} note="total viewers" /><Kpi icon={Star} label="Audience score" value={Math.round(averageAudience)} trend={2.0} note="portfolio average" /><Kpi icon={Trophy} label="Critic score" value={Math.round(averageCritic)} trend={4.0} note="premium scripted portfolio" /></section>
      <section className="ratings-layout">
        <div className="card span-2"><div className="card-header"><div><span className="eyebrow">National program ranker</span><h3>Northstar program performance</h3></div><Badge tone="success">Live + 7</Badge></div><div className="table-wrap"><table className="ratings-table"><thead><tr><th>Rank</th><th>Program</th><th>Total viewers</th><th>Share</th><th>A18–49 index</th><th>Completion</th><th>Weekly move</th></tr></thead><tbody>{sorted.map((show, index) => <tr key={show.id}><td className="rank-cell">#{index + 1}</td><td><strong>{show.title}</strong><small>{show.format} · {show.target}</small></td><td><b>{show.viewers.toFixed(1)}M</b></td><td>{show.share.toFixed(1)}</td><td>{Math.round((show.buzz + show.audience) / 1.55)}</td><td>{Math.round((show.quality + show.audience) / 2)}%</td><td><Trend value={show.trend} /></td></tr>)}</tbody></table></div></div>
        <div className="side-stack"><div className="card"><div className="card-header"><div><span className="eyebrow">Portfolio perception</span><h3>Critics vs. audiences</h3></div><Activity size={18} /></div><div className="scatter-list">{[...shows].sort((a, b) => b.critic - a.critic).slice(0, 6).map((show) => <div key={show.id}><span>{show.title}</span><div className="dual-bar"><i style={{ width: `${show.critic}%` }} /><em style={{ width: `${show.audience}%` }} /></div><strong>{show.critic} / {show.audience}</strong></div>)}</div><div className="legend"><span><i className="critic-key" /> Critics</span><span><i className="audience-key" /> Audience</span></div></div><div className="card"><div className="card-header"><div><span className="eyebrow">Audience migration</span><h3>Where viewers go next</h3></div><ChevronDown size={18} /></div><div className="migration-list"><div><strong>The Harbor → Frontline America</strong><span>31% same-night continuation</span></div><div><strong>Second Chances → Legacy Code</strong><span>19% continuation · weak fit</span></div><div><strong>Island House → Late Tonight</strong><span>38% continuation · strong fit</span></div></div></div></div>
      </section>
    </div>
  );
}

function Sales({ deals, setAdvertiser }) {
  const packages = [
    { name: 'Prime-time rotation', description: 'Broad reach across scripted and unscripted evenings.', inventory: '72 spots', cpm: 34, tone: 'Premium reach' },
    { name: 'Prestige drama package', description: 'The Harbor, premium originals, and awards integrations.', inventory: '28 spots', cpm: 43, tone: 'Affluent audience' },
    { name: 'Comedy + social', description: 'Linear inventory plus high-performing short-form clips.', inventory: '54 spots', cpm: 37, tone: 'Young audience' },
    { name: 'News and trust', description: 'Frontline America, election specials, and newsletter extensions.', inventory: '36 spots', cpm: 35, tone: 'High trust' },
  ];
  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Northstar Media Sales</span><h2>Monetize audience attention without weakening the brand.</h2><p>Negotiate CPM, inventory, sponsorship, category exclusivity, integrations, and cross-platform extensions.</p></div><div className="sales-total"><span>Active contracted value</span><strong>{money(deals.reduce((sum, item) => sum + item.value, 0))}</strong></div></section>
      <section className="package-grid">{packages.map((item) => <div className="package-card" key={item.name}><div className="package-icon"><PackageCheck size={22} /></div><Badge>{item.tone}</Badge><h3>{item.name}</h3><p>{item.description}</p><div className="package-stats"><div><span>Available</span><strong>{item.inventory}</strong></div><div><span>Guide CPM</span><strong>${item.cpm}</strong></div></div><button className="button button-secondary full">Build proposal</button></div>)}</section>
      <section className="sales-layout"><div className="card span-2"><div className="card-header"><div><span className="eyebrow">Buyer marketplace</span><h3>Advertisers currently in market</h3></div><BriefcaseBusiness size={18} /></div><div className="advertiser-list">{advertisers.map((buyer) => <div key={buyer.id} className="advertiser-row"><div className="company-logo">{buyer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div className="advertiser-copy"><strong>{buyer.name}</strong><span>{buyer.category} · {buyer.preference}</span></div><div><span>Audience fit</span><strong>{buyer.fit}%</strong></div><div><span>Budget</span><strong>{money(buyer.budget)}</strong></div><div><span>Target CPM</span><strong>${buyer.ask}</strong></div><button className="button button-secondary" onClick={() => setAdvertiser(buyer)}>Negotiate</button></div>)}</div></div><div className="card"><div className="card-header"><div><span className="eyebrow">Inventory health</span><h3>Current quarter</h3></div><Gauge size={18} /></div><div className="inventory-ring"><div><strong>78%</strong><span>sold</span></div></div><div className="mini-metrics"><div><span>Average CPM</span><strong>$36.80</strong></div><div><span>Scatter premium</span><strong>+9.4%</strong></div><div><span>Makegood liability</span><strong>$1.2M</strong></div></div></div></section>
      <section className="card"><div className="card-header"><div><span className="eyebrow">Contract desk</span><h3>Existing agreements</h3></div><FileText size={18} /></div><div className="table-wrap"><table><thead><tr><th>Advertiser</th><th>Package</th><th>Length</th><th>CPM</th><th>Value</th><th>Status</th></tr></thead><tbody>{deals.map((deal) => <tr key={deal.id}><td><strong>{deal.advertiser}</strong></td><td>{deal.package}</td><td>{deal.weeks} weeks</td><td>${deal.cpm}</td><td>{money(deal.value)}</td><td><Badge tone="success">{deal.status}</Badge></td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function Marketing({ campaigns, setCampaignModal }) {
  const templates = [
    { name: 'Mass Awareness', icon: Megaphone, description: 'Broad TV, digital, outdoor, and earned-media launch.', efficiency: 3, best: 'Premieres and major repositioning' },
    { name: 'Performance Social', icon: TrendingUp, description: 'Audience-targeted video, creator, and conversion media.', efficiency: 6, best: 'Young-skewing and streaming titles' },
    { name: 'Talent Publicity', icon: Star, description: 'Press tour, appearances, profiles, and fan activation.', efficiency: 4, best: 'Personality-led programming' },
    { name: 'Awards Campaign', icon: Trophy, description: 'Screenings, guild outreach, trade media, and events.', efficiency: 2, best: 'Prestige and reputation growth' },
  ];
  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Brand & Audience Growth</span><h2>Create demand, shape perception, and turn programs into cultural events.</h2><p>Marketing improves awareness and sampling. Creative quality and audience fit determine whether viewers stay.</p></div><div className="sales-total"><span>Active media spend</span><strong>{money(campaigns.reduce((sum, item) => sum + item.spend, 0))}</strong></div></section>
      <section className="campaign-template-grid">{templates.map((template) => { const Icon = template.icon; return <article className="campaign-template" key={template.name}><div className="campaign-template-icon"><Icon size={22} /></div><h3>{template.name}</h3><p>{template.description}</p><span>Best for: {template.best}</span><button className="button button-secondary full" onClick={() => setCampaignModal(template)}>Create campaign</button></article>; })}</section>
      <section className="marketing-layout"><div className="card span-2"><div className="card-header"><div><span className="eyebrow">Live campaigns</span><h3>Current portfolio</h3></div><Activity size={18} /></div>{campaigns.length ? <div className="campaign-list">{campaigns.map((campaign) => <div key={campaign.id}><div className="campaign-status"><span className="live-dot" /><div><strong>{campaign.name}</strong><span>{campaign.type} · {campaign.weeks} weeks remaining</span></div></div><div><span>Spend</span><strong>{money(campaign.spend)}</strong></div><div><span>Awareness lift</span><strong>+{campaign.lift}%</strong></div><Progress value={(campaign.weeks / 6) * 100} /></div>)}</div> : <div className="empty-row">No campaigns are live.</div>}</div><div className="side-stack"><div className="card"><div className="card-header"><div><span className="eyebrow">Northstar brand</span><h3>Perception tracker</h3></div><Sparkles size={18} /></div><div className="brand-attributes"><div><span>Quality</span><Progress value={78} /></div><div><span>Trust</span><Progress value={83} /></div><div><span>Relevance</span><Progress value={69} /></div><div><span>Innovation</span><Progress value={61} /></div></div></div><div className="card"><div className="card-header"><div><span className="eyebrow">Opportunity</span><h3>Second Chances fandom</h3></div><TrendingUp size={18} /></div><p className="muted-copy">Unaided awareness among adults 18–34 rose nine points. A cast-led social campaign could convert the show into a broader network identity asset.</p><button className="button button-primary full" onClick={() => setCampaignModal(templates[1])}>Build recommended plan</button></div></div></section>
    </div>
  );
}

function Finance({ shows, weeklyRevenue, weeklyCost, operatingProfit, cash, subscribers }) {
  const adRevenue = shows.reduce((sum, show) => sum + show.revenue, 0);
  const subscriptionRevenue = subscribers * 0.21;
  const licensingRevenue = 4.8;
  return (
    <div className="page-stack">
      <section className="finance-header"><div><span className="eyebrow light">Northstar finance portal</span><h2>Q2 management reporting</h2><p>Consolidated broadcast, streaming, studios, and licensing view.</p></div><div><span>Available liquidity</span><strong>{money(cash)}</strong><small>Cash + undrawn revolver</small></div></section>
      <section className="kpi-grid"><Kpi icon={CircleDollarSign} label="Weekly revenue" value={money(weeklyRevenue)} trend={5.2} note="vs. latest forecast" /><Kpi icon={DollarSign} label="Operating cost" value={money(weeklyCost)} trend={-2.4} note="favorable vs. plan" /><Kpi icon={TrendingUp} label="Operating profit" value={money(operatingProfit)} trend={8.1} note="before corporate overhead" /><Kpi icon={WalletCards} label="Free cash outlook" value="$146.2M" trend={3.6} note="next 13 weeks" /></section>
      <section className="finance-layout"><div className="card span-2"><div className="card-header"><div><span className="eyebrow">Management P&L</span><h3>Current weekly run rate</h3></div><Badge tone="success">Above plan</Badge></div><div className="pnl"><div className="pnl-section"><strong>Revenue</strong><div><span>Advertising and sponsorship</span><b>{money(adRevenue)}</b></div><div><span>Subscription</span><b>{money(subscriptionRevenue)}</b></div><div><span>Licensing, syndication, and other</span><b>{money(licensingRevenue)}</b></div><div className="pnl-total"><span>Total revenue</span><b>{money(adRevenue + subscriptionRevenue + licensingRevenue)}</b></div></div><div className="pnl-section"><strong>Operating expenses</strong><div><span>Content production</span><b>{money(shows.reduce((sum, item) => sum + item.cost, 0))}</b></div><div><span>Marketing and distribution</span><b>$3.8M</b></div><div><span>Technology, sales, and corporate</span><b>$4.8M</b></div><div className="pnl-total"><span>Total operating expenses</span><b>{money(weeklyCost)}</b></div></div><div className="pnl-result"><span>Operating contribution</span><strong>{money(operatingProfit)}</strong><Trend value={8.1} /></div></div></div><div className="side-stack"><div className="card"><div className="card-header"><div><span className="eyebrow">Forecast</span><h3>Quarter outlook</h3></div><LineChart size={18} /></div><div className="forecast-bars">{[64, 69, 73, 72, 79, 84, 82, 87].map((value, index) => <div key={index}><i style={{ height: `${value}%` }} /><span>W{index + 1}</span></div>)}</div><div className="forecast-note"><TrendingUp size={16} /><span>Full-quarter EBITDA is tracking $8.4M above the original plan.</span></div></div><div className="card"><div className="card-header"><div><span className="eyebrow">CFO watchlist</span><h3>Financial risks</h3></div><AlertTriangle size={18} /></div><div className="risk-list"><div><Badge tone="danger">High</Badge><span>The Harbor cast renewals could add $9–13M annually.</span></div><div><Badge tone="warning">Medium</Badge><span>Legacy Code impairment risk if canceled before international sale.</span></div><div><Badge tone="neutral">Low</Badge><span>Production insurance rates rising across the market.</span></div></div></div></div></section>
      <section className="card"><div className="card-header"><div><span className="eyebrow">Content economics</span><h3>Program-level profitability</h3></div><FileText size={18} /></div><div className="table-wrap"><table><thead><tr><th>Program</th><th>Revenue</th><th>Production cost</th><th>Marketing allocation</th><th>Contribution</th><th>Margin</th></tr></thead><tbody>{[...shows].sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost)).map((show) => { const contribution = show.revenue - show.cost - 0.2; return <tr key={show.id}><td><strong>{show.title}</strong><small>{show.status}</small></td><td>{money(show.revenue)}</td><td>{money(show.cost)}</td><td>$0.2M</td><td className={contribution >= 0 ? 'positive-text' : 'negative-text'}>{money(contribution)}</td><td>{Math.round((contribution / show.revenue) * 100)}%</td></tr>; })}</tbody></table></div></section>
    </div>
  );
}

function Operations({ development, shows }) {
  const productions = [
    { title: 'The Harbor', stage: 'Principal photography', location: 'Vancouver', studio: 'Stage 4', completion: 72, status: 'On plan', issue: 'Weather cover day available' },
    { title: 'Second Chances', stage: 'Episode 11 shoot', location: 'Los Angeles', studio: 'Stage 2', completion: 58, status: 'On plan', issue: 'None' },
    { title: 'Ashes of Tomorrow', stage: 'Pilot pre-production', location: 'Atlanta', studio: 'Stage 7', completion: 31, status: 'Watch', issue: 'Lead casting unresolved' },
    { title: 'Island House', stage: 'Post-production', location: 'Caribbean', studio: 'Edit Bay C', completion: 88, status: 'On plan', issue: 'Music clearance pending' },
  ];
  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Enterprise production & operations</span><h2>Keep the content machine moving.</h2><p>Manage studio capacity, production calendars, crew constraints, post-production, distribution, and operational risk.</p></div><Badge tone="success">Network operations normal</Badge></section>
      <section className="operations-kpis"><div><Building2 size={20} /><span>Studio utilization</span><strong>84%</strong><Trend value={7} /></div><div><UsersRound size={20} /><span>Crew utilization</span><strong>77%</strong><Badge tone="neutral">Healthy</Badge></div><div><Clock3 size={20} /><span>On-time delivery</span><strong>92%</strong><Trend value={3} /></div><div><AlertTriangle size={20} /><span>Open critical issues</span><strong>2</strong><Badge tone="warning">Review</Badge></div></section>
      <section className="operations-layout"><div className="card span-2"><div className="card-header"><div><span className="eyebrow">Production control tower</span><h3>Active productions</h3></div><Clapperboard size={18} /></div><div className="production-list">{productions.map((item) => <div key={item.title}><div className="production-main"><div className="production-icon"><Film size={19} /></div><div><strong>{item.title}</strong><span>{item.stage} · {item.location} · {item.studio}</span></div></div><div className="production-progress"><Progress value={item.completion} /><span>{item.completion}% complete</span></div><Badge tone={item.status === 'Watch' ? 'warning' : 'success'}>{item.status}</Badge><div className="production-issue"><span>{item.issue}</span><ChevronRight size={15} /></div></div>)}</div></div><div className="side-stack"><div className="card"><div className="card-header"><div><span className="eyebrow">Capacity</span><h3>Studio stages</h3></div><Building2 size={18} /></div><div className="capacity-list"><div><span>Los Angeles</span><Progress value={92} /><strong>92%</strong></div><div><span>Atlanta</span><Progress value={76} /><strong>76%</strong></div><div><span>Vancouver</span><Progress value={84} /><strong>84%</strong></div><div><span>New York</span><Progress value={63} /><strong>63%</strong></div></div></div><div className="card"><div className="card-header"><div><span className="eyebrow">Logistics alert</span><h3>Camera package constraint</h3></div><AlertTriangle size={18} /></div><p className="muted-copy">Two premium drama productions need the same virtual-production package in Week 17. Moving Ashes of Tomorrow by one week avoids a $420K external rental.</p><button className="button button-primary full">Approve schedule change</button></div></div></section>
      <section className="card"><div className="card-header"><div><span className="eyebrow">Content supply chain</span><h3>Upcoming delivery gates</h3></div><PackageCheck size={18} /></div><div className="delivery-grid">{development.slice(0, 4).map((project) => <div key={project.id}><span>{project.weeks} weeks</span><strong>{project.title}</strong><small>{project.stage}</small><Progress value={project.progress} /></div>)}</div></section>
    </div>
  );
}

function Chronicle({ news, week, year }) {
  return (
    <div className="page-stack chronicle-page">
      <section className="chronicle-header"><div className="chronicle-brand"><Newspaper size={26} /><div><strong>THE INDUSTRY CHRONICLE</strong><span>Northstar executive edition</span></div></div><div>Week {week} · {year}</div></section>
      <section className="chronicle-lead"><div className="lead-image"><Tv size={64} /><span>NORTHSTAR / ORIGINALS</span></div><div><span className="chronicle-kicker">{news[0]?.tag}</span><h2>{news[0]?.headline}</h2><p>{news[0]?.body}</p><div className="byline">Audience Desk · Internal distribution</div></div></section>
      <section className="chronicle-columns"><div className="chronicle-main">{news.slice(1, 7).map((story) => <article key={story.id}><span className="chronicle-kicker">{story.tag}</span><h3>{story.headline}</h3><p>{story.body}</p><small>{story.importance}</small></article>)}</div><aside><div className="chronicle-box"><span>THIS WEEK</span><strong>What everyone is watching</strong><ol><li><b>Second Chances</b><small>Breakout momentum</small></li><li><b>The Harbor</b><small>Awards and renewals</small></li><li><b>Legacy Code</b><small>Cancellation watch</small></li><li><b>Elena Cruz</b><small>Open talent market</small></li></ol></div><div className="chronicle-box dark"><span>EDITORIAL</span><strong>Northstar finally has a comedy identity. It should act like it.</strong><p>The company’s next scheduling and development choices will determine whether Second Chances is a single hit or the foundation of a durable audience franchise.</p></div></aside></section>
      <section className="records-strip"><div><Trophy size={20} /><span>Northstar record book</span></div><div><small>Biggest premiere</small><strong>Empire Falls · 18.4M</strong></div><div><small>Longest-running drama</small><strong>District 9-1 · 8 seasons</strong></div><div><small>Most awarded</small><strong>The Harbor · 14 wins</strong></div><div><small>Best margin</small><strong>Island House · 71%</strong></div></section>
    </div>
  );
}
