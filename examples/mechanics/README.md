# Learning path: mechanics

Seven lessons for a first university course in classical mechanics, from a baseball in flight to chaos in the double
pendulum and the turning plane of Foucault's pendulum. Quantities carry their units (`45 m/s`, `const.g`), so every
answer comes out in metres, seconds or kilometres per hour. Each lesson opens with a question, builds the idea with
small calculations, and lets Galileo solve, simulate and draw. Every section ends with a **Try this**; exercises with
hints and answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Held, simplify, eval](00-held-simplify-eval.ipynb) | why answers come back as you typed them, `simplify` for the exact simplest form, `eval` for digits |
| 1 | [Motion and Newton's laws](01-motion-and-newtons-laws.ipynb) | units and vectors, Newton's three laws, projectiles in a vacuum and with air drag, terminal velocity, an animated flight |
| 2 | [Energy and momentum](02-energy-and-momentum.ipynb) | work and kinetic energy, braking distances, potential energy and its conservation, elastic and inelastic collisions, the rocket equation and staging |
| 3 | [Rotation](03-rotation.ipynb) | torque as a cross product, moments of inertia by integration, the race of rolling shapes, angular momentum and the spinning skater, the precession of a top |
| 4 | [Gravity and orbits](04-gravity-and-orbits.ipynb) | orbital speed and period, geostationary orbits, Kepler's three laws from Newton's force, Hohmann transfers to orbit and to Mars, the figure-eight three-body orbit and chaos |
| 5 | [Lagrangian mechanics](05-lagrangian-mechanics.ipynb) | the principle of least action tested on a thrown ball, the Euler–Lagrange equation, the double pendulum derived, simulated and chaotic |
| 6 | [Hamiltonian mechanics and phase space](06-hamiltonian-mechanics.ipynb) | Hamilton's equations, phase portraits and the separatrix, Liouville's theorem, Noether's theorem, the heavy top with nutation |
| 7 | [Rigid bodies and non-inertial frames](07-rigid-bodies-and-frames.ipynb) | centrifugal and Coriolis forces, the eastward drop, Foucault's pendulum, Euler's equations and the tennis racket theorem |

Prerequisites: calculus and vectors ([foundations](../foundations/README.md)); lessons 5 and 6 use partial
derivatives ([multivariable calculus 1](../multivariable/README.md)). Afterwards: the
[oscillations and waves path](../waves/README.md), [chaos and fractals](../chaos/README.md), and, for gravity beyond
Newton, [general relativity](../general-relativity/README.md).

Commands introduced: units such as `km/h` and `convert`, the constants `const.g`, `const.G`, `const.Mearth` and
others, `animate`, `odeplot`, `odedata`, `parametric` and `cross`. `help(name)` describes each one, and
`explain = "teach"` gives longer explanations with the numbers of each run.

The notebooks are generated from the plain-text sources in [`../src/mechanics`](../src/mechanics) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
