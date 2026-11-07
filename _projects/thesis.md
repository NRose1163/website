---
layout: page
title: School Funding and Youth Crime
importance: 1
category: school
related_publications: false
img: assets/img/thesis_page_logo.jpg
---
This page features an abridged version of my 2026 MS Thesis titled **The Contemporaneous Effects of Increased School Funding in High-Needs Counties on Crime: Evidence from California's Local Control Funding Formula**. You can view the full published version [here](https://digitalcollections.sdsu.edu/do/09534263-1756-4c0d-8f94-55028b730bd8).

<br>

## The Short Version

In 2013, California overhauled how it funds schools with the introduction of The **Local Control Funding Formula (LCFF)**. The LCFF reformulated funding to be needs-based, sending extra money to districts with many high-need students (low-income, foster youth, English learners), including a large bonus where they make up more than 55% of enrollment. Previous studies focused on the impact on student learning outcomes, but downstream effects remained unstudied. I asked: **did that extra funding change crime?**

Comparing high-need counties to low-need counties before and after 2013 using a difference-in-differences design with county and year fixed effects, I find:

- **Arrests fell among young people in high-need counties**, and the drop is concentrated among **minors**: fewer felony, violent, property, and felony sex arrests.
- **Effects grow with exposure.** The longer a county was funded under LCFF, the larger the decline (see Figure 1).
- **Results hold up** when I control for Prop 47 (which reclassified many felonies as misdemeanors) and for differences in police density.
- **No effect shows up among 20-29 year olds**, who had little or no exposure to LCFF-funded schooling. That is what the exposure story predicts.
- **One likely channel:** 12th-grade dropout fell by roughly 4,000 students a year in high-need districts, while diploma graduation rates did not move. That points to at-risk students staying in school and earning a GED or equivalent (not a traditional diploma) instead of leaving.

This is highly suggestive evidence but not fully causal. County-level data is coarse and some estimates are noisy (see Limitations).

<br>

## Data and approach

- **Panel:** California counties, 2008-2018.
- **Funding and need:** California Department of Education LCFF allocations and pre-reform school finance data, aggregated from the district level to counties.
- **Outcomes:** annual arrests per 1,000 residents from the California DOJ OpenJustice database, split by offense type, age, race, and gender.
- **Controls:** county income, poverty, unemployment, demographics, and police staffing.
- **Treatment:** a county is "high-need" if at least half of its local education agencies received LCFF concentration funding in 2013.
- **Tools:** Stata, with event-study designs to check pre-trends and track effects over time.

<br>

## Result 1: Dynamic Effects on Arrests among Minors

Each panel below shows how arrest rates among minors in high-need counties changed relative to low-need counties, with 2012 (the year before LCFF) as the baseline. Before 2013 almost all the estimates hover around zero, which supports the parallel trends assumption. After 2013 they tend to drift downward and keep falling through 2017, best seen in felonies and property crimes.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/thesis_fig1_minors_event_study.png" title="Event study estimates of LCFF effects on arrests among minors" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Figure 1. Dynamic effects on arrests among minors (per 1,000 population). 95% confidence level show, dashed line marks 2012. Y-axes differ across panels.
</div>

<br>

## Result 2: Headline estimates, with Prop 47 and police controls

Prop 47 (2014) reclassified many property and drug felonies as misdemeanors, which could mechanically lower felony arrests in some counties more than others. Police staffing also differs across counties. The model controls for each county's exposure to Prop 47 and for police density, and the event study below shows the same pattern for minors. Point estimates for minors get somewhat larger with the controls, though they are not statistically different from the baseline estimates.

The table reports Panel A (minors), showing the average post-2013 change in arrests per 1,000 young people in high-need counties relative to low-need counties after robustness checks. Negative numbers mean fewer arrests.

**Table 7, Panel A: Minors (17 and under)**

<div class="table-responsive" markdown="1">

|  | Total | Felony | Violent | Property | Felony drug | Felony sex | Other felonies | Misdemeanor | Status offense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| High-need county x Post | -0.388 | **-0.149\*\*** | **-0.0672\*\*\*** | **-0.0680\*** | 0.00948 | **-0.00956\*\*** | -0.0138 | -0.113 | 0.0234 |
|  | (0.347) | (0.0723) | (0.0244) | (0.0354) | (0.0129) | (0.00436) | (0.0270) | (0.207) | (0.136) |
| Pre-treatment mean | 6.31 | 1.27 | 0.30 | 0.53 | 0.13 | 0.03 | 0.29 | 3.07 | 0.69 |
| Observations | 630 | 630 | 630 | 630 | 630 | 630 | 630 | 630 | 630 |

</div>

<div class="caption">
    * p&lt;0.10, ** p&lt;0.05, *** p&lt;0.01. Standard errors clustered by county. Model includes county and year fixed effects plus economic, demographic, Prop 47, and police density controls.
</div>

<br>

**Interpretation:** the violent-crime coefficient of -0.0672 means about 0.07 fewer arrests per 1,000 minors each year, a **22% drop** from the pre-treatment mean of 0.30. Felony arrests fell about 12% and property arrests about 13%.

<br>

<details markdown="1">
<summary>Older age groups (Table 7, Panels B and C)</summary>

**Panel B: Ages 18-19**

<div class="table-responsive" markdown="1">

|  | Total | Felony | Violent | Property | Felony drug | Felony sex | Other felonies | Misdemeanor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| High-need county x Post | 0.103 | -0.0266 | -0.0285\*\* | -0.0240 | 0.0267 | -0.00936\* | 0.00858 | 0.156 |
|  | (0.154) | (0.0369) | (0.0135) | (0.0208) | (0.0191) | (0.00539) | (0.0175) | (0.137) |
| Pre-treatment mean | 4.13 | 1.00 | 0.23 | 0.32 | 0.19 | 0.02 | 0.22 | 2.14 |

</div>

**Panel C: Ages 20-29**

<div class="table-responsive" markdown="1">

|  | Total | Felony | Violent | Property | Felony drug | Felony sex | Other felonies | Misdemeanor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| High-need county x Post | -0.0867 | 0.147 | 0.00258 | -0.0420 | 0.115 | 0.00600 | 0.0650 | -0.380 |
|  | (0.688) | (0.181) | (0.0359) | (0.0680) | (0.0964) | (0.0110) | (0.0817) | (0.512) |
| Pre-treatment mean | 18.88 | 4.56 | 1.18 | 1.07 | 1.20 | 0.07 | 1.04 | 9.76 |

</div>
<div class="caption">
    * p&lt;0.10, ** p&lt;0.05, *** p&lt;0.01. Standard errors clustered by county. Model includes county and year fixed effects plus economic, demographic, Prop 47, and police density controls.
</div>


Effects fade for 18-19 year olds and disappear for 20-29 year olds, consistent with less exposure to LCFF-funded schooling.

</details>

<br>

## Result 3: Event Studies, with Prop 47 and police controls

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/thesis_figC2_minors_robust_event_study.png" title="Robust event study estimates of LCFF effects on arrests among minors" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Appendix Figure C2. Event study for minors with Prop 47 and police density controls. Dynamic effects on arrests among minors (per 1,000 population). Dots are estimates, bars are 95% confidence intervals, and the dashed line marks 2012. Y-axes differ across panels.

</div>

<br>

## Other patterns

- **Gender:** reductions are larger among males. Females show an increase in felony drug arrests.
- **Race:** the largest declines are among Black youth, but there is evidence of pretreatment effects, so I do not treat that result as causal.
- **Offense types:** the most consistent declines are in violent and felony sex arrests, which suggests effects on behavior and stability beyond purely economic motives for crime.

<br>

## Limitations

- **Arrests are only available by county**, so a large county like Los Angeles counts as one unit even though funding and need vary widely within it.
- **Arrest reporting is uneven** across counties and years.
- **County-level estimates are noisy**, and several effects are only marginally significant.
- **Mechanism evidence is suggestive.** Public data on many LCFF-funded programs does not extend before 2013, so I could only test a few channels.