import { memo, useEffect, useEffectEvent, useRef, useState } from 'react';
import { slides } from './slides.js';
import { createDeckBackgroundRenderer } from './backgroundRenderer.js';

const transitionMs = 520;
const tau = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const mixColor = (from, to, amount) => from.map((value, index) => lerp(value, to[index], amount));
const scaleColor = (rgb, factor) => rgb.map((value) => clamp(value * factor, 0, 255));
const mixValue = (from, to, amount) => lerp(from ?? 0, to ?? 0, amount);
const indexToColor = (amount, from, mid, to) => {
  if (amount <= 0.5) return mixColor(from, mid, amount * 2);
  return mixColor(mid, to, (amount - 0.5) * 2);
};
const toRgba = (rgb, alpha) => {
  const safeAlpha = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 0;
  return `rgba(${rgb.map((value) => Math.round(value)).join(', ')}, ${safeAlpha})`;
};
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const smootherstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const calmPulse = (value) => clamp((value ?? 0) * 0.38, 0, 1);
const driftTime = (time) => time * 0.58;

function getInitialIndex() {
  const match = window.location.hash.match(/slide-(\d+)/);
  return clamp(match ? Number(match[1]) - 1 : 0, 0, slides.length - 1);
}

function interpolateScene(from, to, amount) {
  const fromAmbient = from.ambient ?? from.toxic ?? from.haze;
  const toAmbient = to.ambient ?? to.toxic ?? to.haze;
  const fromEdge = from.edge ?? from.magenta ?? from.warning ?? fromAmbient;
  const toEdge = to.edge ?? to.magenta ?? to.warning ?? toAmbient;

  return {
    base: mixColor(from.base, to.base, amount),
    haze: mixColor(from.haze, to.haze, amount),
    ambient: mixColor(fromAmbient, toAmbient, amount),
    edge: mixColor(fromEdge, toEdge, amount),
    light: {
      x: lerp(from.light.x, to.light.x, amount),
      y: lerp(from.light.y, to.light.y, amount),
      radius: lerp(from.light.radius, to.light.radius, amount),
      strength: lerp(from.light.strength, to.light.strength, amount),
    },
    system: {
      displayMode: mixValue(from.system?.displayMode, to.system?.displayMode, amount),
      defense: mixValue(from.system?.defense, to.system?.defense, amount),
      phase: mixValue(from.system?.phase, to.system?.phase, amount),
      horizon: mixValue(from.system?.horizon, to.system?.horizon, amount),
      bandCurve: mixValue(from.system?.bandCurve, to.system?.bandCurve, amount),
      beamTilt: mixValue(from.system?.beamTilt, to.system?.beamTilt, amount),
      lattice: mixValue(from.system?.lattice, to.system?.lattice, amount),
      density: mixValue(from.system?.density, to.system?.density, amount),
      aperture: mixValue(from.system?.aperture, to.system?.aperture, amount),
      warningBias: mixValue(from.system?.warningBias, to.system?.warningBias, amount),
      reticleBias: mixValue(from.system?.reticleBias, to.system?.reticleBias, amount),
      scan: mixValue(from.system?.scan, to.system?.scan, amount),
      notch: mixValue(from.system?.notch, to.system?.notch, amount),
      skew: mixValue(from.system?.skew, to.system?.skew, amount),
      contour: mixValue(from.system?.contour, to.system?.contour, amount),
      interference: mixValue(from.system?.interference, to.system?.interference, amount),
      pulse: mixValue(from.system?.pulse, to.system?.pulse, amount),
      gate: mixValue(from.system?.gate, to.system?.gate, amount),
      sensorField: mixValue(from.system?.sensorField, to.system?.sensorField, amount),
      bloom: mixValue(from.system?.bloom, to.system?.bloom, amount),
      ruler: mixValue(from.system?.ruler, to.system?.ruler, amount),
      diagnostics: mixValue(from.system?.diagnostics, to.system?.diagnostics, amount),
      waist: mixValue(from.system?.waist, to.system?.waist, amount),
    },
  };
}

function withLayerAlpha(context, alpha, draw) {
  if (alpha <= 0.002) return;
  context.save();
  context.globalAlpha *= clamp(alpha, 0, 1);
  draw();
  context.restore();
}

function deriveContinuousScene(scene, controls, time) {
  const slideCount = Math.max(1, controls.slideCount ?? slides.length);
  const localProgress = clamp(controls.localProgress ?? 1, 0, 1);
  const deckProgress = clamp(controls.deckProgress ?? 0, 0, 1);
  const slideSpan = Math.max(1, slideCount - 1);
  const slidePosition = clamp(controls.slidePosition ?? 0, 0, slideSpan);
  const slideIndex = clamp(slidePosition / slideSpan, 0, 1);
  const transitionEase = smootherstep(0, 1, localProgress);
  const slowDriftA = Math.sin(time * 0.072 + deckProgress * tau * 0.85 + slideIndex * 0.7);
  const slowDriftB = Math.sin(time * 0.049 - deckProgress * tau * 0.34 + slidePosition * 0.18 + 1.4);
  const slowDriftC = Math.cos(time * 0.031 + slideIndex * tau * 0.42 - 0.6);
  const slowDriftD = Math.sin(time * 0.022 + deckProgress * tau * 0.24 + 2.1);
  const ambientDrift = Math.sin(time * 0.12 + deckProgress * tau * 0.9);
  const deckWave = Math.sin(deckProgress * tau * 1.4 - time * 0.08 + slidePosition * 0.16);
  const transitionWave = Math.sin(transitionEase * Math.PI + time * 0.1 + slideIndex * tau * 0.3);
  const pulseWave = Math.sin((scene.system.phase ?? 0.5) * tau + time * (0.12 + calmPulse(scene.system.pulse) * 0.08));
  const mode = clamp(scene.system.displayMode ?? 0, 0, 1);
  const horizonDrift = slowDriftA * 0.065 + slowDriftC * 0.035;
  const beamTiltDrift = slowDriftB * 0.07 + slowDriftD * 0.03;
  const apertureDrift = slowDriftA * 0.055 - slowDriftB * 0.03;
  const gateDrift = slowDriftC * 0.06 + slowDriftD * 0.025;
  const densityDrift = slowDriftB * 0.06 - slowDriftA * 0.022;
  const contourDrift = slowDriftA * 0.05 + slowDriftC * 0.03;
  const sweepDrift = slowDriftD * 0.075 + slowDriftB * 0.03;
  const balanceDrift = slowDriftA * 0.045 - slowDriftC * 0.025;
  const phaseDrift = slowDriftA * 0.055 + slowDriftB * 0.035 + slowDriftD * 0.02;

  const specimenPresence = clamp(
    0.72 -
      (scene.system.sensorField ?? 0) * 0.52 -
      (scene.system.defense ?? 0) * 0.24 +
      (1 - deckProgress) * 0.06 +
      ambientDrift * 0.03 +
      transitionWave * 0.03,
    0.08,
    1,
  );
  const defensePresence = clamp(
    (scene.system.defense ?? 0) * 0.84 +
      smoothstep(0.38, 0.72, mode) * 0.16 +
      slideIndex * 0.08 +
      transitionEase * 0.06 +
      pulseWave * 0.04,
    0,
    1,
  );
  const sensorPresence = clamp(
    (scene.system.sensorField ?? 0) * 0.86 +
      smoothstep(0.74, 0.94, mode) * 0.12 +
      deckProgress * 0.06 +
      transitionEase * 0.07 +
      ambientDrift * 0.03,
    0,
    1,
  );
  const contourStrength = clamp(
    (scene.system.contour ?? 0) * 0.78 +
      sensorPresence * 0.14 +
      defensePresence * 0.04 +
      transitionWave * 0.04,
    0,
    1,
  );
  const emphasis = clamp(
    (scene.system.gate ?? 0) * 0.34 +
      (scene.system.warningBias ?? 0) * 0.26 +
      contourStrength * 0.18 +
      defensePresence * 0.08 +
      sensorPresence * 0.06 +
      transitionEase * 0.08,
    0,
    1,
  );
  const commandPresence = clamp(
    0.12 +
      (1 - specimenPresence) * 0.2 +
      (scene.system.lattice ?? 0) * 0.24 +
      contourStrength * 0.16 +
      (1 - sensorPresence) * 0.08 +
      transitionEase * 0.04,
    0,
    1,
  );
  const gridVisibility = clamp(
    (scene.system.lattice ?? 0) * 0.76 +
      commandPresence * 0.2 -
      sensorPresence * 0.1 +
      deckWave * 0.05,
    0,
    1,
  );
  const glowIntensity = clamp(
    (scene.system.bloom ?? 0) * 0.48 +
      emphasis * 0.28 +
      sensorPresence * 0.12 +
      Math.max(0, pulseWave) * 0.08,
    0,
    1,
  );
  const lineSpacing = clamp(
    0.2 +
      (1 - (scene.system.density ?? 0)) * 0.54 +
      sensorPresence * 0.08 -
      commandPresence * 0.04 +
      ambientDrift * 0.03,
    0,
    1,
  );
  const reticleStrength = clamp(
    (scene.system.reticleBias ?? 0) * 0.22 +
      (scene.system.gate ?? 0) * 0.2 +
      commandPresence * 0.34 +
      defensePresence * 0.1 +
      transitionWave * 0.05,
    0,
    1,
  );
  const distortion = clamp(
    (scene.system.skew ?? 0) * 0.72 +
      (scene.system.interference ?? 0) * 0.16 +
      deckWave * 0.04 +
      transitionWave * 0.04,
    0,
    1,
  );
  const scanCurvature = clamp(
    (scene.system.bandCurve ?? 0) * 0.74 +
      distortion * 0.12 +
      sensorPresence * 0.08 +
      pulseWave * 0.04,
    0,
    1,
  );
  const colorWeighting = clamp(
    (scene.system.warningBias ?? 0) * 0.56 +
      deckProgress * 0.16 +
      sensorPresence * 0.12 -
      defensePresence * 0.04 +
      transitionEase * 0.06,
    0,
    1,
  );

  return {
    ...scene,
    light: {
      x: clamp(scene.light.x + beamTiltDrift * 0.035 + sweepDrift * 0.02, 0.18, 0.82),
      y: clamp(scene.light.y + horizonDrift * 0.06 - balanceDrift * 0.03, 0.08, 0.42),
      radius: clamp(scene.light.radius + apertureDrift * 0.06 + slowDriftD * 0.025, 0.18, 0.94),
      strength: clamp(scene.light.strength + balanceDrift * 0.08 + slowDriftC * 0.04, 0.2, 1),
    },
    system: {
      ...scene.system,
      phase: clamp((scene.system.phase ?? 0.5) + phaseDrift, 0, 1),
      horizon: clamp((scene.system.horizon ?? 0.5) + horizonDrift, 0, 1),
      beamTilt: clamp((scene.system.beamTilt ?? 0.5) + beamTiltDrift, 0, 1),
      aperture: clamp((scene.system.aperture ?? 0.5) + apertureDrift, 0, 1),
      notch: clamp((scene.system.notch ?? 0.5) + sweepDrift * 0.7, 0, 1),
      defense: clamp(lerp(scene.system.defense ?? 0, defensePresence, 0.72), 0, 1),
      bandCurve: clamp(lerp(scene.system.bandCurve ?? 0, scanCurvature, 0.68), 0, 1),
      lattice: clamp(lerp(scene.system.lattice ?? 0, gridVisibility, 0.72), 0, 1),
      density: clamp(lerp(scene.system.density ?? 0, 1 - lineSpacing, 0.58) + densityDrift * 0.18, 0, 1),
      warningBias: clamp(lerp(scene.system.warningBias ?? 0, colorWeighting, 0.42), 0, 1),
      reticleBias: clamp((scene.system.reticleBias ?? 0) + (reticleStrength - 0.5) * 0.08 + contourDrift * 0.18, 0, 1),
      scan: clamp(lerp(scene.system.scan ?? 0, emphasis, 0.38), 0, 1),
      skew: clamp(lerp(scene.system.skew ?? 0, distortion, 0.76) + beamTiltDrift * 0.12, 0, 1),
      contour: clamp(lerp(scene.system.contour ?? 0, contourStrength, 0.72) + contourDrift * 0.16, 0, 1),
      interference: clamp(lerp(scene.system.interference ?? 0, emphasis * 0.66 + distortion * 0.24, 0.54), 0, 1),
      gate: clamp(lerp(scene.system.gate ?? 0, emphasis, 0.5) + gateDrift * 0.16, 0, 1),
      sensorField: clamp(lerp(scene.system.sensorField ?? 0, sensorPresence, 0.82), 0, 1),
      bloom: clamp(lerp(scene.system.bloom ?? 0, glowIntensity, 0.82), 0, 1),
      ruler: clamp(lerp(scene.system.ruler ?? 0, sensorPresence * 0.82 + reticleStrength * 0.14, 0.56), 0, 1),
      diagnostics: clamp(lerp(scene.system.diagnostics ?? 0, sensorPresence * 0.74 + emphasis * 0.12, 0.58), 0, 1),
      waist: clamp(lerp(scene.system.waist ?? 0.5, 0.36 + sensorPresence * 0.48 - distortion * 0.08, 0.4) + balanceDrift * 0.14, 0, 1),
    },
    sliders: {
      specimenPresence,
      defensePresence,
      sensorPresence,
      commandPresence,
      contourStrength,
      gridVisibility,
      glowIntensity,
      lineSpacing,
      reticleStrength,
      distortion,
      scanCurvature,
      emphasis,
      colorWeighting,
      slideCount,
      slidePosition,
      deckProgress,
      slideIndex,
      localProgress: transitionEase,
      horizonDrift,
      beamTiltDrift,
      apertureDrift,
      gateDrift,
      densityDrift,
      contourDrift,
      sweepDrift,
      balanceDrift,
    },
  };
}

function strokeBracket(context, x, y, width, height, size, color, lineWidth) {
  const right = x + width;
  const bottom = y + height;

  context.save();
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(x, y + size);
  context.lineTo(x, y);
  context.lineTo(x + size, y);
  context.moveTo(right - size, y);
  context.lineTo(right, y);
  context.lineTo(right, y + size);
  context.moveTo(right, bottom - size);
  context.lineTo(right, bottom);
  context.lineTo(right - size, bottom);
  context.moveTo(x + size, bottom);
  context.lineTo(x, bottom);
  context.lineTo(x, bottom - size);
  context.stroke();
  context.restore();
}

function drawPanelDivisions(context, width, height, hotAmbient, hotWarning) {
  const columns = [0.1, 0.31, 0.52, 0.73, 0.93];
  const top = height * 0.08;
  const bottom = height * 0.92;

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.38);
  context.lineWidth = 1.4;

  for (const ratio of columns) {
    const x = width * ratio;
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, bottom);
    context.stroke();

    for (let index = 1; index < 8; index += 1) {
      const y = lerp(top, bottom, index / 8);
      const tick = width * (index % 2 === 0 ? 0.008 : 0.012);
      context.beginPath();
      context.moveTo(x - tick, y);
      context.lineTo(x + tick, y);
      context.stroke();
    }
  }

  context.strokeStyle = toRgba(hotWarning, 0.42);
  context.beginPath();
  context.moveTo(width * 0.035, top);
  context.lineTo(width * 0.035, bottom);
  context.moveTo(width * 0.035, bottom);
  context.lineTo(width * 0.98, bottom);
  context.stroke();
  context.restore();
}

function drawMeasurementTicks(context, width, height, hotWarning) {
  const left = width * 0.035;
  const bottom = height * 0.92;
  const top = height * 0.08;

  context.save();
  context.strokeStyle = toRgba(hotWarning, 0.58);
  context.lineWidth = 1.1;

  for (let index = 0; index <= 12; index += 1) {
    const y = lerp(bottom, top, index / 12);
    const length = index % 3 === 0 ? width * 0.022 : width * 0.012;
    context.beginPath();
    context.moveTo(left - length * 0.45, y);
    context.lineTo(left + length, y);
    context.stroke();
  }

  for (let index = 0; index <= 20; index += 1) {
    const x = lerp(left, width * 0.98, index / 20);
    const length = index % 5 === 0 ? height * 0.028 : height * 0.016;
    context.beginPath();
    context.moveTo(x, bottom);
    context.lineTo(x, bottom + length);
    context.stroke();
  }

  context.restore();
}

function drawSpecimenColumn(context, width, height, scene, time, hotAmbient, hotWarning) {
  const centerX = width * (0.52 + (scene.system.beamTilt - 0.5) * 0.04);
  const top = height * 0.1;
  const bottom = height * 0.84;
  const coreWidth = width * (0.028 + scene.system.aperture * 0.015);
  const glowWidth = coreWidth * 2.4;
  const segments = 24;

  context.save();

  const beam = context.createLinearGradient(centerX, top, centerX, bottom);
  beam.addColorStop(0, 'rgba(0, 0, 0, 0)');
  beam.addColorStop(0.22, toRgba(hotWarning, 0.18));
  beam.addColorStop(0.5, toRgba(hotWarning, 0.28));
  beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = beam;
  context.fillRect(centerX - glowWidth * 0.5, top, glowWidth, bottom - top);

  for (let index = 0; index < segments; index += 1) {
    const t = index / Math.max(1, segments - 1);
    const y = lerp(top, bottom, t);
    const waveform =
      Math.sin(t * 8.5 + time * 0.22 + scene.system.phase * tau) * 0.5 +
      Math.cos(t * 18 + scene.system.notch * 3) * 0.24;
    const widthFactor = 0.48 + clamp((waveform + 1) * 0.5, 0, 1) * 0.68;
    const chunkWidth = coreWidth * widthFactor;
    const chunkHeight = Math.max(3, (bottom - top) / segments * 0.72);

    context.fillStyle = toRgba(index % 3 === 0 ? hotAmbient : hotWarning, 0.82);
    context.fillRect(centerX - chunkWidth * 0.5, y, chunkWidth, chunkHeight);
  }

  context.strokeStyle = toRgba(hotAmbient, 0.38);
  context.lineWidth = 1;
  context.strokeRect(centerX - coreWidth * 1.45, top, coreWidth * 2.9, bottom - top);
  context.restore();
}

function drawSpecimenBarMarkers(context, width, height, hotAmbient) {
  const x = width * 0.245;
  const yValues = [0.2, 0.31, 0.48, 0.66, 0.82];

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.8);
  context.lineWidth = 2;

  for (const ratio of yValues) {
    const y = height * ratio;
    context.beginPath();
    context.moveTo(x - width * 0.012, y);
    context.lineTo(x + width * 0.012, y);
    context.stroke();
  }

  context.restore();
}

function drawReticleConnectors(context, width, height, scene, hotEdge, time) {
  const gateX = width * (0.66 + (scene.system.beamTilt - 0.5) * 0.14);
  const gateY = height * (0.38 + (scene.system.reticleBias - 0.3) * 0.18);
  const phase = scene.system.phase * tau + time * 0.08;

  context.save();
  context.strokeStyle = toRgba(hotEdge, 0.2);
  context.lineWidth = 1;
  context.setLineDash([10, 18]);

  for (let row = 0; row < 3; row += 1) {
    const y = gateY + (row - 1) * height * 0.06;
    context.beginPath();
    context.moveTo(width * 0.08, y - height * 0.012);
    context.lineTo(gateX - width * 0.1, y);
    context.lineTo(gateX + width * 0.12, y + Math.sin(phase + row * 0.6) * height * 0.0025);
    context.lineTo(width * 0.92, y + height * 0.016);
    context.stroke();
  }

  context.setLineDash([]);
  context.restore();
}

function drawContourAperture(context, width, height, scene, hotAmbient, hotEdge) {
  const apertureX = width * (0.66 + (scene.system.beamTilt - 0.5) * 0.12);
  const apertureY = height * (0.42 + (scene.system.horizon - 0.5) * 0.2);
  const apertureW = width * (0.34 + scene.system.aperture * 0.15);
  const apertureH = height * (0.46 + scene.system.gate * 0.14);

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.18);
  context.lineWidth = 1.2;
  context.strokeRect(apertureX - apertureW * 0.5, apertureY - apertureH * 0.5, apertureW, apertureH);
  strokeBracket(
    context,
    apertureX - apertureW * 0.5,
    apertureY - apertureH * 0.5,
    apertureW,
    apertureH,
    Math.min(apertureW, apertureH) * 0.08,
    toRgba(hotEdge, 0.28),
    1.4,
  );
  context.restore();
}

function panelPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawGridField(context, width, height, scene, hotAmbient, hotEdge, sliders) {
  const lattice = scene.system.lattice;
  const spacingX = width * (0.032 + (1 - lattice) * 0.018 - sliders.commandPresence * 0.005 + sliders.densityDrift * 0.006);
  const spacingY = height * (0.048 + (1 - lattice) * 0.02 - sliders.commandPresence * 0.008 + sliders.densityDrift * 0.008);
  const skew = (scene.system.beamTilt - 0.5 + sliders.distortion * 0.08 + sliders.beamTiltDrift * 0.55) * width * 0.012;
  const horizonY = height * (0.22 + scene.system.horizon * 0.2 + sliders.slideIndex * 0.01 + sliders.horizonDrift * 0.06);
  const defense = scene.system.defense ?? 0;

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.08 + lattice * 0.06 - defense * 0.04);
  context.lineWidth = 1;

  for (let x = width * 0.34; x <= width * 1.02; x += spacingX) {
    context.beginPath();
    context.moveTo(x, height * 0.08);
    context.lineTo(x + skew, height * 0.94);
    context.stroke();
  }

  for (let y = horizonY; y <= height * 0.92; y += spacingY) {
    const t = (y - horizonY) / Math.max(1, height * 0.92 - horizonY);
    const inset = (1 - t) * width * 0.04;
    context.strokeStyle = toRgba(hotAmbient, 0.03 + (1 - t) * 0.1 - defense * 0.02);
    context.beginPath();
    context.moveTo(width * 0.34 + inset, y);
    context.lineTo(width * 0.98, y);
    context.stroke();
  }

  context.strokeStyle = toRgba(hotEdge, 0.16 - defense * 0.06);
  context.setLineDash([10, 18]);
  context.beginPath();
  context.moveTo(width * 0.34, horizonY);
  context.lineTo(width * 0.94, horizonY);
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawInterferenceField(context, width, height, scene, time, hotAmbient, hotEdge, sliders) {
  const motionTime = driftTime(time);
  const phase = scene.system.phase * tau + motionTime * (0.035 + calmPulse(scene.system.pulse) * 0.02 + sliders.contourStrength * 0.025);
  const startX = width * (0.34 - scene.system.skew * 0.08);
  const endX = width * (0.98 + scene.system.skew * 0.02);
  const step = Math.max(4, Math.round(height / 120));
  const defense = scene.system.defense ?? 0;

  context.save();
  context.globalCompositeOperation = 'screen';

  for (let y = height * 0.08; y <= height * 0.94; y += step) {
    const ny = y / height;
    const wave =
      Math.sin(ny * (10 + scene.system.interference * 10 + sliders.distortion * 2.5) - phase * 0.82) * 0.54 +
      Math.cos(ny * (4.5 + scene.system.bandCurve * 5.2 + sliders.scanCurvature * 1.8) + phase * 0.56) * 0.46;
    const gate = Math.pow(clamp((ny - 0.12) / 0.8, 0, 1), 0.8);
    const glow = clamp((wave + 1) * 0.5, 0, 1) * gate;
    const xOffset = wave * width * (0.0038 + scene.system.skew * 0.0048 + sliders.distortion * 0.0034);
    const alpha = 0.006 + glow * (0.018 + scene.system.interference * 0.014) * (1 - defense * 0.35);

    context.strokeStyle = toRgba(hotAmbient, alpha);
    context.lineWidth = glow > 0.82 ? 1.3 : 1;
    context.beginPath();
    context.moveTo(startX + xOffset, y);
    context.lineTo(endX - xOffset * 0.35, y);
    context.stroke();

    if (glow > 0.88) {
      context.strokeStyle = toRgba(hotEdge, 0.015 + glow * 0.028 * (1 - defense * 0.25));
      context.beginPath();
      context.moveTo(startX + width * 0.03 + xOffset, y + 0.5);
      context.lineTo(endX - width * 0.06, y + 0.5);
      context.stroke();
    }
  }

  context.restore();
}

function drawContourField(context, width, height, scene, time, hotAmbient, hotEdge, sliders) {
  const lineCount = 14 + Math.round(scene.system.contour * 10 + sliders.commandPresence * 3);
  const motionTime = driftTime(time);
  const phase = scene.system.phase * tau + motionTime * (0.032 + scene.system.scan * 0.014 + sliders.contourStrength * 0.02);
  const centerX = width * (0.7 + (scene.system.beamTilt - 0.5) * 0.18);
  const centerY = height * (0.42 + (scene.system.horizon - 0.5) * 0.28);
  const radiusX = width * (0.18 + scene.system.aperture * 0.16);
  const radiusY = height * (0.18 + scene.system.gate * 0.2);
  const step = Math.max(12, Math.round(width / 42));
  const defense = scene.system.defense ?? 0;

  context.save();
  context.globalCompositeOperation = 'screen';

  for (let index = 0; index < lineCount; index += 1) {
    const t = index / Math.max(1, lineCount - 1);
    const spread = 0.58 + t * (1.7 + scene.system.contour * 0.8);
    const alpha = (0.04 + (1 - t) * 0.08) * (1 - defense * 0.28);

    context.strokeStyle = toRgba(index % 4 === 0 ? hotEdge : hotAmbient, alpha);
    context.lineWidth = index % 5 === 0 ? 1.4 : 1;
    context.beginPath();

    for (let x = width * 0.28; x <= width * 1.02; x += step) {
      const dx = (x - centerX) / (radiusX * spread);
      const ripple = Math.sin(dx * (5.5 + scene.system.bandCurve * 5.8 + sliders.scanCurvature * 1.4) + phase + index * 0.18);
      const envelope = Math.exp(-Math.abs(dx) * (1.8 - scene.system.skew * 0.8));
      const y =
        centerY +
        dyField(index, t, radiusY, spread) +
        ripple * envelope * height * (0.0038 + scene.system.interference * 0.003 + sliders.distortion * 0.002);

      if (x === width * 0.28) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.stroke();
  }

  context.restore();
}

function dyField(index, t, radiusY, spread) {
  return (t - 0.5) * radiusY * spread * 1.24 + Math.sin(index * 0.7) * radiusY * 0.03;
}

function sensorFieldEnvelope(u, waist, phase) {
  const leftMass = 0.46 * Math.exp(-Math.pow((u - 0.18) / 0.2, 2));
  const rightMass = 0.34 * Math.exp(-Math.pow((u - 0.72) / 0.24, 2));
  const pinchCenter = 0.48 + (waist - 0.5) * 0.12;
  const waistPinch = (0.36 + waist * 0.24) * Math.exp(-Math.pow((u - pinchCenter) / 0.075, 2));
  const drift = Math.sin(u * tau * 0.72 + phase * 0.42) * 0.008;
  return clamp(0.18 + leftMass + rightMass - waistPinch + drift, 0.05, 0.82);
}

function drawSensorFieldMass(context, width, height, scene, time, hotAmbient, hotEdge, hotWarning, sliders) {
  const sensorField = scene.system.sensorField ?? 0;
  if (sensorField <= 0.001) return;

  const motionTime = driftTime(time);
  const phase = scene.system.phase * tau + motionTime * (0.036 + calmPulse(scene.system.pulse) * 0.018 + sliders.sensorPresence * 0.018);
  const fieldStart = width * 0.16;
  const fieldEnd = width * 0.88;
  const midY = height * (0.5 + (scene.system.horizon - 0.5) * 0.06);
  const amplitude = height * (0.31 + sensorField * 0.14 + sliders.contourStrength * 0.05);
  const waist = scene.system.waist ?? 0.5;
  const step = Math.max(8, Math.round(width / 140));
  const contourCount = 16 + Math.round(scene.system.contour * 8 + sensorField * 10);
  const whiteAlpha = 0.16 + sensorField * 0.2;

  const massGradient = context.createLinearGradient(fieldStart, 0, fieldEnd, 0);
  massGradient.addColorStop(0, toRgba(scaleColor(scene.toxic ?? hotAmbient, 1.04), 0.78));
  massGradient.addColorStop(0.22, toRgba([212, 244, 108], 0.82));
  massGradient.addColorStop(0.42, toRgba(scaleColor(hotWarning, 1.04), 0.82));
  massGradient.addColorStop(0.62, toRgba(scaleColor(scene.magenta ?? hotEdge, 1.08), 0.86));
  massGradient.addColorStop(1, toRgba([142, 126, 255], 0.8));

  context.save();
  context.globalCompositeOperation = 'screen';

  const massPath = new Path2D();
  for (let x = fieldStart; x <= fieldEnd; x += step) {
    const u = (x - fieldStart) / (fieldEnd - fieldStart);
    const envelope = sensorFieldEnvelope(u, waist, phase);
    const yWarp = Math.sin(u * tau * (0.9 + scene.system.bandCurve * 0.4) - phase * 0.42) * height * 0.0042 * sensorField;
    const y = midY - envelope * amplitude + yWarp;
    if (x === fieldStart) massPath.moveTo(x, y);
    else massPath.lineTo(x, y);
  }
  for (let x = fieldEnd; x >= fieldStart; x -= step) {
    const u = (x - fieldStart) / (fieldEnd - fieldStart);
    const envelope = sensorFieldEnvelope(u, waist, phase);
    const yWarp = Math.sin(u * tau * (0.9 + scene.system.bandCurve * 0.4) - phase * 0.42) * height * 0.0042 * sensorField;
    massPath.lineTo(x, midY + envelope * amplitude - yWarp);
  }
  massPath.closePath();

  context.shadowColor = toRgba(scene.magenta ?? hotEdge, 0.24 + (scene.system.bloom ?? 0) * 0.16);
  context.shadowBlur = width * (0.011 + (scene.system.bloom ?? 0) * 0.012);
  context.fillStyle = massGradient;
  context.globalAlpha = 0.16 + sensorField * 0.16;
  context.fill(massPath);

  context.shadowBlur = width * (0.006 + (scene.system.bloom ?? 0) * 0.01);
  context.strokeStyle = massGradient;
  context.globalAlpha = 0.34 + sensorField * 0.14;
  for (let index = 0; index < contourCount; index += 1) {
    const t = index / Math.max(1, contourCount - 1);
    const spread = 0.16 + t * 0.94;
    const modulation = Math.sin(phase + index * 0.2) * height * 0.003;
    context.beginPath();
    for (let x = fieldStart; x <= fieldEnd; x += step) {
      const u = (x - fieldStart) / (fieldEnd - fieldStart);
      const envelope = sensorFieldEnvelope(u, waist, phase);
      const ripple =
        Math.sin(u * tau * (1.1 + scene.system.contour * 0.7) + phase * 0.58 + index * 0.12) *
        height *
        (0.0024 + sensorField * 0.0032);
      const y = midY - envelope * amplitude * spread + modulation + ripple;
      if (x === fieldStart) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    for (let x = fieldEnd; x >= fieldStart; x -= step) {
      const u = (x - fieldStart) / (fieldEnd - fieldStart);
      const envelope = sensorFieldEnvelope(u, waist, phase);
      const ripple =
        Math.sin(u * tau * (1.1 + scene.system.contour * 0.7) + phase * 0.58 + index * 0.12) *
        height *
        (0.0024 + sensorField * 0.0032);
      context.lineTo(x, midY + envelope * amplitude * spread - modulation - ripple);
    }
    context.closePath();
    context.lineWidth = index % 5 === 0 ? 1.6 : 1;
    context.stroke();
  }

  context.shadowBlur = width * 0.004;
  context.shadowColor = toRgba(hotAmbient, 0.22);
  context.strokeStyle = toRgba([255, 255, 255], whiteAlpha);
  context.globalAlpha = 1;
  for (let rail = 0; rail < 13; rail += 1) {
    const t = rail / 12;
    const y = lerp(height * 0.08, height * 0.92, t);
    const railGate = smoothstep(0.08, 0.26, t) * (1 - smoothstep(0.76, 0.96, t));
    context.beginPath();
    context.moveTo(fieldStart - width * 0.01, y);
    context.lineTo(fieldEnd - width * 0.02 + Math.cos(phase * 0.7 + rail * 0.34) * width * 0.008 * railGate, y);
    context.stroke();
  }

  context.restore();
}

function drawSensorRulers(context, width, height, scene, hotWarning) {
  const sensorField = scene.system.sensorField ?? 0;
  const ruler = scene.system.ruler ?? 0;
  const weight = Math.max(sensorField, ruler);
  if (weight <= 0.001) return;

  const leftX = width * 0.14;
  const rightX = width * 0.865;
  const top = height * 0.08;
  const bottom = height * 0.92;
  const ticks = 19;
  const fontSize = Math.max(11, Math.round(width * 0.0105));
  const phase = scene.system.phase * tau;

  context.save();
  context.strokeStyle = toRgba(hotWarning, 0.32 + weight * 0.28);
  context.fillStyle = toRgba(hotWarning, 0.7 + weight * 0.16);
  context.font = `700 ${fontSize}px var(--font-mono), monospace`;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.shadowColor = toRgba(hotWarning, 0.24 + (scene.system.bloom ?? 0) * 0.18);
  context.shadowBlur = width * (0.002 + (scene.system.bloom ?? 0) * 0.006);

  for (let index = 0; index < ticks; index += 1) {
    const t = index / (ticks - 1);
    const y = lerp(top, bottom, t);
    const tickLength = index % 2 === 0 ? width * 0.018 : width * 0.01;
    const value = Math.round(90 - t * 180);

    context.beginPath();
    context.moveTo(leftX, y);
    context.lineTo(leftX + tickLength, y);
    context.moveTo(rightX - tickLength, y);
    context.lineTo(rightX, y);
    context.stroke();

    if (index < ticks - 1) {
      context.fillText(
        `${value >= 0 ? '+' : ''}${value}`,
        rightX + width * 0.006,
        y + Math.sin(phase + t * 8) * 1.5,
      );
    }
  }

  context.restore();
}

function drawSensorDiagnostics(context, width, height, scene, hotAmbient, hotWarning) {
  const diagnostics = scene.system.diagnostics ?? 0;
  if (diagnostics <= 0.001) return;

  const fontSize = Math.max(11, Math.round(width * 0.0105));
  const labels = [
    { x: width * 0.54, y: height * 0.115, width: width * 0.16, title: 'FIELD MAP', value: 'PHASE 07 / DELTA 41' },
    { x: width * 0.52, y: height * 0.585, width: width * 0.18, title: 'VECTOR LOCK', value: 'WAIST 3.2 / BAND 18' },
  ];

  context.save();
  context.font = `700 ${fontSize}px var(--font-mono), monospace`;
  context.textBaseline = 'top';
  context.shadowColor = toRgba(hotWarning, 0.18 + (scene.system.bloom ?? 0) * 0.16);
  context.shadowBlur = width * (0.002 + (scene.system.bloom ?? 0) * 0.006);

  labels.forEach((label, index) => {
    const labelHeight = height * 0.09;
    const opacity = 0.38 + diagnostics * 0.24 - index * 0.05;
    context.fillStyle = 'rgba(8, 6, 2, 0.54)';
    context.fillRect(label.x, label.y, label.width, labelHeight);
    context.strokeStyle = toRgba(hotWarning, 0.62 + diagnostics * 0.24);
    context.lineWidth = 1.6;
    context.strokeRect(label.x, label.y, label.width, labelHeight);
    context.fillStyle = toRgba(hotWarning, 0.84 + diagnostics * 0.12);
    context.fillText(label.title, label.x + width * 0.012, label.y + height * 0.016);
    context.fillStyle = toRgba(hotAmbient, opacity);
    context.fillText(label.value, label.x + width * 0.012, label.y + height * 0.046);
  });

  context.restore();
}

function drawBandedMask(context, width, height, scene, hotAmbient, hotEdge, hotWarning) {
  const gateX = width * (0.54 + (scene.system.beamTilt - 0.5) * 0.26);
  const gateWidth = width * (0.16 + scene.system.gate * 0.14);
  const phase = scene.system.phase * tau;
  const top = height * 0.06;
  const bottom = height * 0.94;
  const bandCount = 18 + Math.round(scene.system.density * 16);
  const step = (bottom - top) / bandCount;
  const defense = scene.system.defense ?? 0;

  context.save();
  context.fillStyle = `rgba(0, 0, 0, ${0.74 + defense * 0.08})`;
  context.fillRect(0, 0, gateX - gateWidth * 0.64, height);
  context.fillRect(gateX + gateWidth * 0.64, 0, width - (gateX + gateWidth * 0.64), height);

  for (let index = 0; index < bandCount; index += 1) {
    const y = top + index * step;
    const t = index / Math.max(1, bandCount - 1);
    const sway = Math.sin(t * tau * (0.8 + scene.system.bandCurve * 0.4) + phase * 0.45) * gateWidth * 0.02;
    const aperture = gateWidth * (0.84 + Math.cos(t * tau * 0.5 + phase * 0.35) * 0.025);
    const alpha = (0.04 + (1 - Math.abs(t - 0.5) * 1.7) * 0.08) * (1 - defense * 0.4);

    context.fillStyle = toRgba(index % 5 === 0 ? hotWarning : hotAmbient, alpha);
    context.fillRect(gateX - aperture * 0.5 + sway, y, aperture, Math.max(1, step * 0.18));
  }

  context.strokeStyle = toRgba(hotAmbient, 0.22 - defense * 0.08);
  context.lineWidth = 1.2;
  context.strokeRect(gateX - gateWidth * 0.56, top, gateWidth * 1.12, bottom - top);

  context.strokeStyle = toRgba(hotEdge, 0.42 - defense * 0.14);
  context.setLineDash([14, 10]);
  context.beginPath();
  context.moveTo(gateX, top);
  context.lineTo(gateX, bottom);
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawWarningRails(context, width, height, scene, hotWarning) {
  const bias = scene.system.warningBias;
  const count = 7;
  const railWidth = width * 0.018;
  const originX = width * (0.67 + bias * 0.16);
  const defense = scene.system.defense ?? 0;

  context.save();
  for (let index = 0; index < count; index += 1) {
    const x = originX + index * railWidth * 1.2;
    const alpha = (index % 2 === 0 ? 0.18 : 0.08) * (1 - defense * 0.45);
    context.fillStyle = toRgba(hotWarning, alpha);
    context.fillRect(x, height * 0.06, railWidth, height * 0.88);
  }

  context.restore();
}

function drawReticleField(context, width, height, scene, hotAmbient, hotEdge, hotWarning, time, sliders) {
  const cx = width * (0.67 + (scene.system.beamTilt - 0.5) * 0.16);
  const cy = height * (0.36 + (scene.system.reticleBias - 0.3) * 0.2);
  const rx = width * (0.12 + scene.system.aperture * 0.1);
  const ry = height * (0.14 + scene.system.gate * 0.08);
  const motionTime = driftTime(time);
  const pulse = 1 + Math.sin(motionTime * (0.06 + calmPulse(scene.system.pulse) * 0.03 + sliders.reticleStrength * 0.04) + scene.system.phase * tau) * 0.004;

  context.save();
  context.translate(cx, cy);
  context.scale(pulse, pulse);

  context.strokeStyle = toRgba(hotAmbient, 0.28);
  context.lineWidth = 1.4;
  for (let ring = 0; ring < 4; ring += 1) {
    const ringScale = 0.48 + ring * 0.24;
    context.beginPath();
    context.ellipse(0, 0, rx * ringScale, ry * ringScale, 0, 0, tau);
    context.stroke();
  }

  context.strokeStyle = toRgba(hotEdge, 0.4);
  context.setLineDash([12, 10]);
  context.beginPath();
  context.moveTo(-rx * 1.16, 0);
  context.lineTo(rx * 1.16, 0);
  context.moveTo(0, -ry * 1.16);
  context.lineTo(0, ry * 1.16);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = toRgba(hotWarning, 0.5);
  context.beginPath();
  context.moveTo(-rx * 0.12, 0);
  context.lineTo(rx * 0.12, 0);
  context.moveTo(0, -ry * 0.12);
  context.lineTo(0, ry * 0.12);
  context.stroke();
  context.restore();
}

function strokeSegmentedRing(context, radius, start, end, segments, gap, color, lineWidth) {
  const span = end - start;
  const step = span / segments;

  context.save();
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  for (let index = 0; index < segments; index += 1) {
    const a0 = start + index * step + gap * 0.5;
    const a1 = start + (index + 1) * step - gap * 0.5;
    if (a1 <= a0) continue;
    context.beginPath();
    context.arc(0, 0, radius, a0, a1);
    context.stroke();
  }
  context.restore();
}

function fillNumberBlock(context, x, y, width, height, digits, color, background) {
  context.save();
  context.fillStyle = background;
  context.fillRect(x, y, width, height);
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.strokeRect(x, y, width, height);
  context.fillStyle = color;
  context.font = `${Math.max(14, height * 0.52)}px var(--font-mono), monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(digits, x + width * 0.5, y + height * 0.54);
  context.restore();
}

function drawDefenseScreen(context, width, height, scene, time, hotAmbient, hotEdge, hotWarning, sliders) {
  const defense = scene.system.defense ?? 0;
  if (defense <= 0.001) return;

  const cx = width * (0.74 + (scene.system.beamTilt - 0.5) * 0.08);
  const cy = height * (0.5 + (scene.system.reticleBias - 0.28) * 0.08);
  const minSide = Math.min(width, height);
  const baseRadius = minSide * (0.15 + scene.system.aperture * 0.08);
  const motionTime = driftTime(time);
  const phase = scene.system.phase * tau + motionTime * (0.05 + calmPulse(scene.system.pulse) * 0.024 + sliders.reticleStrength * 0.03);
  const slowPhase = motionTime * (0.022 + scene.system.scan * 0.01 + sliders.commandPresence * 0.008) + scene.system.phase * tau;
  const ringCount = 7 + Math.round(scene.system.density * 5);
  const ringGap = minSide * 0.04;
  const arcWindow = tau * (0.66 + scene.system.gate * 0.1);
  const arcStart = -Math.PI * (0.84 - scene.system.skew * 0.16) + Math.sin(slowPhase) * 0.08;
  const arcEnd = arcStart + arcWindow;

  context.save();
  context.translate(cx, cy);
  context.globalCompositeOperation = 'screen';

  const radialGlow = context.createRadialGradient(0, 0, baseRadius * 0.2, 0, 0, baseRadius + ringGap * (ringCount + 3));
  radialGlow.addColorStop(0, toRgba(hotWarning, 0.08 * defense));
  radialGlow.addColorStop(0.28, toRgba(hotEdge, 0.075 * defense));
  radialGlow.addColorStop(0.64, toRgba(hotAmbient, 0.06 * defense));
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = radialGlow;
  context.fillRect(-baseRadius * 3.8, -baseRadius * 3.8, baseRadius * 7.6, baseRadius * 7.6);

  for (let index = 0; index < ringCount; index += 1) {
    const t = index / Math.max(1, ringCount - 1);
    const radius = baseRadius + index * ringGap;
    const alpha = (0.14 + (1 - t) * 0.24) * defense;
    const color = index % 4 === 2 ? hotWarning : index % 3 === 0 ? hotEdge : hotAmbient;
    const segments = 10 + Math.round(scene.system.lattice * 8) + index;
    const dashGap = (0.035 + (1 - t) * 0.02) * (1 - defense * 0.18);

    strokeSegmentedRing(context, radius, arcStart, arcEnd, segments, dashGap, toRgba(color, alpha), 1.1 + (1 - t) * 0.9);

    if (index % 2 === 0) {
      context.strokeStyle = toRgba(hotAmbient, alpha * 0.52);
      context.lineWidth = 1;
      context.beginPath();
      context.arc(0, 0, radius + ringGap * 0.34, arcStart + 0.08, arcEnd - 0.08);
      context.stroke();
    }
  }

  context.strokeStyle = toRgba(hotAmbient, 0.48 * defense);
  context.lineWidth = 1.2;
  for (let angleIndex = 0; angleIndex < 8; angleIndex += 1) {
    const angle = -Math.PI * 0.5 + angleIndex * (tau / 8) + Math.sin(phase + angleIndex) * 0.01;
    const inner = baseRadius * 0.78;
    const outer = baseRadius + ringGap * (ringCount + 0.8);
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
  }

  context.strokeStyle = toRgba(hotEdge, 0.62 * defense);
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(-baseRadius * 2.2, 0);
  context.lineTo(baseRadius * 2.2, 0);
  context.moveTo(0, -baseRadius * 2.2);
  context.lineTo(0, baseRadius * 2.2);
  context.stroke();

  context.strokeStyle = toRgba(hotWarning, 0.68 * defense);
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, baseRadius * (0.34 + Math.sin(phase * 1.1) * 0.004), 0, tau);
  context.stroke();
  context.beginPath();
  context.moveTo(-baseRadius * 0.18, 0);
  context.lineTo(baseRadius * 0.18, 0);
  context.moveTo(0, -baseRadius * 0.18);
  context.lineTo(0, baseRadius * 0.18);
  context.stroke();

  const wedgeRadius = baseRadius * 1.9;
  const wedgeAngle = -Math.PI * 0.5 + Math.sin(motionTime * 0.1 + scene.system.phase * tau) * 0.08;
  context.fillStyle = toRgba(hotWarning, 0.055 * defense);
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, wedgeRadius, wedgeAngle - 0.08, wedgeAngle + 0.08);
  context.closePath();
  context.fill();

  context.restore();

  const labelWidth = width * 0.17;
  const labelHeight = height * 0.074;
  const blockY = cy - baseRadius - ringGap * (ringCount * 0.72);

  context.save();
  context.fillStyle = toRgba([0, 0, 0], 0.68 + defense * 0.12);
  context.strokeStyle = toRgba(hotWarning, 0.84 * defense);
  context.lineWidth = 1.2;

  const leftX = cx - baseRadius * 2.55;
  const rightX = cx + baseRadius * 1.14;
  context.fillRect(leftX, blockY, labelWidth, labelHeight);
  context.strokeRect(leftX, blockY, labelWidth, labelHeight);
  context.fillRect(rightX, blockY, labelWidth, labelHeight);
  context.strokeRect(rightX, blockY, labelWidth, labelHeight);

  context.fillStyle = toRgba(hotWarning, 0.92 * defense);
  context.font = `${Math.max(12, labelHeight * 0.28)}px var(--font-mono), monospace`;
  context.textBaseline = 'middle';
  context.textAlign = 'left';
  context.fillText('SEAL VECTOR', leftX + labelWidth * 0.08, blockY + labelHeight * 0.36);
  context.fillText('TRACK STATE', rightX + labelWidth * 0.08, blockY + labelHeight * 0.36);
  context.fillStyle = toRgba(hotAmbient, 0.86 * defense);
  context.fillText('LOCKED RADIAL GRID', leftX + labelWidth * 0.08, blockY + labelHeight * 0.7);
  context.fillText('DEFENSE MODE STABLE', rightX + labelWidth * 0.08, blockY + labelHeight * 0.7);
  context.restore();

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.34 * defense);
  context.lineWidth = 1.1;
  context.setLineDash([12, 10]);
  context.beginPath();
  context.moveTo(leftX + labelWidth, blockY + labelHeight * 0.5);
  context.lineTo(cx - baseRadius * 1.3, cy - baseRadius * 0.84);
  context.moveTo(rightX, blockY + labelHeight * 0.5);
  context.lineTo(cx + baseRadius * 1.04, cy - baseRadius * 0.92);
  context.stroke();
  context.setLineDash([]);
  context.restore();

  const digitHeight = height * 0.052;
  const digitWidth = width * 0.092;
  const countdown = `${Math.round(128 + Math.sin(motionTime * 0.12 + scene.system.phase) * 18 + defense * 72)
    .toString()
    .padStart(3, '0')}.${Math.round((time * 17) % 100)
    .toString()
    .padStart(2, '0')}`;
  const diag = `${Math.round(14 + scene.system.scan * 63)
    .toString()
    .padStart(2, '0')}-${Math.round(200 + scene.system.lattice * 500)
    .toString()
    .padStart(3, '0')}`;

  fillNumberBlock(
    context,
    width * 0.07,
    height * 0.76,
    digitWidth,
    digitHeight,
    countdown,
    toRgba(hotWarning, 0.94 * defense),
    'rgba(0, 0, 0, 0.82)',
  );
  fillNumberBlock(
    context,
    width * 0.82,
    height * 0.16,
    digitWidth,
    digitHeight,
    diag,
    toRgba(hotAmbient, 0.92 * defense),
    'rgba(0, 0, 0, 0.82)',
  );
}

function drawSpecimenScaffold(context, width, height, scene, hotAmbient, hotWarning) {
  const top = height * 0.07;
  const bottom = height * 0.92;
  const leftScale = width * 0.048;
  const columnLeft = width * (0.42 + (scene.system.beamTilt - 0.5) * 0.032);
  const columnWidth = width * (0.102 + scene.system.gate * 0.042);
  const columnRight = columnLeft + columnWidth;
  const rails = [leftScale, width * 0.17, width * 0.31, columnLeft, columnRight, width * 0.73, width * 0.89];

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.24);
  context.lineWidth = 1;

  for (const x of rails) {
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, bottom);
    context.stroke();
  }

  context.strokeStyle = toRgba(hotWarning, 0.5);
  for (let index = 0; index <= 12; index += 1) {
    const y = lerp(bottom, top, index / 12);
    const longTick = index % 3 === 0;
    context.beginPath();
    context.moveTo(leftScale - width * (longTick ? 0.012 : 0.007), y);
    context.lineTo(leftScale + width * 0.006, y);
    context.stroke();
  }

  const bottomY = height * 0.94;
  for (let index = 0; index <= 18; index += 1) {
    const x = lerp(width * 0.03, width * 0.97, index / 18);
    const longTick = index % 3 === 0;
    context.beginPath();
    context.moveTo(x, bottomY - height * (longTick ? 0.018 : 0.01));
    context.lineTo(x, bottomY);
    context.stroke();
  }

  context.restore();
}

function drawSpecimenMarkers(context, width, height, hotAmbient) {
  const cols = [0.18, 0.34, 0.58, 0.73, 0.88];
  const rows = [0.16, 0.3, 0.46, 0.62, 0.78];
  const size = Math.min(width, height) * 0.007;

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.68);
  context.lineWidth = 1;

  for (const row of rows) {
    for (const col of cols) {
      if ((col === 0.58 && row > 0.3 && row < 0.7) || (col === 0.88 && row > 0.7)) continue;
      const x = width * col;
      const y = height * row;
      context.beginPath();
      context.moveTo(x - size, y);
      context.lineTo(x + size, y);
      context.moveTo(x, y - size);
      context.lineTo(x, y + size);
      context.stroke();
    }
  }

  context.restore();
}

function drawSpecimenSignal(context, width, height, scene, time, hotWarning, hotAmbient) {
  const columnLeft = width * (0.42 + (scene.system.beamTilt - 0.5) * 0.032);
  const columnWidth = width * (0.102 + scene.system.gate * 0.042);
  const columnTop = height * 0.12;
  const columnBottom = height * 0.86;
  const columnHeight = columnBottom - columnTop;
  const motionTime = driftTime(time);
  const phase = scene.system.phase * tau + motionTime * (0.034 + calmPulse(scene.system.pulse) * 0.016);

  context.save();
  context.globalCompositeOperation = 'screen';
  context.strokeStyle = toRgba(hotWarning, 0.72);
  context.lineWidth = 1.3;
  context.strokeRect(columnLeft, columnTop, columnWidth, columnHeight);

  context.beginPath();
  for (let step = 0; step <= 360; step += 1) {
    const t = step / 360;
    const y = columnTop + t * columnHeight;
    const slowLoop = Math.sin(t * tau * 1.8 + phase * 0.28) * 0.045;
    const denseLoop = Math.sin(t * tau * (6.5 + scene.system.scan * 1.8) + phase) * 0.22;
    const nested = Math.sin(t * tau * (13 + scene.system.contour * 2.2) - phase * 0.46) * 0.055;
    const x = columnLeft + columnWidth * (0.5 + slowLoop + denseLoop + nested);

    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();

  context.strokeStyle = toRgba(hotWarning, 0.62);
  context.beginPath();
  for (let step = 0; step <= 220; step += 1) {
    const t = step / 220;
    const x = lerp(columnLeft + columnWidth * 0.98, width * 0.9, t);
    const envelope = Math.sin(t * Math.PI) ** 0.92;
    const shape =
      Math.sin(t * tau * 0.88 - phase * 0.12) * 0.72 +
      Math.sin(t * tau * (2.2 + scene.system.skew * 0.7) + phase * 0.22) * 0.18;
    const y = height * (0.21 + t * 0.56) + height * 0.068 * shape * envelope;

    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();

  context.strokeStyle = toRgba(hotWarning, 0.46);
  context.beginPath();
  for (let step = 0; step <= 120; step += 1) {
    const t = step / 120;
    const x = lerp(width * 0.9, width * 0.985, t);
    const y =
      height * 0.875 +
      Math.sin(t * tau * (1.1 + scene.system.bandCurve * 0.45) + phase * 0.14) * height * 0.008 +
      Math.sin(t * tau * 2.5 - phase * 0.1) * height * 0.002;

    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();

  context.strokeStyle = toRgba(hotAmbient, 0.24);
  context.setLineDash([6, 8]);
  context.beginPath();
  context.moveTo(columnLeft + columnWidth * 0.5, columnTop - height * 0.02);
  context.lineTo(columnLeft + columnWidth * 0.5, columnBottom + height * 0.02);
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawSpecimenLabels(context, width, height, hotWarning) {
  const boxes = [
    { x: width * 0.055, y: height * 0.035, w: width * 0.14, h: height * 0.062 },
    { x: width * 0.78, y: height * 0.045, w: width * 0.16, h: height * 0.062 },
    { x: width * 0.412, y: height * 0.885, w: width * 0.102, h: height * 0.04 },
  ];

  context.save();
  context.strokeStyle = toRgba(hotWarning, 0.84);
  context.lineWidth = 1.2;

  for (const box of boxes) {
    context.strokeRect(box.x, box.y, box.w, box.h);
    context.beginPath();
    context.moveTo(box.x + box.w * 0.14, box.y + box.h * 0.5);
    context.lineTo(box.x + box.w * 0.86, box.y + box.h * 0.5);
    context.stroke();
  }

  context.restore();
}

function drawTopTelemetry(context, width, height, scene, hotAmbient, hotWarning) {
  const y = height * (0.08 + scene.system.reticleBias * 0.08);
  const x = width * 0.08;
  const h = height * 0.032;
  const segments = 7;
  const gap = width * 0.008;
  const defense = scene.system.defense ?? 0;

  context.save();
  for (let index = 0; index < segments; index += 1) {
    const w = width * (0.026 + ((index + 1) % 3) * 0.012);
    const alpha = index < 2 ? 0.68 : 0.2 + (segments - index) * 0.03 + defense * 0.04;
    context.fillStyle = toRgba(index < 2 ? hotWarning : hotAmbient, alpha);
    context.fillRect(x + index * (w + gap), y, w, h);
  }

  context.strokeStyle = toRgba(hotAmbient, 0.24);
  context.beginPath();
  context.moveTo(x, y + h * 1.7);
  context.lineTo(width * 0.38, y + h * 1.7);
  context.stroke();
  context.restore();
}

function drawFrameDiagnostics(context, width, height, scene, hotAmbient, hotEdge, hotWarning) {
  const top = height * 0.12;
  const bottom = height * 0.88;
  const left = width * 0.08;
  const right = width * 0.92;
  const notchY = lerp(top, bottom, 0.18 + scene.system.notch * 0.54);
  const phase = scene.system.phase * tau;
  const defense = scene.system.defense ?? 0;

  context.save();
  context.strokeStyle = toRgba(hotAmbient, 0.22 + defense * 0.06);
  context.lineWidth = 1.2;

  for (let row = 0; row < 5; row += 1) {
    const y = lerp(top, bottom, row / 4);
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(left + width * 0.024, y);
    context.moveTo(right - width * 0.024, y);
    context.lineTo(right, y);
    context.stroke();
  }

  for (let col = 0; col < 6; col += 1) {
    const x = lerp(left, right, col / 5);
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, top + height * 0.018);
    context.moveTo(x, bottom - height * 0.018);
    context.lineTo(x, bottom);
    context.stroke();
  }

  context.strokeStyle = toRgba(hotWarning, 0.72 + defense * 0.08);
  context.beginPath();
  context.moveTo(left, notchY);
  context.lineTo(left + width * 0.16, notchY);
  context.moveTo(right - width * 0.16, notchY + Math.sin(phase * 0.4) * height * 0.0015);
  context.lineTo(right, notchY + Math.sin(phase * 0.4) * height * 0.0015);
  context.stroke();

  context.strokeStyle = toRgba(hotEdge, 0.32 + defense * 0.08);
  context.setLineDash([10, 14]);
  context.beginPath();
  context.moveTo(left + width * 0.02, top + height * 0.03);
  context.lineTo(right - width * 0.04, top + height * 0.09);
  context.moveTo(left + width * 0.04, bottom - height * 0.08);
  context.lineTo(right - width * 0.12, bottom - height * 0.02);
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawScanField(context, width, height, scene) {
  const defense = scene.system.defense ?? 0;
  const bloom = scene.system.bloom ?? 0;
  context.save();
  context.fillStyle = `rgba(255, 255, 255, ${0.012 + scene.system.scan * 0.008 + defense * 0.003 + bloom * 0.006})`;
  for (let y = 0; y < height; y += 5) {
    context.fillRect(0, y, width, 1);
  }

  context.fillStyle = `rgba(0, 0, 0, ${0.04 + defense * 0.02 + bloom * 0.008})`;
  for (let x = 0; x < width; x += 8) {
    context.fillRect(x, 0, 1, height);
  }
  context.restore();
}

function drawFieldMask(context, width, height, scene) {
  const defense = scene.system.defense ?? 0;
  const sensorField = scene.system.sensorField ?? 0;
  const gradient = context.createLinearGradient(0, 0, width * 0.56, 0);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.94)');
  gradient.addColorStop(0.34, `rgba(0, 0, 0, ${0.8 + sensorField * 0.1})`);
  gradient.addColorStop(0.74, `rgba(0, 0, 0, ${0.18 + defense * 0.1 + sensorField * 0.12})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const sweep = context.createLinearGradient(
    width * (0.1 + scene.system.notch * 0.08),
    0,
    width * (0.38 + scene.system.notch * 0.12),
    height,
  );
  sweep.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  sweep.addColorStop(0.46, `rgba(0, 0, 0, ${0.42 + defense * 0.08 + sensorField * 0.12})`);
  sweep.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = sweep;
  context.fillRect(0, 0, width * 0.52, height);

  const rightMaskStrength = smoothstep(0.02, 0.22, sensorField);
  if (rightMaskStrength > 0.001) {
    const rightMask = context.createLinearGradient(width * 0.88, 0, width, 0);
    rightMask.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rightMask.addColorStop(1, `rgba(0, 0, 0, ${rightMaskStrength * (0.68 + sensorField * 0.18)})`);
    context.fillStyle = rightMask;
    context.fillRect(width * 0.88, 0, width * 0.12, height);
  }
}

function drawAtFieldBands(context, width, height, railColor, lineColor, textColor) {
  const labels = ['FIELD STATUS', 'VECTOR MAP', 'PHASE LOCK', 'LATTICE NODE', 'HARMONIC GRID'];
  const boxHeight = height * 0.052;
  const boxWidth = width * 0.156;
  const gap = width * 0.012;
  const startX = width * 0.085;
  const tickStep = Math.max(10, Math.round(width * 0.012));
  const radius = Math.max(8, Math.min(width, height) * 0.008);

  context.save();
  context.font = `${Math.max(11, Math.round(width * 0.011))}px var(--font-mono), monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  [height * 0.036, height * 0.924].forEach((y, rowIndex) => {
    for (let index = 0; index < labels.length; index += 1) {
      const x = startX + index * (boxWidth + gap);
      panelPath(context, x, y, boxWidth, boxHeight, radius);
      context.fillStyle = 'rgba(12, 7, 3, 0.88)';
      context.fill();
      context.strokeStyle = toRgba(lineColor, 0.84 - index * 0.05);
      context.lineWidth = 1.6;
      context.stroke();
      context.fillStyle = toRgba(textColor, 0.88);
      context.fillText(`${labels[index]} ${rowIndex === 0 ? `0${index + 2}` : `1${index + 2}`}`, x + boxWidth * 0.5, y + boxHeight * 0.5);
    }
  });

  [height * 0.088, height * 0.892].forEach((y) => {
    context.strokeStyle = toRgba(railColor, 0.88);
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(width * 0.08, y);
    context.lineTo(width * 0.92, y);
    context.stroke();

    for (let x = width * 0.08; x <= width * 0.92; x += tickStep) {
      const isMajor = Math.round((x - width * 0.08) / tickStep) % 6 === 0;
      const tickHeight = isMajor ? height * 0.012 : height * 0.007;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y + (y < height * 0.2 ? tickHeight : -tickHeight));
      context.stroke();
    }
  });

  context.restore();
}

function drawAtFieldContours(context, width, height, scene, time, contourColor, glowColor, sliders) {
  const centers = [0.32, 0.5, 0.68].map((x) => width * x);
  const centerY = height * (0.5 + (scene.system.horizon - 0.5) * 0.04);
  const ringCount = 11 + Math.round(scene.system.contour * 7 + sliders.sensorPresence * 3);
  const baseRx = width * (0.09 + scene.system.aperture * 0.05);
  const baseRy = height * (0.11 + scene.system.gate * 0.05);
  const motionTime = driftTime(time);
  const phase = scene.system.phase * tau + motionTime * (0.04 + calmPulse(scene.system.pulse) * 0.014 + sliders.sensorPresence * 0.016);

  context.save();
  context.globalCompositeOperation = 'screen';

  centers.forEach((cx, centerIndex) => {
    for (let index = 0; index < ringCount; index += 1) {
      const t = index / Math.max(1, ringCount - 1);
      const pulse = 1 + Math.sin(phase + centerIndex * 0.5 + index * 0.14) * 0.006;
      const rx = baseRx * (0.72 + t * 1.72) * pulse;
      const ry = baseRy * (0.78 + t * 1.92) * pulse;
      context.strokeStyle = toRgba(index % 5 === 0 ? glowColor : contourColor, 0.05 + (1 - t) * 0.08);
      context.lineWidth = index % 4 === 0 ? 1.3 : 1;
      context.beginPath();
      context.ellipse(cx, centerY, rx, ry, 0, 0, tau);
      context.stroke();
    }
  });

  context.strokeStyle = toRgba(contourColor, 0.16);
  context.lineWidth = 1.1;
  for (let index = -5; index <= 5; index += 1) {
    const inset = Math.abs(index) * width * 0.01;
    context.beginPath();
    context.moveTo(width * 0.34 + inset, height * 0.2);
    context.lineTo(width * 0.5, centerY);
    context.lineTo(width * 0.66 - inset, height * 0.8);
    context.stroke();

    context.beginPath();
    context.moveTo(width * 0.34 + inset, height * 0.8);
    context.lineTo(width * 0.5, centerY);
    context.lineTo(width * 0.66 - inset, height * 0.2);
    context.stroke();
  }

  context.restore();
}

function drawAtFieldCrosses(context, width, height, scene, lineColor, textColor) {
  const xs = [0.16, 0.34, 0.5, 0.66, 0.84].map((x) => width * x);
  const ys = [0.28, 0.5, 0.72].map((y) => height * y);
  const arm = Math.min(width, height) * (0.025 + scene.system.lattice * 0.005);

  context.save();
  context.font = `${Math.max(11, Math.round(width * 0.011))}px var(--font-mono), monospace`;
  context.textAlign = 'left';
  context.textBaseline = 'bottom';

  ys.forEach((cy, row) => {
    xs.forEach((cx, col) => {
      if (row === 1 && col === 2) return;
      context.strokeStyle = toRgba(lineColor, 0.78);
      context.lineWidth = 1.7;
      context.beginPath();
      context.moveTo(cx - arm, cy);
      context.lineTo(cx + arm, cy);
      context.moveTo(cx, cy - arm);
      context.lineTo(cx, cy + arm);
      context.stroke();

      context.fillStyle = toRgba(textColor, 0.76);
      const columnLabel = col - 2;
      const rowLabel = row - 1;
      context.fillText(`N${rowLabel >= 0 ? '+' : ''}${rowLabel}${columnLabel >= 0 ? '+' : ''}${columnLabel}`, cx - arm * 0.9, cy - arm * 0.86);
    });
  });

  context.restore();
}

function drawAtFieldCenterLabel(context, width, height, scene, time, lineColor, glowColor, textColor, sliders) {
  const cx = width * 0.5;
  const cy = height * (0.5 + (scene.system.horizon - 0.5) * 0.03);
  const labelWidth = width * 0.11;
  const labelHeight = height * 0.08;
  const radius = Math.max(10, Math.min(width, height) * 0.01);
  const pulse = 1 + Math.sin(driftTime(time) * (0.08 + sliders.sensorPresence * 0.04) + scene.system.phase * tau) * 0.005;

  context.save();
  context.translate(cx, cy);
  context.scale(pulse, pulse);

  panelPath(context, -labelWidth * 0.5, -labelHeight * 0.5, labelWidth, labelHeight, radius);
  context.fillStyle = 'rgba(18, 10, 4, 0.9)';
  context.fill();
  context.strokeStyle = toRgba(lineColor, 0.92);
  context.lineWidth = 2;
  context.stroke();

  context.strokeStyle = toRgba(glowColor, 0.22);
  context.lineWidth = 1.2;
  for (let index = 1; index <= 3; index += 1) {
    panelPath(
      context,
      -labelWidth * (0.5 + index * 0.04),
      -labelHeight * (0.5 + index * 0.06),
      labelWidth * (1 + index * 0.08),
      labelHeight * (1 + index * 0.12),
      radius,
    );
    context.stroke();
  }

  context.strokeStyle = toRgba(lineColor, 0.68);
  context.beginPath();
  context.moveTo(-labelWidth * 0.88, 0);
  context.lineTo(-labelWidth * 0.5, 0);
  context.moveTo(labelWidth * 0.5, 0);
  context.lineTo(labelWidth * 0.88, 0);
  context.stroke();

  context.fillStyle = toRgba(textColor, 0.92);
  context.font = `${Math.max(16, Math.round(width * 0.018))}px var(--font-mono), monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('LATTICE-13', 0, 0);
  context.restore();
}

function createRenderSurface(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function sceneCacheKey(scene, width, height) {
  const values = [
    width,
    height,
    ...scene.base,
    ...(scene.haze ?? []),
    ...(scene.toxic ?? []),
    ...(scene.magenta ?? []),
    ...(scene.warning ?? []),
    scene.light.x,
    scene.light.y,
    scene.light.radius,
    scene.light.strength,
    ...Object.values(scene.system ?? {}),
  ];

  return values.map((value) => (typeof value === 'number' ? value.toFixed(3) : String(value))).join('|');
}

function drawHudBox(context, x, y, boxWidth, boxHeight, lines, strokeColor, textColor, fontSize, align = 'left') {
  context.fillStyle = 'rgba(10, 6, 2, 0.62)';
  context.strokeStyle = strokeColor;
  context.lineWidth = 1.25;
  context.fillRect(x, y, boxWidth, boxHeight);
  context.strokeRect(x, y, boxWidth, boxHeight);
  context.fillStyle = textColor;
  context.font = `700 ${fontSize}px var(--font-mono), monospace`;
  context.textAlign = align;
  context.textBaseline = 'top';
  lines.forEach((line, index) => {
    const tx = align === 'right' ? x + boxWidth * 0.95 : align === 'center' ? x + boxWidth * 0.5 : x + boxWidth * 0.05;
    context.fillText(line, tx, y + boxHeight * (0.14 + index * 0.3));
  });
}

function buildStaticSceneBase(scene, width, height, controls = {}) {
  const staticScene = deriveContinuousScene(scene, controls, 0);
  const { sliders } = staticScene;
  const ambientColor = staticScene.ambient ?? staticScene.toxic ?? staticScene.haze;
  const edgeColor = staticScene.edge ?? staticScene.magenta ?? staticScene.warning ?? ambientColor;
  const warningColor = staticScene.warning ?? edgeColor;
  const hotAmbient = scaleColor(ambientColor, 1.12);
  const hotEdge = scaleColor(edgeColor, 1.04);
  const hotWarning = scaleColor(warningColor, 1.06);
  const specimenOrange = mixColor(hotWarning, [255, 177, 88], 0.14 + sliders.colorWeighting * 0.18);
  const specimenGreen = mixColor(hotAmbient, [171, 255, 220], 0.12 + (1 - sliders.colorWeighting) * 0.12);
  const sensorViolet = mixColor(staticScene.magenta ?? hotEdge, [152, 110, 255], 0.28 + sliders.sensorPresence * 0.16);
  const deepBase = mixColor(staticScene.base, [0, 0, 0], 0.88 + sliders.emphasis * 0.08);
  const gridWeight = 0.28 + sliders.gridVisibility * 0.42;
  const fontSize = Math.max(12, Math.round(width * 0.011));
  const centerX = width * (0.52 + (staticScene.system.beamTilt - 0.5) * 0.1);
  const centerY = height * (0.52 + (staticScene.system.reticleBias - 0.5) * 0.08);
  const apertureWidth = width * (0.22 + staticScene.system.aperture * 0.16);
  const apertureHeight = height * (0.34 + staticScene.system.bandCurve * 0.16);
  const surface = createRenderSurface(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
  const context = surface.getContext('2d');

  if (!context) return null;

  context.clearRect(0, 0, width, height);
  context.fillStyle = toRgba(deepBase, 1);
  context.fillRect(0, 0, width, height);

  const sideGlow = context.createLinearGradient(0, 0, width, 0);
  sideGlow.addColorStop(0, toRgba(specimenOrange, 0.06 + sliders.glowIntensity * 0.04));
  sideGlow.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
  sideGlow.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
  sideGlow.addColorStop(1, toRgba(specimenGreen, 0.05 + sliders.glowIntensity * 0.04));
  context.fillStyle = sideGlow;
  context.fillRect(0, 0, width, height);

  const bloom = context.createRadialGradient(
    width * staticScene.light.x,
    height * staticScene.light.y,
    0,
    width * staticScene.light.x,
    height * staticScene.light.y,
    Math.max(width, height) * staticScene.light.radius * 0.68,
  );
  bloom.addColorStop(0, toRgba(specimenOrange, (0.06 + sliders.glowIntensity * 0.05) * staticScene.light.strength));
  bloom.addColorStop(0.34, toRgba(sensorViolet, 0.035 + sliders.sensorPresence * 0.04));
  bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = bloom;
  context.fillRect(0, 0, width, height);

  const gridXStep = Math.max(84, Math.round(width * (0.07 + (1 - sliders.gridVisibility) * 0.024)));
  const gridYStep = Math.max(28, Math.round(height * (0.042 + sliders.lineSpacing * 0.03)));
  context.lineWidth = 1;
  context.strokeStyle = toRgba(specimenGreen, 0.04 + gridWeight * 0.08);
  context.beginPath();
  for (let y = 0; y < height + gridYStep; y += gridYStep) {
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
  }
  context.stroke();
  context.strokeStyle = toRgba(sensorViolet, 0.025 + gridWeight * 0.055);
  context.beginPath();
  for (let x = 0; x < width + gridXStep; x += gridXStep) {
    context.moveTo(x + 0.5, height * 0.06);
    context.lineTo(x + 0.5, height * 0.94);
  }
  context.stroke();

  const framePatternSurface = createRenderSurface(2, 6);
  const framePatternContext = framePatternSurface.getContext('2d');
  if (framePatternContext) {
    framePatternContext.fillStyle = 'rgba(255, 255, 255, 0.06)';
    framePatternContext.fillRect(0, 0, 2, 1);
    const pattern = context.createPattern(framePatternSurface, 'repeat');
    if (pattern) {
      context.fillStyle = pattern;
      context.globalAlpha = 0.18 + sliders.scan * 0.12;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 1;
    }
  }

  context.strokeStyle = toRgba(specimenGreen, 0.16 + gridWeight * 0.14);
  context.lineWidth = 1.1;
  context.strokeRect(width * 0.03, height * 0.04, width * 0.94, height * 0.88);
  context.strokeStyle = toRgba(specimenOrange, 0.28 + sliders.emphasis * 0.22);
  context.beginPath();
  context.moveTo(width * 0.03, height * (0.48 + (staticScene.system.horizon - 0.5) * 0.12));
  context.lineTo(width * 0.97, height * (0.48 + (staticScene.system.horizon - 0.5) * 0.12));
  context.stroke();

  const apertureGradient = context.createLinearGradient(centerX - apertureWidth, 0, centerX + apertureWidth, 0);
  apertureGradient.addColorStop(0, toRgba(specimenGreen, 0.08));
  apertureGradient.addColorStop(0.5, toRgba(specimenOrange, 0.1 + sliders.contourStrength * 0.08));
  apertureGradient.addColorStop(1, toRgba(sensorViolet, 0.08));
  context.fillStyle = apertureGradient;
  context.fillRect(centerX - apertureWidth * 0.9, centerY - apertureHeight * 0.7, apertureWidth * 1.8, apertureHeight * 1.4);

  context.strokeStyle = toRgba(specimenOrange, 0.26 + sliders.reticleStrength * 0.18);
  context.lineWidth = 1.2;
  context.beginPath();
  context.ellipse(centerX, centerY, apertureWidth * 0.46, apertureHeight * 0.22, 0, 0, tau);
  context.ellipse(centerX, centerY, apertureWidth * 0.7, apertureHeight * 0.32, 0, 0, tau);
  context.stroke();

  const contentShield = context.createRadialGradient(width * 0.24, height * 0.32, 0, width * 0.24, height * 0.32, width * 0.5);
  contentShield.addColorStop(0, `rgba(0, 0, 0, ${0.7 + sliders.emphasis * 0.08})`);
  contentShield.addColorStop(0.52, `rgba(0, 0, 0, ${0.34 + sliders.sensorPresence * 0.06 + sliders.commandPresence * 0.06})`);
  contentShield.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = contentShield;
  context.fillRect(0, 0, width, height);

  const vignette = context.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.48, Math.max(width, height) * 0.84);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.68, 'rgba(0, 0, 0, 0.18)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.94)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  drawHudBox(
    context,
    width * 0.05,
    height * 0.04,
    width * 0.22,
    height * 0.075,
    ['OPENCLAW SYSTEM FIELD', `Mode ${(staticScene.system.displayMode * 100).toFixed(0)} / GRID ${(sliders.gridVisibility * 100).toFixed(0)}`],
    toRgba(specimenOrange, 0.88),
    toRgba(specimenOrange, 0.94),
    fontSize,
  );
  drawHudBox(
    context,
    width * 0.72,
    height * 0.04,
    width * 0.2,
    height * 0.075,
    ['LIVE TELEMETRY', `Bias ${(staticScene.system.reticleBias * 100).toFixed(0)} / Gate ${(staticScene.system.gate * 100).toFixed(0)}`],
    toRgba(specimenOrange, 0.82),
    toRgba(specimenOrange, 0.92),
    fontSize,
    'right',
  );
  drawHudBox(
    context,
    width * 0.4,
    height * 0.42,
    width * 0.12,
    height * 0.07,
    ['ACTIVE FIELD'],
    toRgba(sensorViolet, 0.76),
    toRgba(specimenGreen, 0.9),
    fontSize,
    'center',
  );

  return surface;
}

function getStaticSceneBase(cacheStore, scene, width, height, controls = {}) {
  if (!cacheStore) return buildStaticSceneBase(scene, width, height, controls);
  const key = sceneCacheKey(scene, width, height);
  if (!cacheStore.has(key)) {
    cacheStore.clear();
    const surface = buildStaticSceneBase(scene, width, height, controls);
    if (surface) cacheStore.set(key, surface);
  }
  return cacheStore.get(key) ?? null;
}

function renderScene(scene, context, width, height, timeMs, controls = {}) {
  const time = timeMs * 0.001;
  const continuousScene = deriveContinuousScene(scene, controls, time);
  const { sliders } = continuousScene;
  const ambientColor = continuousScene.ambient ?? continuousScene.toxic ?? continuousScene.haze;
  const edgeColor = continuousScene.edge ?? continuousScene.magenta ?? continuousScene.warning ?? ambientColor;
  const warningColor = continuousScene.warning ?? edgeColor;
  const hotAmbient = scaleColor(ambientColor, 1.12);
  const hotEdge = scaleColor(edgeColor, 1.04);
  const hotWarning = scaleColor(warningColor, 1.06);
  const specimenOrange = mixColor(hotWarning, [255, 177, 88], 0.14 + sliders.colorWeighting * 0.18);
  const specimenGreen = mixColor(hotAmbient, [171, 255, 220], 0.12 + (1 - sliders.colorWeighting) * 0.12);
  const sensorViolet = mixColor(continuousScene.magenta ?? hotEdge, [152, 110, 255], 0.28 + sliders.sensorPresence * 0.16);
  const deepBase = mixColor(continuousScene.base, [0, 0, 0], 0.88 + sliders.emphasis * 0.08);
  const phase = continuousScene.system.phase * tau;
  const drift = driftTime(time);
  const minSide = Math.min(width, height);
  const fontSize = Math.max(12, Math.round(width * 0.011));
  const sensorWeight = sliders.sensorPresence;
  const gridWeight = 0.28 + sliders.gridVisibility * 0.42;
  const contourWeight = 0.34 + sliders.contourStrength * 0.46;
  const reticleWeight = 0.32 + sliders.reticleStrength * 0.5;
  const rulerWeight = 0.22 + sensorWeight * 0.52 + sliders.commandPresence * 0.14;
  const pulse = 0.5 + 0.5 * Math.sin(drift * 0.42 + phase * 0.8);
  const horizonY = height * (0.48 + (continuousScene.system.horizon - 0.5) * 0.12 + Math.sin(drift * 0.11 + phase * 0.3) * 0.01);
  const centerX = width * (0.52 + (continuousScene.system.beamTilt - 0.5) * 0.1 + Math.sin(drift * 0.09 + phase * 0.4) * 0.012);
  const centerY = height * (0.52 + (continuousScene.system.reticleBias - 0.5) * 0.08 + Math.cos(drift * 0.12 + phase * 0.2) * 0.008);
  const apertureWidth = width * (0.22 + continuousScene.system.aperture * 0.16);
  const apertureHeight = height * (0.34 + continuousScene.system.bandCurve * 0.16);
  const baseSurface = getStaticSceneBase(controls.cacheStore, scene, width, height, controls);
  if (baseSurface) context.drawImage(baseSurface, 0, 0, width, height);
  else {
    context.fillStyle = toRgba(deepBase, 1);
    context.fillRect(0, 0, width, height);
  }

  context.globalCompositeOperation = 'screen';

  const sweepX = width * (0.14 + ((drift * 0.024 + continuousScene.system.notch * 0.18) % 0.72));
  const sweep = context.createLinearGradient(sweepX - width * 0.08, 0, sweepX + width * 0.08, 0);
  sweep.addColorStop(0, 'rgba(0, 0, 0, 0)');
  sweep.addColorStop(0.5, toRgba(specimenOrange, 0.045 + sliders.glowIntensity * 0.05));
  sweep.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = sweep;
  context.fillRect(sweepX - width * 0.08, height * 0.06, width * 0.16, height * 0.88);

  const fieldGradient = context.createLinearGradient(centerX - apertureWidth, 0, centerX + apertureWidth, 0);
  fieldGradient.addColorStop(0, toRgba(specimenGreen, 0.12 + contourWeight * 0.04));
  fieldGradient.addColorStop(0.45, toRgba(specimenOrange, 0.18 + contourWeight * 0.08));
  fieldGradient.addColorStop(1, toRgba(sensorViolet, 0.12 + contourWeight * 0.04));
  context.fillStyle = fieldGradient;
  context.strokeStyle = toRgba([255, 255, 255], 0.32 + contourWeight * 0.18);
  context.lineWidth = 1.4;

  const contourLines = sensorWeight > 0.5 ? 3 : 2;
  const contourSteps = 22;
  for (let band = 0; band < contourLines; band += 1) {
    const bandOffset = (band - (contourLines - 1) * 0.5) * apertureHeight * 0.18;
    context.beginPath();
    for (let step = 0; step <= contourSteps; step += 1) {
      const u = step / contourSteps;
      const x = centerX - apertureWidth + apertureWidth * 2 * u;
      const dx = u - 0.5;
      const pinch = 1 - Math.exp(-Math.abs(dx) * (5 + continuousScene.system.waist * 3.4));
      const envelope = apertureHeight * (0.16 + band * 0.12 + pinch * 0.22);
      const ripple = Math.sin(u * tau * (1.1 + continuousScene.system.contour * 0.7) + drift * 0.28 + phase * 0.6 + band) * height * 0.008;
      const y = centerY - envelope + ripple + bandOffset;
      if (step === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    for (let step = contourSteps; step >= 0; step -= 1) {
      const u = step / contourSteps;
      const x = centerX - apertureWidth + apertureWidth * 2 * u;
      const dx = u - 0.5;
      const pinch = 1 - Math.exp(-Math.abs(dx) * (5 + continuousScene.system.waist * 3.4));
      const envelope = apertureHeight * (0.16 + band * 0.12 + pinch * 0.22);
      const ripple = Math.sin(u * tau * (1.1 + continuousScene.system.contour * 0.7) + drift * 0.28 + phase * 0.6 + band) * height * 0.008;
      context.lineTo(x, centerY + envelope - ripple + bandOffset);
    }
    context.closePath();
    context.globalAlpha = 0.08 + band * 0.05 + contourWeight * 0.08;
    context.fill();
    context.globalAlpha = 1;
    context.stroke();
  }

  const columnLeft = centerX - apertureWidth * 0.12;
  const columnWidth = apertureWidth * 0.24;
  const columnTop = height * 0.18;
  const columnHeight = height * 0.58;
  context.strokeStyle = toRgba(specimenOrange, 0.34 + sliders.glowIntensity * 0.3);
  context.lineWidth = 1.2;
  context.strokeRect(columnLeft, columnTop, columnWidth, columnHeight);
  context.beginPath();
  for (let step = 0; step <= 54; step += 1) {
    const t = step / 54;
    const y = columnTop + columnHeight * t;
    const x =
      columnLeft +
      columnWidth * 0.5 +
      columnWidth *
        (Math.sin(t * tau * (4.2 + continuousScene.system.scan * 1.3) + phase * 0.46) * 0.18 +
          Math.sin(t * tau * 10.5 - phase * 0.22) * 0.04);
    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.22 + Math.sin(drift * 0.1 + phase * 0.5) * 0.04);
  for (let ring = 0; ring < 2; ring += 1) {
    const radius = minSide * (0.12 + ring * 0.08 + pulse * 0.008);
    context.strokeStyle = toRgba(ring === 0 ? specimenGreen : specimenOrange, 0.18 + reticleWeight * 0.22 - ring * 0.04);
    context.lineWidth = ring === 1 ? 1.8 : 1.2;
    context.beginPath();
    context.ellipse(0, 0, radius * (1 + continuousScene.system.aperture * 0.08), radius * (0.64 + ring * 0.12), 0, 0, tau);
    context.stroke();
  }
  context.strokeStyle = toRgba(specimenOrange, 0.54 + reticleWeight * 0.16);
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(0, 0, minSide * 0.21, phase * 0.14, phase * 0.14 + Math.PI * (0.45 + continuousScene.system.gate * 0.18));
  context.stroke();
  context.beginPath();
  context.moveTo(-apertureWidth * 0.38, 0);
  context.lineTo(-apertureWidth * 0.1, 0);
  context.moveTo(apertureWidth * 0.1, 0);
  context.lineTo(apertureWidth * 0.38, 0);
  context.moveTo(0, -apertureHeight * 0.26);
  context.lineTo(0, -apertureHeight * 0.08);
  context.moveTo(0, apertureHeight * 0.08);
  context.lineTo(0, apertureHeight * 0.26);
  context.stroke();
  context.restore();

  context.globalCompositeOperation = 'source-over';
  context.strokeStyle = toRgba(specimenOrange, 0.28 + rulerWeight * 0.28);
  context.fillStyle = toRgba(specimenOrange, 0.8);
  context.lineWidth = 1.1;
  context.font = `700 ${fontSize}px var(--font-mono), monospace`;
  context.textBaseline = 'middle';
  const rulerX = width * 0.82;
  const tickCount = 10;
  for (let index = 0; index <= tickCount; index += 1) {
    const t = index / tickCount;
    const y = lerp(height * 0.12, height * 0.9, t) + Math.sin(drift * 0.16 + t * tau * 1.4) * height * 0.003;
    const tick = index % 2 === 0 ? width * 0.018 : width * 0.01;
    context.beginPath();
    context.moveTo(rulerX, y);
    context.lineTo(rulerX + tick, y);
    context.stroke();
    if (index < tickCount) {
      const value = Math.round(90 - t * 180 + Math.sin(drift * 0.12 + t * 3) * 3);
      context.fillText(`${value >= 0 ? '+' : ''}${value}`, rulerX + width * 0.022, y);
    }
  }

  const liveScanAlpha = 0.04 + sliders.scan * 0.03 + sliders.glowIntensity * 0.02;
  context.fillStyle = `rgba(255, 255, 255, ${liveScanAlpha})`;
  context.fillRect(0, horizonY - 1, width, 2);
}

function DeckBackground({ activeIndex }) {
  const canvasRef = useRef(null);
  const startLoopRef = useRef(() => {});
  const currentSceneRef = useRef(slides[activeIndex].scene);
  const targetSceneRef = useRef(slides[activeIndex].scene);
  const currentPositionRef = useRef(activeIndex);
  const targetPositionRef = useRef(activeIndex);
  const stateRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    animationFrame: 0,
    media: null,
    transitionStart: 0,
    renderer: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const state = stateRef.current;
    state.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    state.renderer = createDeckBackgroundRenderer(context);

    const renderFrame = (scene, timeMs, controls) => {
      state.renderer?.render(scene, timeMs, controls);
    };

    const stopLoop = () => {
      if (!state.animationFrame) return;
      window.cancelAnimationFrame(state.animationFrame);
      state.animationFrame = 0;
    };

    const frame = (timeMs) => {
      const targetScene = targetSceneRef.current;
      const progress = state.media?.matches
        ? 1
        : clamp((timeMs - state.transitionStart) / transitionMs, 0, 1);
      const easedProgress = smootherstep(0, 1, progress);
      const scene = interpolateScene(currentSceneRef.current, targetScene, easedProgress);
      const slidePosition = lerp(currentPositionRef.current, targetPositionRef.current, easedProgress);
      const deckProgress = slides.length > 1 ? slidePosition / (slides.length - 1) : 0;

      renderFrame(scene, timeMs, { slideCount: slides.length, deckProgress, localProgress: easedProgress, slidePosition });

      if (progress >= 1) {
        currentSceneRef.current = targetScene;
        currentPositionRef.current = targetPositionRef.current;
      }
      const shouldContinue = !document.hidden && !state.media?.matches;

      if (shouldContinue) {
        state.animationFrame = window.requestAnimationFrame(frame);
      } else {
        state.animationFrame = 0;
      }
    };

    const startLoop = () => {
      if (state.animationFrame) return;
      state.animationFrame = window.requestAnimationFrame(frame);
    };
    startLoopRef.current = startLoop;

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth >= 1500 ? 1 : window.innerWidth >= 1100 ? 1.1 : 1.2);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      state.renderer?.resize(state.width, state.height, state.dpr);
      const deckProgress = slides.length > 1 ? currentPositionRef.current / (slides.length - 1) : 0;
      renderFrame(currentSceneRef.current, performance.now(), {
        slideCount: slides.length,
        deckProgress,
        localProgress: 1,
        slidePosition: currentPositionRef.current,
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else if (!document.hidden) {
        const deckProgress = slides.length > 1 ? currentPositionRef.current / (slides.length - 1) : 0;
        renderFrame(currentSceneRef.current, performance.now(), {
          slideCount: slides.length,
          deckProgress,
          localProgress: 1,
          slidePosition: currentPositionRef.current,
        });
        startLoop();
      }
    };

    const onMotionChange = () => {
      if (state.media?.matches) {
        stopLoop();
        currentSceneRef.current = targetSceneRef.current;
        currentPositionRef.current = targetPositionRef.current;
        const deckProgress = slides.length > 1 ? currentPositionRef.current / (slides.length - 1) : 0;
        renderFrame(currentSceneRef.current, performance.now(), {
          slideCount: slides.length,
          deckProgress,
          localProgress: 1,
          slidePosition: currentPositionRef.current,
        });
      } else {
        state.transitionStart = performance.now();
        startLoop();
      }
    };

    resize();
    state.transitionStart = performance.now();
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
    const canvas = canvasRef.current;
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const state = stateRef.current;
    const nextScene = slides[activeIndex].scene;
    const now = performance.now();
    const progress = state.media?.matches
      ? 1
      : clamp((now - state.transitionStart) / transitionMs, 0, 1);
    const easedProgress = smootherstep(0, 1, progress);
    const currentScene = interpolateScene(currentSceneRef.current, targetSceneRef.current, easedProgress);
    const currentPosition = lerp(currentPositionRef.current, targetPositionRef.current, easedProgress);

    if (state.media?.matches) {
      currentSceneRef.current = nextScene;
      targetSceneRef.current = nextScene;
      currentPositionRef.current = activeIndex;
      targetPositionRef.current = activeIndex;
      state.renderer?.resize(state.width, state.height, state.dpr);
      state.renderer?.render(nextScene, now, {
        slideCount: slides.length,
        deckProgress: slides.length > 1 ? activeIndex / (slides.length - 1) : 0,
        localProgress: 1,
        slidePosition: activeIndex,
      });
      return;
    }

    currentSceneRef.current = currentScene;
    currentPositionRef.current = currentPosition;
    targetSceneRef.current = nextScene;
    targetPositionRef.current = activeIndex;
    state.transitionStart = performance.now();

    state.renderer?.resize(state.width, state.height, state.dpr);
    state.renderer?.render(currentSceneRef.current, now, {
      slideCount: slides.length,
      deckProgress: slides.length > 1 ? currentPositionRef.current / (slides.length - 1) : 0,
      localProgress: 0,
      slidePosition: currentPositionRef.current,
    });

    if (!document.hidden) startLoopRef.current();
  }, [activeIndex]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

const Panel = memo(function Panel({ item }) {
  const accentClass =
    item.accent === 'focus'
      ? 'border-cyan-300/30 bg-cyan-200/[0.08]'
      : item.accent === 'cool'
        ? 'border-sky-300/25 bg-sky-200/[0.08]'
        : item.accent === 'warm'
          ? 'border-orange-300/25 bg-orange-200/[0.08]'
          : 'border-white/10 bg-white/[0.06]';

  return (
    <article className={`deck-panel ${accentClass}`}>
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

function renderBody(slide) {
  switch (slide.layout) {
    case 'trio':
      return (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {slide.cards.map((card) => (
            <Panel key={card.title} item={card} />
          ))}
        </div>
      );
    case 'split':
      return (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {slide.panels.map((panel) => (
            <Panel key={panel.title} item={panel} />
          ))}
        </div>
      );
    case 'split-note':
      return (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {slide.panels.map((panel) => (
              <Panel key={panel.title} item={panel} />
            ))}
          </div>
          <div className="deck-note">{slide.note}</div>
        </div>
      );
    case 'steps':
      return (
        <div className="space-y-4 sm:space-y-5">
          <div
            className={`grid gap-3 sm:gap-4 md:grid-cols-2 ${
              slide.steps.length > 4 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'
            }`}
          >
            {slide.steps.map((step, index) => (
              <article
                key={`${step.title}-${index}`}
                className={`deck-panel min-h-0 sm:min-h-40 ${
                  step.accent === 'focus'
                    ? 'border-cyan-300/30 bg-cyan-200/[0.1]'
                    : step.accent === 'cool'
                      ? 'border-sky-300/25 bg-sky-200/[0.08]'
                      : 'border-white/10 bg-white/[0.05]'
                }`}
              >
                <p className="deck-label">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="deck-subtitle">{step.title}</h3>
                {step.body ? <p className="deck-copy text-balance">{step.body}</p> : null}
              </article>
            ))}
          </div>
          {slide.tags ? (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {slide.tags.map((tag) => (
                <span key={tag} className="deck-chip">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {slide.note ? <div className="deck-note">{slide.note}</div> : null}
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
            <h3 className="deck-subtitle">Current claws</h3>
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
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {slide.cards.map((card) => (
            <Panel key={card.title} item={card} />
          ))}
        </div>
      );
    case 'closing':
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            {slide.cards.map((card) => (
              <Panel key={card.title} item={card} />
            ))}
          </div>
          <p className="max-w-[26ch] text-balance text-xl font-semibold leading-tight text-white/95 sm:text-3xl">
            {slide.closing}
          </p>
        </div>
      );
    default:
      return null;
  }
}

const SlideCard = memo(function SlideCard({ slide, state, direction }) {
  return (
    <section
      aria-hidden={state === 'leaving'}
      className="deck-slide"
      data-direction={direction > 0 ? 'forward' : 'backward'}
      data-layout={slide.layout}
      data-slide={slide.id}
      data-state={state}
    >
      <div className="deck-frame" data-layout={slide.layout}>
        <p className="deck-kicker">{slide.kicker}</p>
        <h1 className="deck-title">{slide.title}</h1>
        {renderBody(slide)}
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

  const progress = slides.length > 1 ? activeIndex / (slides.length - 1) : 0;
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
