---
layout: page
title: HPAI and Poultry Prices
importance: 2
category: school
related_publications: false
img: assets/img/chicken_farm.avif
---

This page features an abridged version of a course project completed for the capstone course in applied research at SDSU, Fall 2025, which analyzed the effects of highly pathogenic avian influenza on poultry prices. 

<br>

## Introduction

<br>

The 2022 outbreak of Highly Pathogenic Avian Influenza (HPAI) is the largest in American history, with over 183 million domestic birds culled since January 2022. Egg production took the heaviest blow: egg-laying hens made up 75% of all poultry culled, and the national average egg price peaked at USD 6.23 per dozen in March 2022. Egg prices became a fixture of the news cycle, and most research on HPAI has followed, focusing on eggs.

Far less is known about **chicken and turkey products**, even though U.S. processors produce roughly 9.4 billion broiler chickens and 218 million turkeys each year (2023). Over 5 million turkeys were culled in the first seven months of the outbreak alone, about 2.5% of annual turkey meat production. This project asks: **how did HPAI outbreaks affect retail chicken and turkey product prices?**

[Read the full paper (PDF)]({{ '/assets/pdf/HPAI__Copy__revised__.pdf' | relative_url }})

<br>

## Data
<br>
I built a region-by-week panel covering February 2022 through November 2025, using the six USDA Agricultural Marketing Service (AMS) regions.

- **Disease exposure:** Confirmed HPAI detections in commercial flocks from the USDA APHIS dashboard, aggregated to the region-week level.
- **Prices:** Advertised retail prices per pound from the USDA AMS Weekly Retail Feature dataset, covering fresh, frozen, and prepared chicken and turkey. For each region, week, species, and product condition, I computed the average price weighted by the number of stores advertising the product.
- **Controls:** USDA feed price ratios, the USDA Prices Paid Index for farm inputs, regional unemployment, Google Trends for "HPAI" and "bird flu" (a proxy for consumer awareness), weekly beef and pork prices (substitutes), and COVID-19 cases and deaths.

Because not every product is advertised every week, the panel is unbalanced. Weekly COVID-19 data stop in May 2023, so I estimate every model both with and without COVID controls (about 375 observations versus about 1,000).

<br>

## Methods
<br>
 Culled flocks cannot be replaced instantly, so a single detection affects supply for weeks afterward. Following Mitchell, Thompson, and Malone (2024), who studied egg prices, I built cumulative rolling measures of exposure **to accounting for biological lags** instead of a simple "outbreak yes/no" indicator:

- **CBBirds:** the rolling total of birds affected (in millions)
- **CBFlocks:** the rolling total of flocks affected

The rolling window matches how long each species takes to reach market: **10 weeks for broiler chickens** and **18 weeks for turkeys** (versus 26 weeks for egg-laying hens). If the same location is infected again, the counter resets and the affected amounts are summed. Breeder birds are excluded because the infection data cannot show whether their offspring become layers or broilers.

For each species and product type, I estimate a two-way fixed effects model via OLS:

$$
Y_{rt} = \beta_0 + \beta_1 \, \text{HPAI}_{rt} + \delta \mathbf{X}'_{rt} + \alpha_r + \eta_t + \epsilon_{rt}
$$

where $$Y_{rt}$$ is the log weighted-average price per pound in region $$r$$ and week $$t$$, $$\text{HPAI}_{rt}$$ is CBBirds or CBFlocks, $$\mathbf{X}_{rt}$$ is the vector of controls, and $$\alpha_r$$ and $$\eta_t$$ are region and week fixed effects. The coefficient $$\beta_1$$ is the average effect of an additional 1 million birds (or one more flock) in the rolling window on regional prices.

With only six regions, conventional clustered standard errors are unreliable, so I cluster by region and use the **wild bootstrap** (Cameron, Gelbach, and Miller 2008) to compute p-values.

<br>

## Results
<br>
Poultry prices were largely resilient to HPAI, in sharp contrast to eggs. Estimated effects on chicken prices are small and statistically indistinguishable from zero. For turkey, the estimates are negative and marginally significant (90% level) when COVID controls are excluded.

<div style="overflow-x:auto;" markdown="1">

| | Chicken (1) | Chicken (2) | Chicken (3) | Chicken (4) | Turkey (5) | Turkey (6) | Turkey (7) | Turkey (8) |
|---|---|---|---|---|---|---|---|---|
| **HPAI Birds** | -0.002 | | -0.034 | | -0.008 | | -0.019* | |
| *p-value* | 0.971 | | 0.314 | | 0.618 | | 0.075 | |
| **HPAI Flocks** | | 0.001 | | -0.006 | | -0.0003 | | -0.001* |
| *p-value* | | 0.902 | | 0.186 | | 0.655 | | 0.060 |
| COVID controls | Yes | Yes | No | No | Yes | Yes | No | No |
| Observations | 376 | 376 | 1,067 | 1,067 | 374 | 374 | 993 | 993 |
| R² | 0.628 | 0.628 | 0.369 | 0.368 | 0.748 | 0.748 | 0.668 | 0.668 |

</div>

*Dependent variable: log price per pound. \*p<0.1. Birds in millions. Standard errors clustered by region; wild-bootstrapped p-values shown. All specifications include covariates for feed price ratios, PPITW, regional monthly unemployment rates, substitute good prices, and HPAI specific Google Trends terms.*

<br>

**Effects differ by product type.** When treatment is defined as the cumulative number of affected birds, Frozen chicken is the clear exception with the largest positive and significant estimates, with price increases of over 5% per million birds affected when COVID controls are excluded. Turkey prepared and frozen products show significant price decreases of around 5%, while fresh products show no significant effect.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/coefplot_birds.png" title="Effects of HPAI outbreaks on chicken and turkey prices by product type, measured in birds affected" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 1. Effects of HPAI outbreaks (measured in millions of birds affected) on log prices by product type. 95% confidence intervals shown.
</div>

<br>

Measuring outbreaks by flocks instead of birds gives very similar results, with somewhat wider confidence intervals for chicken. Because patterns tend to hold across both measures, the results do not appear to be driven by a few large producers.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/coefplot_flocks.png" title="Effects of HPAI outbreaks on chicken and turkey prices by product type, measured in birds affected" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 1. Effects of HPAI outbreaks (measured in millions of birds affected) on log prices by product type. 95% confidence intervals shown.
</div>

<br>

## Discussion
<br>
Falling or flat prices despite large flock losses suggest that other market forces offset the supply shortage. I discuss three potential candidate mechanisms, none of which I can directly identify with these data:

1. **Export diversion.** If foreign importers restricted U.S. poultry because of HPAI, product intended for export would be sold domestically, raising domestic supply and lowering prices.
2. **Consumer substitution.** Beef and pork prices have no statistically significant relationship with poultry prices in any specification (all p-values above 0.50), so substitution does not appear to be a primary driver.
3. **Inter-regional trade.** Frozen products last longest and travel farthest, so regions may have filled supply gaps with frozen poultry from elsewhere. This may help explain the frozen product results.

COVID-19 also mattered. Including COVID controls reduces the negative price effects, suggesting that pandemic-era labor shortages in processing plants and shifts in consumer demand pushed prices up and masked the effect of HPAI in the larger sample.

**Takeaway.** Despite historic flock losses, poultry meat markets absorbed the shock far better than the egg market. Shorter biological production cycles for broilers (up to 10 weeks) and turkeys (about 4 months), together with flexible supply chains, likely explain the difference.

<br>

## Limitations
<br>
- The effect of HPAI on prices is assumed to be linear, though it may be larger right after an outbreak. Average effects may understate large acute shocks.
- HPAI outbreaks follow wild bird migration, so seasonal patterns may affect regions and species (turkey sells more in winter) differently than week and region fixed effects can capture.
- Prices come from advertised retail features rather than transaction data, and the panel is unbalanced.
- With only six regional clusters, inference relies on the wild bootstrap.
- Trade and export mechanisms are suggested, not tested. Future work should add international and inter-regional trade data.

<br>

*Reference: Mitchell, J. L., Thompson, J. M., and Malone, T. (2024). Biological lags and market dynamics in vertically coordinated food supply chains: HPAI impacts on U.S. egg prices. Food Policy, 126, 102655. Cameron, A. C., Gelbach, J. B., and Miller, D. L. (2008). Bootstrap-based improvements for inference with clustered errors. Review of Economics and Statistics, 90(3), 414-427.*
