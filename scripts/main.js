import { Adapter } from './Adapter.js';
import { Device } from './Device.js';
import { CanvasContext } from './CanvasContext.js';
import { BindGroupLayout } from './BindGroupLayout.js';
import { PipelineLayout } from './PipelineLayout.js';
import { Buffers } from './Buffers.js';
import { Renderer } from './Renderer.js';

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const canvas = document.querySelector("canvas");

    if (!navigator.gpu)
      throw new Error("WebGPU not supported on this browser.");

    const adapter = await Adapter.get();
    const device = await Device.get(adapter);

    const bindGroupLayout = BindGroupLayout.create(device);
    const vertices = Buffers.createVertexArray();

    // ? should we setup the variables directly in the Renderer class instead of passing it as parameters?
    const renderer = new Renderer({
      device,
      bindGroups: Buffers.createBindGroups(
        device,
        bindGroupLayout,
        Buffers.createUniformBuffer(device, [0.75, 0.0])
      ),
      vertexBuffer: Buffers.createVertexBuffer(device, vertices),
      vertexCount: vertices.length / 2,
      pipelineLayout: PipelineLayout.create(device, bindGroupLayout),
      ...CanvasContext.configure(canvas, device)
    });

    renderer.render();

  } catch (err) {
    console.error("Failed to initialize WebGPU:", err);
  }
});