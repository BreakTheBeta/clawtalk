import { memo, useEffect, useEffectEvent, useRef, useState } from 'react';
import { slides } from './slides.js';
import { createDeckBackgroundRenderer } from './backgroundRenderer.js';
import { DIAGRAMS } from './diagrams.jsx';

const transitionMs = 520;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const mixColor = (from, to, amount) => from.map((value, index) => lerp(value, to[index], amount));
const mixValue = (from, to, amount) => lerp(from ?? 0, to ?? 0, amount);

const ACCENT_CLASS = {
  cool: 'border-sky-300/25 bg-sky-200/[0.08]',
  focus: 'border-cyan-300/30 bg-cyan-200/[0.08]',
  warm: 'border-orange-300/25 bg-orange-200/[0.08]',
};

function getInitialIndex() {
  const match = window.location.hash.match(/slide-(\d+)/);
  return clamp(match ? Number(match[1]) - 1 : 0, 0, slides.length - 1);
}

function getSceneProgress(index) {
  return slides.length > 1 ? index / (slides.length - 1) : 0;
}

function interpolateScene(from, to, amount) {
  const fromAmbient = from.ambient ?? from.toxic ?? from.haze;
  const toAmbient = to.ambient ?? to.toxic ?? to.haze;
  const fromEdge = from.edge ?? from.magenta ?? from.warning ?? fromAmbient;
  const toEdge = to.edge ?? to.magenta ?? to.warning ?? toAmbient;
  const fromWarning = from.warning ?? fromEdge;
  const toWarning = to.warning ?? toEdge;

  return {
    base: mixColor(from.base, to.base, amount),
    haze: mixColor(from.haze, to.haze, amount),
    toxic: mixColor(from.toxic ?? fromAmbient, to.toxic ?? toAmbient, amount),
    magenta: mixColor(from.magenta ?? fromEdge, to.magenta ?? toEdge, amount),
    warning: mixColor(fromWarning, toWarning, amount),
    ambient: mixColor(fromAmbient, toAmbient, amount),
    edge: mixColor(fromEdge, toEdge, amount),
    light: {
      x: lerp(from.light.x, to.light.x, amount),
      y: lerp(from.light.y, to.light.y, amount),
      radius: lerp(from.light.radius, to.light.radius, amount),
      strength: lerp(from.light.strength, to.light.strength, amount),
    },
    system: {
      aperture: mixValue(from.system?.aperture, to.system?.aperture, amount),
      bandCurve: mixValue(from.system?.bandCurve, to.system?.bandCurve, amount),
      beamTilt: mixValue(from.system?.beamTilt, to.system?.beamTilt, amount),
      bloom: mixValue(from.system?.bloom, to.system?.bloom, amount),
      contour: mixValue(from.system?.contour, to.system?.contour, amount),
      defense: mixValue(from.system?.defense, to.system?.defense, amount),
      density: mixValue(from.system?.density, to.system?.density, amount),
      diagnostics: mixValue(from.system?.diagnostics, to.system?.diagnostics, amount),
      displayMode: mixValue(from.system?.displayMode, to.system?.displayMode, amount),
      gate: mixValue(from.system?.gate, to.system?.gate, amount),
      horizon: mixValue(from.system?.horizon, to.system?.horizon, amount),
      interference: mixValue(from.system?.interference, to.system?.interference, amount),
      lattice: mixValue(from.system?.lattice, to.system?.lattice, amount),
      notch: mixValue(from.system?.notch, to.system?.notch, amount),
      phase: mixValue(from.system?.phase, to.system?.phase, amount),
      pulse: mixValue(from.system?.pulse, to.system?.pulse, amount),
      reticleBias: mixValue(from.system?.reticleBias, to.system?.reticleBias, amount),
      ruler: mixValue(from.system?.ruler, to.system?.ruler, amount),
      scan: mixValue(from.system?.scan, to.system?.scan, amount),
      sensorField: mixValue(from.system?.sensorField, to.system?.sensorField, amount),
      skew: mixValue(from.system?.skew, to.system?.skew, amount),
      waist: mixValue(from.system?.waist, to.system?.waist, amount),
      warningBias: mixValue(from.system?.warningBias, to.system?.warningBias, amount),
    },
  };
}

function renderPanels(items, columns = 'lg:grid-cols-2') {
  return (
    <div className={`grid w-full gap-6 sm:gap-8 ${columns}`}>
      {items.map((item) => (
        <Panel key={item.title} item={item} />
      ))}
    </div>
  );
}

function VisualCard({ visual, compact = false }) {
  if (!visual) return null;

  return (
    <figure
      className={`deck-visual ${compact ? 'deck-visual--compact' : ''}`}
      style={visual.bg ? { background: visual.bg } : undefined}
    >
      {visual.badge ? <span className="deck-visual-badge">{visual.badge}</span> : null}
      {visual.src ? (
        <img
          src={visual.src}
          alt={visual.alt ?? ''}
          className={`deck-visual-media ${visual.fit === 'contain' ? 'object-contain p-6' : 'object-cover'}`}
        />
      ) : (
        <div className="deck-visual-placeholder" aria-hidden="true" />
      )}
      {visual.caption ? <figcaption className="deck-visual-caption">{visual.caption}</figcaption> : null}
    </figure>
  );
}

function renderBody(slide) {
  switch (slide.layout) {
    case 'hero':
      return (
        <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            {slide.lede ? <p className="deck-lede">{slide.lede}</p> : null}
            {slide.chips?.length ? (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {slide.chips.map((chip) => (
                  <span key={chip} className="deck-chip">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
            {slide.facts?.length ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {slide.facts.map((fact) => (
                  <article key={fact.label} className="deck-fact">
                    <p className="deck-fact-value">{fact.value}</p>
                    <p className="deck-fact-label">{fact.label}</p>
                  </article>
                ))}
              </div>
            ) : null}
            {slide.panels ? renderPanels(slide.panels) : null}
            {slide.note ? <div className="deck-note">{slide.note}</div> : null}
          </div>
          <div className="flex items-center justify-center">
            <VisualCard visual={slide.visual} compact={slide.visual?.compact} />
          </div>
        </div>
      );
    case 'quote':
      return (
        <div className="grid flex-1 gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <article className="deck-quote-card">
            <p className="deck-quote-mark">"</p>
            <blockquote className="deck-quote">{slide.quote}</blockquote>
            {slide.attribution ? <p className="deck-quote-source">{slide.attribution}</p> : null}
            {slide.context ? <p className="deck-copy max-w-[36ch]">{slide.context}</p> : null}
          </article>
          <div className="space-y-4">
            <VisualCard visual={slide.visual} compact />
            {slide.panels ? renderPanels(slide.panels) : null}
          </div>
        </div>
      );
    case 'compare':
      return (
        <div className="flex flex-1 flex-col gap-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="deck-compare-head deck-compare-head--left">
              <p className="deck-label">{slide.compare.left.label}</p>
              {slide.compare.left.title ? <h3 className="deck-subtitle">{slide.compare.left.title}</h3> : null}
              {slide.compare.left.body ? <p className="deck-copy max-w-[34ch]">{slide.compare.left.body}</p> : null}
            </article>
            <article className="deck-compare-head deck-compare-head--right">
              <p className="deck-label">{slide.compare.right.label}</p>
              {slide.compare.right.title ? <h3 className="deck-subtitle">{slide.compare.right.title}</h3> : null}
              {slide.compare.right.body ? <p className="deck-copy max-w-[34ch]">{slide.compare.right.body}</p> : null}
            </article>
          </div>
          {slide.compare.rows.length > 0 ? (
            <div className="flex flex-1 flex-col justify-center gap-3">
              {slide.compare.rows.map((row) => (
                <article key={row.topic} className="deck-compare-row">
                  <div className="deck-compare-topic">{row.topic}</div>
                  <div className="deck-compare-cell">{row.left}</div>
                  <div className="deck-compare-cell">{row.right}</div>
                </article>
              ))}
            </div>
          ) : null}
          {slide.note ? <div className="deck-note">{slide.note}</div> : null}
        </div>
      );
    case 'trio':
      return (
        <div className="flex flex-1 items-center">
          {renderPanels(slide.cards, 'lg:grid-cols-3')}
        </div>
      );
    case 'split':
      return renderPanels(slide.panels);
    case 'split-note':
      return (
        <div className="flex flex-1 flex-col justify-center gap-5">
          {renderPanels(slide.panels)}
          {slide.note ? <div className="deck-note">{slide.note}</div> : null}
        </div>
      );
    case 'diagram': {
      const DiagramComponent = DIAGRAMS[slide.diagramId];
      return (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="deck-diagram">
            {DiagramComponent ? <DiagramComponent /> : null}
          </div>
          {slide.steps ? (
            <div className="deck-steps-grid deck-steps-grid--compact">
              {slide.steps.map((step, index) => (
                <article
                  key={`${step.title}-${index}`}
                  className={`deck-step-item ${step.accent ? `deck-step--${step.accent}` : ''}`}
                >
                  <h3 className="deck-step-title">{step.title}</h3>
                  {step.body ? <p className="deck-step-body">{step.body}</p> : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case 'steps':
      return (
        <div className="deck-steps-grid">
          {slide.steps.map((step, index) => (
            <article
              key={`${step.title}-${index}`}
              className={`deck-step-item ${step.accent ? `deck-step--${step.accent}` : ''}`}
            >
              <h3 className="deck-step-title">{step.title}</h3>
              {step.body ? <p className="deck-step-body">{step.body}</p> : null}
            </article>
          ))}
        </div>
      );
    case 'metrics':
      return (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {slide.metrics.map((metric) => (
            <article key={metric.label} className="deck-panel">
              <p className="deck-label">{metric.label}</p>
              <p className="deck-copy max-w-[24ch] text-balance text-lg text-white sm:text-xl">{metric.body}</p>
            </article>
          ))}
        </div>
      );
    case 'names':
      return (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="deck-panel">
            <h3 className="deck-subtitle">{slide.namesTitle ?? 'Current claws'}</h3>
            <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
              {slide.names.map((name) => (
                <span key={name} className="deck-chip text-center text-base text-white sm:text-lg">
                  {name}
                </span>
              ))}
            </div>
          </article>
          {slide.panels.map((panel) => (
            <Panel key={panel.title} item={panel} />
          ))}
        </div>
      );
    case 'grid':
      return (
        <div className="flex flex-1 items-center">
          {renderPanels(slide.cards)}
        </div>
      );
    case 'closing':
      return (
        <div className="flex flex-1 flex-col justify-center gap-6">
          {renderPanels(slide.cards, 'lg:grid-cols-3')}
          {slide.closing ? (
            <p className="max-w-[26ch] text-balance text-xl font-semibold leading-tight text-white/95 sm:text-3xl">
              {slide.closing}
            </p>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}

function DeckBackground({ activeIndex }) {
  const canvasRef = useRef(null);
  const startLoopRef = useRef(() => {});
  const currentSceneRef = useRef(slides[activeIndex].scene);
  const targetSceneRef = useRef(slides[activeIndex].scene);
  const currentPositionRef = useRef(activeIndex);
  const targetPositionRef = useRef(activeIndex);
  const stateRef = useRef({
    animationFrame: 0,
    dpr: 1,
    height: 0,
    lastFrameTime: 0,
    media: null,
    renderer: null,
    width: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const state = stateRef.current;
    state.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    try {
      state.renderer = createDeckBackgroundRenderer(canvas);
    } catch (error) {
      state.renderer = null;
      canvas.style.display = 'none';
      console.warn('Deck background disabled:', error);
    }

    const renderFrame = (scene, timeMs, position, localProgress) => {
      state.renderer?.render(scene, timeMs, {
        deckProgress: getSceneProgress(position),
        localProgress,
        slideCount: slides.length,
        slidePosition: position,
      });
    };

    const stopLoop = () => {
      if (!state.animationFrame) return;
      window.cancelAnimationFrame(state.animationFrame);
      state.animationFrame = 0;
    };

    // Exponential smoothing: each frame the scene smoothly approaches the
    // target.  No timer / duration – large jumps start fast and ease out,
    // rapid re-targeting just moves the destination.  Rate ≈ 95% in ~550 ms.
    const SMOOTH_RATE = 5.5;

    const frame = (timeMs) => {
      const dt = Math.min((timeMs - state.lastFrameTime) / 1000, 0.1);
      state.lastFrameTime = timeMs;

      if (!state.media?.matches && dt > 0) {
        const alpha = 1 - Math.exp(-SMOOTH_RATE * dt);

        currentSceneRef.current = interpolateScene(
          currentSceneRef.current,
          targetSceneRef.current,
          alpha,
        );
        currentPositionRef.current = lerp(
          currentPositionRef.current,
          targetPositionRef.current,
          alpha,
        );

        // Snap when asymptotically close to avoid creep
        if (Math.abs(currentPositionRef.current - targetPositionRef.current) < 0.002) {
          currentSceneRef.current = targetSceneRef.current;
          currentPositionRef.current = targetPositionRef.current;
        }
      }

      const posDelta = Math.abs(currentPositionRef.current - targetPositionRef.current);
      const localProgress = clamp(1 - posDelta, 0, 1);

      renderFrame(currentSceneRef.current, timeMs, currentPositionRef.current, localProgress);

      if (!document.hidden && !state.media?.matches) {
        state.animationFrame = window.requestAnimationFrame(frame);
      } else {
        state.animationFrame = 0;
      }
    };

    const startLoop = () => {
      if (state.animationFrame) return;
      state.lastFrameTime = performance.now();
      state.animationFrame = window.requestAnimationFrame(frame);
    };
    startLoopRef.current = startLoop;

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth >= 1500 ? 1 : window.innerWidth >= 1100 ? 1.1 : 1.2);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      state.renderer?.resize(state.width, state.height, state.dpr);
      renderFrame(currentSceneRef.current, performance.now(), currentPositionRef.current, 1);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        state.lastFrameTime = performance.now();
        renderFrame(currentSceneRef.current, performance.now(), currentPositionRef.current, 1);
        startLoop();
      }
    };

    const onMotionChange = () => {
      if (state.media?.matches) {
        stopLoop();
        currentSceneRef.current = targetSceneRef.current;
        currentPositionRef.current = targetPositionRef.current;
        renderFrame(currentSceneRef.current, performance.now(), currentPositionRef.current, 1);
      } else {
        startLoop();
      }
    };

    resize();
    state.lastFrameTime = performance.now();
    if (!state.media?.matches) startLoop();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    state.media?.addEventListener('change', onMotionChange);

    return () => {
      stopLoop();
      startLoopRef.current = () => {};
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      state.media?.removeEventListener('change', onMotionChange);
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    targetSceneRef.current = slides[activeIndex].scene;
    targetPositionRef.current = activeIndex;

    if (state.media?.matches) {
      currentSceneRef.current = targetSceneRef.current;
      currentPositionRef.current = targetPositionRef.current;
      state.renderer?.render(targetSceneRef.current, performance.now(), {
        deckProgress: getSceneProgress(activeIndex),
        localProgress: 1,
        slideCount: slides.length,
        slidePosition: activeIndex,
      });
      return;
    }

    if (!document.hidden) startLoopRef.current();
  }, [activeIndex]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

const Panel = memo(function Panel({ item }) {
  return (
    <article className={`deck-panel ${ACCENT_CLASS[item.accent] ?? 'border-white/10 bg-white/[0.06]'}`}>
      {item.label ? <p className="deck-label">{item.label}</p> : null}
      <h3 className="deck-subtitle">{item.title}</h3>
      {item.body ? <p className="deck-copy max-w-[34ch] text-balance">{item.body}</p> : null}
      {item.bullets ? (
        <ul className="deck-list">
          {item.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
});

const SlideCard = memo(function SlideCard({ slide, state, direction }) {
  return (
    <section
      aria-hidden={state === 'leaving'}
      className="deck-slide"
      data-direction={direction > 0 ? 'forward' : 'backward'}
      data-layout={slide.layout}
      data-slide={slide.id}
      data-state={state}
      data-title-size={slide.titleSize ?? 'default'}
    >
      <div className="deck-frame" data-layout={slide.layout}>
        {slide.kicker ? <p className="deck-kicker">{slide.kicker}</p> : null}
        <h1 className="deck-title">{slide.title}</h1>
        <div className="deck-body">{renderBody(slide)}</div>
      </div>
    </section>
  );
});

export default function App() {
  const [activeIndex, setActiveIndex] = useState(getInitialIndex);
  const [leavingIndex, setLeavingIndex] = useState(null);
  const [direction, setDirection] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const exitTimerRef = useRef(0);

  const navigateTo = useEffectEvent((nextIndex) => {
    const clamped = clamp(nextIndex, 0, slides.length - 1);

    setActiveIndex((current) => {
      if (clamped === current) return current;
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
      setDirection(clamped > current ? 1 : -1);
      setLeavingIndex(current);
      exitTimerRef.current = window.setTimeout(() => setLeavingIndex(null), transitionMs);
      return clamped;
    });
  });

  useEffect(() => {
    const nextHash = `#slide-${activeIndex + 1}`;
    if (window.location.hash !== nextHash) history.replaceState(null, '', nextHash);
  }, [activeIndex]);

  useEffect(() => {
    const onHashChange = () => {
      const match = window.location.hash.match(/slide-(\d+)/);
      if (!match) return;
      navigateTo(Number(match[1]) - 1);
    };

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, [navigateTo]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        navigateTo(activeIndex + 1);
      } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        navigateTo(activeIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        navigateTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        navigateTo(slides.length - 1);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, navigateTo]);

  const progress = getSceneProgress(activeIndex);
  const visibleSlides = leavingIndex === null ? [activeIndex] : [leavingIndex, activeIndex];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040814] text-slate-50">
      <DeckBackground activeIndex={activeIndex} />

      <main className="deck-app-shell relative z-10 min-h-screen">
        <div className="relative flex min-h-screen flex-col">
          <div className="deck-stage flex-1 px-4 py-4 sm:px-7 sm:py-6 lg:px-10">
            <div className="deck-slide-stack relative min-h-[calc(100vh-8rem)]">
              {visibleSlides.map((index) => (
                <SlideCard
                  key={`${slides[index].id}-${index === activeIndex ? 'active' : 'leaving'}`}
                  slide={slides[index]}
                  state={index === activeIndex ? 'active' : 'leaving'}
                  direction={direction}
                />
              ))}
            </div>
          </div>

          <footer className="deck-footer-shell relative z-20 px-4 pb-4 sm:px-7 lg:px-10">
            <div className="deck-footer-bar mx-auto flex w-full max-w-[1500px] items-center gap-3 rounded-full border border-white/10 bg-slate-950/85 px-3 py-3">
              <button
                type="button"
                onClick={() => navigateTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="deck-nav-button"
                aria-label="Previous slide"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => navigateTo(activeIndex + 1)}
                disabled={activeIndex === slides.length - 1}
                className="deck-nav-button"
                aria-label="Next slide"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen();
                  else document.documentElement.requestFullscreen();
                }}
                className="deck-nav-button"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <span className="sm:hidden">{isFullscreen ? 'Exit' : 'Full'}</span>
                <span className="hidden sm:inline">{isFullscreen ? 'Window' : 'Fullscreen'}</span>
              </button>
              <p className="deck-progress-label hidden font-mono text-[0.72rem] font-semibold tracking-[0.22em] text-white/38 sm:block">
                {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </p>
              <div className="deck-progress-track ml-2 h-px flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-white/70 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(progress * 100, 4)}%` }}
                />
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
