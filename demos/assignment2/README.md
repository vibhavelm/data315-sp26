# US Economic Profile (2024) - Assignment 2

## Project Overview
This dashboard provides a look at the 2024 economic profile for the United States. It visualizes median household income, poverty rates, educational attainment, and unemployment across all the states.

**Deployment Link:** https://sage-manatee-a359cb.netlify.app

## Data & Motivation
I sourced this data manually from the following organizations:
- **Median Household Income:** FRED (Federal Reserve Economic Data)
- **Poverty Rates & Educational Attainment:** US Census Bureau
- **Unemployment Rates:** Bureau of Statistics (BLS)

I chose to work with this data as I have previous experience with government datasets from my internships and I think it's important to make public data
understandable and accessible. 

## Design Choices & Implementation
As a beginner to web development, I kept the data simple to focus on mastering technologies that are new for me (Svelte, D3, and Vite). My design choices include:

- **Choropleth Scale Justification:** I implemented a scale that clips at the 5th and 95th percentiles of the dataset. This was done to address outliers in the US income data. Without the clipping, outliers at either end of the spectrum would compress the middle of the distribution, making most of the country look like a similar shade of blue. Additionally, this scale allows users to visually compare each state's income level relative to the rest of the country. To maintain transparency, I labeled the legend with the 5th and 95th percentile bounds so users know that the very light and very dark colors represent the statistical extremes.
- **Intuitive Color Scale:** I chose a single-hue Blues scale for income. This follows an intuitive mapping scheme where lighter colors naturally represent lower income and darker colors represent higher income.
- **Interactive State Selection:** The dashboard supports both hovering and clicking for states. This was a deliberate choice to ensure I met assignment requirements and provide a "focus" mode for specific state metrics.
- **Visual Feedback:** When a state is selected or hovered, a gold outline highlights the state on the map, and a corresponding vertical line appears on each histogram to show where that state falls relative to national distributions.
- **Geographic Insets:** Alaska and Hawaii are visualized as inset maps to allow the entire US to be represented without distorting the continental projection.
- **Bi-directional Filtering:** Brushing ranges on the histograms allows users to filter the map, allowing users to explore how different factors correlate geographically.

## AI Disclosure
AI was used to understand code, debug (I was having problems with my JSON file and it helped me get rid of the problematic element), suggest colors (histogram and outline), teaching me how to add the map interactivity (highlight state on hover and info box), resolving layout issues (making sure everything is centered the way I like), and grammar in the README. 