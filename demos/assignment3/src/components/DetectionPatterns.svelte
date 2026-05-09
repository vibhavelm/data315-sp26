<script>
  import * as d3 from "d3";

  /** @typedef {{ time: number, brightness: number }} Point */
  /** @typedef {{ planetSize: number, orbitalPeriod: number, noiseLevel: number, seed: number }} ComparisonConfig */

  const cardWidth = 1500;
  const cardHeight = 220;
  const margin = { top: 30, right: 20, bottom: 28, left: 90 };
  const timeSteps = 180;

  const comparisons = [
    {
      title: "Easy to spot",
      note: "bigger planet, quicker orbit",
      planetSize: 0.18,
      orbitalPeriod: 24,
      noiseLevel: 0.03,
      seed: 11,
      tint: "#bfdbfe"
    },
    {
      title: "Harder to spot",
      note: "smaller planet, slower orbit",
      planetSize: 0.06,
      orbitalPeriod: 90,
      noiseLevel: 0.03,
      seed: 29,
      tint: "#bfdbfe"
    }
  ];

  /** @param {number} seed */
  function createSeededRandom(seed) {
    /** @param {number} index */
    return function(index) {
      const x = Math.sin(seed + index * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
  }

  /** @param {ComparisonConfig} config */
  function generateSeries({ planetSize, orbitalPeriod, noiseLevel, seed }) {
    const getRandom = createSeededRandom(seed);

    /** @type {Point[]} */
    const data = Array.from({ length: timeSteps }, (_, index) => {
      const time = index;
      let brightness = 1;
      const phase = (time % orbitalPeriod) / orbitalPeriod;
      const dipCenter = 0.5;
      const dipWidth = 0.12;

      if (phase > dipCenter - dipWidth / 2 && phase < dipCenter + dipWidth / 2) {
        const distance = phase - dipCenter;
        const sigma = dipWidth / 6;
        const dip = Math.exp(-(distance * distance) / (2 * sigma * sigma));
        brightness -= planetSize * dip;
      }

      brightness += (getRandom(index) - 0.5) * noiseLevel;

      return { time, brightness };
    });

    const xScale = d3.scaleLinear()
      .domain([0, timeSteps - 1])
      .range([margin.left, cardWidth - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0.7, 1.1])
      .range([cardHeight - margin.bottom, margin.top]);

    const yTicks = yScale.ticks(4);

    const line = d3.line()
      .x(/** @param {Point} point */ (point) => xScale(point.time))
      .y(/** @param {Point} point */ (point) => yScale(point.brightness))
      .curve(d3.curveMonotoneX);

    const dipCenters = [];
    for (let center = orbitalPeriod * 0.5; center < timeSteps; center += orbitalPeriod) {
      dipCenters.push(center);
    }

    const dipWindows = dipCenters.map((center) => ({
      start: Math.max(0, center - orbitalPeriod * 0.08),
      end: Math.min(timeSteps - 1, center + orbitalPeriod * 0.08)
    }));

    return {
      xScale,
      yScale,
      yTicks: yScale.ticks(4),
      line: line(data),
      dipWindows: dipWindows.map((window) => ({
        start: xScale(window.start),
        end: xScale(window.end)
      }))
    };
  }

  const series = comparisons.map((comparison) => ({
    ...comparison,
    ...generateSeries(comparison)
  }));
</script>

<div class="panel">
  <div class="comparison-grid">
    {#each series as item}
      <section class="comparison-item">
        <div class="card-head">
          <div>
            <h4>{item.title}</h4>
            <p>{item.note}</p>
          </div>
        </div>

        <svg viewBox={`0 0 ${cardWidth} ${cardHeight}`} role="img" aria-label={item.title}>

          {#each item.dipWindows as window}
            <rect x={window.start} y="24" width={Math.max(6, window.end - window.start)} height={cardHeight - 58} rx="10" fill={item.tint} opacity="0.34" />
          {/each}

          <line class="axis-baseline x-baseline" x1={margin.left} x2={cardWidth - margin.right} y1={cardHeight - margin.bottom} y2={cardHeight - margin.bottom}></line>
          <line class="axis-baseline y-baseline" x1={margin.left} x2={margin.left} y1={margin.top} y2={cardHeight - margin.bottom}></line>

          <g class="axis x-axis" transform={`translate(0, ${cardHeight - margin.bottom})`}>
            {#each [0, 60, 120, 180] as tick}
              <line x1={item.xScale(tick)} x2={item.xScale(tick)} y1="0" y2="6"></line>
              <text x={item.xScale(tick)} y="18" text-anchor="middle">{tick}</text>
            {/each}
          </g>

          <g class="axis y-axis" transform={`translate(${margin.left}, 0)`}>
            {#each item.yTicks as tick}
              <line x1="-8" x2="0" y1={item.yScale(tick)} y2={item.yScale(tick)}></line>
              <text x="-30" y={item.yScale(tick) + 3} text-anchor="end">{tick.toFixed(2)}</text>
            {/each}
          </g>

          <path d={item.line} fill="none" stroke="#5FB3D5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>

          <text class="axis-label bottom" x={cardWidth / 2} y={cardHeight - 4} text-anchor="middle">Time (Days)</text>
          <text class="axis-label left" transform={`translate(18, ${cardHeight / 2}) rotate(-90)`} text-anchor="middle">Relative Brightness</text>
        </svg>

        <div class="caption">{item.title === "Easy to spot" ? "The dip is deep and repeats often." : "The dip is shallower and shows up less often."}</div>
      </section>
    {/each}
  </div>
</div>

<style>
  .panel {
    color: #e8eef2;
    font-family: "Helvetica Neue", Arial, sans-serif;
     width: 100%;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.2rem;
    width: 100%;
  }

  .comparison-item {
    padding: 0;
    width: 100%;
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

  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .axis text,
  .axis-label {
    font-size: 0.8rem;
    fill: #a8bfd4;
  }

  .axis line {
    stroke: #5FB3D5;
  }

  .axis-baseline {
    stroke: #5FB3D5;
    stroke-width: 1;
    shape-rendering: crispEdges;
  }

  .axis-label {
    font-size: 0.9rem;
    fill: #a8bfd4;
  }

  .caption {
    margin-top: 0.35rem;
    font-size: 0.9rem;
    color: #a8bfd4;
  }

  @media (max-width: 760px) {
    .comparison-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
