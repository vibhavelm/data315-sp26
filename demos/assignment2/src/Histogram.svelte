<script>
    import * as d3 from 'd3';

    export let data;
    export let fullData;
    export let variable;
    export let filter;
    export let update;
    export let hoveredState = null;
    export let selectedState = null;

    let margin = {top: 10, right: 30, bottom: 35, left: 40};
    let width = 380;
    let height = 180;
    let chartW = width - margin.left - margin.right;
    let chartH = height - margin.top - margin.bottom;

    let brushLayer, xAxis, yAxis;

    const brush = d3.brushX()
        .extent([[0, 0], [chartW, chartH]])
        .on("brush", brushed)
        .on("end", brushended);        

    function brushed(event) {
        if (event && event.selection) {
            filter = [xScale.invert(event.selection[0]), xScale.invert(event.selection[1])];
            update();
        }
    }

    function brushended(event) {
        if (event && !event.selection) {
            filter = [];
            update();
        }
    }

    function clearFilter() {
        d3.select(brushLayer).call(brush.move, null);
        filter = [];
        update();
    }

    $: xScale = d3.scaleLinear()
        .range([0, chartW])
        .domain(variable === 'Poverty' ? [7, 19] : (variable === 'Education' ? [20, 70] : [1.5, 6]));
    
    $: binner = d3.bin()
        .value((d) => d.properties[variable])
        .domain(xScale.domain())
        .thresholds(xScale.ticks(variable === 'Poverty' ? 15 : 10));

    $: backgroundBins = binner(fullData);
    $: bins = binner(data);

    $: yScale = d3.scaleLinear()
        .range([chartH, 0])
        .domain([0, 16]);

    $: {	
        d3.select(brushLayer).call(brush);
        d3.select(xAxis).call(d3.axisBottom(xScale));
        
        const tickCount = variable === 'Poverty' ? 9 : (variable === 'Unemployment' ? 6 : 10);
        d3.select(yAxis).call(d3.axisLeft(yScale).ticks(tickCount).tickFormat(d3.format("d")));
    }
</script>

<main>
    <div class="chart-container">
        {#if filter.length > 0}
            <button class="clear-btn" on:click={clearFilter}>Clear</button>
        {/if}
        <svg {width} {height}>
            <g transform="translate({margin.left}, {margin.top})">
                {#each backgroundBins as d}
                    <rect class = "backgroundbar"
                        x={xScale(d.x0)} 
                        y={yScale(d.length)}
                        width={xScale(d.x1) - xScale(d.x0)}
                        height={chartH - yScale(d.length)}/>
                {/each}
                {#each bins as d}
                    <rect class = "bar"
                        x={xScale(d.x0)} 
                        y={yScale(d.length)}
                        width={xScale(d.x1) - xScale(d.x0)}
                        height={chartH - yScale(d.length)}/>
                {/each}

                {#if selectedState || hoveredState}
                    {@const active = selectedState || hoveredState}
                    <line 
                        x1={xScale(active.properties[variable])}
                        y1={0}
                        x2={xScale(active.properties[variable])}
                        y2={chartH}
                        stroke="#d4af37"
                        stroke-width={selectedState ? "3" : "2.5"}
                        stroke-dasharray={selectedState ? "0" : "4 2"}
                    />
                {/if}
            </g>

            <g transform="translate({margin.left}, {margin.top})"
                bind:this={brushLayer} />
           
            <g transform="translate({margin.left}, {chartH + margin.top})" 
                bind:this={xAxis} />
            
            <text x={margin.left + chartW / 2} y={height - 4} text-anchor="middle" font-size="11" fill="#455a64" font-weight="500">
                {variable === 'Education' ? 'Bachelor\'s Degree or Higher (%)' : (variable === 'Poverty' ? 'Poverty Rate (%)' : 'Unemployment Rate (%)')}
            </text>

            <text x="12" y={margin.top + chartH / 2} text-anchor="middle" font-size="11" fill="#455a64" font-weight="500" dominant-baseline="middle" transform="rotate(-90 12 {margin.top + chartH / 2})">
                Number of States
            </text>

            <g transform="translate({margin.left}, {margin.top})"
                bind:this={yAxis} />
        </svg>
    </div>
</main>

<style>
    .bar {
        fill: #455a64;
        stroke: white;
        stroke-width: 1px;
    }

    .backgroundbar {
        fill: #cfd8dc;
        opacity: 0.5;
    }

    .chart-container {
        position: relative;
        display: block;
        width: 380px;
    }

    .clear-btn {
        position: absolute;
        top: 5px;
        right: 10px;
        font-size: 10px;
        padding: 2px 6px;
        background: #f5f5f5;
        border: 1px solid #455a64;
        border-radius: 4px;
        color: #455a64;
        cursor: pointer;
        z-index: 100;
        transition: all 0.2s;
        font-family: sans-serif;
    }

    .clear-btn:hover {
        background: #fffdf5;
        border-color: #d4af37;
        color: #b8860b;
    }
 </style>
