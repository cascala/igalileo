# Learning path: calculus of variations

Three lessons on finding the best curve: the fastest slide, the shape of a soap film or a hanging chain, the path a
ball or a planet actually takes. Each lesson starts from a classic problem, derives its Euler–Lagrange equation,
finds the answer exactly where possible and numerically where not, and compares the two. Every section ends with a
**Try this**; exercises with hints and answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Shortest paths and the fastest slide](01-shortest-paths-and-the-fastest-slide.ipynb) | functionals and Lagrangians, the Euler–Lagrange equation, straight lines as shortest paths, Bernoulli's brachistochrone and the cycloid, conserved quantities (Beltrami's identity), numerical extremals |
| 2 | [Hanging chains and soap films](02-hanging-chains-and-soap-films.ipynb) | the catenary and the catenoid, two solutions or none, when a soap film snaps, constraints with a Lagrange multiplier, the hanging chain versus the parabola, Dido's problem and the circle |
| 3 | [The principle of least action](03-the-principle-of-least-action.ipynb) | $L = T - V$ and the action, Newton's law from the Euler–Lagrange equation, the pendulum, energy conservation, Noether's theorem and Kepler orbits, chaos in the double pendulum |

Prerequisites: derivatives and integrals; the [differential equations](../differential-equations/README.md) path helps.

Commands introduced: `eulerlagrange`, `energy`, `action`, `extremal`, `motion`. `help(name)` describes each one.

The notebooks are generated from the plain-text sources in [`../src/variations`](../src/variations) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
