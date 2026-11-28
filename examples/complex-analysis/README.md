# Learning path: complex analysis

Eight lessons for a first course in complex analysis, from pictures of complex functions to residues, real integrals
and the flow around a wing. Each lesson opens with a question, builds the idea with small examples you work by hand,
and uses Galileo to check and to draw. Every section ends with a **Try this**; exercises with hints and answers close
each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Held, simplify, eval](00-held-simplify-eval.ipynb) | why answers come back as you typed them, `simplify` for the exact simplest form, `eval` for digits |
| 1 | [Complex functions and how to picture them](01-complex-functions.ipynb) | complex numbers in polar form, real and imaginary parts, maps of a grid with `cmap`, domain coloring with `cplot`, zeros and poles |
| 2 | [Analytic functions](02-analytic-functions.ipynb) | the complex derivative, the Cauchy–Riemann equations, functions that are not analytic, harmonic functions and harmonic conjugates |
| 3 | [Contour integrals](03-contour-integrals.ipynb) | integrals along paths with `cint`, path dependence, the integral of $z^n$ around a circle, winding numbers, the ML estimate |
| 4 | [Cauchy's theorem and the integral formula](04-cauchy.ipynb) | Cauchy's theorem, the integral formula, the mean value property, derivatives of all orders, Liouville's theorem and the fundamental theorem of algebra |
| 5 | [Taylor and Laurent series](05-taylor-and-laurent.ipynb) | why $1/(1 + x^2)$ has radius of convergence 1, Laurent series on annuli, removable singularities, poles and essential singularities, the residue |
| 6 | [The residue theorem](06-residues.ipynb) | the residue theorem, residue formulas, the argument principle and Rouché's theorem, summing $\sum 1/k^2$ with residues |
| 7 | [Real integrals by residues](07-real-integrals.ipynb) | rational integrals over the line, Jordan's lemma and Fourier integrals, indented contours and $\int \sin x/x$, integrals over a period |
| 8 | [Conformal maps and the flow around a wing](08-conformal-maps.ipynb) | angle preservation, Möbius and Cayley maps, complex potentials and streamlines, the Joukowski airfoil |

Prerequisites: complex numbers ([foundations 6](../foundations/06-complex-numbers.ipynb)) and functions of two
variables and line integrals ([multivariable calculus 1 and 6](../multivariable/README.md)). Afterwards, the tools
return in physics: Fourier integrals in waves, residues in scattering, conformal maps in electrostatics.

Commands introduced: `cmap`, `cplot`, `cint`, `laurent`, `residue`, `poles`, together with `real`, `imag`, `conj`,
`abs` and `arg`. `help(name)` describes each one, and `explain = "teach"` gives longer explanations with the numbers of
each run.

The notebooks are generated from the plain-text sources in [`../src/complex-analysis`](../src/complex-analysis) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
