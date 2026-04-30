<script>
  import * as d3 from 'd3';
  import 'd3-transition';
	import {onMount} from 'svelte';

  const margin = {top: 50, right: 50, bottom: 60, left: 60};
  const width = 500
  const height = 400;
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const refDate = new Date("2020-01-21");

  let data = [];

  let xScale;
  let xAxis;
  let yScale;
  let yAxis;
  let marks;

  let xScale0;
  let yScale0;
  let animating = false;

	onMount(async function() {
    await d3.csv('iris.csv').then((source) => {
      source.forEach((d, i) => {
        // @ts-ignore
        d._i = i;
      }); // Give each datum a stable id
      data = [...source];
      console.log(data);

      initialRender();
    });
	});

  function initialRender() {
    xScale = d3.scaleLinear()
      .range([0, chartW])
      .domain(d3.extent(data, (d) => +d.petal_width));
    xScale0 = xScale.copy();

    d3.select(xAxis)
      .call(d3.axisBottom(xScale));
    
    // Add label only if it doesn't exist
    if (d3.select(xAxis).select(".axis-label").empty()) {
      d3.select(xAxis)
        .append("text")
        .attr("class", "axis-label")
        .style("font-family", "sans-serif")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .style("transform", `translate(${chartW / 2}px, 35px)`)
        .text("Petal Width");
    }

    yScale = d3.scaleLinear()
      .range([chartH, 0])
      .domain(d3.extent(data, (d) => +d.petal_length));
    yScale0 = yScale.copy();

    d3.select(yAxis)
      .call(d3.axisLeft(yScale));

    if (d3.select(yAxis).select(".title").empty()) {
      d3.select(yAxis)
        .append("text")
        .attr("class", "title")
        .style("font-family", "sans-serif")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .style("text-anchor", "middle")
        .style("transform", `translate(${-margin.left / 2}px, ${chartH / 2}px) rotate(-90deg)`)
        .text("Petal Length");
    }

    d3.select(marks)
      .selectAll("circle")
      .data(data, d => d._i).enter()
      .append("circle")
      .style("fill", "steelblue")
      .style("opacity", 0.7)
      .attr("cx", (d) => xScale(+d.petal_width))
      .attr("cy", (d) => yScale(+d.petal_length))
      .attr("r", 3);
  }

  function update() {
    if (animating) return;
    animating = true;

    // set new xScale and bin data
    xScale = d3.scaleLinear()
      .range([0, chartW])
      .domain(d3.extent(data.map((d) => +d.petal_width)))
      .nice();
    
    /** @type {any} */
    const histogram = d3.histogram();
    let binData = histogram
        .value((d) => +d.petal_width)
        .domain(xScale.domain())
        .thresholds(xScale.ticks(12));
    /** @type {any[]} */
    let bins = binData(data);

    // mapping for dots to find their home in the bins
    const binLookup = new Array(data.length);
    const posInBin = new Array(data.length);
    bins.forEach((b, bi) => {
      b.forEach((d, i) => {
        binLookup[d._i] = bi;
        posInBin[d._i] = i;
      });
    });

    const duration = 1000;

    // render axes
    d3.select(xAxis)
      .transition().duration(duration)
      .call(d3.axisBottom(xScale));
    
    d3.select(xAxis).select(".axis-label")
      .text("Petal Width (binned)");

    // set new yScale based on max count
    yScale = d3.scaleLinear()
      .range([chartH, 0])
      .domain([0, d3.max(bins, (d) => d.length)]);
    
    // render yAxis
    d3.select(yAxis)
      .transition().duration(duration)
      .call(d3.axisLeft(yScale));
    
    d3.select(yAxis).select(".title")
      .text("Count");

    let padding = 2; // px between bars

    // TRANSITION DOTS
    const dots = d3.select(marks).selectAll("circle").data(data, d => d._i);
    
    dots.transition().duration(duration)
      .attr("cx", d => {
        const b = bins[binLookup[d._i]];
        return xScale((b.x0 + b.x1) / 2);
      })
      .attr("cy", d => {
        const i = posInBin[d._i];
        return yScale(i + 0.5); // stack dots roughly
      })
      .attr("r", 1)
      .style("opacity", 0);

    // BARS
    const bars = d3.select(marks).selectAll("rect").data(bins);

    bars.enter()
      .append("rect")
      .style("fill", "steelblue")
      .attr("x", (d) => xScale(d.x0) + padding / 2)
      .attr("width", (d) => Math.max(0, xScale(d.x1) - xScale(d.x0) - padding / 2))
      .attr("y", yScale(0))
      .attr("height", 0)
      .transition().duration(duration)
      .attr("y", (d) => yScale(d.length))
      .attr("height", (d) => yScale(0) - yScale(d.length))
      .on("end", (d, i, nodes) => {
        if (i === nodes.length - 1) {
          animating = false;
          dots.remove(); // tidy up dots after bars are fully grown
        }
      });
  }

  function clearChart() {
    d3.select(marks)
      .selectAll("*")
      .remove();
    d3.select(xAxis)
      .selectAll("*")
      .remove();
    d3.select(yAxis)
      .selectAll("*")
      .remove();
  }

  function reset() {
    if (animating) return;
    animating = true;

    const duration = 1000;

    // Reset scales
    xScale = xScale0.copy();
    yScale = yScale0.copy();

    // Transition axes back
    d3.select(xAxis)
      .transition().duration(duration)
      .call(d3.axisBottom(xScale));
    
    d3.select(xAxis).select(".axis-label")
      .text("Petal Width");

    d3.select(yAxis)
      .transition().duration(duration)
      .call(d3.axisLeft(yScale));
    
    d3.select(yAxis).select(".title")
      .text("Petal Length");

    // BRING BACK DOTS (re-enter from current bar positions if possible, or just fade in at scatter)
    // To make it look cool, we re-seed dots at their scatter positions but with 0 opacity, then fade in.
    const dots = d3.select(marks).selectAll("circle")
      .data(data, d => d._i);

    dots.enter()
      .append("circle")
      .style("fill", "steelblue")
      .attr("r", 3)
      .attr("cx", d => xScale(+d.petal_width))
      .attr("cy", d => yScale(+d.petal_length))
      .style("opacity", 0)
      .transition().duration(duration)
      .style("opacity", 0.7);

    // REMOVE BARS
    const bars = d3.select(marks).selectAll("rect");
    
    bars.transition().duration(duration)
      .attr("y", yScale0.range()[0]) // fall to bottom of scatter plot
      .attr("height", 0)
      .remove()
      .on("end", (d, i, nodes) => {
        if (i === nodes.length - 1) {
          animating = false;
        }
      });
    
    if (bars.empty()) {
        animating = false;
    }
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