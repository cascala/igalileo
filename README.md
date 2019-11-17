## iGalileo

iGalileo is a [Galileo](https://github.com/cascala/galileo) kernel for use alongside the Jupyter framework

This allows users to experiment with Galileo using powerful Jupyter notebooks

![Illustration](doc/jupyter_1.png)

## Installation

Currently, you can only run this by building it from source. If there's interest I will build an easier way (send me an issue in the issue tracker to express interest)

Prerequisites:
* A scala and java environment including the sbt build tool
* Jupyter
* Download this repo from git and ensure the package can be built without error:
    * `git clone https://github.com/cascala/igalileo.git`
    * `cd igalileo`
    * `sbt package`

A small file `kernel.json` has to be placed in a new folder galileo in your home or user directory:
* Mac:`~/Library/Jupyter/kernels/galileo/kernel.json`
* Linux: `~/.local/share/jupyter/kernels\galileo\kernel.json`
* Windows: `%APPDATA%\jupyter\kernels\galileo\kernel.json`
with the following contents:
```
{
    "argv": [
        "<PATH_TO_THIS_REPO>/scripts/run.sh", 
        "-m",
        "Galileo.kernel",
        "-f", 
        "{connection_file}"
    ],
    "display_name": "Galileo",
    "language": "galileo"
}
```
Replace <PATH_TO_THIS_REPO> with the absolute path to your repo.
If all goes will, galileo should be listed as part of the available Jupyter kernels. You can see that list with the command
```
jupyter kernelspec list
```

Launch Jupyter as usual (`jupyter notebook`).
Good luck - don't hesitate to share any feedback as an issue
