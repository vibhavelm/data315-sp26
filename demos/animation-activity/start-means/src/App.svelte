<script>
  import * as d3 from 'd3';
  import 'd3-transition';
  import { onMount } from 'svelte';

  const margin = { top: 50, right: 50, bottom: 60, left: 60 };
  const width = 500;
  const height = 400;
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  let data = [];
  /** @type {any} */
  let marks;
  let xAxis;
  let yAxis;

  let xScale0, yScale0; // Save baseline scales for reset
  let animating = false;

  onMount(async function () {
    await d3.csv('iris.csv').then((source) => {
      data = source.map((d, i) => ({ ...d, _i: i })); // Stable ID
      console.log(data);

      initialRender();
    });
  });

  function initialRender() {
    xScale0 = d3.scaleLinear()
      .range([0, chartW])
      .domain(d3.extent(data, (d) => +d.petal_width));

    yScale0 = d3.scaleLinear()
      .range([chartH, 0])
      .domain(d3.extent(data, (d) => +d.petal_length));

    // Render Axes
    d3.select(xAxis).call(d3.axisBottom(xScale0));
    d3.select(xAxis).append("text")
      .attr("class", "axis-label")
      .style("font-family", "sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .style("transform", `translate(${chartW / 2}px, 35px)`)
      .text("Petal Width");

    d3.select(yAxis).call(d3.axisLeft(yScale0));
    d3.select(yAxis).append("text")
      .attr("class", "axis-label")
      .style("font-family", "sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .style("text-anchor", "middle")
      .style("transform", `translate(${-margin.left / 2}px, ${chartH / 2}px) rotate(-90deg)`)
      .text("Petal Length");

    // Render Marks
    d3.select(marks)
      .selectAll("circle")
      .data(data, (d) => d._i)
      .join("circle")
      .attr("class", "dot")
      .style("fill", "steelblue")
      .style("opacity", 0.7)
      .attr("cx", (d) => xScale0(+d.petal_width))
      .attr("cy", (d) => yScale0(+d.petal_length))
      .attr("r", 3);
  }

  function update() {
    if (animating) return;
    animating = true;

    // group by species and compute mean petal_length
    const speciesMeans = d3.rollups(data, (v) => d3.mean(v, (d) => +d.petal_length), (d) => d.species)
      .map(([species, mean]) => ({ species, mean }));

    // set new xScale (band scale for species)
    const xScaleBar = d3.scaleBand()
      .range([0, chartW])
      .domain(speciesMeans.map((d) => d.species))
      .padding(0.2);

    // set new yScale based on max mean petal_length
    const yScaleBar = d3.scaleLinear()
      .range([chartH, 0])
      .domain([0, d3.max(speciesMeans, (d) => d.mean)])
      .nice();

    const t = d3.transition().duration(1000);

    // render xAxis
    d3.select(xAxis).transition(t).call(d3.axisBottom(xScaleBar));
    d3.select(xAxis).select(".axis-label").text("Species");

    // render yAxis
    d3.select(yAxis).transition(t).call(d3.axisLeft(yScaleBar));
    d3.select(yAxis).select(".axis-label").text("Mean Petal Length");

    // 1. Move dots to species means (top center of where bars will be)
    d3.select(marks).selectAll(".dot")
      .transition(t)
      .attr("cx", (d) => xScaleBar(d.species) + xScaleBar.bandwidth() / 2)
      .attr("cy", (d) => {
          const mean = speciesMeans.find(m => m.species === d.species).mean;
          return yScaleBar(mean);
      })
      .style("opacity", 0);

    // 2. Grow bars
    d3.select(marks).selectAll("rect")
      .data(speciesMeans, (d) => d.species)
      .join(
        enter => enter.append("rect")
          .attr("x", d => xScaleBar(d.species))
          .attr("y", chartH)
          .attr("width", xScaleBar.bandwidth())
          .attr("height", 0)
          .style("fill", "steelblue")
          .style("opacity", 0.7),
        update => update,
        exit => exit.remove()
      )
      .transition(t)
      .attr("y", d => yScaleBar(d.mean))
      .attr("height", d => chartH - yScaleBar(d.mean))
      .on("end", () => animating = false);
  }

  function reset() {
    if (animating) return;
    animating = true;

    const t = d3.transition().duration(1000);

    // Restore Axes
    d3.select(xAxis).transition(t).call(d3.axisBottom(xScale0));
    d3.select(xAxis).select(".axis-label").text("Petal Width");

    d3.select(yAxis).transition(t).call(d3.axisLeft(yScale0));
    d3.select(yAxis).select(".axis-label").text("Petal Length");

    // Shrink and fade bars
    d3.select(marks).selectAll("rect")
      .transition(t)
      .attr("y", chartH)
      .attr("height", 0)
      .style("opacity", 0)
      .remove();

    // Restore dots
    d3.select(marks).selectAll(".dot")
      .transition(t)
      .attr("cx", (d) => xScale0(+d.petal_width))
      .attr("cy", (d) => yScale0(+d.petal_length))
      .style("opacity", 0.7)
      .on("end", () => animating = false);
  }
</script>

<main>
  <h1>Animated Transitions</h1>

  <svg {width} {height}>
    <g 
      style="transform: translate({margin.left}px, {margin.top}px)" 
      bind:this={marks}></g>
    <g 
      style="transform: translate({margin.left}px, {height - margin.bottom}px)" 
      bind:this={xAxis}></g>
    <g 
      style="transform: translate({margin.left}px, {margin.top}px)" 
      bind:this={yAxis}></g>
  </svg>

  <br/>
  <button on:click={update}>Animate</button>
  <button on:click={reset}>Reset</button>
</main>

<style>
  button {
      border: none;
      padding: 0.5rem 2rem;
      color: slategrey;
      font-size: 1.5rem;
      border-radius: 1rem;
      transition: all 250ms;
      transform-origin: center;
      box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.25),
      inset 0px -2px 3px rgba(0, 0, 0, 0.25);
  }
  button:hover {
      cursor: pointer;
      transform: scale(0.975);
      box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.25);
  }
</style>