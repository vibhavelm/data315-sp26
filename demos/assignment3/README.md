# Assignment 3 - Exoplanet Detection

## Link
https://spontaneous-quokka-2be948.netlify.app/

## About This Story

This scrollyteller teaches viewers how astronomers detect planets beyond our solar system by observing tiny dips in starlight. The story uses animated visualizations and interactive controls to let readers experience the challenges astronomers face of spotting planetary signals hidden in noisy telescope data.

## Narrative Approach

This piece uses an interactive slideshow with guided exploration structure:

Author-driven setup (stages 1–4): Introduce key concepts (what starlight looks like, how planets show up, why noise is a problem)
Reader-driven exploration (stage 5): Challenge readers to discover patterns independently with full interactive controls
Author-driven synthesis (stages 6–8): Return to guided narration to explain detection patterns, and show how astronomers might handle this data.

This structure of guide → explore → reflect → contextualize structure lets readers discover insights themselves, then provides follow up information to validates and deepen their understanding.

Messaging: I used clear, conversational language designed for a broad audience. The progressive introduction of interactive controls guides readers without overwhelming them.

## Data Information

I use generated data rather than real telescope observations. Each light curve simulates a star whose brightness stays near a normalized baseline of 1.0, with periodic dips added to represent a planet passing in front of the star. The depth of each dip depends on planet size, the timing depends on orbital period, and random Gaussian noise is added to mimic the messy conditions astronomers deal with in real observations.

I used synthetic data so the story could focus on the core idea of separating signal from noise in exoplanet detection. This project prioritizes teaching that concept over strict scientific realism, so the data is simplified to make the pattern easier to understand. That makes the progression easier to follow as the story moves from a clean, obvious transit to noisier and more realistic cases. The sliders let readers change planet size, orbital period, and noise level directly, so they can see how each parameter impacts whether a planet is easy or hard to detect. Fixed random seeds keep the examples reproducible across stages.

## Visualizations

Light Curve Charts (most of the pages)
- Time-series plot of stellar brightness
- Interactive sliders adjust planet size, orbital period, and noise level depending on the page
- Toggle reveals the clean signal overlay depending on the page

Detection Patterns
- Side-by-side examples showing "easy to spot" vs. "harder to spot" planets
- Illustrates how planetary radius and orbital speed affect detectability

Stacked Observations (animated demo)
- Top chart shows a single noisy observation and the bottom shows multiple noisy observations from the same star stacked and aligned
- Animated reveal of the average signal pattern
- Demonstrates how repetition helps astronomers overcome noise

## AI Disclosure

AI was used to help generate the simulated data and connect it for use in this website, suggest color schemes, highlight dips in star brightness on the comparison between big and small planet detections page, implement the animated chart, and debugging (ensuring interactive controls work). 