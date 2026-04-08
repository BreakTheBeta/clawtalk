const mono = 'var(--font-mono)';
const sans = 'var(--font-sans)';

const C = {
  cyan: '#22d3ee',
  cyanBg: 'rgba(34,211,238,0.08)',
  cyanBorder: 'rgba(34,211,238,0.35)',
  orange: '#fb923c',
  orangeBg: 'rgba(251,146,60,0.08)',
  orangeBorder: 'rgba(251,146,60,0.35)',
  teal: '#2dd4bf',
  tealBg: 'rgba(45,212,191,0.08)',
  tealBorder: 'rgba(45,212,191,0.35)',
  purple: '#a78bfa',
  purpleBg: 'rgba(167,139,250,0.08)',
  purpleBorder: 'rgba(167,139,250,0.35)',
  green: '#4ade80',
  greenBg: 'rgba(74,222,128,0.08)',
  red: '#f87171',
  yellow: '#fbbf24',
  white: 'rgba(255,255,255,0.92)',
  dim: 'rgba(255,255,255,0.48)',
  faint: 'rgba(255,255,255,0.22)',
  line: 'rgba(255,255,255,0.18)',
};

function ArrowMarker({ id, color = C.dim }) {
  return (
    <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d={`M0 0 L8 4 L0 8 Z`} fill={color} />
    </marker>
  );
}

/* ─── Lane System ──────────────────────────────────────────── */

function LanesDiagram() {
  return (
    <svg viewBox="0 0 520 340" fill="none" className="w-full h-auto">
      <defs>
        <ArrowMarker id="la" />
        <ArrowMarker id="lac" color={C.cyan} />
        <ArrowMarker id="lao" color={C.orange} />
        <ArrowMarker id="lap" color={C.purple} />
        <ArrowMarker id="lat" color={C.teal} />
      </defs>

      {/* ── Layer 1: Session Lane ── */}
      <text x="10" y="14" fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">LAYER 1</text>
      <rect x="10" y="22" width="130" height="68" rx="10" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="1.2" />
      <text x="75" y="46" textAnchor="middle" fill={C.cyan} fontSize="10" fontWeight="700" fontFamily={mono}>SESSION LANE</text>
      <text x="75" y="62" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>session:&lt;key&gt;</text>
      <text x="75" y="78" textAnchor="middle" fill={C.dim} fontSize="7.5" fontFamily={sans}>1 turn per session</text>

      {/* Arrow L1 → L2 */}
      <line x1="140" y1="56" x2="175" y2="56" stroke={C.cyan} strokeWidth="1.2" markerEnd="url(#lac)" />
      <text x="157" y="50" textAnchor="middle" fill={C.faint} fontSize="7" fontFamily={mono}>then</text>

      {/* ── Layer 2: Global Lanes ── */}
      <text x="178" y="14" fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">LAYER 2: GLOBAL LANES</text>
      <rect x="178" y="22" width="332" height="68" rx="10" fill="rgba(255,255,255,0.015)" stroke={C.faint} strokeWidth="1" strokeDasharray="5 3" />

      {/* Lane boxes inside */}
      <rect x="190" y="32" width="68" height="48" rx="6" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="0.8" />
      <text x="224" y="52" textAnchor="middle" fill={C.cyan} fontSize="9" fontWeight="700" fontFamily={mono}>MAIN</text>
      <text x="224" y="66" textAnchor="middle" fill={C.dim} fontSize="7.5" fontFamily={mono}>user msgs</text>

      <rect x="268" y="32" width="68" height="48" rx="6" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="0.8" />
      <text x="302" y="52" textAnchor="middle" fill={C.orange} fontSize="9" fontWeight="700" fontFamily={mono}>SUBAGENT</text>
      <text x="302" y="66" textAnchor="middle" fill={C.dim} fontSize="7.5" fontFamily={mono}>child work</text>

      <rect x="346" y="32" width="68" height="48" rx="6" fill={C.tealBg} stroke={C.tealBorder} strokeWidth="0.8" />
      <text x="380" y="52" textAnchor="middle" fill={C.teal} fontSize="9" fontWeight="700" fontFamily={mono}>CRON</text>
      <text x="380" y="66" textAnchor="middle" fill={C.dim} fontSize="7.5" fontFamily={mono}>scheduled</text>

      <rect x="424" y="32" width="68" height="48" rx="6" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="0.8" />
      <text x="458" y="52" textAnchor="middle" fill={C.purple} fontSize="9" fontWeight="700" fontFamily={mono}>NESTED</text>
      <text x="458" y="66" textAnchor="middle" fill={C.dim} fontSize="7.5" fontFamily={mono}>deadlock fix</text>

      {/* ── WHY: Separation ── */}
      <text x="10" y="114" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>WHY SEPARATE LANES?</text>

      {/* Main spawns subagent */}
      <rect x="10" y="126" width="240" height="44" rx="8" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="0.8" />
      <text x="22" y="144" fill={C.cyan} fontSize="8.5" fontWeight="700" fontFamily={mono}>MAIN → SUBAGENT</text>
      <text x="22" y="160" fill={C.dim} fontSize="8" fontFamily={sans}>Spawning children doesn't eat parent slots</text>

      {/* Cron doesn't starve main */}
      <rect x="260" y="126" width="250" height="44" rx="8" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="0.8" />
      <text x="272" y="144" fill={C.teal} fontSize="8.5" fontWeight="700" fontFamily={mono}>CRON ≠ MAIN</text>
      <text x="272" y="160" fill={C.dim} fontSize="8" fontFamily={sans}>Background jobs never starve user requests</text>

      {/* ── WHY: Deadlock prevention ── */}
      <text x="10" y="196" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>DEADLOCK PREVENTION</text>

      <rect x="10" y="208" width="500" height="70" rx="10" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1" />

      {/* Deadlock scenario */}
      <rect x="24" y="218" width="72" height="30" rx="5" fill={C.tealBg} stroke={C.tealBorder} strokeWidth="0.8" />
      <text x="60" y="237" textAnchor="middle" fill={C.teal} fontSize="8.5" fontWeight="700" fontFamily={mono}>CRON JOB</text>
      <text x="60" y="262" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>holds slot</text>

      <line x1="96" y1="233" x2="124" y2="233" stroke={C.line} strokeWidth="1" markerEnd="url(#la)" />
      <text x="110" y="226" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>runs</text>

      <rect x="126" y="218" width="82" height="30" rx="5" fill="rgba(255,255,255,0.04)" stroke={C.faint} strokeWidth="0.8" />
      <text x="167" y="237" textAnchor="middle" fill={C.white} fontSize="8" fontWeight="600" fontFamily={mono}>inner agent</text>

      <line x1="208" y1="233" x2="236" y2="233" stroke={C.line} strokeWidth="1" markerEnd="url(#la)" />
      <text x="222" y="226" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>needs</text>

      {/* X on cron */}
      <rect x="238" y="218" width="56" height="30" rx="5" fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.3)" strokeWidth="0.8" />
      <text x="266" y="237" textAnchor="middle" fill={C.red} fontSize="8" fontWeight="700" fontFamily={mono}>CRON</text>
      <text x="266" y="262" textAnchor="middle" fill={C.red} fontSize="7" fontFamily={mono}>FULL!</text>
      <line x1="248" y1="222" x2="284" y2="244" stroke={C.red} strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="284" y1="222" x2="248" y2="244" stroke={C.red} strokeWidth="1.2" strokeOpacity="0.5" />

      {/* Redirect arrow */}
      <line x1="294" y1="233" x2="330" y2="233" stroke={C.purple} strokeWidth="1.2" markerEnd="url(#lap)" />
      <text x="312" y="226" textAnchor="middle" fill={C.purple} fontSize="7" fontWeight="600" fontFamily={mono}>redirect</text>

      <rect x="332" y="218" width="70" height="30" rx="5" fill={C.purpleBg} stroke={C.purple} strokeWidth="1" />
      <text x="367" y="237" textAnchor="middle" fill={C.purple} fontSize="8.5" fontWeight="700" fontFamily={mono}>NESTED</text>
      <text x="367" y="262" textAnchor="middle" fill={C.green} fontSize="7" fontWeight="600" fontFamily={mono}>safe!</text>

      {/* ── Session store bridge ── */}
      <rect x="10" y="296" width="500" height="34" rx="8" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="0.8" strokeDasharray="4 3" />
      <text x="260" y="316" textAnchor="middle" fill={C.dim} fontSize="8.5" fontFamily={mono}>
        Lanes don't share data — results flow through session store, not transcripts
      </text>
    </svg>
  );
}

/* ─── Heartbeat ────────────────────────────────────────────── */

function HeartbeatDiagram() {
  return (
    <svg viewBox="0 0 500 310" fill="none" className="w-full h-auto">
      <defs><ArrowMarker id="hb" color={C.teal} /><ArrowMarker id="hbd" /></defs>

      {/* Timeline */}
      <line x1="30" y1="32" x2="470" y2="32" stroke={C.line} strokeWidth="1.5" />
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <line x1={60 + i * 100} y1="24" x2={60 + i * 100} y2="40" stroke={C.teal} strokeWidth="1.5" />
          <text x={60 + i * 100} y="16" textAnchor="middle" fill={C.teal} fontSize="9" fontFamily={mono} fontWeight="600">{i * 30}m</text>
          {i < 4 && <text x={110 + i * 100} y="48" textAnchor="middle" fill={C.faint} fontSize="8" fontFamily={mono}>30 min</text>}
        </g>
      ))}

      {/* Flow diagram */}
      <rect x="30" y="72" width="120" height="44" rx="8" fill={C.tealBg} stroke={C.tealBorder} strokeWidth="1.2" />
      <text x="90" y="98" textAnchor="middle" fill={C.teal} fontSize="11" fontWeight="700" fontFamily={mono}>HEARTBEAT</text>

      <line x1="150" y1="94" x2="178" y2="94" stroke={C.line} strokeWidth="1" markerEnd="url(#hbd)" />

      {/* Decision diamond */}
      <polygon points="220,72 262,94 220,116 178,94" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="1.2" />
      <text x="220" y="92" textAnchor="middle" fill={C.orange} fontSize="9" fontWeight="700" fontFamily={mono}>WORK</text>
      <text x="220" y="102" textAnchor="middle" fill={C.orange} fontSize="9" fontWeight="700" fontFamily={mono}>PENDING?</text>

      {/* Yes path */}
      <line x1="262" y1="94" x2="298" y2="94" stroke={C.line} strokeWidth="1" markerEnd="url(#hbd)" />
      <text x="280" y="87" textAnchor="middle" fill={C.green} fontSize="8" fontFamily={mono} fontWeight="600">YES</text>
      <rect x="300" y="72" width="120" height="44" rx="8" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="1.2" />
      <text x="360" y="91" textAnchor="middle" fill={C.cyan} fontSize="10" fontWeight="700" fontFamily={mono}>EXECUTE</text>
      <text x="360" y="105" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>full session history</text>

      {/* No path */}
      <line x1="220" y1="116" x2="220" y2="148" stroke={C.line} strokeWidth="1" markerEnd="url(#hbd)" />
      <text x="232" y="135" fill={C.dim} fontSize="8" fontFamily={mono} fontWeight="600">NO</text>
      <rect x="160" y="150" width="120" height="36" rx="8" fill="rgba(74,222,128,0.06)" stroke="rgba(74,222,128,0.3)" strokeWidth="1.2" />
      <text x="220" y="172" textAnchor="middle" fill={C.green} fontSize="10" fontWeight="700" fontFamily={mono}>HEARTBEAT_OK</text>

      {/* HEARTBEAT.md config box */}
      <rect x="30" y="210" width="440" height="88" rx="10" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="1" strokeDasharray="4 3" />
      <text x="48" y="232" fill={C.white} fontSize="10" fontWeight="700" fontFamily={mono}>openclaw.json</text>
      <text x="48" y="252" fill={C.dim} fontSize="9" fontFamily={sans}>
        <tspan x="48" dy="0">• Heartbeat intervals &amp; schedule config</tspan>
        <tspan x="48" dy="16">• Active hours &amp; timezone configuration</tspan>
        <tspan x="48" dy="16">• Delivery targets: announce, webhook, or none</tspan>
      </text>
    </svg>
  );
}

/* ─── Core Docs ────────────────────────────────────────────── */

function CoreDocsDiagram() {
  const docs = [
    { file: 'SOUL.md', desc: 'Core identity & personality', color: C.cyan, bg: C.cyanBg, border: C.cyanBorder },
    { file: 'AGENTS.md', desc: 'Behavioral guidelines & roles', color: C.orange, bg: C.orangeBg, border: C.orangeBorder },
    { file: 'IDENTITY.md', desc: 'Agent metadata & traits', color: C.teal, bg: C.tealBg, border: C.tealBorder },
    { file: 'TOOLS.md', desc: 'Local env notes & tool guidance', color: C.purple, bg: C.purpleBg, border: C.purpleBorder },
    { file: 'MEMORY.md', desc: 'Learned context & knowledge', color: C.cyan, bg: C.cyanBg, border: C.cyanBorder },
    { file: 'HEARTBEAT.md', desc: 'Periodic task schedules', color: C.orange, bg: C.orangeBg, border: C.orangeBorder },
    { file: 'BOOTSTRAP.md', desc: 'System prompt instructions', color: C.teal, bg: C.tealBg, border: C.tealBorder },
  ];

  const rowH = 42;
  const startY = 10;

  return (
    <svg viewBox="0 0 500 320" fill="none" className="w-full h-auto">
      <defs><ArrowMarker id="cd" /></defs>

      {/* Workspace label */}
      <rect x="8" y="2" width="340" height={docs.length * rowH + 18} rx="12" fill="rgba(255,255,255,0.015)" stroke={C.faint} strokeWidth="1" strokeDasharray="5 3" />
      <text x="20" y={docs.length * rowH + 28} fill={C.faint} fontSize="8" fontFamily={mono}>~/.openclaw/agents/[id]/workspace/</text>

      {docs.map((doc, i) => {
        const y = startY + i * rowH;
        return (
          <g key={doc.file}>
            <rect x="18" y={y + 4} width="120" height="30" rx="5" fill={doc.bg} stroke={doc.border} strokeWidth="1" />
            <text x="78" y={y + 23} textAnchor="middle" fill={doc.color} fontSize="9.5" fontWeight="700" fontFamily={mono}>{doc.file}</text>
            <text x="148" y={y + 23} fill={C.dim} fontSize="8.5" fontFamily={sans}>{doc.desc}</text>

            {/* Arrow to agent */}
            <line x1="348" y1={y + 19} x2="378" y2={160} stroke={C.line} strokeWidth="0.8" markerEnd="url(#cd)" />
          </g>
        );
      })}

      {/* Agent box */}
      <rect x="380" y="110" width="110" height="100" rx="12" fill={C.cyanBg} stroke={C.cyan} strokeWidth="1.5" />
      <text x="435" y="148" textAnchor="middle" fill={C.cyan} fontSize="11" fontWeight="700" fontFamily={mono}>AGENT</text>
      <text x="435" y="164" textAnchor="middle" fill={C.cyan} fontSize="11" fontWeight="700" fontFamily={mono}>RUNTIME</text>
      <text x="435" y="184" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>Pi Agent Core</text>

      {/* Skills folder */}
      <rect x="380" y="230" width="110" height="36" rx="6" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1" />
      <text x="435" y="252" textAnchor="middle" fill={C.purple} fontSize="9" fontWeight="700" fontFamily={mono}>skills/*/SKILL.md</text>
      <line x1="435" y1="230" x2="435" y2="212" stroke={C.line} strokeWidth="1" markerEnd="url(#cd)" />
    </svg>
  );
}

/* ─── Prompt Assembly Pipeline ─────────────────────────────── */

function PromptAssemblyDiagram() {
  const files = [
    { label: 'SOUL.md', color: C.cyan, y: 14 },
    { label: 'AGENTS.md', color: C.orange, y: 52 },
    { label: 'IDENTITY.md', color: C.teal, y: 90 },
    { label: 'TOOLS.md', color: C.purple, y: 128 },
    { label: 'MEMORY.md', color: C.cyan, y: 166 },
    { label: 'HEARTBEAT.md', color: C.orange, y: 204 },
  ];

  return (
    <svg viewBox="0 0 520 340" fill="none" className="w-full h-auto">
      <defs>
        <ArrowMarker id="pa" />
        <ArrowMarker id="pac" color={C.cyan} />
      </defs>

      {/* Bootstrap files column */}
      <text x="10" y="8" fill={C.faint} fontSize="8" fontFamily={mono} textTransform="uppercase" letterSpacing="0.1em">BOOTSTRAP FILES</text>
      {files.map((f) => (
        <g key={f.label}>
          <rect x="10" y={f.y} width="120" height="30" rx="5" fill="rgba(255,255,255,0.03)" stroke={f.color} strokeWidth="1" strokeOpacity="0.4" />
          <text x="70" y={f.y + 19} textAnchor="middle" fill={f.color} fontSize="9.5" fontWeight="700" fontFamily={mono}>{f.label}</text>
          <line x1="130" y1={f.y + 15} x2="195" y2={148} stroke={C.line} strokeWidth="0.8" markerEnd="url(#pa)" />
        </g>
      ))}

      {/* Skills input */}
      <rect x="10" y="248" width="120" height="30" rx="5" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1" />
      <text x="70" y="267" textAnchor="middle" fill={C.purple} fontSize="9.5" fontWeight="700" fontFamily={mono}>SKILL.md files</text>
      <line x1="130" y1="263" x2="195" y2="180" stroke={C.line} strokeWidth="0.8" markerEnd="url(#pa)" />

      {/* Session History input */}
      <rect x="10" y="290" width="120" height="30" rx="5" fill="rgba(255,255,255,0.03)" stroke={C.faint} strokeWidth="1" />
      <text x="70" y="309" textAnchor="middle" fill={C.dim} fontSize="9.5" fontWeight="700" fontFamily={mono}>Session History</text>
      <line x1="130" y1="305" x2="195" y2="195" stroke={C.line} strokeWidth="0.8" markerEnd="url(#pa)" />

      {/* Context Assembler */}
      <rect x="198" y="110" width="130" height="100" rx="12" fill={C.cyanBg} stroke={C.cyan} strokeWidth="1.5" />
      <text x="263" y="148" textAnchor="middle" fill={C.cyan} fontSize="11" fontWeight="700" fontFamily={mono}>CONTEXT</text>
      <text x="263" y="164" textAnchor="middle" fill={C.cyan} fontSize="11" fontWeight="700" fontFamily={mono}>ASSEMBLER</text>
      <text x="263" y="184" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>resolveBootstrap</text>
      <text x="263" y="196" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>ContextForRun</text>

      {/* Arrow to system prompt */}
      <line x1="328" y1="160" x2="365" y2="160" stroke={C.cyan} strokeWidth="1.5" markerEnd="url(#pac)" />

      {/* System Prompt output */}
      <rect x="368" y="100" width="140" height="120" rx="12" fill="rgba(251,146,60,0.06)" stroke={C.orange} strokeWidth="1.5" />
      <text x="438" y="138" textAnchor="middle" fill={C.orange} fontSize="11" fontWeight="700" fontFamily={mono}>SYSTEM</text>
      <text x="438" y="154" textAnchor="middle" fill={C.orange} fontSize="11" fontWeight="700" fontFamily={mono}>PROMPT</text>

      {/* Prompt contents */}
      <text x="385" y="178" fill={C.dim} fontSize="8" fontFamily={mono}>
        <tspan x="385" dy="0">1. Base instructions</tspan>
        <tspan x="385" dy="13">2. Agent identity</tspan>
        <tspan x="385" dy="13">3. Tool definitions</tspan>
        <tspan x="385" dy="13">4. Conversation</tspan>
      </text>

      {/* Token budget label */}
      <rect x="198" y="230" width="310" height="40" rx="6" fill="rgba(248,113,113,0.06)" stroke="rgba(248,113,113,0.25)" strokeWidth="0.8" />
      <text x="353" y="244" textAnchor="middle" fill={C.red} fontSize="8" fontWeight="600" fontFamily={mono}>
        20K/file · 150K total bootstrap
      </text>
      <text x="353" y="258" textAnchor="middle" fill={C.red} fontSize="8" fontFamily={mono} fontStyle="italic">
        Auto-compaction on overflow
      </text>
    </svg>
  );
}

/* ─── Cron System ──────────────────────────────────────────── */

function CronDiagram() {
  const types = [
    { label: 'at', desc: 'One-shot', example: 'run once', color: C.cyan, bg: C.cyanBg, border: C.cyanBorder, y: 20 },
    { label: 'every', desc: 'Interval', example: '"30m" / "2h"', color: C.orange, bg: C.orangeBg, border: C.orangeBorder, y: 80 },
    { label: 'cron', desc: 'Expression', example: '"0 */6 * * *"', color: C.teal, bg: C.tealBg, border: C.tealBorder, y: 140 },
  ];

  const sessions = [
    { label: 'main', y: 32, color: C.cyan },
    { label: 'isolated', y: 60, color: C.orange },
    { label: 'session:<id>', y: 88, color: C.teal },
  ];

  const deliveries = [
    { label: 'announce', y: 32, color: C.cyan },
    { label: 'webhook', y: 60, color: C.orange },
    { label: 'none', y: 88, color: C.dim },
  ];

  return (
    <svg viewBox="0 0 520 280" fill="none" className="w-full h-auto">
      <defs><ArrowMarker id="cr" /><ArrowMarker id="crc" color={C.cyan} /></defs>

      {/* Schedule types */}
      <text x="10" y="12" fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">SCHEDULE TYPE</text>
      {types.map((t) => (
        <g key={t.label}>
          <rect x="10" y={t.y} width="150" height="48" rx="8" fill={t.bg} stroke={t.border} strokeWidth="1.2" />
          <text x="24" y={t.y + 20} fill={t.color} fontSize="13" fontWeight="700" fontFamily={mono}>{t.label}</text>
          <text x="24" y={t.y + 36} fill={C.dim} fontSize="8" fontFamily={mono}>{t.desc} · {t.example}</text>
          <line x1="160" y1={t.y + 24} x2="208" y2={115} stroke={C.line} strokeWidth="0.8" markerEnd="url(#cr)" />
        </g>
      ))}

      {/* Session options */}
      <rect x="210" y="70" width="120" height="110" rx="10" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="1" />
      <text x="222" y="62" fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">SESSION</text>
      {sessions.map((s) => (
        <g key={s.label}>
          <text x="224" y={s.y + 76} fill={s.color} fontSize="10" fontWeight="600" fontFamily={mono}>{s.label}</text>
        </g>
      ))}

      {/* Arrow to delivery */}
      <line x1="330" y1="125" x2="368" y2="125" stroke={C.line} strokeWidth="1" markerEnd="url(#cr)" />

      {/* Delivery options */}
      <rect x="370" y="70" width="130" height="110" rx="10" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="1" />
      <text x="382" y="62" fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">DELIVERY</text>
      {deliveries.map((d) => (
        <g key={d.label}>
          <text x="385" y={d.y + 76} fill={d.color} fontSize="10" fontWeight="600" fontFamily={mono}>{d.label}</text>
        </g>
      ))}

      {/* Persistence note */}
      <rect x="10" y="218" width="490" height="48" rx="8" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="0.8" strokeDasharray="4 3" />
      <text x="255" y="236" textAnchor="middle" fill={C.dim} fontSize="8.5" fontFamily={mono}>
        Persisted in openclaw.json · Retry with backoff
      </text>
      <text x="255" y="252" textAnchor="middle" fill={C.faint} fontSize="8" fontFamily={mono} fontStyle="italic">
        Auto-stagger · Approval for sensitive ops
      </text>
    </svg>
  );
}

/* ─── Task Lifecycle ───────────────────────────────────────── */

function TaskLifecycleDiagram() {
  return (
    <svg viewBox="0 0 520 380" fill="none" className="w-full h-auto">
      <defs>
        <ArrowMarker id="tl" />
        <ArrowMarker id="tlc" color={C.cyan} />
        <ArrowMarker id="tlg" color={C.green} />
        <ArrowMarker id="tlr" color={C.red} />
      </defs>

      {/* Task sources */}
      <text x="10" y="16" fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">SOURCES</text>
      {[
        { label: 'ACP runs', y: 28, color: C.cyan },
        { label: 'Subagents', y: 54, color: C.orange },
        { label: 'Cron jobs', y: 80, color: C.teal },
        { label: 'CLI ops', y: 106, color: C.purple },
      ].map((s) => (
        <g key={s.label}>
          <rect x="10" y={s.y} width="90" height="22" rx="4" fill="rgba(255,255,255,0.03)" stroke={s.color} strokeWidth="0.8" strokeOpacity="0.5" />
          <text x="55" y={s.y + 15} textAnchor="middle" fill={s.color} fontSize="9" fontWeight="600" fontFamily={mono}>{s.label}</text>
          <line x1="100" y1={s.y + 11} x2="148" y2={78} stroke={C.line} strokeWidth="0.8" markerEnd="url(#tl)" />
        </g>
      ))}

      {/* QUEUED */}
      <rect x="150" y="56" width="90" height="44" rx="8" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1.2" />
      <text x="195" y="82" textAnchor="middle" fill={C.purple} fontSize="11" fontWeight="700" fontFamily={mono}>QUEUED</text>

      <line x1="240" y1="78" x2="278" y2="78" stroke={C.line} strokeWidth="1.2" markerEnd="url(#tl)" />

      {/* RUNNING */}
      <rect x="280" y="56" width="90" height="44" rx="8" fill={C.cyanBg} stroke={C.cyan} strokeWidth="1.5" />
      <text x="325" y="82" textAnchor="middle" fill={C.cyan} fontSize="11" fontWeight="700" fontFamily={mono}>RUNNING</text>

      {/* SUCCEEDED */}
      <line x1="370" y1="66" x2="408" y2="38" stroke="rgba(74,222,128,0.3)" strokeWidth="1.2" markerEnd="url(#tlg)" />
      <rect x="410" y="16" width="100" height="40" rx="8" fill={C.greenBg} stroke="rgba(74,222,128,0.35)" strokeWidth="1.2" />
      <text x="460" y="40" textAnchor="middle" fill={C.green} fontSize="10" fontWeight="700" fontFamily={mono}>SUCCEEDED</text>

      {/* FAILED */}
      <line x1="370" y1="78" x2="408" y2="78" stroke="rgba(248,113,113,0.3)" strokeWidth="1.2" markerEnd="url(#tlr)" />
      <rect x="410" y="58" width="100" height="40" rx="8" fill="rgba(248,113,113,0.06)" stroke="rgba(248,113,113,0.35)" strokeWidth="1.2" />
      <text x="460" y="82" textAnchor="middle" fill={C.red} fontSize="10" fontWeight="700" fontFamily={mono}>FAILED</text>

      {/* TIMED_OUT */}
      <line x1="370" y1="90" x2="408" y2="118" stroke="rgba(251,191,36,0.3)" strokeWidth="1.2" markerEnd="url(#tl)" />
      <rect x="410" y="100" width="100" height="40" rx="8" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.35)" strokeWidth="1.2" />
      <text x="460" y="124" textAnchor="middle" fill={C.yellow} fontSize="10" fontWeight="700" fontFamily={mono}>TIMED_OUT</text>

      {/* CANCELLED */}
      <line x1="370" y1="96" x2="408" y2="158" stroke="rgba(167,139,250,0.3)" strokeWidth="1.2" markerEnd="url(#tl)" />
      <rect x="410" y="142" width="100" height="40" rx="8" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1.2" />
      <text x="460" y="166" textAnchor="middle" fill={C.purple} fontSize="10" fontWeight="700" fontFamily={mono}>CANCELLED</text>

      {/* LOST */}
      <line x1="370" y1="100" x2="408" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" markerEnd="url(#tl)" />
      <rect x="410" y="190" width="100" height="40" rx="8" fill="rgba(255,255,255,0.03)" stroke={C.faint} strokeWidth="1.2" />
      <text x="460" y="214" textAnchor="middle" fill={C.dim} fontSize="10" fontWeight="700" fontFamily={mono}>LOST</text>

      {/* Storage & reconciliation */}
      <rect x="10" y="252" width="500" height="42" rx="8" fill="rgba(255,255,255,0.02)" stroke={C.faint} strokeWidth="0.8" strokeDasharray="4 3" />
      <text x="260" y="270" textAnchor="middle" fill={C.dim} fontSize="8.5" fontFamily={mono}>SQLite · 7-day retention · Auto-reconciliation</text>
      <text x="260" y="284" textAnchor="middle" fill={C.faint} fontSize="8" fontFamily={mono} fontStyle="italic">Managed or mirrored orchestration</text>

      {/* Managed vs Mirrored */}
      <rect x="10" y="310" width="240" height="60" rx="8" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="1" />
      <text x="26" y="330" fill={C.cyan} fontSize="10" fontWeight="700" fontFamily={mono}>MANAGED MODE</text>
      <text x="26" y="348" fill={C.dim} fontSize="8.5" fontFamily={sans}>System controls task lifecycle.</text>
      <text x="26" y="360" fill={C.dim} fontSize="8.5" fontFamily={sans}>Queue → assign → track → cleanup</text>

      <rect x="270" y="310" width="240" height="60" rx="8" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="1" />
      <text x="286" y="330" fill={C.orange} fontSize="10" fontWeight="700" fontFamily={mono}>MIRRORED MODE</text>
      <text x="286" y="348" fill={C.dim} fontSize="8.5" fontFamily={sans}>External system drives lifecycle.</text>
      <text x="286" y="360" fill={C.dim} fontSize="8.5" fontFamily={sans}>Reflects external state into tasks DB</text>
    </svg>
  );
}

/* ─── Devs vs Normies Sentiment Chart ─────────────────────── */

function DevsVsNormiesDiagram() {
  // Chart area — leave room for labels on right
  const left = 60, right = 420, top = 40, bottom = 260;
  const midY = (top + bottom) / 2;

  // Time labels
  const timePoints = [
    { x: left, label: 'Launch' },
    { x: left + (right - left) * 0.3, label: 'Early adopters' },
    { x: left + (right - left) * 0.6, label: 'Mainstream' },
    { x: right, label: 'Now' },
  ];

  const amp = 90; // max amplitude from midY

  // Normies (cyan) — starts neutral, rises to love
  const normiesPath = `M${left},${midY} C${left + 70},${midY - 8} ${left + 140},${midY - 50} ${left + 200},${midY - 65} C${left + 260},${midY - 78} ${left + 310},${midY - 85} ${right},${midY - amp}`;

  // Developers (red) — starts slightly positive, drops to disdain
  const devsPath = `M${left},${midY - 15} C${left + 50},${midY - 5} ${left + 120},${midY + 35} ${left + 200},${midY + 55} C${left + 270},${midY + 75} ${left + 320},${midY + 84} ${right},${midY + amp}`;

  return (
    <svg viewBox="0 0 520 300" fill="none" className="w-full h-auto">
      <defs>
        <linearGradient id="normies-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.cyan} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.cyan} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="devs-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.red} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.red} stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Title */}
      <text x={(left + right) / 2} y="20" textAnchor="middle" fill={C.white} fontSize="11" fontWeight="700" fontFamily={mono}>SENTIMENT OVER TIME</text>

      {/* Y-axis labels */}
      <text x="14" y={top + 8} fill={C.green} fontSize="9" fontWeight="700" fontFamily={mono}>LOVE</text>
      <text x="14" y={bottom - 2} fill={C.red} fontSize="9" fontWeight="700" fontFamily={mono}>DISDAIN</text>

      {/* Y-axis line */}
      <line x1={left} y1={top} x2={left} y2={bottom} stroke={C.faint} strokeWidth="1" />

      {/* Neutral dashed line */}
      <line x1={left} y1={midY} x2={right} y2={midY} stroke={C.faint} strokeWidth="1" strokeDasharray="4 3" />

      {/* X-axis bottom line */}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={C.faint} strokeWidth="1" />

      {/* Time labels */}
      {timePoints.map((pt) => (
        <g key={pt.label}>
          <line x1={pt.x} y1={bottom} x2={pt.x} y2={bottom + 4} stroke={C.faint} strokeWidth="1" />
          <text x={pt.x} y={bottom + 16} textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>{pt.label}</text>
        </g>
      ))}

      {/* Neutral label */}
      <text x={left - 6} y={midY + 3} textAnchor="end" fill={C.dim} fontSize="7.5" fontFamily={mono}>0</text>

      {/* Normies line (cyan) */}
      <path d={normiesPath} stroke="url(#normies-grad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx={right} cy={midY - amp} r="4" fill={C.cyan} />
      <text x={right + 10} y={midY - amp + 4} fill={C.cyan} fontSize="10" fontWeight="700" fontFamily={mono}>Normies</text>

      {/* Developers line (red) */}
      <path d={devsPath} stroke="url(#devs-grad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx={right} cy={midY + amp} r="4" fill={C.red} />
      <text x={right + 10} y={midY + amp + 4} fill={C.red} fontSize="10" fontWeight="700" fontFamily={mono}>Devs</text>
    </svg>
  );
}

export const DIAGRAMS = {
  lanes: LanesDiagram,
  heartbeat: HeartbeatDiagram,
  'core-docs': CoreDocsDiagram,
  'prompt-assembly': PromptAssemblyDiagram,
  cron: CronDiagram,
  tasks: TaskLifecycleDiagram,
  'devs-vs-normies': DevsVsNormiesDiagram,
};
