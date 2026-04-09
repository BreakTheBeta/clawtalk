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

/* ─── Sessions ─────────────────────────────────────────────── */

function SessionsDiagram() {
  const keys = [
    { scenario: 'Default main chat', key: 'agent:main:main', color: C.cyan },
    { scenario: 'Telegram DM (user 456)', key: 'agent:main:telegram:direct:456', color: C.orange },
    { scenario: 'Slack channel #ops', key: 'agent:main:slack:channel:C012', color: C.teal },
    { scenario: 'Thread in Slack channel', key: '...slack:channel:C012:thread:123', color: C.purple },
    { scenario: 'Subagent', key: 'agent:main:subagent:a3f7...', color: C.orange },
    { scenario: 'Cron job', key: 'agent:main:cron:morning-check', color: C.teal },
  ];

  const rowH = 28;
  const tableY = 30;
  const bridgeY = tableY + keys.length * rowH + 30;

  return (
    <svg viewBox="0 0 520 380" fill="none" className="w-full h-auto">
      <defs>
        <ArrowMarker id="ss" />
        <ArrowMarker id="ssc" color={C.cyan} />
        <ArrowMarker id="sso" color={C.orange} />
        <ArrowMarker id="ssp" color={C.purple} />
      </defs>

      {/* Session key table */}
      <text x="10" y="16" fill={C.white} fontSize="10" fontWeight="700" fontFamily={mono}>SESSION KEYS</text>
      <text x="10" y={tableY - 4} fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">SCENARIO</text>
      <text x="190" y={tableY - 4} fill={C.faint} fontSize="8" fontFamily={mono} letterSpacing="0.1em">SESSION KEY</text>

      {keys.map((k, i) => {
        const y = tableY + i * rowH;
        return (
          <g key={k.scenario}>
            <rect x="8" y={y} width="504" height={rowH - 4} rx="4" fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)'} stroke={C.faint} strokeWidth="0.5" />
            <text x="16" y={y + 17} fill={C.dim} fontSize="8.5" fontFamily={sans}>{k.scenario}</text>
            <text x="196" y={y + 17} fill={k.color} fontSize="8.5" fontWeight="600" fontFamily={mono}>{k.key}</text>
          </g>
        );
      })}

      {/* How information travels */}
      <text x="10" y={bridgeY} fill={C.white} fontSize="10" fontWeight="700" fontFamily={mono}>HOW INFORMATION TRAVELS BETWEEN SESSIONS</text>
      <text x="10" y={bridgeY + 14} fill={C.dim} fontSize="7.5" fontFamily={sans}>Sessions cannot read each other's transcripts directly. Four bridges:</text>

      {/* Bridge 1: System Events */}
      <rect x="10" y={bridgeY + 24} width="120" height="62" rx="6" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="0.8" />
      <text x="70" y={bridgeY + 40} textAnchor="middle" fill={C.cyan} fontSize="8" fontWeight="700" fontFamily={mono}>System Events</text>
      <text x="70" y={bridgeY + 54} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Ephemeral in-memory queue</text>
      <text x="70" y={bridgeY + 66} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Prepended to next turn</text>
      <text x="70" y={bridgeY + 78} textAnchor="middle" fill={C.faint} fontSize="6.5" fontFamily={sans}>Not persisted — lost on restart</text>

      {/* Bridge 2: sessions_send */}
      <rect x="140" y={bridgeY + 24} width="120" height="62" rx="6" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="0.8" />
      <text x="200" y={bridgeY + 40} textAnchor="middle" fill={C.orange} fontSize="8" fontWeight="700" fontFamily={mono}>sessions_send</text>
      <text x="200" y={bridgeY + 54} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Message another session</text>
      <text x="200" y={bridgeY + 66} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Fire-and-forget or wait</text>
      <text x="200" y={bridgeY + 78} textAnchor="middle" fill={C.faint} fontSize="6.5" fontFamily={sans}>Ping-pong up to 5 turns</text>

      {/* Bridge 3: sessions_spawn */}
      <rect x="270" y={bridgeY + 24} width="120" height="62" rx="6" fill={C.tealBg} stroke={C.tealBorder} strokeWidth="0.8" />
      <text x="330" y={bridgeY + 40} textAnchor="middle" fill={C.teal} fontSize="8" fontWeight="700" fontFamily={mono}>sessions_spawn</text>
      <text x="330" y={bridgeY + 54} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Isolated child session</text>
      <text x="330" y={bridgeY + 66} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Always non-blocking</text>
      <text x="330" y={bridgeY + 78} textAnchor="middle" fill={C.faint} fontSize="6.5" fontFamily={sans}>Results announced to parent</text>

      {/* Bridge 4: sessions_history */}
      <rect x="400" y={bridgeY + 24} width="110" height="62" rx="6" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="0.8" />
      <text x="455" y={bridgeY + 40} textAnchor="middle" fill={C.purple} fontSize="8" fontWeight="700" fontFamily={mono}>sessions_history</text>
      <text x="455" y={bridgeY + 54} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Read-only transcript</text>
      <text x="455" y={bridgeY + 66} textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>Redacted + sanitized</text>
      <text x="455" y={bridgeY + 78} textAnchor="middle" fill={C.faint} fontSize="6.5" fontFamily={sans}>80KB cap, 4K/block</text>

    </svg>
  );
}

/* ─── Lane System ──────────────────────────────────────────── */

function LanesDiagram() {
  const lanes = [
    { label: 'MAIN', cap: '4', desc: 'User messages get dedicated capacity', color: C.cyan, bg: C.cyanBg, border: C.cyanBorder },
    { label: 'SUBAGENT', cap: '8', desc: 'Child work without eating parent slots', color: C.orange, bg: C.orangeBg, border: C.orangeBorder },
    { label: 'CRON', cap: '1', desc: 'Background jobs can\'t flood user capacity', color: C.teal, bg: C.tealBg, border: C.tealBorder },
    { label: 'NESTED', cap: '1', desc: 'Prevents deadlock (see below)', color: C.purple, bg: C.purpleBg, border: C.purpleBorder },
  ];

  return (
    <svg viewBox="0 0 520 420" fill="none" className="w-full h-auto">
      <defs>
        <ArrowMarker id="la" />
        <ArrowMarker id="lac" color={C.cyan} />
        <ArrowMarker id="lao" color={C.orange} />
        <ArrowMarker id="lap" color={C.purple} />
        <ArrowMarker id="lat" color={C.teal} />
      </defs>

      {/* ── Two-layer solution ── */}
      <text x="10" y="14" fill={C.white} fontSize="10" fontWeight="700" fontFamily={mono}>TWO-LAYER QUEUE</text>

      {/* Inbound */}
      <text x="10" y="36" fill={C.faint} fontSize="7" fontFamily={mono}>INBOUND</text>
      <rect x="10" y="42" width="60" height="20" rx="3" fill="rgba(255,255,255,0.03)" stroke={C.faint} strokeWidth="0.6" />
      <text x="40" y="56" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>User A ×2</text>
      <rect x="10" y="66" width="60" height="20" rx="3" fill="rgba(255,255,255,0.03)" stroke={C.faint} strokeWidth="0.6" />
      <text x="40" y="80" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>User B</text>
      <rect x="10" y="90" width="60" height="20" rx="3" fill="rgba(255,255,255,0.03)" stroke={C.faint} strokeWidth="0.6" />
      <text x="40" y="104" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>Subagent</text>
      <rect x="10" y="114" width="60" height="20" rx="3" fill="rgba(255,255,255,0.03)" stroke={C.faint} strokeWidth="0.6" />
      <text x="40" y="128" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>Cron</text>

      {/* Arrows to Layer 1 */}
      <line x1="70" y1="52" x2="98" y2="52" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />
      <line x1="70" y1="76" x2="98" y2="76" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />
      <line x1="70" y1="100" x2="98" y2="100" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />
      <line x1="70" y1="124" x2="98" y2="124" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />

      {/* Layer 1: Session lanes */}
      <text x="100" y="36" fill={C.cyan} fontSize="7" fontWeight="600" fontFamily={mono}>LAYER 1: SESSION LANE [cap 1]</text>
      <rect x="100" y="42" width="120" height="20" rx="3" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="0.8" />
      <text x="160" y="56" textAnchor="middle" fill={C.cyan} fontSize="7" fontWeight="600" fontFamily={mono}>session:alice [1]</text>
      <rect x="100" y="66" width="120" height="20" rx="3" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="0.8" />
      <text x="160" y="80" textAnchor="middle" fill={C.cyan} fontSize="7" fontWeight="600" fontFamily={mono}>session:bob [1]</text>
      <rect x="100" y="90" width="120" height="20" rx="3" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="0.8" />
      <text x="160" y="104" textAnchor="middle" fill={C.orange} fontSize="7" fontWeight="600" fontFamily={mono}>session:sub:… [1]</text>
      <rect x="100" y="114" width="120" height="20" rx="3" fill={C.tealBg} stroke={C.tealBorder} strokeWidth="0.8" />
      <text x="160" y="128" textAnchor="middle" fill={C.teal} fontSize="7" fontWeight="600" fontFamily={mono}>session:cron:… [1]</text>

      {/* Arrows to Layer 2 */}
      <line x1="220" y1="52" x2="268" y2="64" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />
      <line x1="220" y1="76" x2="268" y2="70" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />
      <line x1="220" y1="100" x2="268" y2="100" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />
      <line x1="220" y1="124" x2="268" y2="124" stroke={C.line} strokeWidth="0.8" markerEnd="url(#la)" />

      {/* Layer 2: Global lanes */}
      <text x="270" y="36" fill={C.faint} fontSize="7" fontWeight="600" fontFamily={mono}>LAYER 2: GLOBAL LANES</text>
      <rect x="270" y="42" width="100" height="40" rx="5" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="0.8" />
      <text x="320" y="60" textAnchor="middle" fill={C.cyan} fontSize="9" fontWeight="700" fontFamily={mono}>MAIN [4]</text>
      <text x="320" y="74" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={sans}>user messages</text>

      <rect x="270" y="88" width="100" height="26" rx="5" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="0.8" />
      <text x="320" y="106" textAnchor="middle" fill={C.orange} fontSize="9" fontWeight="700" fontFamily={mono}>SUBAGENT [8]</text>

      <rect x="270" y="118" width="100" height="26" rx="5" fill={C.tealBg} stroke={C.tealBorder} strokeWidth="0.8" />
      <text x="320" y="136" textAnchor="middle" fill={C.teal} fontSize="9" fontWeight="700" fontFamily={mono}>CRON [1]</text>

      {/* Arrow to run */}
      <line x1="370" y1="80" x2="400" y2="80" stroke={C.cyan} strokeWidth="1.2" markerEnd="url(#lac)" />
      <rect x="402" y="62" width="100" height="40" rx="8" fill="rgba(74,222,128,0.06)" stroke="rgba(74,222,128,0.3)" strokeWidth="1" />
      <text x="452" y="86" textAnchor="middle" fill={C.green} fontSize="10" fontWeight="700" fontFamily={mono}>LLM RUN</text>

      {/* ── Lane table ── */}
      <text x="10" y="168" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>FOUR GLOBAL LANES</text>

      {lanes.map((l, i) => {
        const y = 180 + i * 30;
        return (
          <g key={l.label}>
            <rect x="10" y={y} width="500" height="26" rx="4" fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)'} stroke={C.faint} strokeWidth="0.5" />
            <text x="22" y={y + 17} fill={l.color} fontSize="9" fontWeight="700" fontFamily={mono}>{l.label}</text>
            <text x="110" y={y + 17} fill={C.dim} fontSize="9" fontWeight="600" fontFamily={mono}>cap {l.cap}</text>
            <text x="160" y={y + 17} fill={C.dim} fontSize="8" fontFamily={sans}>{l.desc}</text>
          </g>
        );
      })}

      {/* ── Deadlock prevention ── */}
      <text x="10" y="316" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>DEADLOCK PREVENTION</text>

      <rect x="10" y="328" width="500" height="70" rx="10" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1" />

      <rect x="24" y="338" width="72" height="30" rx="5" fill={C.tealBg} stroke={C.tealBorder} strokeWidth="0.8" />
      <text x="60" y="357" textAnchor="middle" fill={C.teal} fontSize="8.5" fontWeight="700" fontFamily={mono}>CRON JOB</text>
      <text x="60" y="382" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>holds slot</text>

      <line x1="96" y1="353" x2="124" y2="353" stroke={C.line} strokeWidth="1" markerEnd="url(#la)" />
      <text x="110" y="346" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>runs</text>

      <rect x="126" y="338" width="82" height="30" rx="5" fill="rgba(255,255,255,0.04)" stroke={C.faint} strokeWidth="0.8" />
      <text x="167" y="357" textAnchor="middle" fill={C.white} fontSize="8" fontWeight="600" fontFamily={mono}>inner agent</text>

      <line x1="208" y1="353" x2="236" y2="353" stroke={C.line} strokeWidth="1" markerEnd="url(#la)" />
      <text x="222" y="346" textAnchor="middle" fill={C.dim} fontSize="7" fontFamily={mono}>needs</text>

      <rect x="238" y="338" width="56" height="30" rx="5" fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.3)" strokeWidth="0.8" />
      <text x="266" y="357" textAnchor="middle" fill={C.red} fontSize="8" fontWeight="700" fontFamily={mono}>CRON</text>
      <text x="266" y="382" textAnchor="middle" fill={C.red} fontSize="7" fontFamily={mono}>same lane</text>
      <line x1="248" y1="342" x2="284" y2="364" stroke={C.red} strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="284" y1="342" x2="248" y2="364" stroke={C.red} strokeWidth="1.2" strokeOpacity="0.5" />

      <line x1="294" y1="353" x2="330" y2="353" stroke={C.purple} strokeWidth="1.2" markerEnd="url(#lap)" />
      <text x="312" y="346" textAnchor="middle" fill={C.purple} fontSize="7" fontWeight="600" fontFamily={mono}>always remap</text>

      <rect x="332" y="338" width="70" height="30" rx="5" fill={C.purpleBg} stroke={C.purple} strokeWidth="1" />
      <text x="367" y="357" textAnchor="middle" fill={C.purple} fontSize="8.5" fontWeight="700" fontFamily={mono}>NESTED</text>
      <text x="367" y="382" textAnchor="middle" fill={C.green} fontSize="7" fontWeight="600" fontFamily={mono}>safe!</text>
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
      <text x="435" y="184" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>OpenClaw Runtime</text>

      {/* Skills folder */}
      <rect x="380" y="230" width="110" height="36" rx="6" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1" />
      <text x="435" y="252" textAnchor="middle" fill={C.purple} fontSize="9" fontWeight="700" fontFamily={mono}>skills/*/SKILL.md</text>
      <line x1="435" y1="230" x2="435" y2="212" stroke={C.line} strokeWidth="1" markerEnd="url(#cd)" />
    </svg>
  );
}

/* ─── Prompt Assembly Pipeline ─────────────────────────────── */

function PromptAssemblyDiagram() {
  const cx = 260; // center x
  return (
    <svg viewBox="0 0 520 320" fill="none" className="w-full h-auto">
      <defs>
        <ArrowMarker id="pa" />
        <ArrowMarker id="pac" color={C.cyan} />
      </defs>

      {/* Section: Each API call */}
      <text x={cx} y="20" textAnchor="middle" fill={C.white} fontSize="13" fontWeight="700" fontFamily={mono}>EACH API CALL</text>

      {[
        { label: 'Turn 1', hist: 20 },
        { label: 'Turn 2', hist: 55 },
        { label: 'Turn 3', hist: 100 },
      ].map((t, i) => {
        const y = 38 + i * 50;
        const barH = 36;
        const cW = 200;
        const vW = 30;
        const hW = t.hist;
        const barStart = 70;
        return (
          <g key={t.label}>
            <text x="14" y={y + 23} fill={C.dim} fontSize="12" fontWeight="600" fontFamily={mono}>{t.label}</text>
            {/* Cached prefix */}
            <rect x={barStart} y={y} width={cW} height={barH} rx="6" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="1.2" />
            <text x={barStart + cW / 2} y={y + 22} textAnchor="middle" fill={C.green} fontSize="11" fontWeight="700" fontFamily={mono}>
              {i === 0 ? 'STABLE PREFIX → CACHED' : 'CACHE HIT (free)'}
            </text>
            {/* Volatile */}
            <rect x={barStart + cW + 3} y={y} width={vW} height={barH} rx="6" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="1.2" />
            {/* Transcript grows */}
            <rect x={barStart + cW + vW + 6} y={y} width={hW} height={barH} rx="6" fill="rgba(255,255,255,0.05)" stroke={C.faint} strokeWidth="1.2" />
            {i === 0 && <>
              <text x={barStart + cW + 3 + vW + 3 + hW / 2} y={y - 7} textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={mono}>
                <tspan fill={C.orange}>volatile context</tspan>{' + transcript'}
              </text>
            </>}
            {i === 2 && <text x={barStart + cW + vW + 6 + hW + 8} y={y + 23} fill={C.orange} fontSize="11" fontWeight="600" fontFamily={mono}>{'← grows'}</text>}
          </g>
        );
      })}

      {/* Divider */}
      <line x1="40" y1="196" x2="480" y2="196" stroke={C.faint} strokeWidth="0.5" strokeDasharray="4 4" />

      {/* Section: Compaction */}
      <text x={cx} y="218" textAnchor="middle" fill={C.white} fontSize="13" fontWeight="700" fontFamily={mono}>WHEN CONTEXT FILLS UP</text>

      <rect x="46" y="232" width="130" height="44" rx="8" fill="rgba(255,255,255,0.03)" stroke={C.cyanBorder} strokeWidth="1" />
      <text x="111" y="250" textAnchor="middle" fill={C.cyan} fontSize="10" fontWeight="700" fontFamily={mono}>PREEMPTIVE</text>
      <text x="111" y="266" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={sans}>before send</text>

      <rect x="186" y="232" width="130" height="44" rx="8" fill="rgba(255,255,255,0.03)" stroke={C.orangeBorder} strokeWidth="1" />
      <text x="251" y="250" textAnchor="middle" fill={C.orange} fontSize="10" fontWeight="700" fontFamily={mono}>POST-TURN</text>
      <text x="251" y="266" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={sans}>after success</text>

      <rect x="326" y="232" width="130" height="44" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(248,113,113,0.35)" strokeWidth="1" />
      <text x="391" y="250" textAnchor="middle" fill={C.red} fontSize="10" fontWeight="700" fontFamily={mono}>OVERFLOW</text>
      <text x="391" y="266" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={sans}>after API error</text>

      {/* Arrow down to compaction */}
      <line x1={cx} y1="276" x2={cx} y2="290" stroke={C.line} strokeWidth="1.2" markerEnd="url(#pa)" />

      <rect x="100" y="294" width="320" height="22" rx="6" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1.2" />
      <text x={cx} y="309" textAnchor="middle" fill={C.purple} fontSize="10" fontWeight="700" fontFamily={mono}>COMPACTION — recent verbatim, older summarized</text>

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
    <svg viewBox="0 0 520 340" fill="none" className="w-full h-auto">
      <defs>
        <ArrowMarker id="tl" />
        <ArrowMarker id="tlc" color={C.cyan} />
        <ArrowMarker id="tlg" color={C.green} />
        <ArrowMarker id="tlr" color={C.red} />
      </defs>

      {/* Creates vs doesn't */}
      <text x="10" y="14" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>CREATES A TASK</text>
      {[
        { label: 'ACP (API calls)', color: C.cyan },
        { label: 'Subagents', color: C.orange },
        { label: 'Cron jobs', color: C.teal },
        { label: 'CLI ops', color: C.purple },
      ].map((s, i) => (
        <g key={s.label}>
          <rect x="10" y={24 + i * 22} width="90" height="18" rx="3" fill="rgba(255,255,255,0.03)" stroke={s.color} strokeWidth="0.8" strokeOpacity="0.5" />
          <text x="55" y={37 + i * 22} textAnchor="middle" fill={s.color} fontSize="8" fontWeight="600" fontFamily={mono}>{s.label}</text>
        </g>
      ))}

      <text x="130" y="14" fill={C.faint} fontSize="9" fontWeight="700" fontFamily={mono}>DOES NOT</text>
      {[
        { label: 'Chat turns', color: C.dim },
        { label: 'Heartbeats', color: C.dim },
        { label: '/commands', color: C.dim },
      ].map((s, i) => (
        <g key={s.label}>
          <rect x="130" y={24 + i * 22} width="90" height="18" rx="3" fill="rgba(255,255,255,0.01)" stroke={C.faint} strokeWidth="0.5" />
          <text x="175" y={37 + i * 22} textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={mono}>{s.label}</text>
        </g>
      ))}

      {/* Lifecycle */}
      <text x="260" y="14" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>LIFECYCLE</text>

      {/* QUEUED */}
      <rect x="260" y="24" width="70" height="30" rx="6" fill={C.purpleBg} stroke={C.purpleBorder} strokeWidth="1" />
      <text x="295" y="43" textAnchor="middle" fill={C.purple} fontSize="9" fontWeight="700" fontFamily={mono}>QUEUED</text>

      <line x1="330" y1="39" x2="358" y2="39" stroke={C.line} strokeWidth="1" markerEnd="url(#tl)" />

      {/* RUNNING */}
      <rect x="360" y="24" width="74" height="30" rx="6" fill={C.cyanBg} stroke={C.cyan} strokeWidth="1.2" />
      <text x="397" y="43" textAnchor="middle" fill={C.cyan} fontSize="9" fontWeight="700" fontFamily={mono}>RUNNING</text>

      {/* Terminal states */}
      <line x1="434" y1="30" x2="458" y2="22" stroke="rgba(74,222,128,0.3)" strokeWidth="1" markerEnd="url(#tlg)" />
      <rect x="460" y="8" width="52" height="22" rx="4" fill={C.greenBg} stroke="rgba(74,222,128,0.35)" strokeWidth="0.8" />
      <text x="486" y="23" textAnchor="middle" fill={C.green} fontSize="7" fontWeight="700" fontFamily={mono}>OK</text>

      <line x1="434" y1="39" x2="458" y2="39" stroke="rgba(248,113,113,0.3)" strokeWidth="1" markerEnd="url(#tlr)" />
      <rect x="460" y="28" width="52" height="22" rx="4" fill="rgba(248,113,113,0.06)" stroke="rgba(248,113,113,0.35)" strokeWidth="0.8" />
      <text x="486" y="43" textAnchor="middle" fill={C.red} fontSize="7" fontWeight="700" fontFamily={mono}>FAILED</text>

      <line x1="434" y1="48" x2="458" y2="56" stroke="rgba(251,191,36,0.3)" strokeWidth="1" markerEnd="url(#tl)" />
      <rect x="460" y="48" width="52" height="22" rx="4" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.35)" strokeWidth="0.8" />
      <text x="486" y="63" textAnchor="middle" fill={C.yellow} fontSize="7" fontWeight="700" fontFamily={mono}>TIMEOUT</text>

      {/* LOST - special */}
      <line x1="397" y1="54" x2="397" y2="72" stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#tl)" />
      <rect x="368" y="74" width="58" height="22" rx="4" fill="rgba(255,255,255,0.03)" stroke={C.faint} strokeWidth="0.8" />
      <text x="397" y="89" textAnchor="middle" fill={C.dim} fontSize="7" fontWeight="700" fontFamily={mono}>LOST</text>
      <text x="434" y="89" fill={C.faint} fontSize="6.5" fontFamily={sans}>backing gone &gt; 5m</text>

      {/* Lost detection section */}
      <text x="10" y="130" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>LOST DETECTION (every 60s)</text>

      <rect x="10" y="142" width="500" height="56" rx="8" fill="rgba(248,113,113,0.04)" stroke="rgba(248,113,113,0.2)" strokeWidth="0.8" />
      <text x="24" y="160" fill={C.dim} fontSize="8" fontFamily={mono}>For each active task: is the backing runtime still alive?</text>
      <text x="24" y="178" fill={C.dim} fontSize="8" fontFamily={mono}>
        <tspan fill={C.cyan}>ACP</tspan> → session entry?{'   '}
        <tspan fill={C.teal}>Cron</tspan> → job tracked?{'   '}
        <tspan fill={C.purple}>CLI</tspan> → run context?{'   '}
        <tspan fill={C.red}>Gone &gt; 5 min → LOST</tspan>
      </text>
      <text x="24" y="192" fill={C.faint} fontSize="7.5" fontFamily={mono}>Terminal records kept 7 days, then pruned</text>

      {/* Two orchestration modes */}
      <text x="10" y="226" fill={C.white} fontSize="9" fontWeight="700" fontFamily={mono}>TWO ORCHESTRATION MODES</text>

      <rect x="10" y="238" width="244" height="86" rx="8" fill={C.cyanBg} stroke={C.cyanBorder} strokeWidth="1" />
      <text x="24" y="258" fill={C.cyan} fontSize="9" fontWeight="700" fontFamily={mono}>MANAGED</text>
      <text x="24" y="274" fill={C.dim} fontSize="8" fontFamily={sans}>Flow owns the lifecycle end-to-end.</text>
      <text x="24" y="290" fill={C.dim} fontSize="8" fontFamily={sans}>Create → assign → track → cleanup</text>
      <text x="24" y="306" fill={C.faint} fontSize="7.5" fontFamily={mono}>e.g. multi-step report flow</text>

      <rect x="266" y="238" width="244" height="86" rx="8" fill={C.orangeBg} stroke={C.orangeBorder} strokeWidth="1" />
      <text x="280" y="258" fill={C.orange} fontSize="9" fontWeight="700" fontFamily={mono}>MIRRORED</text>
      <text x="280" y="274" fill={C.dim} fontSize="8" fontFamily={sans}>Flow observes external tasks.</text>
      <text x="280" y="290" fill={C.dim} fontSize="8" fontFamily={sans}>Cron/CLI creates, flow syncs state</text>
      <text x="280" y="306" fill={C.faint} fontSize="7.5" fontFamily={mono}>e.g. 3 cron jobs as "morning ops"</text>
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
    { x: right, label: 'Early adopters' },
  ];

  const amp = 90; // max amplitude from midY

  // Non-devs (cyan) — starts neutral, rises to love
  const normiesPath = `M${left},${midY} C${left + 120},${midY - 15} ${left + 240},${midY - 60} ${right},${midY - amp}`;

  // Developers (red) — starts slightly positive, drops to disdain
  const devsPath = `M${left},${midY - 15} C${left + 100},${midY + 10} ${left + 220},${midY + 60} ${right},${midY + amp}`;

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

      {/* Non-devs line (cyan) */}
      <path d={normiesPath} stroke="url(#normies-grad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx={right} cy={midY - amp} r="4" fill={C.cyan} />
      <text x={right + 10} y={midY - amp + 4} fill={C.cyan} fontSize="10" fontWeight="700" fontFamily={mono}>Non-devs</text>

      {/* Developers line (red) */}
      <path d={devsPath} stroke="url(#devs-grad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx={right} cy={midY + amp} r="4" fill={C.red} />
      <text x={right + 10} y={midY + amp + 4} fill={C.red} fontSize="10" fontWeight="700" fontFamily={mono}>Devs</text>
    </svg>
  );
}

export const DIAGRAMS = {
  sessions: SessionsDiagram,
  lanes: LanesDiagram,
  heartbeat: HeartbeatDiagram,
  'core-docs': CoreDocsDiagram,
  'prompt-assembly': PromptAssemblyDiagram,
  cron: CronDiagram,
  tasks: TaskLifecycleDiagram,
  'devs-vs-normies': DevsVsNormiesDiagram,
};
