[![GitHub issues](https://img.shields.io/github/issues/cascala/igalileo.svg)](https://github.com/cascala/igalileo/issues)

# iGalileo

iGalileo is a Jupyter kernel for [Galileo](https://github.com/cascala/galileo), a computer algebra system written in Scala. In a notebook you can do symbolic algebra, calculus, matrices, tensors and differential geometry, with interactive 2D and 3D plots.

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

The full language is described in the [Galileo language reference](https://github.com/cascala/galileo/blob/master/docs/language.md).

### Example notebooks

* [A tour of Galileo](examples/galileo-tour.ipynb): numbers, simplification, calculus, 2D and 3D plotting, matrices
* [Differential geometry and physics](examples/differential-geometry-tour.ipynb): curvature of surfaces, geodesics in 3D, the Schwarzschild black hole, Mercury's perihelion precession, light bending, GPS clocks, the pendulum and the Lorenz attractor

More notebooks go in [examples/](examples/), and the Docker image includes all of them.

## Using your own Jupyter, with the kernel in Docker

If Jupyter already runs on your machine, you can install just the kernel. It starts in a container each time a notebook opens.

1. Copy [igalileo/kernel.json](igalileo/kernel.json) into a new folder named `galileo` in your Jupyter kernels directory:
   * Mac: `~/Library/Jupyter/kernels/galileo/kernel.json`
   * Linux: `~/.local/share/jupyter/kernels/galileo/kernel.json`
   * Windows: `%APPDATA%\jupyter\kernels\galileo\kernel.json`
2. Edit it so the first argument is the absolute path to [igalileo/run_docker.sh](igalileo/run_docker.sh). Keep that script executable.
3. Check that `jupyter kernelspec list` shows `galileo`, then start Jupyter and pick "Galileo (Docker)".

`run_docker.sh` uses `cascala/igalileo:latest`. Set `IGALILEO_IMAGE` to use a different tag. For interactive plots in your own JupyterLab, also run `pip install plotly`. Without it you get the SVG version.

## Building from source

You need JDK 17 or later and [sbt](https://www.scala-sbt.org/).

iGalileo needs Galileo 0.2.1, which isn't on Maven Central yet, so publish Galileo locally first:

```
git clone https://github.com/cascala/galileo.git && (cd galileo && sbt publishLocal)
git clone https://github.com/cascala/igalileo.git && cd igalileo
sbt test stage
```

This produces `target/universal/stage/bin/igalileo`. To use it with your own Jupyter, point `kernel.json` at [igalileo/run_sbt.sh](igalileo/run_sbt.sh), or straight at that launcher, with `"{connection_file}"` as the second argument.

### Building the Docker image

The image builds Galileo from source, which it receives as a named build context:

```
docker build --build-context galileo=../galileo -t cascala/igalileo .
# or straight from GitHub:
docker build --build-context galileo=https://github.com/cascala/galileo.git -t cascala/igalileo .
```

To build and push for Intel and Apple Silicon at once, see [NOTES](NOTES). The image's entry point takes `lab` (the default), `notebook`, or `kernel CONNECTION_FILE`, which `run_docker.sh` uses.

## How it works

The kernel is a JVM process. It speaks the [Jupyter messaging protocol](https://jupyter-client.readthedocs.io/en/latest/messaging.html) (version 5.3) over ZeroMQ using [JeroMQ](https://github.com/zeromq/jeromq), and evaluates code in-process with Galileo's parser and expression handler. Plots go out as `display_data` with three representations: a Plotly figure (`application/vnd.plotly.v1+json`), an SVG image, and a text fallback.

Feedback and bug reports are welcome as [issues](https://github.com/cascala/igalileo/issues/new).
