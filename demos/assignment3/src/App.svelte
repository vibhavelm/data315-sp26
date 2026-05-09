<script>
  import { onMount } from "svelte";
  import { stages } from "./story.js";
  import LightCurve from "./components/LightCurve.svelte";
  import DetectionPatterns from "./components/DetectionPatterns.svelte";
  import StackedObservations from "./components/StackedObservations.svelte";

  let stageIndex = 0;
  $: stage = stages[stageIndex];
  /** @type {[number, number] | null} */
  let yAxisRange = null;

  let planetSize = 0.1, 
      orbitalPeriod = 50, 
      noiseLevel = 0.1, 
      showClean = false, 
      showSliders = { size: false, period: false, noise: false }, 
      showToggle = false;

  let lastStageIndex = -1;
  let lastInteractionTime = 0;

  $: {
    if (stageIndex !== lastStageIndex) {
      lastStageIndex = stageIndex;
      if (stage.props) {
        const props = /** @type {any} */ (stage.props ?? {});
        planetSize = props.planetSize ?? planetSize;
        orbitalPeriod = props.orbitalPeriod ?? orbitalPeriod;
        noiseLevel = props.noiseLevel ?? noiseLevel;
        showClean = props.showClean ?? false;
        showSliders = props.showSliders ?? { size: false, period: false, noise: false };
        showToggle = props.showToggle ?? false;
        yAxisRange = props.yAxisRange ?? null;
      }
    }
  }

  function onControlChange() {
    lastInteractionTime = Date.now();
  }

  onMount(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
  });

  let dashW = 0, dashH = 0;
  $: width = Math.max(dashW * 0.9, 300);
  $: height = Math.max(dashH * 0.6, 200);
  $: simpleVisualStage = stage.id === "detection-patterns" || stage.id === "how-astronomers-do-it";

  /** @param {HTMLElement} node */
  function observe(node) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (Date.now() - lastInteractionTime > 300) {
              const target = /** @type {HTMLElement} */ (entry.target);
              const idx = Number(target.dataset.index);
              if (!isNaN(idx)) stageIndex = idx;
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return {
      destroy() {
        observer.disconnect();
      }
    };
  }
</script>

<main>
    <div class="scrollyteller">
        <div class="text">
            {#each stages as s, i}
            <section
                class="step"
                id={s.id}
                data-index={i}
                use:observe
            >
                {@html s.copy}
            </section>
            {/each}
        </div>

        <div class="dashboard" bind:clientWidth={dashW} bind:clientHeight={dashH}>
            {#if stage.id === "detection-patterns"}
              <div class="story-visual story-visual-comparison">
                <DetectionPatterns />
              </div>
            {:else if stage.id === "how-astronomers-do-it"}
              <div class="story-visual story-visual-comparison">
                <StackedObservations
                  {planetSize}
                  {orbitalPeriod}
                  {noiseLevel}
                  seed={stage.props?.seed ?? 7}
                />
              </div>
            {:else}
              <div class="chart-container">
                  <LightCurve
                      {width}
                      {height}
                      {planetSize}
                      {orbitalPeriod}
                      {noiseLevel}
                      {showClean}
                    seed={stage.props?.seed}
                    showSliders={showSliders}
                    yAxisRange={yAxisRange}
                        showHeader={stage.id === "title"}
                  />
              </div>
            {/if}
        </div>
        <div class="controls" class:hidden={simpleVisualStage || (!showSliders?.size && !showSliders?.period && !showSliders?.noise && !showToggle)}>
              {#if showSliders?.size}
              <div class="slider">
                <label>
                  Planet Size (Light Blocked)
                  <span class="info-wrapper" aria-label="Planet Size info">
                    <button class="info" type="button">i</button>
                    <div class="tooltip">Percent of starlight blocked. Larger → deeper dip.</div>
                  </span>
                </label>
                <input type="range" min="0.01" max="0.5" step="0.01" bind:value={planetSize} on:input={onControlChange} aria-label="Planet Size" aria-valuetext={(planetSize*100).toFixed(0) + "% blocked"}>
                <div class="value">{(planetSize*100).toFixed(0)}%</div>
              </div>
              {/if}
              {#if showSliders?.period}
              <div class="slider">
                <label>
                  Orbital Period
                  <span class="info-wrapper" aria-label="Orbital period info">
                    <button class="info" type="button">i</button>
                    <div class="tooltip">Number of days between dips (lower = faster orbit).</div>
                  </span>
                </label>
                <input type="range" min="10" max="200" step="1" bind:value={orbitalPeriod} on:input={onControlChange} aria-label="Orbital Period" aria-valuetext={orbitalPeriod + " observations"}>
                <div class="value">{orbitalPeriod}</div>
              </div>
              {/if}
              {#if showSliders?.noise}
              <div class="slider">
                <label>
                  Noise
                  <span class="info-wrapper" aria-label="Noise info">
                    <button class="info" type="button">i</button>
                    <div class="tooltip">Random jitter added to brightness (higher = harder to see dips).</div>
                  </span>
                </label>
                <input type="range" min="0" max="1" step="0.01" bind:value={noiseLevel} on:input={onControlChange} aria-label="Noise" aria-valuetext={(noiseLevel).toFixed(2)}>
                <div class="value">{noiseLevel.toFixed(2)}</div>
              </div>
              {/if}
              {#if showToggle}
              <div class="toggle">
                <label>
                  <input type="checkbox" bind:checked={showClean} on:change={onControlChange} aria-label="Show clean signal">
                  <strong>Show clean signal</strong>
                  <span class="info-wrapper" aria-label="Show clean signal info">
                    <button class="info" type="button">i</button>
                    <div class="tooltip"><strong>Show what the dip would look like without noise.</strong></div>
                  </span>
                </label>
              </div>
              {/if}
        </div>
    </div>
</main>

<style>
.scrollyteller {
  position: relative;
  display: grid;
  grid-template-columns: 1fr minmax(auto, 32rem) 1fr;
}

.dashboard {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 5rem;
  box-sizing: border-box;
}

.chart-container {
    width: 90%;
    height: 60%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.story-visual {
  width: 90%;
  max-width: 980px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.story-visual-comparison {
  min-height: 340px;
}

.story-visual.story-visual-comparison {
  width: min(92vw, 1100px) !important;
  max-width: none !important;
  align-items: flex-start;
  padding-top: 6rem;
  overflow: visible;
}

.dashboard > .story-visual.story-visual-comparison {
  width: min(92vw, 1100px) !important;
}

.controls {
    position: fixed;
  bottom: 1.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: 85%;
    max-width: 900px;
    display: flex;
    flex-wrap: wrap;
  gap: 1rem;
    align-items: center;
    justify-content: center;
    pointer-events: all;
    background: rgba(26, 45, 66, 0.95);
  padding: 0.8rem 1.2rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(95, 179, 213, 0.2);
    border: 1px solid #5FB3D5;
    z-index: 100;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.controls.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

.slider {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 210px;
    min-width: 120px;
    flex: 0 1 auto;
  min-height: 70px;
}

.slider label {
    font-size: 0.8rem;
    font-weight: bold;
    margin-bottom: 0.2rem;
    color: #5FB3D5;
}

.slider input {
    width: 100%;
}

.toggle {
    display: flex;
    align-items: center;
    white-space: nowrap;
}

.toggle label {
    font-size: 0.9rem;
    color: #e8eef2;
}

.value {
  font-size: 0.85rem;
  color: #a8bfd4;
  margin-top: 0.2rem;
}

.info-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.info {
  background: transparent;
  border: 1px solid #5FB3D5;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  margin-left: 0.4rem;
  color: #5FB3D5;
  cursor: pointer;
  position: relative;
}

.info:hover {
  background: rgba(95, 179, 213, 0.1);
  border-color: #ffa500;
  color: #ffa500;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: #0a1628;
  color: #5FB3D5;
  padding: 0.6rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  line-height: 1.4;
  white-space: nowrap;
  text-align: center;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 200;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  border: 1px solid #5FB3D5;
}

.info-wrapper:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.text {
  position: relative;
  z-index: 1;
  grid-column: 2;
  padding: 2rem;
}

.step {
  margin-bottom: 90vh;
  font-size: 1.1rem;
  background: rgba(26, 45, 66, 0.9);
  padding: 1rem 1.5rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(95, 179, 213, 0.15);
  border: 1px solid rgba(95, 179, 213, 0.3);
  color: #e8eef2;
}

.step :global(p.small-text) {
    font-size: 0.9rem;
    color: #a8bfd4;
    text-align: center;
    margin-top: 1rem;
}
</style>
