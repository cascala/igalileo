# Learning path: differential equations

Eight lessons for a first undergraduate course in ordinary differential equations, ending with the heat, wave and
Laplace equations. Each lesson opens with a question from physics, biology or engineering, builds the method with small
examples you work by hand, and uses Galileo to check, to draw and to take on the bigger computations. Every section ends
with a **Try this**; exercises with hints and answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Simplify and eval](00-simplify-and-eval.ipynb) | exact answers, `eval` for digits, and the `calc` setting: work answers out, give digits, or keep input as typed |
| 1 | [First-order equations, slope fields and equilibria](01-first-order-equations.ipynb) | slope fields, separable equations, a draining tank, the logistic equation, equilibria and stability, a fishery bifurcation, blow-up and non-uniqueness |
| 2 | [Linear first-order equations](02-linear-first-order.ipynb) | the integrating factor, mixing tanks, transient and steady state of a driven circuit, Euler's method and its error |
| 3 | [Second-order equations, oscillations and resonance](03-second-order.ipynb) | the characteristic equation, under-, critically and overdamped springs, undetermined coefficients, resonance and beats, the amplitude response, Cauchy–Euler equations |
| 4 | [Laplace transforms, switches and hammer blows](04-laplace-transforms.ipynb) | the transform and its table, solving initial value problems, partial fractions, the Heaviside step, the Dirac delta, impulse response and transfer function |
| 5 | [Systems and the phase plane](05-systems-and-phase-plane.ipynb) | linear systems, saddles, nodes, spirals and centers, linearization with the Jacobian, competing species, predator and prey, the pendulum |
| 6 | [Series solutions](06-series-solutions.ipynb) | power series and recurrences, Airy's equation, Hermite and Legendre polynomials, radius of convergence, Bessel functions |
| 7 | [Fourier series](07-fourier-series.ipynb) | orthogonality, coefficients, the Gibbs phenomenon, smoothness and decay, half-range series, $\sum 1/n^2 = \pi^2/6$ |
| 8 | [Heat, waves and potentials](08-partial-differential-equations.ipynb) | separation of variables, the heat equation on a rod, a plucked string and its harmonics, Laplace's equation on a plate |

Prerequisites: single-variable calculus ([foundations 7](../foundations/07-calculus.ipynb)); complex numbers
([foundations 6](../foundations/06-complex-numbers.ipynb)) for lesson 3; eigenvalues
([linear algebra 6](../linear-algebra/06-eigenvalues.ipynb)) for lesson 5; partial derivatives
([multivariable calculus 2](../multivariable/02-partial-derivatives-and-gradient.ipynb)) for lesson 8.
[Foundations 8](../foundations/08-differential-equations.ipynb) is a shorter first look.

Commands introduced: `dsolve` (separable, linear, constant coefficients, Cauchy–Euler, systems), `fieldplot` for slope
fields, `window`, `iterate`, `laplace`, `ilaplace`, `partfrac`, `heaviside`, `dirac`, `sign`, `assume` and `forget`,
`odeplot`, `jacobian`, `seriessolve`, `besselj`, `hermite`, `legendre`, `fourier`, `surface`, `contour`,
`laplacian`. `help(name)` describes each one, and `explain = "teach"` gives longer explanations.

The notebooks are generated from the plain-text sources in [`../src/differential-equations`](../src/differential-equations)
by `python3 examples/src/build.py`, then executed so that results and plots are stored with them.
