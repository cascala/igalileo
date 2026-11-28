# Learning path: foundations

Ten notebooks that start from arithmetic and work up through algebra, functions, trigonometry, complex numbers and
calculus to differential equations and conic sections. Nothing is assumed beyond school arithmetic. Each notebook
takes 20 to 40 minutes, and every cell can be edited and re-run. Every plot is explained: what is on each axis, what
each curve is, and what every argument of the command means.

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Simplify and eval](01-simplify-and-eval.ipynb) | exact answers, `eval` for digits, and the two settings: `calc` (how answers are worked out) and `explain` (how much each command explains) |
| 2 | [Numbers](02-numbers.ipynb) | calculating, exact answers versus decimals, powers and roots, remainders, divisors and primes, variables |
| 3 | [Algebra](03-algebra.ipynb) | expressions, expanding and factoring, substituting, solving equations by hand and with `solve`, systems, your own functions |
| 4 | [Functions and graphs](04-functions-and-graphs.ipynb) | reading a plot (axes, labels, titles, legends), where a function is undefined, shifting and stretching graphs, exponentials and logarithms, intersections |
| 5 | [Polynomials](05-polynomials.ipynb) | degree and coefficients, roots and factors, long division, multiplicity, Vieta's formulas, the fundamental theorem of algebra, interpolation |
| 6 | [Trigonometry](06-trigonometry.ipynb) | radians, the unit circle, period, amplitude and phase, identities, trigonometric equations, solving triangles |
| 7 | [Complex numbers](07-complex-numbers.ipynb) | $i$, the complex plane, polar form, Euler's formula, roots of unity, a first look at the Mandelbrot set |
| 8 | [Calculus](08-calculus.ipynb) | limits, derivatives, maxima and minima, integrals as sums of rectangles, the fundamental theorem, Taylor polynomials |
| 9 | [Differential equations](09-differential-equations.ipynb) | growth, decay and cooling, `dsolve`, springs and oscillators, numeric solutions with `odeplot` step by step, the pendulum and its phase portrait |
| 10 | [Geometry and conics](10-geometry-and-conics.ipynb) | distances and lines, curves given by an equation, circles, ellipses, parabolas and hyperbolas, classifying $ax^2 + bxy + cy^2 + \ldots = 0$, rotating away the $xy$ term, eccentricity, cutting a cone |

After this path you can continue with any of the advanced paths:

* [Number theory](../number-theory/README.md): primes, factoring large numbers, modular arithmetic, cryptography.
* [Group theory](../group-theory/README.md): symmetry, permutations, cyclic groups, Lagrange's theorem.
* [Linear algebra](../linear-algebra/README.md): vectors, matrices, eigenvalues.
* [Chaos and fractals](../chaos/README.md): the logistic map, the Lorenz butterfly, the Mandelbrot set.
* [Differential geometry](../differential-geometry/README.md) and then [general relativity](../general-relativity/README.md).

The notebooks are generated from the plain-text sources in [`../src/foundations`](../src/foundations) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
