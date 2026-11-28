# Learning path: discovering physical laws

Four notebooks that let Galileo do what Kepler, Newton, Le Verrier and Einstein did: find laws in tables of
observations, notice where they fail, and check a new theory against the failure. You will use two commands built
for this path:

* `discover(data, vars)` searches for the simplest formula that explains one column of a table from the others
  (symbolic regression), including laws for rates of change such as $u''$;
* `check(law, data, vars)` tests one or several formulas against observations, fitting any unknown constants and
  judging the fit with the uncertainties.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Held, simplify, eval](00-held-simplify-eval.ipynb) | why answers come back as you typed them, `simplify` for the exact simplest form, `eval` for digits |
| 1 | [Kepler's third law](01-kepler.ipynb) | data tables, `scatter`, log-log plots, `discover` and how it picks the best formula, `check`, weighing Jupiter from its moons |
| 2 | [From Kepler to Newton](02-newton.ipynb) | `transform`, your own building blocks, Mars's ellipse, equal areas from $\phi'$, the inverse-square law, the Binet equation found in data |
| 3 | [Mercury doesn't fit](03-mercury.ipynb) | the 43″ anomaly, uncertainties and $\chi^2$, comparing hypotheses, the $1/p$ scaling that points to a $u^2$ term, and why positions could never show it |
| 4 | [Deriving the precession](04-precession.ipynb) | Einstein's orbit equation to $6\pi GM/(c^2 p)$ step by step, a prediction with no free constant |

**What this path does not claim.** General relativity cannot be derived from data. The data lead to a precise
question (which extra term in the orbit equation, and how big?) and test the answer; the answer itself, gravity as
curved spacetime, came from an idea. The notebooks say plainly which numbers are observations, which are computed from
published orbital elements, and which are invented to show how a method works.

Prerequisites: powers, logarithms and derivatives. The [general relativity path](../general-relativity/README.md)
derives the orbit equations used in parts 2 to 4.

The notebooks are generated from the plain-text sources in [`../src/discovery`](../src/discovery) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
