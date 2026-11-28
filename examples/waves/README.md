# Learning path: oscillations and waves

Seven lessons for a first university course on vibrations and waves, from a mass on a spring to the colours of the
rainbow. Quantities carry their units, sounds are sampled and taken apart with the fast Fourier transform, and waves
move in animations you can play. Each lesson opens with a question, builds the idea with small calculations, and lets
Galileo solve, simulate and draw. Every section ends with a **Try this**; exercises with hints and answers close each
lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Held, simplify, eval](00-held-simplify-eval.ipynb) | why answers come back as you typed them, `simplify` for the exact simplest form, `eval` for digits |
| 1 | [The harmonic oscillator](01-harmonic-oscillator.ipynb) | frequency from mass and stiffness, underdamped, critical and overdamped motion, shock absorbers, driven oscillations, resonance curves and the quality factor |
| 2 | [Coupled oscillators](02-coupled-oscillators.ipynb) | normal modes as eigenvectors, beats and energy transfer between weakly coupled pendulums, the vibrations of CO₂, the modes of a chain of masses |
| 3 | [The wave equation](03-wave-equation.ipynb) | the wave equation for a string, travelling pulses, standing waves and harmonics, the Fourier series of a plucked string and why plucking position changes the tone |
| 4 | [Sound and the Fourier transform](04-sound-and-fourier.ipynb) | sampled sound, spectra with `fft`, timbre as a mix of harmonics, beats, frequency resolution, the Doppler shift of a passing siren |
| 5 | [Dispersion](05-dispersion.ipynb) | dispersion relations, phase and group velocity, wave packets on deep water, swell from distant storms |
| 6 | [Light as a wave](06-light-as-a-wave.ipynb) | interference, Young's double slit, diffraction by adding Huygens waves, gratings and the colours of a CD, the resolution of a telescope |
| 7 | [Geometric optics](07-geometric-optics.ipynb) | Snell's law from Fermat's least time, total internal reflection, thin lenses and ray diagrams, Descartes' rainbow |

Prerequisites: calculus ([foundations](../foundations/README.md)); lesson 2 uses eigenvalues
([linear algebra](../linear-algebra/README.md)). [Mechanics 1](../mechanics/01-motion-and-newtons-laws.ipynb) helps.
Afterwards: the [differential equations path](../differential-equations/README.md) treats the heat and wave equations
in more depth, and the [mechanics path](../mechanics/README.md) returns to normal modes in the double pendulum.

Commands introduced: `fft`, `freqs`, `animate`, `eig` and `eigvec` for normal modes, `dsolve` for systems, `bar`, and
units such as `Hz` and `nm`. `help(name)` describes each one, and `explain = "teach"` gives longer explanations with
the numbers of each run.

The notebooks are generated from the plain-text sources in [`../src/waves`](../src/waves) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
