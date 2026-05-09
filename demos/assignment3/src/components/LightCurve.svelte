<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  /** @typedef {{ size?: boolean, period?: boolean, noise?: boolean }} SliderVisibility */
  /** @typedef {{ time: number, brightness: number }} DataPoint */

  /** @type {number} */
  export let width = 0;
  /** @type {number} */
  export let height = 0;
  export let planetSize = 0.1;
  export let orbitalPeriod = 50;
  export let noiseLevel = 0.1;
  export let showClean = false;
  /** @type {number | null} */
  export let seed = null;
  /** @type {SliderVisibility} */
  export let showSliders = {};
  /** @type {[number, number] | null} */
  export let yAxisRange = null;
  export let showHeader = false;

  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  /** @type {SVGSVGElement | null} */
  let svg = null;
  /** @type {any} */
  let xScale = null;
  /** @type {any} */
  let yScale = null;
  /** @type {any} */
  let line = null;
  /** @type {any} */
  let cleanLine = null;
  const fallbackSeed = Math.random();

  const timeSteps = 500;

  /** @param {number} seed */
  function createSeededRandom(seed) {
    /** @param {number} index */
    return function(index) {
      const x = Math.sin(seed + index * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
  }

  /** @type {DataPoint[]} */
  $: data = generateData(planetSize, orbitalPeriod, noiseLevel, seed);
  /** @type {DataPoint[]} */
  $: cleanData = generateData(planetSize, orbitalPeriod, 0, seed);
  $: if (svg && data) draw(showClean, yAxisRange);

  /** @param {number} size @param {number} period @param {number} noise @param {number | null} seed */
  function generateData(size, period, noise, seed) {
    const resolvedSeed = seed != null ? seed : fallbackSeed;
    const getRandom = createSeededRandom(resolvedSeed);

    /** @type {DataPoint[]} */
    return Array.from({ length: timeSteps }, (_, i) => {
      const time = i;
      let brightness = 1.0;

    
      const phase = (time % period) / period;

      const dipCenter = 0.5;
      const dipWidth = 0.1;

      if (phase > dipCenter - dipWidth / 2 && phase < dipCenter + dipWidth / 2) {
        const distance = phase - dipCenter;

        const sigma = dipWidth / 6;
        const gaussianDip =
          Math.exp(-(distance * distance) / (2 * sigma * sigma));

        brightness -= size * gaussianDip;
      }

      const maxNoiseUp = 1.5 - brightness;
      const maxNoiseDown = brightness - 0.3;
      const noiseAmount = (getRandom(i) - 0.5) * noise;
      const constrainedNoise = Math.max(-maxNoiseDown, Math.min(maxNoiseUp, noiseAmount));
      brightness += constrainedNoise;

      return { time, brightness };
    });
  }

  /** @param {boolean} isCleanVisible @param {[number, number] | null} axisRange */
  function draw(isCleanVisible, axisRange) {
    if (!svg) return;

    /** @type {any} */
    const svgSelection = d3.select(svg);

    xScale = d3.scaleLinear()
      .domain([0, timeSteps])
      .range([margin.left, width - margin.right]);

    let domainMin, domainMax;

    if (axisRange) {
      [domainMin, domainMax] = axisRange;
    } else {
      const yMin = d3.min(data, brightnessValue);
      const yMax = d3.max(data, brightnessValue);

      const bufferBelowMin = (seed == null || showSliders?.size) ? 0.02 : 0;

      domainMin = Math.floor((yMin - bufferBelowMin) * 10) / 10;
      domainMax = Math.ceil(Math.max(yMax * 1.02, 1.05) * 10) / 10;
    }

    yScale = d3.scaleLinear()
      .domain([domainMin, domainMax])
      .range([height - margin.bottom, margin.top]);

    line = d3.line()
      .x(/** @param {DataPoint} point */ (point) => xScale(point.time))
      .y(/** @param {DataPoint} point */ (point) => yScale(point.brightness));

    cleanLine = d3.line()
      .x(/** @param {DataPoint} point */ (point) => xScale(point.time))
      .y(/** @param {DataPoint} point */ (point) => yScale(point.brightness));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svgSelection.select(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

    svgSelection.select(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis);

    svgSelection.select(".x-axis-label")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .text("Time (Days)");

    svgSelection.select(".y-axis-label")
      .attr("transform", `translate(10, ${height / 2}) rotate(-90)`)
      .text("Relative Brightness");

    svgSelection.select(".line")
      .datum(data)
      .transition().duration(500)
      .attr("d", line);
    svgSelection.select(".line")
      .style("opacity", isCleanVisible ? 0.7 : 1);

    svgSelection.select(".clean-line")
      .datum(cleanData)
      .transition().duration(500)
      .attr("d", cleanLine)
      .style("opacity", isCleanVisible ? 1 : 0);
  }

  onMount(() => {
    draw(showClean, yAxisRange);
  });

  /** @param {DataPoint} point */
  function brightnessValue(point) {
    return point.brightness;
  }
</script>

<div class="lightcurve-shell">
  {#if showHeader}
    <div class="chart-header">
      <h3>Star Brightness Over Time</h3>
      <p>Can you spot the planet?</p>
    </div>
  {/if}

  <svg {width} {height} bind:this={svg}>
  <g class="x-axis"></g>
  <g class="y-axis"></g>

  <text class="x-axis-label" text-anchor="middle"></text>
  <text class="y-axis-label" text-anchor="middle"></text>

  <path class="line" fill="none" stroke="#5FB3D5" stroke-width="1.5"></path>
  <path class="clean-line" fill="none" stroke="#ffa500" stroke-width="2.5" stroke-dasharray="8,5"></path>
  </svg>
</div>

<style>
  .lightcurve-shell {
    width: 100%;
  }

  .chart-header {
    margin-bottom: 0.5rem;
    padding-left: 8px;
  }

  .chart-header h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: #5FB3D5;
  }

  .chart-header p {
    margin: 0.12rem 0 0 0;
    font-size: 0.95rem;
    color: #a8bfd4;
  }

  svg {
    display: block;
  }

  .x-axis-label, .y-axis-label {
    font-size: 0.8rem;
    fill: #a8bfd4;
  }

  .line {
    transition: opacity 500ms ease;
  }

  .clean-line {
    opacity: 0;
    transition: opacity 500ms ease;
  }
</style>
