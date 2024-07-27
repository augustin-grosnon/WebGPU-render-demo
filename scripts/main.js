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

    const lineCoords = [
      [428.0, 440.0],
      [480.0, 500.0],
      [544.0, 568.0],
      [620.0, 662.0],
      [714.0, 770.0],
    ];

    const lines = lineCoords.map(
      line => line.map(
        coord => -((coord / 960.0) * 2.0 - 1.0)
      )
    ); // * setup values for webgpu render

    // ? should we setup the variables directly in the Renderer class instead of passing it as parameters?
    const renderer = new Renderer({
      device,
      bindGroups: Buffers.createBindGroups(
        device,
        bindGroupLayout,
        Buffers.createCircleParamsBuffer(device, [0.75, 0.0]), // ? can we send a simple value instead of a vector?
        Buffers.createLineBuffer(device, lines)
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
