const tau = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const mixColor = (from, to, amount) => from.map((value, index) => lerp(value, to[index], amount));
const scaleColor = (rgb, factor) => rgb.map((value) => clamp(value * factor, 0, 255));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const smootherstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const toRgba = (rgb, alpha) => `rgba(${rgb.map((value) => Math.round(value)).join(', ')}, ${clamp(alpha, 0, 1)})`;
const calmPulse = (value) => clamp((value ?? 0) * 0.42, 0, 1);

function withAlpha(context, alpha, draw) {
  if (alpha <= 0.0015) return;
  context.save();
  context.globalAlpha *= clamp(alpha, 0, 1);
  draw();
  context.restore();
}

function pseudoNoise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function buildGeometry(width, height, quality) {
  const gridColumns = [];
  const gridRows = [];
  const specimenNodes = [];
  const frameTicks = [];
  const crossMarkers = [];

  const columnCount = Math.max(8, Math.round((9 + width / 220) * quality));
  const rowCount = Math.max(9, Math.round((10 + height / 120) * quality));
  const specimenCount = Math.max(42, Math.round((56 + height / 18) * quality));
  const tickCount = Math.max(14, Math.round((18 + width / 120) * quality));

  for (let index = 0; index < columnCount; index += 1) {
    const t = index / Math.max(1, columnCount - 1);
    gridColumns.push({
      t,
      x: lerp(0.18, 0.95, t),
      weight: index % 3 === 0 ? 1.3 : 1,
      phase: pseudoNoise(index + 7),
    });
  }

  for (let index = 0; index < rowCount; index += 1) {
    const t = index / Math.max(1, rowCount - 1);
    gridRows.push({
      t,
      y: lerp(0.08, 0.94, t),
      weight: index % 4 === 0 ? 1.2 : 1,
      phase: pseudoNoise(index + 43),
    });
  }

  for (let index = 0; index < specimenCount; index += 1) {
    const t = index / Math.max(1, specimenCount - 1);
    specimenNodes.push({
      t,
      envelope: Math.sin(t * Math.PI) ** 0.65,
      noise: pseudoNoise(index * 0.73 + 15),
      curve: Math.sin(t * tau * 1.7 + 0.2),
    });
  }

  for (let index = 0; index <= tickCount; index += 1) {
    const t = index / Math.max(1, tickCount);
    frameTicks.push({
      t,
      weight: index % 3 === 0 ? 1 : 0.55,
    });
  }

  const crossCols = [0.17, 0.34, 0.5, 0.66, 0.83];
  const crossRows = [0.22, 0.5, 0.78];
  crossRows.forEach((y, row) => {
    crossCols.forEach((x, col) => {
      if (row === 1 && col === 2) return;
      crossMarkers.push({ x, y, label: `${['a', 'b', 'g'][row]}${col - 2 >= 0 ? '+' : ''}${col - 2}` });
    });
  });

  return { gridColumns, gridRows, specimenNodes, frameTicks, crossMarkers };
}

function deriveContinuousScene(scene, controls, time) {
  const slideCount = Math.max(1, controls.slideCount ?? 1);
  const slideSpan = Math.max(1, slideCount - 1);
  const slidePosition = clamp(controls.slidePosition ?? 0, 0, slideSpan);
  const slideIndex = clamp(slidePosition / slideSpan, 0, 1);
  const deckProgress = clamp(controls.deckProgress ?? slideIndex, 0, 1);
  const localProgress = clamp(controls.localProgress ?? 1, 0, 1);
  const transition = smootherstep(0, 1, localProgress);
  const mode = clamp(scene.system.displayMode ?? 0, 0, 1);
  const driftA = Math.sin(time * 0.17 + deckProgress * tau * 0.6 + slidePosition * 0.15);
  const driftB = Math.cos(time * 0.11 - slideIndex * tau * 0.42 + 1.1);
  const driftC = Math.sin(time * 0.06 + mode * tau * 0.8 + 2.7);
  const driftD = Math.cos(time * 0.037 + deckProgress * tau * 1.35 - 0.8);
  const pulse = Math.sin(time * (0.42 + calmPulse(scene.system.pulse) * 0.34) + (scene.system.phase ?? 0.5) * tau);

  const specimenBias = clamp(
    0.88 -
      deckProgress * 0.34 -
      mode * 0.28 -
      (scene.system.sensorField ?? 0) * 0.22 +
      driftA * 0.04,
    0.18,
    1,
  );
  const commandBias = clamp(
    0.22 +
      (scene.system.defense ?? 0) * 0.34 +
      mode * 0.18 +
      deckProgress * 0.22 +
      transition * 0.08 +
      driftB * 0.04,
    0,
    1,
  );
  const contourBias = clamp(
    (scene.system.contour ?? 0) * 0.72 +
      (scene.system.sensorField ?? 0) * 0.18 +
      deckProgress * 0.1 +
      driftC * 0.05,
    0,
    1,
  );
  const latticeBias = clamp(
    (scene.system.lattice ?? 0) * 0.7 +
      (1 - deckProgress) * 0.12 +
      (1 - mode) * 0.06 +
      driftD * 0.04,
    0,
    1,
  );
  const warningBias = clamp(
    (scene.system.warningBias ?? 0) * 0.7 + deckProgress * 0.14 + commandBias * 0.12 + Math.max(0, pulse) * 0.08,
    0,
    1,
  );
  const scanBias = clamp(
    (scene.system.scan ?? 0) * 0.72 +
      (scene.system.interference ?? 0) * 0.1 +
      transition * 0.05 +
      driftA * 0.04,
    0,
    1,
  );
  const radialBias = clamp(
    (scene.system.defense ?? 0) * 0.58 +
      mode * 0.22 +
      deckProgress * 0.16 +
      transition * 0.08 +
      driftC * 0.04,
    0,
    1,
  );
  const fieldWarp = clamp(
    (scene.system.skew ?? 0) * 0.68 +
      (scene.system.bandCurve ?? 0) * 0.12 +
      driftB * 0.08 +
      driftD * 0.05,
    0,
    1,
  );
  const density = clamp(
    0.28 +
      (scene.system.density ?? 0) * 0.42 +
      contourBias * 0.12 +
      commandBias * 0.08 -
      radialBias * 0.05,
    0,
    1,
  );
  const readabilityMask = clamp(0.54 + specimenBias * 0.1 + commandBias * 0.06, 0.48, 0.82);

  return {
    ...scene,
    sliders: {
      deckProgress,
      slideIndex,
      slidePosition,
      localProgress: transition,
      specimenBias,
      commandBias,
      contourBias,
      latticeBias,
      warningBias,
      scanBias,
      radialBias,
      fieldWarp,
      density,
      readabilityMask,
      pulse,
      driftA,
      driftB,
      driftC,
      driftD,
    },
  };
}

function drawBackdrop(context, width, height, scene, palette, sliders, time) {
  const base = mixColor(scene.base, [0, 0, 0], 0.88);
  context.fillStyle = toRgba(base, 1);
  context.fillRect(0, 0, width, height);

  const bloom = context.createRadialGradient(
    width * scene.light.x,
    height * scene.light.y,
    0,
    width * scene.light.x,
    height * scene.light.y,
    Math.max(width, height) * (0.42 + scene.light.radius * 0.36),
  );
  bloom.addColorStop(0, toRgba(palette.warning, 0.11 + sliders.warningBias * 0.08));
  bloom.addColorStop(0.35, toRgba(palette.edge, 0.09 + sliders.contourBias * 0.07));
  bloom.addColorStop(0.68, toRgba(palette.ambient, 0.06 + sliders.latticeBias * 0.06));
  bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = bloom;
  context.fillRect(0, 0, width, height);

  const sideGlow = context.createLinearGradient(0, 0, width, 0);
  sideGlow.addColorStop(0, toRgba(palette.warning, 0.1 + sliders.warningBias * 0.06));
  sideGlow.addColorStop(0.24, 'rgba(0, 0, 0, 0)');
  sideGlow.addColorStop(0.78, 'rgba(0, 0, 0, 0)');
  sideGlow.addColorStop(1, toRgba(palette.ambient, 0.08 + sliders.contourBias * 0.05));
  context.fillStyle = sideGlow;
  context.fillRect(0, 0, width, height);

  const sweepX = width * (0.1 + ((time * 0.018 + sliders.driftA * 0.04 + sliders.deckProgress * 0.3) % 0.82));
  const sweep = context.createLinearGradient(sweepX - width * 0.09, 0, sweepX + width * 0.09, 0);
  sweep.addColorStop(0, 'rgba(0, 0, 0, 0)');
  sweep.addColorStop(0.5, toRgba(palette.warning, 0.05 + sliders.scanBias * 0.04));
  sweep.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = sweep;
  context.fillRect(0, height * 0.04, width, height * 0.92);

  const topBand = context.createLinearGradient(0, 0, width, 0);
  topBand.addColorStop(0, toRgba(palette.warning, 0.06 + sliders.warningBias * 0.04));
  topBand.addColorStop(0.45, toRgba(palette.ambient, 0.02 + sliders.latticeBias * 0.02));
  topBand.addColorStop(1, toRgba(palette.edge, 0.04 + sliders.contourBias * 0.03));
  context.fillStyle = topBand;
  context.fillRect(0, 0, width, height * 0.09);

  const lowerBand = context.createLinearGradient(0, height, width, height * 0.64);
  lowerBand.addColorStop(0, toRgba(palette.ambient, 0.08 + sliders.latticeBias * 0.04));
  lowerBand.addColorStop(0.4, toRgba(palette.warning, 0.03 + sliders.warningBias * 0.02));
  lowerBand.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = lowerBand;
  context.fillRect(0, height * 0.64, width, height * 0.36);
}

function drawAmbientTexture(context, width, height, palette, sliders, geometry, time) {
  context.save();
  context.fillStyle = toRgba([255, 255, 255], 0.018 + sliders.scanBias * 0.018);
  const scanStep = Math.max(4, Math.round(height / (78 + sliders.density * 28)));
  for (let y = 0; y < height; y += scanStep) {
    context.fillRect(0, y, width, 1);
  }

  context.fillStyle = toRgba(palette.edge, 0.028 + sliders.contourBias * 0.015);
  for (let index = 0; index < geometry.gridRows.length; index += 1) {
    if (index % 3 !== 0) continue;
    const row = geometry.gridRows[index];
    const y = row.y * height + Math.sin(time * 0.22 + row.phase * tau) * height * 0.002;
    context.fillRect(width * 0.08, y, width * 0.84, 1);
  }

  context.fillStyle = toRgba(palette.warning, 0.016 + sliders.warningBias * 0.02);
  const grainCount = Math.max(14, Math.round(geometry.crossMarkers.length * 1.8));
  for (let index = 0; index < grainCount; index += 1) {
    const x = width * (0.1 + pseudoNoise(index * 1.73 + Math.floor(time * 18)) * 0.82);
    const y = height * (0.08 + pseudoNoise(index * 0.91 + Math.floor(time * 14) + 40) * 0.84);
    context.fillRect(x, y, 1, 1);
  }
  context.restore();
}

function drawLattice(context, width, height, scene, palette, sliders, geometry, time) {
  context.save();
  context.strokeStyle = toRgba(palette.ambient, 0.12 + sliders.latticeBias * 0.14);
  context.lineWidth = 1;
  context.beginPath();

  geometry.gridColumns.forEach((column) => {
    const x = column.x * width;
    const warp =
      Math.sin(time * 0.22 + column.phase * tau + sliders.fieldWarp * 2.4) * width * 0.008 * sliders.fieldWarp;
    if (column.weight > 1.2) {
      context.strokeStyle = toRgba(palette.warning, 0.14 + sliders.warningBias * 0.1);
      context.beginPath();
      context.moveTo(x + warp, height * 0.06);
      context.lineTo(x - warp * 0.6, height * 0.94);
      context.stroke();
      context.strokeStyle = toRgba(palette.ambient, 0.08 + sliders.latticeBias * 0.1);
    }
    context.moveTo(x + warp, height * 0.06);
    context.lineTo(x - warp * 0.6, height * 0.94);
  });
  context.stroke();

  geometry.gridRows.forEach((row, index) => {
    const y = row.y * height;
    const alpha = 0.065 + (1 - row.t) * 0.07 + sliders.scanBias * 0.04;
    context.strokeStyle = toRgba(index % 4 === 0 ? palette.warning : palette.ambient, alpha);
    context.lineWidth = row.weight;
    context.beginPath();
    for (let step = 0; step <= 20; step += 1) {
      const u = step / 20;
      const x = lerp(width * 0.08, width * 0.95, u);
      const warp =
        Math.sin(u * tau * (0.8 + sliders.fieldWarp * 1.6) + time * 0.14 + row.phase * tau) *
        height *
        0.01 *
        sliders.fieldWarp;
      const pinch = Math.exp(-Math.abs(u - 0.55) * (7 - sliders.contourBias * 2));
      const yy = y + warp * pinch;
      if (step === 0) context.moveTo(x, yy);
      else context.lineTo(x, yy);
    }
    context.stroke();
  });

  context.strokeStyle = toRgba(palette.ambient, 0.48);
  context.lineWidth = 1.4;
  context.strokeRect(width * 0.04, height * 0.045, width * 0.92, height * 0.89);
  context.restore();
}

function drawFieldContours(context, width, height, scene, palette, sliders, geometry, time) {
  const lineCount = Math.max(10, Math.round(10 + sliders.contourBias * 10 + sliders.radialBias * 3));
  const centerX = width * (0.52 + (scene.system.beamTilt - 0.5) * 0.18 + sliders.driftB * 0.02);
  const centerY = height * (0.5 + (scene.system.horizon - 0.5) * 0.12 + sliders.driftC * 0.015);
  const spanX = width * (0.18 + (scene.system.aperture ?? 0.5) * 0.23);
  const spanY = height * (0.12 + sliders.specimenBias * 0.1 + sliders.radialBias * 0.08);

  context.save();
  context.globalCompositeOperation = 'screen';

  for (let index = 0; index < lineCount; index += 1) {
    const t = index / Math.max(1, lineCount - 1);
    const spread = 0.52 + t * (1.8 + sliders.contourBias * 0.8);
    const color = t < 0.4 ? palette.ambient : t < 0.72 ? palette.warning : palette.edge;
    context.strokeStyle = toRgba(color, 0.14 + (1 - t) * 0.24);
    context.lineWidth = index % 4 === 0 ? 1.7 : 1.15;
    context.beginPath();
    for (let step = 0; step <= 44; step += 1) {
      const u = step / 44;
      const x = centerX - spanX + u * spanX * 2;
      const dx = u - 0.5;
      const pinch = 1 - Math.exp(-Math.abs(dx) * (5 + sliders.specimenBias * 5));
      const innerWave =
        Math.sin(u * tau * (1.2 + sliders.fieldWarp * 1.4) + time * 0.24 + index * 0.18) * height * 0.02;
      const localWarp = Math.sin(time * 0.12 + u * tau * 0.6 + index * 0.4) * height * 0.008;
      const y = centerY + (t - 0.5) * spanY * spread + innerWave * pinch * 0.34 + localWarp * (1 - pinch);
      if (step === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }

  context.restore();
}

function drawSpecimenSystem(context, width, height, scene, palette, sliders, geometry, time) {
  const columnX = width * (0.49 + (scene.system.beamTilt - 0.5) * 0.08);
  const columnTop = height * 0.11;
  const columnBottom = height * 0.88;
  const columnHeight = columnBottom - columnTop;
  const columnWidth = width * (0.082 + sliders.specimenBias * 0.03 + sliders.commandBias * 0.018);
  const lineAlpha = 0.3 + sliders.specimenBias * 0.24;
  const traceCount = 3 + Math.round(sliders.specimenBias * 3);

  context.save();
  context.globalCompositeOperation = 'screen';
  context.strokeStyle = toRgba(palette.warning, lineAlpha);
  context.lineWidth = 1.2;
  context.strokeRect(columnX - columnWidth * 0.5, columnTop, columnWidth, columnHeight);
  context.strokeStyle = toRgba(palette.ambient, 0.2 + sliders.latticeBias * 0.14);
  context.beginPath();
  context.moveTo(columnX, columnTop - height * 0.02);
  context.lineTo(columnX, columnBottom + height * 0.02);
  context.stroke();

  for (let trace = 0; trace < traceCount; trace += 1) {
    const offset = (trace - (traceCount - 1) * 0.5) / Math.max(1, traceCount - 1 || 1);
    context.strokeStyle = toRgba(trace === traceCount - 1 ? palette.warning : palette.edge, lineAlpha - trace * 0.03);
    context.beginPath();
    geometry.specimenNodes.forEach((node, index) => {
      const y = columnTop + node.t * columnHeight;
      const wobble =
        Math.sin(node.t * tau * (6.5 + sliders.scanBias * 3.2) + time * (0.62 + trace * 0.05) + node.noise * 4) * 0.22;
      const inner =
        Math.sin(node.t * tau * (14 + sliders.contourBias * 7) - time * 0.35 + trace * 0.8) * 0.08 * node.envelope;
      const x = columnX + (wobble + inner + offset * 0.11) * columnWidth;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }

  const blobCount = Math.max(16, Math.round(20 + sliders.specimenBias * 22));
  context.fillStyle = toRgba(palette.warning, 0.15 + sliders.warningBias * 0.08);
  for (let index = 0; index < blobCount; index += 1) {
    const t = index / Math.max(1, blobCount - 1);
    const y = columnTop + t * columnHeight;
    const widthFactor = 0.22 + pseudoNoise(index * 1.9 + Math.floor(time * 7)) * 0.58;
    const x = columnX + Math.sin(t * tau * 7 + time * 0.8 + index) * columnWidth * 0.18;
    context.fillRect(x - columnWidth * widthFactor * 0.28, y, columnWidth * widthFactor * 0.56, Math.max(2, height * 0.006));
  }

  context.strokeStyle = toRgba(palette.warning, 0.48 + sliders.warningBias * 0.2);
  context.beginPath();
  for (let step = 0; step <= 80; step += 1) {
    const t = step / 80;
    const x = lerp(columnX + columnWidth * 0.52, width * 0.93, t);
    const envelope = Math.sin(t * Math.PI) ** 0.82;
    const y =
      height * (0.28 + t * 0.48) +
      Math.sin(t * tau * (2 + sliders.fieldWarp * 0.8) + time * 0.46) * height * 0.06 * envelope +
      Math.sin(t * tau * 8 - time * 0.22) * height * 0.012 * envelope;
    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();

  context.strokeStyle = toRgba(palette.ambient, 0.18 + sliders.latticeBias * 0.14);
  context.setLineDash([8, 10]);
  context.beginPath();
  context.moveTo(columnX, columnTop - height * 0.02);
  context.lineTo(columnX, columnBottom + height * 0.02);
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function drawCommandSystem(context, width, height, scene, palette, sliders, geometry, time) {
  const cx = width * (0.68 + sliders.radialBias * 0.08 + sliders.driftA * 0.015);
  const cy = height * (0.46 + (scene.system.reticleBias - 0.4) * 0.16 + sliders.driftB * 0.012);
  const baseRadius = Math.min(width, height) * (0.12 + sliders.commandBias * 0.08 + sliders.radialBias * 0.04);
  const ringCount = Math.max(4, Math.round(4 + sliders.radialBias * 5));
  const spokeCount = 8 + Math.round(sliders.commandBias * 6);
  const arcSpan = Math.PI * (0.72 + sliders.radialBias * 0.18);
  const arcStart = -Math.PI * 0.82 + Math.sin(time * 0.18 + sliders.driftC) * 0.12;

  context.save();
  context.translate(cx, cy);
  context.globalCompositeOperation = 'screen';

  const commandGlow = context.createRadialGradient(0, 0, baseRadius * 0.1, 0, 0, baseRadius * (2.8 + sliders.radialBias));
  commandGlow.addColorStop(0, toRgba(palette.warning, 0.06 + sliders.commandBias * 0.05));
  commandGlow.addColorStop(0.35, toRgba(palette.edge, 0.06 + sliders.contourBias * 0.06));
  commandGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = commandGlow;
  context.fillRect(-baseRadius * 3.2, -baseRadius * 3.2, baseRadius * 6.4, baseRadius * 6.4);

  for (let ring = 0; ring < ringCount; ring += 1) {
    const t = ring / Math.max(1, ringCount - 1);
    const radius = baseRadius * (0.62 + t * 1.9);
    const segmentCount = 10 + ring * 2 + Math.round(sliders.commandBias * 4);
    const color = ring % 3 === 0 ? palette.warning : ring % 2 === 0 ? palette.ambient : palette.edge;
    context.strokeStyle = toRgba(color, 0.24 + (1 - t) * 0.34);
    context.lineWidth = ring % 2 === 0 ? 1.8 : 1.2;
    for (let segment = 0; segment < segmentCount; segment += 1) {
      const a0 = arcStart + (segment / segmentCount) * arcSpan;
      const a1 = arcStart + ((segment + 0.72) / segmentCount) * arcSpan;
      context.beginPath();
      context.arc(0, 0, radius, a0, a1);
      context.stroke();
    }
  }

  context.strokeStyle = toRgba(palette.ambient, 0.34 + sliders.commandBias * 0.2);
  context.lineWidth = 1.25;
  for (let index = 0; index < spokeCount; index += 1) {
    const angle = (-Math.PI * 0.5 + (index / spokeCount) * tau + Math.sin(time * 0.24 + index) * 0.012);
    const inner = baseRadius * 0.44;
    const outer = baseRadius * (2.05 + sliders.radialBias * 0.66);
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
  }

  context.strokeStyle = toRgba(palette.warning, 0.66 + sliders.warningBias * 0.18);
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-baseRadius * 0.28, 0);
  context.lineTo(baseRadius * 0.28, 0);
  context.moveTo(0, -baseRadius * 0.28);
  context.lineTo(0, baseRadius * 0.28);
  context.stroke();

  const wedgeAngle = -Math.PI * 0.5 + Math.sin(time * 0.3 + sliders.deckProgress * tau) * 0.1;
  context.fillStyle = toRgba(palette.warning, 0.085 + sliders.warningBias * 0.05);
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, baseRadius * (1.8 + sliders.radialBias * 0.5), wedgeAngle - 0.12, wedgeAngle + 0.12);
  context.closePath();
  context.fill();

  context.strokeStyle = toRgba(palette.warning, 0.82);
  context.lineWidth = 1.1;
  context.strokeRect(-baseRadius * 1.92, -baseRadius * 2.22, baseRadius * 1.32, baseRadius * 0.42);
  context.strokeRect(baseRadius * 0.68, -baseRadius * 2.22, baseRadius * 1.32, baseRadius * 0.42);
  context.fillStyle = toRgba(palette.warning, 0.96);
  context.font = `${Math.max(10, baseRadius * 0.12)}px var(--font-mono), monospace`;
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText('SEAL VECTOR', -baseRadius * 1.82, -baseRadius * 2.02);
  context.fillText('TRACK STATE', baseRadius * 0.78, -baseRadius * 2.02);

  context.restore();
}

function drawMarkers(context, width, height, palette, geometry) {
  const arm = Math.min(width, height) * 0.018;
  const fontSize = Math.max(10, Math.round(width * 0.0095));
  context.save();
  context.strokeStyle = toRgba(palette.warning, 0.46);
  context.fillStyle = toRgba(palette.warning, 0.74);
  context.lineWidth = 1.3;
  context.font = `700 ${fontSize}px var(--font-mono), monospace`;
  context.textAlign = 'left';
  context.textBaseline = 'bottom';
  geometry.crossMarkers.forEach((marker) => {
    const x = marker.x * width;
    const y = marker.y * height;
    context.beginPath();
    context.moveTo(x - arm, y);
    context.lineTo(x + arm, y);
    context.moveTo(x, y - arm);
    context.lineTo(x, y + arm);
    context.stroke();
    context.fillText(marker.label, x + arm * 0.24, y - arm * 0.3);
  });
  context.restore();
}

function drawTelemetry(context, width, height, scene, palette, sliders, geometry, time) {
  const fontSize = Math.max(11, Math.round(width * 0.0105));
  context.save();
  context.strokeStyle = toRgba(palette.ambient, 0.62);
  context.fillStyle = toRgba(palette.warning, 0.86);
  context.font = `700 ${fontSize}px var(--font-mono), monospace`;
  context.textBaseline = 'middle';

  const topY = height * 0.08;
  const bottomY = height * 0.92;
  context.beginPath();
  context.moveTo(width * 0.05, topY);
  context.lineTo(width * 0.95, topY);
  context.moveTo(width * 0.05, bottomY);
  context.lineTo(width * 0.95, bottomY);
  context.stroke();

  geometry.frameTicks.forEach((tick) => {
    const x = lerp(width * 0.05, width * 0.95, tick.t);
    const size = height * (tick.weight > 0.8 ? 0.015 : 0.008);
    context.beginPath();
    context.moveTo(x, topY);
    context.lineTo(x, topY + size);
    context.moveTo(x, bottomY);
    context.lineTo(x, bottomY - size);
    context.stroke();
  });

  const boxHeight = height * 0.064;
  const leftBoxWidth = width * 0.25;
  const rightBoxWidth = width * 0.19;
  context.fillStyle = 'rgba(10, 6, 2, 0.72)';
  context.strokeStyle = toRgba(palette.warning, 0.84);
  context.lineWidth = 1.2;
  context.fillRect(width * 0.07, height * 0.03, leftBoxWidth, boxHeight);
  context.strokeRect(width * 0.07, height * 0.03, leftBoxWidth, boxHeight);
  context.fillRect(width * 0.74, height * 0.03, rightBoxWidth, boxHeight);
  context.strokeRect(width * 0.74, height * 0.03, rightBoxWidth, boxHeight);

  context.fillStyle = toRgba(palette.warning, 0.94);
  context.fillText('PSYCHOGRAPHIC DISPLAY', width * 0.085, height * 0.06);
  context.fillText(`PHASE ${(scene.system.phase * 100).toFixed(0)} / LINK ${(sliders.deckProgress * 100).toFixed(0)}`, width * 0.085, height * 0.087);
  context.textAlign = 'right';
  context.fillText(`MODE ${(scene.system.displayMode * 100).toFixed(0)}`, width * 0.915, height * 0.06);
  context.fillText(`SYNC ${Math.round(100 + Math.sin(time * 0.3) * 20 + sliders.commandBias * 90)}`, width * 0.915, height * 0.087);

  context.textAlign = 'left';
  context.strokeStyle = toRgba(palette.warning, 0.62);
  context.fillStyle = toRgba(palette.ambient, 0.92);
  const rulerX = width * 0.035;
  for (let index = 0; index <= 12; index += 1) {
    const y = lerp(height * 0.08, height * 0.92, index / 12);
    const tick = index % 3 === 0 ? width * 0.022 : width * 0.012;
    context.beginPath();
    context.moveTo(rulerX, y);
    context.lineTo(rulerX + tick, y);
    context.stroke();
    if (index < 12) {
      context.fillText(`+${String(12 - index).padStart(2, '0')}`, rulerX + tick + width * 0.006, y);
    }
  }

  const labels = ['A.T. FIELD STATUS', 'EVA-05', 'EVA-06', 'EVA-07', 'EVA-13'];
  const bandY = height * 0.11;
  const bandHeight = height * 0.045;
  const bandWidth = width * 0.125;
  for (let index = 0; index < labels.length; index += 1) {
    const x = width * 0.07 + index * (bandWidth + width * 0.012);
    context.fillStyle = 'rgba(10, 6, 2, 0.64)';
    context.strokeStyle = toRgba(palette.warning, 0.82 - index * 0.04);
    context.fillRect(x, bandY, bandWidth, bandHeight);
    context.strokeRect(x, bandY, bandWidth, bandHeight);
    context.fillStyle = toRgba(index === 0 ? palette.warning : palette.ambient, 0.94);
    context.fillText(labels[index], x + width * 0.008, bandY + bandHeight * 0.5);
  }
  context.restore();
}

function drawReadabilityMask(context, width, height, sliders) {
  const leftMask = context.createLinearGradient(0, 0, width * 0.54, 0);
  leftMask.addColorStop(0, `rgba(0, 0, 0, ${0.9 - sliders.readabilityMask * 0.14})`);
  leftMask.addColorStop(0.4, `rgba(0, 0, 0, ${0.72 - sliders.readabilityMask * 0.18})`);
  leftMask.addColorStop(0.86, `rgba(0, 0, 0, ${0.18 + sliders.commandBias * 0.08})`);
  leftMask.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = leftMask;
  context.fillRect(0, 0, width, height);

  const centerMask = context.createRadialGradient(width * 0.34, height * 0.42, 0, width * 0.34, height * 0.42, width * 0.44);
  centerMask.addColorStop(0, `rgba(0, 0, 0, ${0.64 + sliders.specimenBias * 0.07})`);
  centerMask.addColorStop(0.5, `rgba(0, 0, 0, ${0.26 + sliders.commandBias * 0.06})`);
  centerMask.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = centerMask;
  context.fillRect(0, 0, width, height);

  const vignette = context.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.18)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function updateStats(state, frameMs) {
  state.frameSamples.push(frameMs);
  if (state.frameSamples.length > 120) state.frameSamples.shift();
  const samples = [...state.frameSamples].sort((a, b) => a - b);
  const avg = state.frameSamples.reduce((sum, value) => sum + value, 0) / state.frameSamples.length;
  const p95 = samples[Math.max(0, Math.floor(samples.length * 0.95) - 1)] ?? frameMs;
  const fps = avg > 0 ? 1000 / avg : 0;
  state.stats = {
    frameMs,
    avgFrameMs: avg,
    p95FrameMs: p95,
    fps,
  };
  window.__openclawDeckBackgroundStats = {
    ...state.stats,
    canvasCount: 1,
    renderPathCount: 1,
    width: state.width,
    height: state.height,
    dpr: state.dpr,
    quality: state.quality,
    geometry: {
      gridColumns: state.geometry?.gridColumns.length ?? 0,
      gridRows: state.geometry?.gridRows.length ?? 0,
      specimenNodes: state.geometry?.specimenNodes.length ?? 0,
      frameTicks: state.geometry?.frameTicks.length ?? 0,
      crossMarkers: state.geometry?.crossMarkers.length ?? 0,
    },
  };
}

export function createDeckBackgroundRenderer(context) {
  const state = {
    context,
    width: 0,
    height: 0,
    dpr: 1,
    quality: 1,
    geometryKey: '',
    geometry: null,
    frameSamples: [],
    stats: null,
  };

  return {
    resize(width, height, dpr) {
      state.width = width;
      state.height = height;
      state.dpr = dpr;
      const viewportWeight = clamp((width * height) / (1600 * 900), 0.72, 1.4);
      state.quality = clamp(1.12 - (viewportWeight - 0.72) * 0.18 - (dpr - 1) * 0.12, 0.72, 1.05);
      const geometryKey = `${Math.round(width)}|${Math.round(height)}|${state.quality.toFixed(2)}`;
      if (geometryKey !== state.geometryKey) {
        state.geometryKey = geometryKey;
        state.geometry = buildGeometry(width, height, state.quality);
      }
    },
    render(scene, timeMs, controls = {}) {
      const start = performance.now();
      const { context } = state;
      const time = timeMs * 0.001;
      const continuousScene = deriveContinuousScene(scene, controls, time);
      const ambient = continuousScene.ambient ?? continuousScene.toxic ?? continuousScene.haze;
      const edge = continuousScene.edge ?? continuousScene.magenta ?? continuousScene.warning ?? ambient;
      const warning = continuousScene.warning ?? edge;
      const sliders = continuousScene.sliders;
      const palette = {
        ambient: mixColor(scaleColor(ambient, 1.16), [172, 255, 218], 0.18 + sliders.latticeBias * 0.1),
        edge: mixColor(mixColor(scaleColor(edge, 1), ambient, 0.5), [196, 136, 222], 0.05 + sliders.contourBias * 0.06),
        warning: mixColor(scaleColor(warning, 1.16), [255, 176, 92], 0.24 + sliders.warningBias * 0.14),
      };

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, state.width * state.dpr, state.height * state.dpr);
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

      drawBackdrop(context, state.width, state.height, continuousScene, palette, sliders, time);
      drawAmbientTexture(context, state.width, state.height, palette, sliders, state.geometry, time);
      drawLattice(context, state.width, state.height, continuousScene, palette, sliders, state.geometry, time);
      withAlpha(context, 0.84 + sliders.contourBias * 0.12, () => {
        drawFieldContours(context, state.width, state.height, continuousScene, palette, sliders, state.geometry, time);
      });
      withAlpha(context, 0.76 + sliders.specimenBias * 0.16, () => {
        drawSpecimenSystem(context, state.width, state.height, continuousScene, palette, sliders, state.geometry, time);
      });
      withAlpha(context, 0.6 + sliders.commandBias * 0.26, () => {
        drawCommandSystem(context, state.width, state.height, continuousScene, palette, sliders, state.geometry, time);
      });
      drawMarkers(context, state.width, state.height, palette, state.geometry);
      drawTelemetry(context, state.width, state.height, continuousScene, palette, sliders, state.geometry, time);
      drawReadabilityMask(context, state.width, state.height, sliders);

      updateStats(state, performance.now() - start);
    },
    getStats() {
      return state.stats;
    },
  };
}
