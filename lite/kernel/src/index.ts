import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { GalileoKernel } from './kernel';
import logoSvg from '../style/logo.svg';

// the builder may hand us the SVG text or a URL; kernelspec resources need a URL
const logo = logoSvg.trim().startsWith('<') ? `data:image/svg+xml;base64,${btoa(logoSvg)}` : logoSvg;

const plugin: JupyterFrontEndPlugin<void> = {
  id: '@galileo/jupyterlite-kernel:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterFrontEnd, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'galileo',
        display_name: 'Galileo',
        language: 'galileo',
        argv: [],
        resources: { 'logo-32x32': logo, 'logo-64x64': logo }
      },
      create: async (options: IKernel.IOptions) => new GalileoKernel(options, app.serviceManager.contents)
    });
  }
};

export default [plugin];
