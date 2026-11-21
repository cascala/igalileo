# Learning path: differential geometry

Seven notebooks that build differential geometry from curves up to the Riemann tensor, computed with Galileo and
drawn in interactive 3D. Each one takes 15 to 30 minutes, and every cell can be edited and re-run.

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Curves](01-curves.ipynb) | parametrised curves, velocity, arc length, curvature, osculating circles, the helix |
| 2 | [Metrics and coordinates](02-metrics.ipynb) | the line element $ds^2$, polar and spherical coordinates, lengths from a metric, the hyperbolic plane |
| 3 | [Surfaces](03-surfaces.ipynb) | parametrised surfaces, the induced metric, area, cylinder, cone, torus, helicoid |
| 4 | [Gaussian curvature](04-gaussian-curvature.ipynb) | $K = \kappa_1\kappa_2$, the Theorema Egregium, folded pizza, map projections, Gauss–Bonnet |
| 5 | [Parallel transport](05-parallel-transport.ipynb) | Christoffel symbols, carrying a vector around a loop, holonomy, the Foucault pendulum |
| 6 | [Geodesics](06-geodesics.ipynb) | the geodesic equation, great circles, parallel lines that meet, the hyperbolic plane, cone and torus |
| 7 | [The Riemann tensor](07-riemann-tensor.ipynb) | Riemann, Ricci and Einstein tensors, flatness tests, the 3-sphere, invariants |

Prerequisites: calculus (derivatives and integrals) and a little linear algebra (matrices). No prior geometry beyond
high school is needed.

After this path, continue with [general relativity](../general-relativity/README.md), which uses the same tools on
spacetime.

The notebooks are generated from the plain-text sources in [`../src/differential-geometry`](../src/differential-geometry)
by `python3 examples/src/build.py`, then executed so that results and plots are stored with them.
