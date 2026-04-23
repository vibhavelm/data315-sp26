<script>
    import * as d3 from 'd3';

    export let data;
    export let fullData;
    export let hoveredState = null;
    export let selectedState = null;

    let width = 900;
    let height = 550;

    // Main projection for continental US + DC
    let proj = d3.geoMercator()
        .scale(650)
        .center([-100, 40])
        .translate([width / 2 - 10, height / 2 - 40]);
    
    let path = d3.geoPath().projection(proj);

    // Inset projections for Alaska and Hawaii
    const insetWidth = 150;
    const akInsetHeight = 140;
    const hiInsetHeight = 110;
    const insetPadding = 2;
    
    // Alaska shifted to bottom-left cluster
    let projAK = d3.geoMercator()
        .scale(150)
        .center([-154, 63])
        .translate([insetPadding + insetWidth / 2, height - (insetPadding * 3) - akInsetHeight - hiInsetHeight + akInsetHeight / 2 - 125]);
    
    // Hawaii shifted to below Alaska
    let projHI = d3.geoMercator()
        .scale(1000)
        .center([-157.5, 20.5])
        .translate([insetPadding + insetWidth / 2, height - insetPadding - hiInsetHeight / 2 - 125]);
    
    let pathAK = d3.geoPath().projection(projAK);
    let pathHI = d3.geoPath().projection(projHI);

    $: fullDataIncomeValues = fullData
      .map((d) => +d.properties.Income)
      .filter((value) => Number.isFinite(value));

    $: {
      const sortedValues = [...fullDataIncomeValues].sort((a, b) => a - b);
      p5 = d3.quantile(sortedValues, 0.05);
      p95 = d3.quantile(sortedValues, 0.95);
      scale = d3.scaleSequential(d3.interpolateBlues)
        .domain([p5, p95])
        .clamp(true);
    }

    let scale;

    // constant values as a fallback
    const DEFAULT_P5 = 63645;
    const DEFAULT_P95 = 108100;

    // legend colors calculated from scale
    $: legendColors = [0, 0.25, 0.5, 0.75, 1].map(t => {
      const min = p5 ?? DEFAULT_P5;
      const max = p95 ?? DEFAULT_P95;
      const value = min + t * (max - min);
      return scale ? d3.color(scale(value)).formatHex() : '#ccc';
    });

    let p5, p95;

    // function to filter data by region
    function isContinental(state) {
      return state !== 'Alaska' && state !== 'Hawaii';
    }
</script>

<main>
    <div class="map-container">
        <h3>Median Household Income by State</h3>
        <p class="directions">
            <strong>Interact:</strong> Brush ranges on <strong>one or more</strong> histograms to filter the map. 
            Click a state to highlight its specific metrics (click again to clear).
        </p>
        <svg {width} {height} style="background: white;">
            <!-- Continental US + DC -->
            <g>
                {#each data as d (d.properties.name)}
                {#if isContinental(d.properties.name)}
                    <path
                    d={path(d)}
                    fill={Number.isFinite(+d.properties.Income) ? scale(+d.properties.Income) : 'white'}
                    fill-opacity={(selectedState || hoveredState) && (selectedState?.properties.name !== d.properties.name && hoveredState?.properties.name !== d.properties.name) ? 0.3 : 1}
                    stroke="#333"
                    stroke-width="0.5"
                    on:mouseover={() => hoveredState = d}
                    on:mouseleave={() => hoveredState = null}
                    on:click={() => selectedState = (selectedState?.properties.name === d.properties.name ? null : d)} />
                {/if}
                {/each}
            </g>

            <!-- AK & HI inset box and map -->
        <g id="inset-ak">
          <rect x={insetPadding} y={height - (insetPadding * 2) - akInsetHeight - hiInsetHeight - 135} width={insetWidth} height={akInsetHeight} fill="white" stroke="#999" stroke-width="1" />
          {#each data as d (d.properties.name)}
            {#if d.properties.name === 'Alaska'}
                <path
                d={pathAK(d)}
                fill={Number.isFinite(+d.properties.Income) ? scale(+d.properties.Income) : 'white'}
                fill-opacity={(selectedState || hoveredState) && (selectedState?.properties.name !== d.properties.name && hoveredState?.properties.name !== d.properties.name) ? 0.3 : 1}
                stroke="#333"
                stroke-width="0.5"
                on:mouseover={() => hoveredState = d}
                on:mouseleave={() => hoveredState = null}
                on:click={() => selectedState = (selectedState?.properties.name === d.properties.name ? null : d)}
                clip-path="url(#ak-clip)" />
            {/if}
          {/each}

          <rect x={insetPadding} y={height - insetPadding - hiInsetHeight - 125} width={insetWidth} height={hiInsetHeight} fill="white" stroke="#999" stroke-width="1" />
          {#each data as d (d.properties.name)}
            {#if d.properties.name === 'Hawaii'}
                <path
                d={pathHI(d)}
                fill={Number.isFinite(+d.properties.Income) ? scale(+d.properties.Income) : 'white'}
                fill-opacity={(selectedState || hoveredState) && (selectedState?.properties.name !== d.properties.name && hoveredState?.properties.name !== d.properties.name) ? 0.3 : 1}
                stroke="#333"
                stroke-width="0.5"
                on:mouseover={() => hoveredState = d}
                on:mouseleave={() => hoveredState = null}
                on:click={() => selectedState = (selectedState?.properties.name === d.properties.name ? null : d)}
                clip-path="url(#hi-clip)" />
            {/if}
          {/each}
        </g>

        <!-- Clipping paths for insets -->
        <defs>
          <clipPath id="ak-clip">
            <rect x={insetPadding} y={height - (insetPadding * 2) - akInsetHeight - hiInsetHeight - 135} width={insetWidth} height={akInsetHeight} />
          </clipPath>
          <clipPath id="hi-clip">
            <rect x={insetPadding} y={height - insetPadding - hiInsetHeight - 125} width={insetWidth} height={hiInsetHeight} />
          </clipPath>
          <!-- Legend gradient colors -->
          <linearGradient id="legendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color: {legendColors?.[0] || '#f7fbff'}; stop-opacity: 1" />
            <stop offset="25%" style="stop-color: {legendColors?.[1] || '#99d6f0'}; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: {legendColors?.[2] || '#3b99d6'}; stop-opacity: 1" />
            <stop offset="75%" style="stop-color: {legendColors?.[3] || '#0868ac'}; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: {legendColors?.[4] || '#084594'}; stop-opacity: 1" />
          </linearGradient>
        </defs>
        
        <!-- Income colorbar -->
        <g transform="translate({width - 270}, 35)">
          <text x="100" y="0" font-size="12" font-weight="bold" fill="#333" text-anchor="middle">Median Income</text>
          <rect x="0" y="15" width="200" height="20" fill="url(#legendGradient)" stroke="#333" stroke-width="1" />
          
          <!-- Main labels (endpoints and midpoint) -->
            <text x="0" y="48" font-size="10" fill="#333" font-weight="bold">&lt; 64k</text>
            <text x="100" y="48" font-size="10" text-anchor="middle" fill="#333" font-weight="bold">$86k</text>
            <text x="200" y="48" font-size="10" text-anchor="end" fill="#333" font-weight="bold">&gt; 108k</text>
          <!-- Explanatory labels -->
          <text x="0" y="60" font-size="9" fill="#999" font-style="italic">Lower outliers</text>
          <text x="200" y="60" font-size="9" text-anchor="end" fill="#999" font-style="italic">Higher outliers</text>
        </g>

        <!-- Dynamic Tooltip / Legend Info -->
        {#if selectedState || hoveredState}
          {@const active = selectedState || hoveredState}
          <g transform="translate({width - 221}, {height - 110 - 95})">
            <text x="0" y="0" font-size="14" font-weight="bold" fill="#d4af37">{active.properties.name}{selectedState ? ' (Selected)' : ''}</text>
            <text x="0" y="20" font-size="12" fill="#333">Median Income: ${d3.format(",")(active.properties.Income)}</text>
            <text x="0" y="38" font-size="12" fill="#333">Poverty Rate: {active.properties.Poverty}%</text>
            <text x="0" y="56" font-size="12" fill="#333">Education (BA+): {active.properties.Education}%</text>
            <text x="0" y="74" font-size="12" fill="#333">Unemployment: {active.properties.Unemployment}%</text>
          </g>
        {:else}
          <g transform="translate({width - 221}, {height - 110 - 95})">
            <text x="0" y="0" font-size="11" fill="#999" font-style="italic">Click a state to select/filter</text>
          </g>
        {/if}

        <!-- Dynamic Selection Outlines  -->
        {#if selectedState || hoveredState}
          {@const active = selectedState || hoveredState}
          {#if isContinental(active.properties.name)}
            <path 
              d={path(active)} 
              fill="none" 
              stroke="#d4af37" 
              stroke-width="1.8" 
              stroke-linejoin="round"
              pointer-events="none" />
          {:else if active.properties.name === 'Alaska'}
            <path 
              d={pathAK(active)} 
              fill="none" 
              stroke="#d4af37" 
              stroke-width="1.8" 
              stroke-linejoin="round"
              pointer-events="none"
              clip-path="url(#ak-clip)" />
          {:else if active.properties.name === 'Hawaii'}
            <path 
              d={pathHI(active)} 
              fill="none" 
              stroke="#d4af37" 
              stroke-width="1.8" 
              stroke-linejoin="round"
              pointer-events="none"
              clip-path="url(#hi-clip)" />
          {/if}
        {/if}
      </svg>
    </div>
</main>

<style>
    .map-container {
        position: relative;
        width: 900px;
        padding-bottom: 20px;
    }
    h3 {
        margin: 0 0 2px 0;
        font-size: 18px;
        color: #333;
    }

    .directions {
        font-size: 12px;
        color: #455a64;
        margin: 0 0 10px 0;
        padding-left: 0;
        font-family: sans-serif;
    }

    svg {
      background: white;
    }

  </style>
