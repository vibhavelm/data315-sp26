<script>
  import * as d3 from 'd3';
	import {onMount} from 'svelte';
  import Map from './Map.svelte';
  import Histogram from './Histogram.svelte';

	let data = [];
  let fullData = [];
  let filter1 = [];
  let filter2 = [];
  let filter3 = [];

  let var1 = 'Poverty';
  let var2 = 'Education';
  let var3 = 'Unemployment';

  let hoveredState = null;
  let selectedState = null;

  $: histogramData = selectedState ? [selectedState] : (hoveredState ? [hoveredState] : data);

	onMount(async function() {
    // load US states data
    let table = d3.csv('US2024.csv', (d) => ({
          State: d.State.trim(),
          Income: +d.Income,
          Education: +d.Education,
          Poverty: +d.Poverty,
          Unemployment: +d.Unemployment
        }));

    let geocoord = d3.json('us-states-1.json')
      .then((d) => d.features);
    
    await Promise.all([table, geocoord]).then((values) => {
      let tableData = values[0];
      let geocoordData = values[1];
      
      data = geocoordData.map(feature => {
        const stateMatch = tableData.find(t => t.State === feature.properties.name);
        if (stateMatch) {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              ...stateMatch
            }
          };
        }
        return null;
      }).filter(d => d);

      data.sort((a, b) => b.properties.name.localeCompare(a.properties.name));
      fullData = [...data];
    });
	});

  function updateData() {
    data = fullData.filter((d) => {
      const match1 = filter1.length === 0 || (d.properties[var1] >= filter1[0] && d.properties[var1] < filter1[1]);
      const match2 = filter2.length === 0 || (d.properties[var2] >= filter2[0] && d.properties[var2] < filter2[1]);
      const match3 = filter3.length === 0 || (d.properties[var3] >= filter3[0] && d.properties[var3] < filter3[1]);
      return match1 && match2 && match3;
    });
  }

  
</script>

<main>
  <div class="flex-container row no-top-margin">
    <div class="map">
      <div class="header-container">
        <h1 class="main-title">US Economic Profile by State (2024)</h1>
      </div>
      <Map data={data} fullData={fullData} bind:hoveredState bind:selectedState></Map>
    </div>
    <div class="flex-container col higher-col">
      <div class="hist-group">
        <p class="hist-title">Distribution by State: Poverty Rates</p>
        <div class="hist"><Histogram data={histogramData} fullData={fullData} variable={var1} bind:filter={filter1} update={updateData} {hoveredState} {selectedState}></Histogram></div>
      </div>
      <div class="hist-group">
        <p class="hist-title">Distribution by State: Bachelor's Degree Holders (25+)</p>
        <div class="hist"><Histogram data={histogramData} fullData={fullData} variable={var2} bind:filter={filter2} update={updateData} {hoveredState} {selectedState}></Histogram></div>
      </div>
      <div class="hist-group">
        <p class="hist-title">Distribution by State: Unemployment Rates</p>
        <div class="hist"><Histogram data={histogramData} fullData={fullData} variable={var3} bind:filter={filter3} update={updateData} {hoveredState} {selectedState}></Histogram></div>
      </div>
      <p class="sources">
        Sources: US Census Bureau (Education, Poverty), BLS (Unemployment), FRED (Income)
      </p>
    </div>
  </div>
</main>

<style>
  .sources {
    font-size: 10px;
    color: #999;
    margin: 5px 0 0 0;
    font-family: sans-serif;
    font-style: italic;
    text-align: right;
    padding-right: 30px;
    white-space: nowrap;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .header-container {
    padding: 2px 0 0 0;
    height: 45px;
    text-align: center;
    width: 900px;
  }

  .main-title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #333;
    text-align: center;
    line-height: 1;
  }

  .flex-container {
    display: flex;
    justify-content: flex-start;  
    height: auto;
    padding: 0 10px;
    gap: 10px;
  }

  .flex-container > div {
    padding: 0px;
  }

  .flex-container.row {
    flex-direction: row;  
    align-items: flex-start;
  }

  .flex-container.col {
    flex-direction: column;  
    margin-top: 0px;
  }

  .higher-col {
    margin-top: -45px !important;
  }

  .hist-group {
    margin-bottom: 2px;
  }

  .map { 
    flex-grow: 0;
    flex-shrink: 0;
    background-color: #ffffff;
    overflow: hidden;
    width: 900px;
    height: 550px;
    margin-top: 0px;
  }
			
  .hist { 
    flex-grow: 0;
  }

  .hist-title {
    margin: 2px 0;
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
			

</style>