const tau = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mixColor = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const scaleColor = (rgb, f) => rgb.map((v) => clamp(v * f, 0, 255));
const smootherstep = (e0, e1, x) => {
  const t = clamp((x - e0) / Math.max(0.0001, e1 - e0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const calmPulse = (v) => clamp((v ?? 0) * 0.42, 0, 1);

/* ── GLSL sources ─────────────────────────────────────────────── */

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 o_color;

uniform vec2 u_res;
uniform float u_time;

// palette (0-1)
uniform vec3 u_base;
uniform vec3 u_ambient;
uniform vec3 u_edge;
uniform vec3 u_warning;

// light
uniform vec2 u_lightPos;
uniform float u_lightRadius;

// derived sliders
uniform float u_deckProgress;
uniform float u_specimenBias;
uniform float u_commandBias;
uniform float u_contourBias;
uniform float u_latticeBias;
uniform float u_warningBias;
uniform float u_scanBias;
uniform float u_radialBias;
uniform float u_fieldWarp;
uniform float u_density;
uniform float u_readMask;
uniform float u_pulse;
uniform float u_driftA;
uniform float u_driftB;
uniform float u_driftC;
uniform float u_driftD;

// system params
uniform float u_beamTilt;
uniform float u_horizon;
uniform float u_aperture;
uniform float u_reticleBias;
uniform float u_phase;

#define PI  3.14159265359
#define TAU 6.28318530718

/* ── helpers ──────────────────────────────────────────────────── */

float hash(float n){ return fract(sin(n*12.9898)*43758.5453); }
float hash2(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }

float lineSDF(float pos, float target, float w){
  return smoothstep(w, 0.0, abs(pos - target));
}

float boxBorder(vec2 uv, vec2 lo, vec2 hi, float w){
  vec2 c = (lo + hi) * 0.5;
  vec2 h = (hi - lo) * 0.5;
  vec2 d = abs(uv - c) - h;
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  return smoothstep(w, 0.0, abs(dist));
}

float boxFill(vec2 uv, vec2 lo, vec2 hi){
  return step(lo.x, uv.x)*step(uv.x, hi.x)*step(lo.y, uv.y)*step(uv.y, hi.y);
}

/* ── main ─────────────────────────────────────────────────────── */

void main(){
  vec2 uv = v_uv;
  // flip so y=0 is top (matches Canvas 2D convention used by scene data)
  uv.y = 1.0 - uv.y;

  vec2 px = 1.0 / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  vec3 c = vec3(0.0);

  // ── 1. BACKGROUND + BLOOM ──────────────────────────────────
  c = u_base * 0.10;

  // radial bloom from light source
  vec2 lp = u_lightPos;
  float dL = length((uv - lp) * vec2(aspect, 1.0));
  float bR = 0.42 + u_lightRadius * 0.36;
  float bloom = exp(-dL*dL / (bR*bR*0.5));
  c += u_warning * bloom * (0.22 + u_warningBias*0.14);
  c += u_edge    * bloom * 0.6 * (0.16 + u_contourBias*0.12);
  c += u_ambient * bloom * 0.4 * (0.12 + u_latticeBias*0.10);

  // side glows
  c += u_warning * smoothstep(0.28, 0.0, uv.x) * (0.18 + u_warningBias*0.10);
  c += u_ambient * smoothstep(0.74, 1.0, uv.x) * (0.14 + u_contourBias*0.08);

  // top / bottom bands
  c += mix(u_warning, u_edge, uv.x) * smoothstep(0.09, 0.0, uv.y) * 0.12;
  c += u_ambient * smoothstep(0.91, 1.0, uv.y) * 0.14;

  // animated sweep line — very slow pan
  float sweepX = 0.1 + mod(t*0.006 + u_deckProgress*0.3, 0.82);
  float sweep = exp(-pow((uv.x - sweepX) / 0.12, 2.0));
  c += u_warning * sweep * (0.06 + u_scanBias*0.04)
       * step(0.04, uv.y) * step(uv.y, 0.96);

  // ── 2. SCANLINES ─────────────────────────────────────────────
  float scanStep = max(3.0, u_res.y / (100.0 + u_density*30.0));
  float scanY = mod(gl_FragCoord.y, scanStep);
  float scanLine = smoothstep(1.5, 0.0, scanY);
  c += u_ambient * scanLine * (0.04 + u_scanBias*0.04);

  // horizontal rules
  float hStep = 1.0 / (10.0 + u_density*4.0);
  float hDist = mod(uv.y + 0.001, hStep);
  float hLine = smoothstep(px.y*1.5, 0.0, min(hDist, hStep - hDist));
  c += u_edge * hLine * (0.06 + u_contourBias*0.05)
       * step(0.08, uv.x) * step(uv.x, 0.92);

  // ── 3. VERTICAL GRID LINES (with warp) ─────────────────────
  float vCount = 9.0 + u_density*4.0;
  for(float i=0.0; i<16.0; i++){
    if(i >= vCount) break;
    float gt = i / max(1.0, vCount - 1.0);
    float gx = mix(0.18, 0.95, gt);
    float ph = hash(i + 7.0);
    float warp = sin(t*0.04 + ph*TAU + u_fieldWarp*2.4) * 0.005 * u_fieldWarp;
    float xp = gx + warp*(1.0 - 2.0*uv.y);
    float lw = px.x * (mod(i,3.0)<0.5 ? 2.0 : 1.2);
    float vL = smoothstep(lw, 0.0, abs(uv.x - xp));
    vec3 lc = mod(i,3.0)<0.5
      ? u_warning * (0.22 + u_warningBias*0.12)
      : u_ambient * (0.14 + u_latticeBias*0.10);
    c += lc * vL * step(0.06, uv.y) * step(uv.y, 0.94);
  }

  // ── 4. HORIZONTAL GRID ROWS (with pinch warp) ──────────────
  float hCount = 10.0 + u_density*4.0;
  for(float i=0.0; i<18.0; i++){
    if(i >= hCount) break;
    float rt = i / max(1.0, hCount - 1.0);
    float ry = mix(0.08, 0.94, rt);
    float ph = hash(i + 43.0);
    float u_l = clamp((uv.x - 0.08)/0.87, 0.0, 1.0);
    float warp = sin(u_l*TAU*(0.8 + u_fieldWarp*1.6) + t*0.03 + ph*TAU)
                 * 0.01 * u_fieldWarp;
    float pinch = exp(-abs(u_l - 0.55)*(7.0 - u_contourBias*2.0));
    float rowY = ry + warp*pinch;
    float rAlpha = 0.08 + (1.0 - rt)*0.07 + u_scanBias*0.04;
    vec3 rc = mod(i,4.0)<0.5 ? u_warning : u_ambient;
    c += rc * rAlpha * smoothstep(px.y*1.5, 0.0, abs(uv.y - rowY))
         * step(0.08, uv.x) * step(uv.x, 0.95);
  }

  // ── 5. OUTER FRAME ─────────────────────────────────────────
  c += u_ambient * boxBorder(uv, vec2(0.04,0.045), vec2(0.96,0.935), px.x*1.6) * 0.45;

  // ── 6. FIELD CONTOURS (ref-3 style) ─────────────────────────
  {
    float fcx = 0.52 + (u_beamTilt - 0.5)*0.18 + u_driftB*0.02;
    float fcy = 0.50 + (u_horizon  - 0.5)*0.12 + u_driftC*0.015;
    float spX = 0.22 + u_aperture*0.28;
    float spY = 0.16 + u_specimenBias*0.14 + u_radialBias*0.10;

    float nContours = 10.0 + u_contourBias*10.0 + u_radialBias*3.0;
    for(float i=0.0; i<24.0; i++){
      if(i >= nContours) break;
      float ct = i / max(1.0, nContours - 1.0);
      float spread = 0.52 + ct*(1.8 + u_contourBias*0.8);

      float dx = (uv.x - fcx) / max(0.001, spX);
      float ul = clamp(dx*0.5 + 0.5, 0.0, 1.0);
      float pinch = 1.0 - exp(-abs(dx)*(5.0 + u_specimenBias*5.0));
      float wave = sin(ul*TAU*(1.2 + u_fieldWarp*1.4) + t*0.04 + i*0.18) * 0.025;
      float drift = sin(t*0.02 + ul*TAU*0.6 + i*0.4) * 0.010;
      float lineY = fcy + (ct - 0.5)*spY*spread
                   + wave*pinch*0.45 + drift*(1.0 - pinch);

      float d = abs(uv.y - lineY);
      float la = smoothstep(px.y*3.0, 0.0, d);
      vec3 lc = ct<0.4 ? u_ambient : ct<0.72 ? u_warning : u_edge;
      c += lc * la * (0.22 + (1.0 - ct)*0.28);
    }
  }

  // ── 7. SPECIMEN COLUMN (anchored to grid center) ─────────────
  {
    // pin to the nearest grid column so it feels integrated
    float colX  = 0.50;
    float colT  = 0.11;
    float colB  = 0.88;
    float colW  = 0.06 + u_specimenBias*0.02;
    float colH  = colB - colT;
    float lineA = 0.22 + u_specimenBias*0.14;

    // column border — thin, tied to grid
    c += u_warning * boxBorder(uv,
         vec2(colX - colW*0.5, colT),
         vec2(colX + colW*0.5, colB), px.x*1.4) * lineA * 0.7;

    // center axis — continuous with the vertical grid line at 0.5
    float inCol = step(colT - 0.01, uv.y)*step(uv.y, colB + 0.01);
    c += u_ambient * lineSDF(uv.x, colX, px.x*1.2) * inCol
         * (0.22 + u_latticeBias*0.12);

    // slow oscillating traces — tight, gentle movement
    float trCnt = 2.0 + u_specimenBias*2.0;
    float nodeT = (uv.y - colT) / colH;
    float inNode = step(0.0, nodeT)*step(nodeT, 1.0);

    for(float tr=0.0; tr<4.0; tr++){
      if(tr >= trCnt) break;
      float off = (tr - (trCnt-1.0)*0.5) / max(1.0, trCnt - 1.0);
      float env = pow(max(0.0, sin(nodeT*PI)), 0.7);
      float nv  = hash(floor(nodeT*40.0)*0.73 + 15.0 + tr*3.7);
      // slow speeds, tight amplitude
      float wobble = sin(nodeT*TAU*4.0 + t*0.12 + nv*3.0 + tr*1.2)*0.14;
      float inner  = sin(nodeT*TAU*8.0 - t*0.06 + tr*0.6)*0.05*env;
      float trX = colX + (wobble + inner + off*0.08)*colW;
      float trLine = smoothstep(px.x*2.5, 0.0, abs(uv.x - trX));
      vec3 trCol = tr >= trCnt - 1.0 ? u_warning : u_edge;
      c += trCol * trLine * (lineA - tr*0.02) * inNode;
    }

    // blob particles — slow, stable
    float blobCnt = 22.0 + u_specimenBias*18.0;
    float cellH = colH / blobCnt;
    float cellIdx = floor((uv.y - colT) / cellH);
    float cellFrac = fract((uv.y - colT) / cellH);
    if(cellIdx >= 0.0 && cellIdx < blobCnt){
      float bt = cellIdx / max(1.0, blobCnt - 1.0);
      float bEnv = pow(max(0.0, sin(bt * PI)), 0.6);
      // slow movement, centered on column axis
      float bx = colX + sin(bt*TAU*3.0 + t*0.08 + cellIdx*0.7)*colW*0.12;
      float bw = (0.25 + hash(cellIdx*1.9 + floor(t*1.5))*0.45)*colW*0.55;
      float bh = max(3.0*px.y, 0.007);
      float inBlob = step(abs(uv.x - bx), bw*0.5)
                   * step(abs(cellFrac*cellH - cellH*0.5), bh*0.5);
      c += u_warning * inBlob * (0.18 + u_warningBias*0.08) * (0.4 + bEnv*0.6);
    }

    // right-side emanating wave — slow drift
    float wStart = colX + colW*0.52;
    float wEnd   = 0.88;
    if(uv.x > wStart && uv.x < wEnd){
      float wt = (uv.x - wStart)/(wEnd - wStart);
      float wEnv = pow(sin(wt*PI), 0.82);
      float waveY = 0.32 + wt*0.36
        + sin(wt*TAU*(1.5 + u_fieldWarp*0.5) + t*0.08)*0.04*wEnv
        + sin(wt*TAU*5.0 - t*0.04)*0.008*wEnv;
      c += u_warning * smoothstep(px.y*2.0, 0.0, abs(uv.y - waveY))
           * (0.28 + u_warningBias*0.10);
    }

    // left-side exponential curve — slow
    float curveStart = colX - colW*0.52;
    if(uv.x > 0.10 && uv.x < curveStart){
      float ct2 = (uv.x - 0.10)/(curveStart - 0.10);
      float curveY = colB - (1.0 - exp(-ct2*3.5))*(colH*0.88);
      c += u_warning * smoothstep(px.y*1.5, 0.0, abs(uv.y - curveY))
           * (0.22 + u_warningBias*0.08) * u_specimenBias;
    }
  }

  // ── 8. COMMAND SYSTEM (ref-2/5 arcs + spokes) ──────────────
  {
    vec2 cmdC = vec2(0.68 + u_radialBias*0.08 + u_driftA*0.015,
                     0.46 + (u_reticleBias - 0.4)*0.16 + u_driftB*0.012);
    float bR = min(1.0/aspect, 1.0)*(0.12 + u_commandBias*0.08 + u_radialBias*0.04);

    vec2 dp = (uv - cmdC)*vec2(aspect, 1.0);
    float dist = length(dp);
    float ang  = atan(dp.y, dp.x);

    // glow
    float glow = exp(-dist*dist/(bR*bR*3.5));
    c += u_warning * glow * (0.12 + u_commandBias*0.10);
    c += u_edge    * glow * 0.6 * (0.10 + u_contourBias*0.10);

    // rings
    float ringCnt = 4.0 + u_radialBias*5.0;
    float arcSpan = PI*(0.72 + u_radialBias*0.18);
    float arcStart = -PI*0.82 + sin(t*0.03 + u_driftC)*0.08;
    for(float r=0.0; r<10.0; r++){
      if(r >= ringCnt) break;
      float rt = r / max(1.0, ringCnt - 1.0);
      float radius = bR*(0.62 + rt*1.9);
      float rLine = smoothstep(px.x*2.2, 0.0, abs(dist - radius));

      // segment gaps
      float segN = 10.0 + r*2.0 + u_commandBias*4.0;
      float segAng = mod(ang - arcStart + TAU, TAU);
      rLine *= step(segAng, arcSpan);
      float segPh = segAng/arcSpan*segN;
      rLine *= smoothstep(0.0, 0.15, fract(segPh))
             * smoothstep(1.0, 0.85, fract(segPh));

      vec3 rc = mod(r,3.0)<0.5 ? u_warning
              : mod(r,2.0)<0.5 ? u_ambient : u_edge;
      c += rc * rLine * (0.24 + (1.0 - rt)*0.28);
    }

    // spokes
    float spCnt = 8.0 + u_commandBias*6.0;
    for(float s=0.0; s<16.0; s++){
      if(s >= spCnt) break;
      float sAng = -PI*0.5 + s/spCnt*TAU + sin(t*0.04+s)*0.006;
      float aDist = abs(mod(ang - sAng + PI, TAU) - PI);
      float spLine = smoothstep(px.x*2.5/max(0.01,dist), 0.0, aDist);
      spLine *= step(bR*0.44, dist)*step(dist, bR*(2.05+u_radialBias*0.66));
      c += u_ambient * spLine * (0.28 + u_commandBias*0.16);
    }

    // crosshair
    float crH = smoothstep(px.y*2.0,0.0,abs(dp.y))*step(abs(dp.x),bR*0.28);
    float crV = smoothstep(px.x*2.0,0.0,abs(dp.x))*step(abs(dp.y),bR*0.28);
    c += u_warning*(crH+crV)*(0.50 + u_warningBias*0.14);

    // rotating wedge
    float wAng = -PI*0.5 + sin(t*0.05 + u_deckProgress*TAU)*0.06;
    float wDist = abs(mod(ang - wAng + PI, TAU) - PI);
    c += u_warning * step(wDist,0.12)*step(dist, bR*(1.8+u_radialBias*0.5))
         * (0.15 + u_warningBias*0.10);

    // info boxes near command center
    float boxH = 0.042;
    float boxW = bR*0.7/aspect;

    vec2 lb0 = cmdC + vec2(-bR*1.92/aspect, -bR*2.22);
    vec2 lb1 = lb0 + vec2(boxW, boxH);
    float lbF = boxFill(uv, lb0, lb1);
    c = mix(c, vec3(0.04,0.024,0.008), lbF*0.72);
    c += u_warning * boxBorder(uv, lb0, lb1, px.x*1.5) * 0.60;

    vec2 rb0 = cmdC + vec2(bR*0.68/aspect, -bR*2.22);
    vec2 rb1 = rb0 + vec2(boxW, boxH);
    float rbF = boxFill(uv, rb0, rb1);
    c = mix(c, vec3(0.04,0.024,0.008), rbF*0.72);
    c += u_warning * boxBorder(uv, rb0, rb1, px.x*1.5) * 0.60;
  }

  // ── 9. CROSS MARKERS (ref-5 style) ─────────────────────────
  {
    float cSpX = 0.165;  // (0.83-0.17)/4
    float cSpY = 0.28;   // (0.78-0.22)/2
    float arm  = 0.022;

    // nearest marker via rounding
    float nX = clamp(round((uv.x - 0.17)/cSpX)*cSpX + 0.17, 0.17, 0.83);
    float nY = clamp(round((uv.y - 0.22)/cSpY)*cSpY + 0.22, 0.22, 0.78);
    // skip center (0.5, 0.5)
    float isCenter = step(abs(nX-0.5),0.01)*step(abs(nY-0.5),0.01);

    vec2 md = abs(uv - vec2(nX, nY));
    float crH = step(md.y, px.y*2.0)*step(md.x, arm);
    float crV = step(md.x, px.x*2.0)*step(md.y, arm);
    c += u_warning*(crH+crV)*0.45*(1.0 - isCenter);
  }

  // ── 10. INTERFERENCE OVALS (ref-5 center pattern) ──────────
  {
    vec2 oc = vec2(0.50, 0.46);
    float od = length((uv - oc)*vec2(aspect*0.55, 1.0));
    // multiple concentric rings with line-like edges
    float ringDist = od * 32.0 + t*0.02;
    float ringLine = smoothstep(0.4, 0.0, abs(fract(ringDist) - 0.5) - 0.3);
    float fade = smoothstep(0.34, 0.0, od);
    c += u_ambient * ringLine * fade * (0.12 + u_radialBias*0.10);
    // additional warm oval set offset
    vec2 oc2 = vec2(0.48, 0.50);
    float od2 = length((uv - oc2)*vec2(aspect*0.7, 1.0));
    float ring2 = smoothstep(0.4, 0.0, abs(fract(od2*24.0 - t*0.015) - 0.5) - 0.3);
    c += u_warning * ring2 * smoothstep(0.28, 0.0, od2) * 0.08 * u_radialBias;
  }

  // ── 11. SMALL ORBS (ref-1 planetary bodies) ────────────────
  {
    vec2 orb1 = vec2(0.24, 0.38 + sin(t*0.015)*0.005);
    vec2 orb2 = vec2(0.22, 0.72 + sin(t*0.012+1.0)*0.005);
    float o1 = smoothstep(0.020,0.012, length((uv-orb1)*vec2(aspect,1.0)));
    float o2 = smoothstep(0.016,0.009, length((uv-orb2)*vec2(aspect,1.0)));
    c += u_warning * o1 * 0.30 * u_specimenBias;
    c += mix(u_warning, u_ambient, 0.5) * o2 * 0.22 * u_specimenBias;
  }

  // ── 12. TELEMETRY HUD ──────────────────────────────────────
  // top/bottom rule lines
  float topY = 0.08;
  float botY = 0.92;
  c += u_ambient * smoothstep(px.y*1.5,0.0,abs(uv.y-topY))
       * step(0.05,uv.x)*step(uv.x,0.95) * 0.50;
  c += u_ambient * smoothstep(px.y*1.5,0.0,abs(uv.y-botY))
       * step(0.05,uv.x)*step(uv.x,0.95) * 0.50;

  // tick marks along top/bottom
  {
    float tickCnt = 18.0;
    float tickT = (uv.x - 0.05)/0.9;
    float nearTick = round(tickT*tickCnt)/tickCnt;
    float tickDist = abs(tickT - nearTick);
    float isMajor = step(mod(round(tickT*tickCnt),3.0), 0.5);
    float tickH = mix(0.008, 0.015, isMajor);

    float topTick = step(tickDist*0.9, px.x*1.5)
                  * step(topY, uv.y)*step(uv.y, topY + tickH);
    float botTick = step(tickDist*0.9, px.x*1.5)
                  * step(botY - tickH, uv.y)*step(uv.y, botY);
    c += u_ambient * (topTick + botTick) * 0.50;
  }

  // left ruler ticks
  {
    float rulerX = 0.035;
    float rulerStep = (botY - topY)/12.0;
    float rulerT = (uv.y - topY)/rulerStep;
    float nearR = round(rulerT);
    float rDist = abs(rulerT - nearR);
    float rMajor = step(mod(nearR,3.0), 0.5);
    float tickW = mix(0.012, 0.022, rMajor);

    float rTick = step(rDist*rulerStep, px.y*1.5)
                * step(rulerX, uv.x)*step(uv.x, rulerX + tickW)
                * step(topY, uv.y)*step(uv.y, botY);
    c += u_ambient * rTick * 0.55;

    // small number-like marks next to major ticks
    float numMark = step(rDist*rulerStep, px.y*1.2) * rMajor
                  * step(rulerX + tickW + 0.004, uv.x)
                  * step(uv.x, rulerX + tickW + 0.024)
                  * step(topY, uv.y)*step(uv.y, botY);
    c += u_warning * numMark * 0.40;
  }

  // top info boxes (dark-filled + orange border, ref-1 style)
  {
    // left box
    vec2 tlb0 = vec2(0.07, 0.03);
    vec2 tlb1 = vec2(0.32, 0.094);
    float tlbF = boxFill(uv, tlb0, tlb1);
    c = mix(c, vec3(0.04,0.024,0.008), tlbF*0.72);
    c += u_warning * boxBorder(uv, tlb0, tlb1, px.x*1.2) * 0.65;

    // simulated text lines inside
    float tl1 = step(tlb0.x+0.012, uv.x)*step(uv.x, tlb1.x-0.04)
              * step(abs(uv.y - 0.055), px.y*1.0);
    float tl2 = step(tlb0.x+0.012, uv.x)*step(uv.x, tlb1.x-0.08)
              * step(abs(uv.y - 0.077), px.y*1.0);
    c += u_warning * (tl1*0.55 + tl2*0.40);

    // right box
    vec2 trb0 = vec2(0.74, 0.03);
    vec2 trb1 = vec2(0.93, 0.094);
    float trbF = boxFill(uv, trb0, trb1);
    c = mix(c, vec3(0.04,0.024,0.008), trbF*0.72);
    c += u_warning * boxBorder(uv, trb0, trb1, px.x*1.2) * 0.65;

    float tr1 = step(trb0.x+0.012, uv.x)*step(uv.x, trb1.x-0.02)
              * step(abs(uv.y - 0.055), px.y*1.0);
    float tr2 = step(trb0.x+0.012, uv.x)*step(uv.x, trb1.x-0.06)
              * step(abs(uv.y - 0.077), px.y*1.0);
    c += u_warning * (tr1*0.55 + tr2*0.40);
  }

  // status bands near top (ref-5 AT FIELD bands)
  {
    float bandY = 0.11;
    float bandH = 0.045;
    float bandW = 0.125;
    for(float i=0.0; i<5.0; i++){
      float bx = 0.07 + i*(bandW + 0.012);
      vec2 b0 = vec2(bx, bandY);
      vec2 b1 = vec2(bx + bandW, bandY + bandH);
      float bF = boxFill(uv, b0, b1);
      c = mix(c, vec3(0.04,0.024,0.008), bF*0.72);
      c += u_warning * boxBorder(uv, b0, b1, px.x*1.0)
           * (0.55 - i*0.04);
      // text line inside
      float tl = step(b0.x+0.006, uv.x)*step(uv.x, b1.x-0.01)
               * step(abs(uv.y - (bandY + bandH*0.5)), px.y*1.0);
      c += (i<0.5 ? u_warning : u_ambient) * tl * 0.45;
    }
  }

  // bottom-right warning box (ref-1 style)
  {
    float wBoxAlpha = max(0.0, u_pulse)*0.4 + u_warningBias*0.3;
    vec2 w0 = vec2(0.68, 0.85);
    vec2 w1 = vec2(0.93, 0.92);
    float wF = boxFill(uv, w0, w1);
    c = mix(c, u_warning*0.12, wF*wBoxAlpha);
    c += u_warning * boxBorder(uv, w0, w1, px.x*1.2) * (0.50 + wBoxAlpha);
    // text lines
    float wt1 = step(w0.x+0.01, uv.x)*step(uv.x, w1.x-0.03)
              * step(abs(uv.y - 0.875), px.y*1.0);
    float wt2 = step(w0.x+0.01, uv.x)*step(uv.x, w1.x-0.06)
              * step(abs(uv.y - 0.895), px.y*1.0);
    c += u_warning * (wt1+wt2) * (0.40 + wBoxAlpha);
  }

  // ── 13. READABILITY MASK ───────────────────────────────────
  // gentle darken on left side for text readability
  float leftMask = smoothstep(0.42, 0.0, uv.x) * 0.45;
  c *= 1.0 - leftMask;

  // subtle center darkening
  float cMask = exp(-length(uv - vec2(0.34,0.42))*4.0);
  c *= 1.0 - cMask*0.18;

  // vignette
  float vig = length(uv - 0.5)*1.28;
  c *= 1.0 - smoothstep(0.6, 1.2, vig)*0.55;

  // ── output ─────────────────────────────────────────────────
  o_color = vec4(c, 1.0);
}
`;

/* ── WebGL helpers ────────────────────────────────────────────── */

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile error: ${log}`);
  }
  return s;
}

function createProgram(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`Program link error: ${log}`);
  }
  return p;
}

/* ── Scene derivation (same logic as before) ──────────────────── */

function deriveContinuousScene(scene, controls, time) {
  const slideCount = Math.max(1, controls.slideCount ?? 1);
  const slideSpan = Math.max(1, slideCount - 1);
  const slidePosition = clamp(controls.slidePosition ?? 0, 0, slideSpan);
  const slideIndex = clamp(slidePosition / slideSpan, 0, 1);
  const deckProgress = clamp(controls.deckProgress ?? slideIndex, 0, 1);
  const localProgress = clamp(controls.localProgress ?? 1, 0, 1);
  const transition = smootherstep(0, 1, localProgress);
  const mode = clamp(scene.system.displayMode ?? 0, 0, 1);

  const driftA = Math.sin(time * 0.03 + deckProgress * tau * 0.6 + slidePosition * 0.15);
  const driftB = Math.cos(time * 0.02 - slideIndex * tau * 0.42 + 1.1);
  const driftC = Math.sin(time * 0.015 + mode * tau * 0.8 + 2.7);
  const driftD = Math.cos(time * 0.01 + deckProgress * tau * 1.35 - 0.8);
  const pulse = Math.sin(time * (0.08 + calmPulse(scene.system.pulse) * 0.06) + (scene.system.phase ?? 0.5) * tau);

  const specimenBias = clamp(0.88 - deckProgress * 0.34 - mode * 0.28 - (scene.system.sensorField ?? 0) * 0.22 + driftA * 0.04, 0.18, 1);
  const commandBias = clamp(0.22 + (scene.system.defense ?? 0) * 0.34 + mode * 0.18 + deckProgress * 0.22 + transition * 0.08 + driftB * 0.04, 0, 1);
  const contourBias = clamp((scene.system.contour ?? 0) * 0.72 + (scene.system.sensorField ?? 0) * 0.18 + deckProgress * 0.1 + driftC * 0.05, 0, 1);
  const latticeBias = clamp((scene.system.lattice ?? 0) * 0.7 + (1 - deckProgress) * 0.12 + (1 - mode) * 0.06 + driftD * 0.04, 0, 1);
  const warningBias = clamp((scene.system.warningBias ?? 0) * 0.7 + deckProgress * 0.14 + commandBias * 0.12 + Math.max(0, pulse) * 0.08, 0, 1);
  const scanBias = clamp((scene.system.scan ?? 0) * 0.72 + (scene.system.interference ?? 0) * 0.1 + transition * 0.05 + driftA * 0.04, 0, 1);
  const radialBias = clamp((scene.system.defense ?? 0) * 0.58 + mode * 0.22 + deckProgress * 0.16 + transition * 0.08 + driftC * 0.04, 0, 1);
  const fieldWarp = clamp((scene.system.skew ?? 0) * 0.68 + (scene.system.bandCurve ?? 0) * 0.12 + driftB * 0.08 + driftD * 0.05, 0, 1);
  const density = clamp(0.28 + (scene.system.density ?? 0) * 0.42 + contourBias * 0.12 + commandBias * 0.08 - radialBias * 0.05, 0, 1);
  const readabilityMask = clamp(0.54 + specimenBias * 0.1 + commandBias * 0.06, 0.48, 0.82);

  return {
    ...scene,
    sliders: {
      deckProgress, slideIndex, slidePosition,
      localProgress: transition,
      specimenBias, commandBias, contourBias, latticeBias,
      warningBias, scanBias, radialBias, fieldWarp,
      density, readabilityMask, pulse,
      driftA, driftB, driftC, driftD,
    },
  };
}

function updateStats(state, frameMs) {
  state.frameSamples.push(frameMs);
  if (state.frameSamples.length > 120) state.frameSamples.shift();
  const samples = [...state.frameSamples].sort((a, b) => a - b);
  const avg = state.frameSamples.reduce((s, v) => s + v, 0) / state.frameSamples.length;
  const p95 = samples[Math.max(0, Math.floor(samples.length * 0.95) - 1)] ?? frameMs;
  state.stats = { frameMs, avgFrameMs: avg, p95FrameMs: p95, fps: avg > 0 ? 1000 / avg : 0 };
  window.__openclawDeckBackgroundStats = { ...state.stats, renderer: 'webgl2' };
}

/* ── Public API ───────────────────────────────────────────────── */

export function createDeckBackgroundRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('WebGL 2 not available');

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = createProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  // fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, 'a_pos');
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // uniform locations
  const loc = {};
  const uNames = [
    'u_res','u_time',
    'u_base','u_ambient','u_edge','u_warning',
    'u_lightPos','u_lightRadius',
    'u_deckProgress','u_specimenBias','u_commandBias','u_contourBias',
    'u_latticeBias','u_warningBias','u_scanBias','u_radialBias',
    'u_fieldWarp','u_density','u_readMask','u_pulse',
    'u_driftA','u_driftB','u_driftC','u_driftD',
    'u_beamTilt','u_horizon','u_aperture','u_reticleBias','u_phase',
  ];
  for (const name of uNames) loc[name] = gl.getUniformLocation(prog, name);

  const state = {
    width: 0, height: 0, dpr: 1,
    frameSamples: [], stats: null,
  };

  return {
    resize(width, height, dpr) {
      state.width = width;
      state.height = height;
      state.dpr = dpr;
    },

    render(scene, timeMs, controls = {}) {
      const start = performance.now();
      const time = timeMs * 0.001;
      const cs = deriveContinuousScene(scene, controls, time);
      const sl = cs.sliders;

      // compute palette — colors come from the slide scene definitions
      const ambient = cs.ambient ?? cs.toxic ?? cs.haze;
      const edge = cs.edge ?? cs.magenta ?? cs.warning ?? ambient;
      const warning = cs.warning ?? edge;

      // gentle time-based brightness breathing (not hue shifting)
      const breath = 1.0 + Math.sin(time * 0.08) * 0.04;

      const pal = {
        ambient: scaleColor(ambient, 1.1 * breath),
        edge: scaleColor(edge, 1.05 * breath),
        warning: scaleColor(warning, 1.15 * breath),
      };

      const w = Math.round(state.width * state.dpr);
      const h = Math.round(state.height * state.dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;

      gl.viewport(0, 0, w, h);
      gl.useProgram(prog);

      // set uniforms
      gl.uniform2f(loc.u_res, state.width, state.height);
      gl.uniform1f(loc.u_time, time);

      const toGL = (rgb) => [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
      gl.uniform3fv(loc.u_base, toGL(cs.base));
      gl.uniform3fv(loc.u_ambient, toGL(pal.ambient));
      gl.uniform3fv(loc.u_edge, toGL(pal.edge));
      gl.uniform3fv(loc.u_warning, toGL(pal.warning));

      gl.uniform2f(loc.u_lightPos, cs.light.x, cs.light.y);
      gl.uniform1f(loc.u_lightRadius, cs.light.radius);

      gl.uniform1f(loc.u_deckProgress, sl.deckProgress);
      gl.uniform1f(loc.u_specimenBias, sl.specimenBias);
      gl.uniform1f(loc.u_commandBias, sl.commandBias);
      gl.uniform1f(loc.u_contourBias, sl.contourBias);
      gl.uniform1f(loc.u_latticeBias, sl.latticeBias);
      gl.uniform1f(loc.u_warningBias, sl.warningBias);
      gl.uniform1f(loc.u_scanBias, sl.scanBias);
      gl.uniform1f(loc.u_radialBias, sl.radialBias);
      gl.uniform1f(loc.u_fieldWarp, sl.fieldWarp);
      gl.uniform1f(loc.u_density, sl.density);
      gl.uniform1f(loc.u_readMask, sl.readabilityMask);
      gl.uniform1f(loc.u_pulse, sl.pulse);
      gl.uniform1f(loc.u_driftA, sl.driftA);
      gl.uniform1f(loc.u_driftB, sl.driftB);
      gl.uniform1f(loc.u_driftC, sl.driftC);
      gl.uniform1f(loc.u_driftD, sl.driftD);

      gl.uniform1f(loc.u_beamTilt, cs.system.beamTilt ?? 0.58);
      gl.uniform1f(loc.u_horizon, cs.system.horizon ?? 0.44);
      gl.uniform1f(loc.u_aperture, cs.system.aperture ?? 0.52);
      gl.uniform1f(loc.u_reticleBias, cs.system.reticleBias ?? 0.34);
      gl.uniform1f(loc.u_phase, cs.system.phase ?? 0.5);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);

      updateStats(state, performance.now() - start);
    },

    getStats() {
      return state.stats;
    },
  };
}
