# Learning path: probability and statistics

Eight lessons for a first undergraduate course in probability and statistics. Each lesson opens with a real question
(a gambler's losing bet, deaths by horse kick, the density of the Earth, the expansion of the universe), builds the
idea with small examples you can work by hand, and checks every answer by simulating it thousands of times. Every
section ends with a **Try this**; exercises with hints and answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Simplify and eval](00-simplify-and-eval.ipynb) | exact answers, `eval` for digits, and the `calc` setting: work answers out, give digits, or keep input as typed |
| 1 | [Describing data](01-describing-data.ipynb) | mean, median and mode, standard deviation and quartiles, histograms, symmetric and skewed data, z-scores |
| 2 | [Probability and simulation](02-probability-and-simulation.ipynb) | counting outcomes, complements and products, de Méré's problem, the birthday problem, conditional probability and Bayes' rule |
| 3 | [Discrete distributions](03-discrete-distributions.ipynb) | random variables, the binomial distribution, expected value and variance, the Poisson distribution and the horse kicks |
| 4 | [Continuous distributions](04-continuous-distributions.ipynb) | densities as areas, uniform and exponential distributions, the memoryless property, the normal distribution, percentiles |
| 5 | [Sampling and the central limit theorem](05-sampling-and-clt.ipynb) | the law of large numbers, the standard error $\sigma/\sqrt n$, the central limit theorem, the margin of error of a poll |
| 6 | [Estimation and confidence intervals](06-estimation-and-confidence.ipynb) | standard errors, what 95% confidence means, Student's t, intervals for proportions, why $n - 1$ |
| 7 | [Hypothesis tests](07-hypothesis-tests.ipynb) | null hypotheses and p-values, t-tests (one sample, paired, two samples), chi-square tests, false discoveries |
| 8 | [Regression and correlation](08-regression-and-correlation.ipynb) | scatter plots, correlation, least squares, residuals, Anscombe's quartet, regression to the mean |

Prerequisites: arithmetic and fractions for lessons 1 to 3; definite integrals
([foundations 7](../foundations/08-calculus.ipynb)) for lesson 4.

Commands introduced: `mean`, `median`, `mode`, `var`, `std`, `summary`, `tally`, `cumsum`, `hist`, `bar`, `seed`,
`rand`, `randn`, `randint`, `randbin`, `randpois`, `binopdf`, `binocdf`, `poisspdf`, `poisscdf`, `normpdf`, `normcdf`,
`norminv`, `tpdf`, `tinv`, `chi2cdf`, `ci`, `ttest`, `chi2test`, `cov`, `corr`, `linfit`, `scatter`. `help(name)`
describes each one, and `explain = "teach"` gives longer explanations.

The notebooks are generated from the plain-text sources in [`../src/statistics`](../src/statistics) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
