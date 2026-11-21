[![GitHub issues](https://img.shields.io/github/issues/cascala/igalileo.svg)](https://github.com/cascala/igalileo/issues)

# iGalileo

iGalileo is a Jupyter kernel for [Galileo](https://github.com/cascala/galileo-rs), a computer algebra system written in Rust. In a notebook you can do symbolic algebra, calculus, matrices, tensors and differential geometry, with interactive 2D and 3D plots.

![JupyterLab running Galileo, with plots](doc/jupyterlab_plot.png)

![An interactive 3D surface](doc/plot3d.png)

## Quick start: JupyterLab in Docker

The `cascala/igalileo` image bundles JupyterLab and the Galileo kernel. It runs natively on Intel (amd64) and Apple Silicon (arm64), and Docker is all you need:

```
docker run --rm -p 8888:8888 -v "$PWD:/home/galileo/notebooks/work" cascala/igalileo
```

Open the `http://127.0.0.1:8888/lab?token=...` link it prints. The example notebooks appear in the file browser. Your current directory is mounted as `work/`, so notebooks you save there stay on your machine.

Options:
* For a fixed token instead of a random one, add `-e JUPYTER_TOKEN=mysecret` before the image name.
* For the classic Notebook interface, add `notebook` after the image name.
* To get the latest image, run `docker pull cascala/igalileo`.

## Using Galileo in a notebook

* Each line of a cell is one Galileo statement, and each result is shown. End a line with `;` to hide its result.
* Symbolic results, metrics and curvature tensors are typeset with LaTeX.
* Plots are interactive: you can zoom, pan, and rotate 3D plots.
  * `plot(f, g, ..., x, a, b)` draws curves, and `parametric(fx, fy, t, a, b)` draws a parametric curve
  * `plot3d(f, x, a, b, y, c, d)` draws a surface z = f(x, y)
  * `surface(fx, fy, fz, u, a, b, v, c, d)` draws a parametric surface, and `parametric3d(fx, fy, fz, t, a, b)` draws a space curve
  * plots are values (`p = plot(...)`), and `show(p, q, ...)` overlays them
* Notebooks also store an SVG copy of each plot, so they display on GitHub and in other viewers.
* `help` lists all commands, and `help(name)` explains one. Shift+Tab on a name shows the same text.
* Tab completes Galileo's functions and the variables you defined.

The language is described in the [Galileo language reference](https://github.com/cascala/galileo/blob/master/docs/language.md), written for the Scala version. The [galileo-rs README](https://github.com/cascala/galileo-rs#readme) lists what changed and the new differential geometry commands.

### Example notebooks

* [A tour of Galileo](examples/galileo-tour.ipynb): numbers, simplification, calculus, 2D and 3D plotting, matrices
* [Differential geometry and physics](examples/differential-geometry-tour.ipynb): curvature of surfaces, geodesics in 3D, the Schwarzschild black hole, Mercury's perihelion precession, light bending, GPS clocks, the pendulum and the Lorenz attractor

### Learning paths

* [Differential geometry](examples/differential-geometry/README.md), seven notebooks: curves, metrics, surfaces, Gaussian curvature, parallel transport, geodesics and the Riemann tensor
* [General relativity](examples/general-relativity/README.md), nine notebooks: spacetime, the equivalence principle, Einstein's equations, black holes, Mercury's orbit, light bending, GPS, gravitational waves and cosmology

More notebooks go in [examples/](examples/), and the Docker image includes all of them. The learning-path notebooks are generated from the text sources in [examples/src](examples/src) with `python3 examples/src/build.py`, then executed with `examples/src/execute.sh` so that their results and plots are stored with them.

## Using your own Jupyter, with the kernel in Docker

If Jupyter already runs on your machine, you can install just the kernel. It starts in a container each time a notebook opens.

1. Copy [igalileo/kernel.json](igalileo/kernel.json) into a new folder named `galileo` in your Jupyter kernels directory:
   * Mac: `~/Library/Jupyter/kernels/galileo/kernel.json`
   * Linux: `~/.local/share/jupyter/kernels/galileo/kernel.json`
   * Windows: `%APPDATA%\jupyter\kernels\galileo\kernel.json`
2. Edit it so the first argument is the absolute path to [igalileo/run_docker.sh](igalileo/run_docker.sh). Keep that script executable.
3. Check that `jupyter kernelspec list` shows `galileo`, then start Jupyter and pick "Galileo (Docker)".

`run_docker.sh` uses `cascala/igalileo:latest`. Set `IGALILEO_IMAGE` to use a different tag. For interactive plots in your own JupyterLab, also run `pip install plotly`. Without it you get the SVG version.

## Without Docker

Install the engine with Rust's `cargo`, then the kernel with `pip`:

```
cargo install --git https://github.com/cascala/galileo-rs   # puts `galileo` on your PATH
pip install "git+https://github.com/cascala/igalileo#subdirectory=kernel"
python -m galileo_kernel.install --user
```

Start Jupyter and pick "Galileo". Set `GALILEO_BIN` if `galileo` is not on your `PATH`.

### Building the Docker image

The image builds the engine from source, which it receives as a named build context:

```
docker build --build-context galileo=../galileo-rs -t cascala/igalileo .
# or straight from GitHub:
docker build --build-context galileo=https://github.com/cascala/galileo-rs.git -t cascala/igalileo .
```

To build and push for Intel and Apple Silicon at once, see [NOTES](NOTES). The image's entry point takes `lab` (the default), `notebook`, or `kernel CONNECTION_FILE`, which `run_docker.sh` uses.

## How it works

The mathematics happens in the `galileo` executable from [galileo-rs](https://github.com/cascala/galileo-rs). Started as `galileo --kernel`, it reads cells on stdin and answers each with one line of JSON holding MIME bundles. The kernel in [kernel/](kernel/) is a small [ipykernel](https://github.com/ipython/ipykernel) wrapper that passes cells, completion and help requests to it. Plots go out as `display_data` with three representations: a Plotly figure (`application/vnd.plotly.v1+json`), an SVG image, and a text fallback. Interrupting a cell restarts the engine, and the variables you defined are lost.

Version 0.2.1 and earlier used a JVM kernel built on the Scala version of Galileo. Those images are still on Docker Hub under their version tags.

Feedback and bug reports are welcome as [issues](https://github.com/cascala/igalileo/issues/new).
