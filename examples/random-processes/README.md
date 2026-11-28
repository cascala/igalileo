# Learning path: random processes

Three lessons on quantities that change by chance over time: weather from day to day, a gambler's fortune, a
pollen grain in water, a stock price, the spins in a magnet. Each lesson opens with a real question, works out the
exact answer where one exists, and checks it against simulation. Every section ends with a **Try this**;
exercises with hints and answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Held, simplify, eval](00-held-simplify-eval.ipynb) | why answers come back as you typed them, `simplify` for the exact simplest form, `eval` for digits |
| 1 | [Markov chains](01-markov-chains.ipynb) | transition matrices, the stationary distribution and the long run, absorbing chains and the gambler's ruin, expected waiting times by first-step analysis |
| 2 | [Random walks, Brownian motion and arrivals](02-random-walks-and-brownian-motion.ipynb) | the simple random walk, the square-root law, walks in the plane, Brownian motion as a limit of walks, the Poisson process and exponential waiting times |
| 3 | [Stochastic differential equations, options and magnets](03-sdes-options-and-magnets.ipynb) | Euler–Maruyama, the Ornstein–Uhlenbeck process, geometric Brownian motion, pricing an option by simulation and by Black–Scholes, the Ising model and its phase transition |

Prerequisites: basic probability ([statistics 1](../statistics/README.md) helps) and matrix multiplication
([linear algebra 1](../linear-algebra/01-vectors-and-matrices.ipynb)); lesson 3 uses differential equations at the
level of the [differential equations](../differential-equations/README.md) path.

Commands introduced: `stationary`, `absorption`, `hitting`, `randchain`, `randwalk`, `arrivals`, `brownian`, `sde`,
`ising`, `bscall`, `bsput`. `help(name)` describes each one.

The notebooks are generated from the plain-text sources in [`../src/random-processes`](../src/random-processes) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
