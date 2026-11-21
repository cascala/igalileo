# Learning path: general relativity

Nine notebooks that go from flat spacetime to black holes, gravitational waves and the age of the universe. Every
result is computed by Galileo from a metric, and every number is checked against observation. Each notebook takes 20 to
40 minutes, and every cell can be edited and re-run.

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Spacetime and special relativity](01-spacetime.ipynb) | the Minkowski metric, light cones, Lorentz boosts, proper time, muons, the twin paradox |
| 2 | [The equivalence principle](02-equivalence-principle.ipynb) | gravity in an accelerating rocket, Newton's law from $g_{tt}$, clocks at different heights, tides as curvature |
| 3 | [Einstein's equations](03-einstein-equations.ipynb) | $G_{ab} + \Lambda g_{ab} = 8\pi G T_{ab}$, finding Schwarzschild by guess and check, charge, $\Lambda$, Einstein's static universe |
| 4 | [Black holes](04-black-holes.ipynb) | horizon and singularity, spaghettification, falling in, Flamm's paraboloid, the Kerr black hole and its ergosphere |
| 5 | [Orbits and Mercury](05-orbits.ipynb) | the effective potential, the innermost stable orbit, rosettes, 43″ per century |
| 6 | [Light bending and shadows](06-light.ipynb) | the photon sphere, a light beam past a black hole, Eddington's eclipse, the M87 shadow |
| 7 | [Clocks, redshift and GPS](07-clocks-and-gps.ipynb) | gravitational redshift, Pound–Rebka, Sirius B, GPS's 38 µs per day |
| 8 | [Gravitational waves](08-gravitational-waves.ipynb) | an exact wave solution, a ring of particles, LIGO's sensitivity, the chirp of GW150914 |
| 9 | [Cosmology](09-cosmology.ipynb) | the FLRW metric, radiation, matter and dark energy, the age of the universe, the cosmic microwave background |

Prerequisites: calculus and the idea of a metric. If metrics, Christoffel symbols and curvature are new to you, the
[differential geometry path](../differential-geometry/README.md) builds them up; its parts 1 to 3 are enough to start
here, and parts 5 to 7 help from part 3 on.

Notebook 4 checks that the Kerr metric solves Einstein's equations, which takes about a minute.

The notebooks are generated from the plain-text sources in [`../src/general-relativity`](../src/general-relativity) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
