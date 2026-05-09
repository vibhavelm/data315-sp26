<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import * as d3 from "d3";

  export let planetSize = 0.08;
  export let orbitalPeriod = 30;
  export let noiseLevel = 0.3;
  export let seed = 7;

  const panelWidth = 1400;
  const panelHeight = 220;
  const fixedYDomain = [0.8, 1.2];
  const fixedYTicks = [0.8, 0.9, 1.0, 1.1, 1.2];
  const margin = { top: 30, right: 20, bottom: 45, left: 90 };
  const plotBottom = panelHeight - margin.bottom;

  const leftSampleCount = 180;
  const rightSampleCount = 180;
  const traceCount = 34;
  const animationDuration = 5500;
  const transitCenter = 0.5;

  /** @type {number | undefined} */
  let animationFrame;
  let progress = 0;
  let leftPath = "";
  /** @type {any} */
  let leftXScale;
  /** @type {any} */
  let leftYScale;
  /** @type {number[]} */
  let leftYTicks = [];
  /** @type {any} */
  let rightXScale;
  /** @type {any} */
  let rightYScale;
  /** @type {number[]} */
  let rightYTicks = [];
  /** @type {Array<{ id: number, line: string, opacity: number, series: Array<{ phase: number, brightness: number }> }>} */
  let rightTraces = [];
  let averagePath = "";
  let averageOpacity = 0;
  let animationFinished = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let animationStartTimeout;

  /** @param {number} seedValue */
  function createSeededRandom(seedValue) {
    /** @param {number} index */
    return function(index) {
      const x = Math.sin(seedValue + index * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
  }

  /** @param {number} phase */
  function transitProfile(phase) {
    const transitSigma = 0.032 + Math.min(0.022, 24 / Math.max(orbitalPeriod, 1) * 0.004);
    const wrapped = ((phase - transitCenter + 0.5) % 1) - 0.5;
    return Math.exp(-(wrapped * wrapped) / (2 * transitSigma * transitSigma));
  }

  function buildSingleObservation() {
    const random = createSeededRandom(seed);

    /** @type {Array<{ time: number, brightness: number }>} */
    return Array.from({ length: leftSampleCount }, (_, index) => {
      const time = index;
      const phase = index / (leftSampleCount - 1);
      const dip = transitProfile(phase);
      const brightness = 1 - planetSize * 0.58 * dip + (random(index) - 0.5) * noiseLevel;

      return { time, brightness };
    });
  }

  function buildRightTemplates() {
    const random = createSeededRandom(seed + 91);

    /** @type {Array<{ id: number, initialShift: number, noiseSeed: number }>} */
    return Array.from({ length: traceCount }, (_, index) => ({
      id: index,
      initialShift: (random(index) - 0.5) * 0.18,
      noiseSeed: seed + index * 13
    }));
  }

  const rightTemplates = buildRightTemplates();

  /** @param {{ id: number, initialShift: number, noiseSeed: number }} template @param {number} easedProgress @param {number} sampleCount */
  function buildTraceSeries(template, easedProgress, sampleCount = rightSampleCount) {
    const random = createSeededRandom(template.noiseSeed);
    const phaseShift = template.initialShift * (1 - easedProgress);

    /** @type {Array<{ phase: number, brightness: number }>} */
    return Array.from({ length: sampleCount }, (_, index) => {
      const phase = index / (sampleCount - 1);
      const alignedPhase = (phase + phaseShift + 1) % 1;
      const dip = transitProfile(alignedPhase);
      const brightness = 1 - planetSize * 0.7 * dip + (random(index) - 0.5) * (noiseLevel * 0.8);

      return { phase, brightness };
    });
  }

  /** @param {Array<Array<{ phase: number, brightness: number }>>} traces */
  function buildAveragePath(traces) {
    if (!traces.length) return "";

    const means = traces[0].map((point, index) => {
      const total = traces.reduce((sum, trace) => sum + trace[index].brightness, 0);
      return {
        phase: point.phase,
        brightness: total / traces.length
      };
    });

    return d3.line()
      .x(rightPointX)
      .y(rightPointY)
      .curve(d3.curveMonotoneX)(means);
  }

  /** @param {{ phase: number, brightness: number }} point */
  function rightPointX(point) {
    return rightXScale(point.phase);
  }

  /** @param {{ phase: number, brightness: number }} point */
  function rightPointY(point) {
    return rightYScale(point.brightness);
  }

  /** @param {{ time: number, brightness: number }} point */
  function leftPointX(point) {
    return leftXScale(point.time);
  }

  /** @param {{ time: number, brightness: number }} point */
  function leftPointY(point) {
    return leftYScale(point.brightness);
  }

  function draw() {
    const leftData = buildSingleObservation();

    leftXScale = d3.scaleLinear()
      .domain([0, leftSampleCount - 1])
      .range([margin.left, panelWidth - margin.right]);

    leftYScale = d3.scaleLinear()
      .domain(fixedYDomain)
      .range([plotBottom, margin.top]);
    leftYTicks = fixedYTicks;

    leftPath = d3.line()
      .x(leftPointX)
      .y(leftPointY)
      .curve(d3.curveMonotoneX)(leftData);

    rightXScale = d3.scaleLinear()
      .domain([0, 1])
      .range([margin.left, panelWidth - margin.right]);

    const easedProgress = d3.easeCubicInOut(progress);
    const visibleCount = Math.max(1, Math.round(1 + easedProgress * (traceCount - 1)));

    rightTraces = rightTemplates.slice(0, visibleCount).map((template, index) => {
      const series = buildTraceSeries(template, easedProgress);
      const values = series.map((d) => d.brightness);
      const yMin = Math.min(...values) - 0.02;
      const yMax = Math.max(...values) + 0.02;

      if (!rightYScale) {
        rightYScale = d3.scaleLinear()
          .domain([yMin, yMax])
          .range([plotBottom, margin.top]);
      } else {
        rightYScale = rightYScale.domain([Math.min(rightYScale.domain()[0], yMin), Math.max(rightYScale.domain()[1], yMax)]);
      }

      const line = d3.line()
        .x(rightPointX)
        .y(rightPointY)
        .curve(d3.curveMonotoneX)(series);

      return {
        id: template.id,
        line,
        opacity: 0.08 + easedProgress * 0.16,
        series
      };
    });

    rightYScale = d3.scaleLinear()
      .domain(fixedYDomain)
      .range([plotBottom, margin.top]);
    rightYTicks = fixedYTicks;

    rightTraces = rightTraces.map((trace) => ({
      ...trace,
      line: d3.line()
        .x(rightPointX)
        .y(rightPointY)
        .curve(d3.curveMonotoneX)(trace.series)
    }));

    averagePath = buildAveragePath(rightTraces.map((trace) => trace.series));
    averageOpacity = easedProgress < 0.9 ? 0 : Math.min(1, (easedProgress - 0.7) / 0.3);
  }

  function startAnimation() {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    progress = 0;
    animationFinished = false;
    draw();

    const start = performance.now();

    /** @param {number} now */
    function frame(now) {
      progress = Math.min(1, (now - start) / animationDuration);
      draw();

      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else {
        progress = 1;
        animationFinished = true;
        draw();
      }
    }

    animationFrame = requestAnimationFrame(frame);
  }

  function handleReplay() {
    startAnimation();
  }

  onMount(() => {
    draw();
    animationStartTimeout = setTimeout(() => {
      startAnimation();
    }, 4000);

    return () => {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      clearTimeout(animationStartTimeout);
    };
  });

  $: if (progress >= 0) {
    draw();
  }
</script>

<div class="stacked-observations">
  <section class="panel-block">
    <div class="chart-wrap">
      <div class="card-head">
        <div>
          <h4>One Orbital Cycle</h4>
          <p>one noisy planet signal</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${panelWidth} ${panelHeight}`} role="img" aria-label="One night of observation">
        <rect x="0" y="0" width={panelWidth} height={panelHeight} fill="transparent" />

        <line class="axis-baseline x-baseline" x1={margin.left} x2={panelWidth - margin.right} y1={panelHeight - margin.bottom} y2={panelHeight - margin.bottom}></line>
        <line class="axis-baseline y-baseline" x1={margin.left} x2={margin.left} y1={margin.top} y2={panelHeight - margin.bottom}></line>

        <g class="axis x-axis" transform={`translate(0, ${panelHeight - margin.bottom})`}>
          {#each [0, 60, 120, 180] as tick}
            <line x1={leftXScale ? leftXScale(tick) : 0} x2={leftXScale ? leftXScale(tick) : 0} y1="0" y2="6"></line>
            <text x={leftXScale ? leftXScale(tick) : 0} y="18" text-anchor="middle">{tick}</text>
          {/each}
        </g>

        <g class="axis y-axis" transform={`translate(${margin.left}, 0)`}>
          {#each leftYTicks as tick}
            <line x1="-6" x2="0" y1={leftYScale ? leftYScale(tick) : 0} y2={leftYScale ? leftYScale(tick) : 0}></line>
            <text x="-18" y={leftYScale ? leftYScale(tick) + 3 : 0} text-anchor="end">{tick.toFixed(1)}</text>
          {/each}
        </g>

        <path d={leftPath} fill="none" stroke="#5FB3D5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>

  <text class="axis-label x" x={panelWidth / 2} y={panelHeight - 20} text-anchor="middle">Time (Days)</text>
        <text class="axis-label y" transform={`translate(40, ${panelHeight / 2}) rotate(-90)`} text-anchor="middle">Relative Brightness</text>
      </svg>

      <p class="panel-caption">The planet dip is faint and easy to miss.</p>
    </div>
  </section>

  <section class="panel-block">
    <div class="chart-wrap">
      <div class="card-head">
        <div>
          <h4>Stacked Orbital Cycles</h4>
          <p>same planet, many cycles stacked together</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${panelWidth} ${panelHeight}`} role="img" aria-label="Same star, many nights stacked together">
        <rect x="0" y="0" width={panelWidth} height={panelHeight} fill="transparent" />
        <defs>
          <marker id="average-signal-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#ffa500"></path>
          </marker>
        </defs>

        <line class="axis-baseline x-baseline" x1={margin.left} x2={panelWidth - margin.right} y1={panelHeight - margin.bottom} y2={panelHeight - margin.bottom}></line>
        <line class="axis-baseline y-baseline" x1={margin.left} x2={margin.left} y1={margin.top} y2={panelHeight - margin.bottom}></line>

        <g class="axis x-axis" transform={`translate(0, ${panelHeight - margin.bottom})`}>
          {#each [0, 0.25, 0.5, 0.75, 1] as tick}
            <line x1={rightXScale ? rightXScale(tick) : 0} x2={rightXScale ? rightXScale(tick) : 0} y1="0" y2="6"></line>
            <text x={rightXScale ? rightXScale(tick) : 0} y="18" text-anchor="middle">{tick.toFixed(2)}</text>
          {/each}
        </g>

        <g class="axis y-axis" transform={`translate(${margin.left}, 0)`}>
          {#each rightYTicks as tick}
            <line x1="-6" x2="0" y1={rightYScale ? rightYScale(tick) : 0} y2={rightYScale ? rightYScale(tick) : 0}></line>
            <text x="-18" y={rightYScale ? rightYScale(tick) + 3 : 0} text-anchor="end">{tick.toFixed(1)}</text>
          {/each}
        </g>

        {#each rightTraces as trace}
          <path d={trace.line} fill="none" stroke="#5FB3D5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity={trace.opacity}></path>
        {/each}

        <path d={averagePath} fill="none" stroke="#ffa500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity={averageOpacity}></path>

        {#if averageOpacity > 0.15}
          <g class="average-annotation" in:fade={{ duration: 300 }}>
            <text x="478" y="48" text-anchor="start">Average Signal</text>
            <line x1="474" y1="52" x2="402" y2="98" marker-end="url(#average-signal-arrow)"></line>
          </g>
        {/if}

        <text class="axis-label x" x={panelWidth / 2} y={panelHeight - 8} text-anchor="middle">Fraction of Orbital Cycle Completed</text>
        <text class="axis-label y" transform={`translate(40, ${panelHeight / 2}) rotate(-90)`} text-anchor="middle">Relative Brightness</text>
      </svg>

      {#if animationFinished}
        <div class="end-reveal" in:fade={{ duration: 300 }}>
          <p class="panel-caption">Random noise fades. The repeating signal stays.</p>
        </div>
        <button class="replay-btn" in:fade={{ duration: 300, delay: 900 }} on:click={handleReplay}>↻ Watch again</button>
      {/if}
    </div>
  </section>
</div>

<style>
  .stacked-observations {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.2rem;
    align-items: start;
    color: #e8eef2;
  }

  .panel-block {
    min-width: 0;
  }

  .chart-wrap {
    overflow: visible;
  }

  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  :global(.axis text),
  :global(.axis-label) {
    font-size: 0.8rem;
    fill: #a8bfd4;
  }

  :global(.axis line),
  :global(.axis path) {
    stroke: #5FB3D5;
  }

  :global(.axis-baseline) {
    stroke: #5FB3D5;
  }

  .panel-caption {
    margin: 0.4rem 0 0 0;
    font-size: 0.9rem;
    color: #a8bfd4;
  }

  .end-reveal {
    display: block;
  }

  .average-annotation text {
    fill: #ffa500;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .average-annotation line {
    stroke: #ffa500;
    stroke-width: 1.5;
    fill: none;
  }

  @media (max-width: 900px) {
    .stacked-observations {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .card-head h4 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #5FB3D5;
  }

  .card-head p {
    margin: 0.1rem 0 0 0;
    font-size: 0.9rem;
    color: #a8bfd4;
  }

  .replay-btn {
    margin-top: 0.8rem;
    padding: 0.5rem 1rem;
    background: #ffa500;
    color: #0a1628;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
    pointer-events: auto;
  }

  .replay-btn:hover {
    background: #ffb84d;
  }
</style>