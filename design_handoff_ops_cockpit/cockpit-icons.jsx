// cockpit-icons.jsx
// Small inline Lucide-style SVG icon set, all 1.5px stroke, round joins.
// Sized via parent CSS (svg { width: 16px; height: 16px }).

const Icon = ({ d, children, size = 16, ...rest }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round"
       width={size} height={size} {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  // Nav
  cockpit:  (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><path d="M12 12 16 8"/></Icon>,
  agents:   (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="2.4"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M14 19a5 5 0 0 1 8-3"/></Icon>,
  work:     (p) => <Icon {...p}><rect x="3" y="4" width="6" height="16" rx="1.5"/><rect x="10" y="4" width="6" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="8" rx="1.5"/></Icon>,
  spec:     (p) => <Icon {...p}><path d="M4 4h10l4 4v12H4z"/><path d="M14 4v4h4"/><path d="M8 13h7M8 17h7"/></Icon>,
  inventory:(p) => <Icon {...p}><path d="M3 7h18M3 12h18M3 17h18"/><circle cx="6" cy="7" r=".5"/><circle cx="6" cy="12" r=".5"/><circle cx="6" cy="17" r=".5"/></Icon>,
  events:   (p) => <Icon {...p}><path d="M4 6h16M4 10h16M4 14h11M4 18h7"/></Icon>,
  chat:     (p) => <Icon {...p}><path d="M4 5h16v11H8l-4 4z"/></Icon>,
  settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="2.5"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,
  mobile:   (p) => <Icon {...p}><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></Icon>,

  // UI
  search:   (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/></Icon>,
  bell:     (p) => <Icon {...p}><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21h4"/></Icon>,
  sun:      (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></Icon>,
  moon:     (p) => <Icon {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></Icon>,
  cmd:      (p) => <Icon {...p}><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/></Icon>,
  chevDown: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  chevRight:(p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>,
  chevLeft: (p) => <Icon {...p}><path d="m15 6-6 6 6 6"/></Icon>,
  chevUp:   (p) => <Icon {...p}><path d="m18 15-6-6-6 6"/></Icon>,
  x:        (p) => <Icon {...p}><path d="M6 6 18 18M6 18 18 6"/></Icon>,
  check:    (p) => <Icon {...p}><path d="m5 13 4 4L19 7"/></Icon>,
  checkCirc:(p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></Icon>,
  alert:    (p) => <Icon {...p}><path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18v.5"/></Icon>,
  alertCirc:(p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16v.5"/></Icon>,
  shield:   (p) => <Icon {...p}><path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z"/></Icon>,
  pause:    (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></Icon>,
  play:     (p) => <Icon {...p}><path d="m6 4 14 8-14 8z"/></Icon>,
  restart:  (p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></Icon>,
  logs:     (p) => <Icon {...p}><path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/></Icon>,
  plus:     (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  github:   (p) => <Icon {...p}><path d="M9 19c-4 1-4-2-6-2m12 4v-3.5a3 3 0 0 0-.9-2.6c3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.6 4.6 0 0 0-.1-3.4S17 2 14.5 3.5a13 13 0 0 0-7 0C5 2 3.9 1.9 3.9 1.9a4.6 4.6 0 0 0-.1 3.4A5 5 0 0 0 2.4 8.8c0 5 3 6.2 6 6.5a3 3 0 0 0-.9 2.6V22"/></Icon>,
  link:     (p) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></Icon>,
  mic:      (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  send:     (p) => <Icon {...p}><path d="m4 20 18-8L4 4l3 8z"/><path d="M7 12h15"/></Icon>,
  branch:   (p) => <Icon {...p}><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M8 8a8 8 0 0 0 8 8"/></Icon>,
  prMerge:  (p) => <Icon {...p}><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M6 8v8M8 18a8 8 0 0 0 8-8V8"/></Icon>,
  prOpen:   (p) => <Icon {...p}><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 8v8M18 8v10"/></Icon>,
  filter:   (p) => <Icon {...p}><path d="M4 4h16l-6 8v6l-4 2v-8z"/></Icon>,
  refresh:  (p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/></Icon>,
  flow:     (p) => <Icon {...p}><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/></Icon>,
  block:    (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="m5 5 14 14"/></Icon>,
  clock:    (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  user:     (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>,
  bot:      (p) => <Icon {...p}><rect x="4" y="7" width="16" height="12" rx="2"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M12 3v4M8 19v2M16 19v2"/></Icon>,
  sparkle:  (p) => <Icon {...p} className={(p&&p.className)||'spk'}><path d="M12 3 13.5 9 19 10.5 13.5 12 12 18 10.5 12 5 10.5 10.5 9z"/><path d="M19 4l.6 1.4L21 6l-1.4.6L19 8l-.6-1.4L17 6l1.4-.6z"/></Icon>,
  copy:     (p) => <Icon {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></Icon>,
  external:(p) => <Icon {...p}><path d="M7 7h10v10"/><path d="M17 7 7 17"/></Icon>,
  bullet:   (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/></Icon>,
  folder:   (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Icon>,
  heart:    (p) => <Icon {...p}><path d="M12 20s-7-4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 5-9 9-9 9z"/></Icon>,
  rocket:   (p) => <Icon {...p}><path d="M5 19c2-3 4-4 7-7 4-4 6-7 10-9-2 4-5 6-9 10-3 3-4 5-8 6z"/><circle cx="14" cy="10" r="1.5"/></Icon>,
  target:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></Icon>,
  gate:     (p) => <Icon {...p}><path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/></Icon>,
  queue:    (p) => <Icon {...p}><rect x="4" y="5" width="16" height="3" rx="1"/><rect x="4" y="10" width="16" height="3" rx="1"/><rect x="4" y="15" width="10" height="3" rx="1"/></Icon>,
  zap:      (p) => <Icon {...p}><path d="m13 3-9 12h7l-1 6 9-12h-7z"/></Icon>,
  graph:    (p) => <Icon {...p}><path d="M4 19V5M4 19h16"/><path d="m7 15 4-5 3 3 5-7"/></Icon>,
  more:     (p) => <Icon {...p}><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></Icon>,
  doc:      (p) => <Icon {...p}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3"/></Icon>,
  key:      (p) => <Icon {...p}><circle cx="8" cy="14" r="4"/><path d="m11 11 9-9 2 2-2 2 1 1-2 2-1-1-3 3"/></Icon>,
};

window.CockpitIcons = Icons;
