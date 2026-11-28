# Learning path: multivariable calculus

Seven lessons for a first course in multivariable calculus (Calculus III), from functions of two variables to the
theorems of Green, Stokes and Gauss. Each lesson opens with a question, builds the idea with small examples you work
by hand, and uses Galileo to check and to draw. Every section ends with a **Try this**; exercises with hints and
answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Simplify and eval](00-simplify-and-eval.ipynb) | exact answers, `eval` for digits, and the `calc` setting: work answers out, give digits, or keep input as typed |
| 1 | [Functions of two variables](01-functions-of-two-variables.ipynb) | graphs as surfaces, slices, level curves and contour maps, peaks, pits and saddles, implicit curves, level surfaces |
| 2 | [Partial derivatives and the gradient](02-partial-derivatives-and-gradient.ipynb) | partial derivatives as slopes, Clairaut's theorem, tangent planes and linear approximation, directional derivatives, the gradient and steepest ascent, gradients in polar and spherical coordinates, the chain rule |
| 3 | [Optimization](03-optimization.ipynb) | the closed interval method, critical points, the Hessian and the second derivative test, least squares line fitting, numeric minimization (BFGS) |
| 4 | [Lagrange multipliers](04-lagrange-multipliers.ipynb) | constrained extremes, why the gradients are parallel, closest points, the meaning of λ, a box of largest volume, two constraints |
| 5 | [Multiple integrals and the bell curve](05-multiple-integrals.ipynb) | iterated integrals, regions between curves, changing the order, polar coordinates and the Jacobian, the Gaussian integral, the error function, the normal distribution, the gamma function, triple integrals |
| 6 | [Vector fields and line integrals](06-vector-fields-and-line-integrals.ipynb) | vector fields, work and arc length, path independence, potentials, the curl test, a field with a hole, gravity |
| 7 | [Green, Stokes and Gauss](07-the-big-theorems.ipynb) | circulation and Green's theorem, divergence, flux, the divergence theorem and Gauss's law, Stokes' theorem |

Prerequisites: single-variable calculus ([foundations 7](../foundations/07-calculus.ipynb)) and conic sections
([foundations 9](../foundations/09-geometry-and-conics.ipynb)); vectors and the dot product
([linear algebra 1](../linear-algebra/01-vectors-and-matrices.ipynb)) help. Afterwards,
[differential geometry](../differential-geometry/README.md) takes curves, surfaces and Stokes' theorem further.

Commands introduced: `contour`, `fieldplot`, `grad`, `div`, `curl`, `laplacian`, `jacobian`, `hessian`, `critical`,
`classify`, `minimize`/`maximize`, `lagrange`, `potential`, `lineint`, `flux`/`surfint`, `erf`, `gamma`. `help(name)`
describes each one, and `explain = "teach"` gives longer explanations with the numbers of each run.

The notebooks are generated from the plain-text sources in [`../src/multivariable`](../src/multivariable) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
