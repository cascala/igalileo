from ipykernel.kernelapp import IPKernelApp

from .kernel import GalileoKernel

IPKernelApp.launch_instance(kernel_class=GalileoKernel)
