# Learning path: partial differential equations

Three lessons on the equations of heat, waves and equilibrium: how a rod cools, how a guitar string sounds, how
the temperature settles in a plate. Each lesson derives the equation from a simple physical picture, solves it on a
grid the way a computer does, and checks the result against an exact solution. Every section ends with a
**Try this**; exercises with hints and answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Held, simplify, eval](00-held-simplify-eval.ipynb) | why answers come back as you typed them, `simplify` for the exact simplest form, `eval` for digits |
| 1 | [The heat equation](01-the-heat-equation.ipynb) | where $u_t = k u_{xx}$ comes from, the explicit scheme as a matrix step, instability and the condition $r \le 1/2$, Crank–Nicolson, fixed and insulated ends, heat sources, Fourier's series solution |
| 2 | [Waves on a string](02-waves-on-a-string.ipynb) | the wave equation from beads on a string, d'Alembert's travelling waves, reflection at fixed and free ends, pitch and overtones of a plucked string, the Courant condition, damping |
| 3 | [Laplace and Poisson](03-laplace-and-poisson.ipynb) | steady states in a plate, the five-point formula and the maximum principle, superposition, separation of variables, Jacobi and over-relaxation, a membrane under pressure, a hot spot |

Prerequisites: derivatives and matrix multiplication ([linear algebra 1](../linear-algebra/01-vectors-and-matrices.ipynb));
the [differential equations](../differential-equations/README.md) path helps.

Commands introduced: `heat`, `wave`, `laplace` (with 7 or 8 arguments), `poisson`, `pdeplot`. `help(name)` describes
each one.

The notebooks are generated from the plain-text sources in [`../src/pde`](../src/pde) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
