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

    const initialColorsValues = [
      [134.0, 109.0, 255.0, 255.0],
      [0.0, 0.0, 132.0, 255.0],
      [254.0, 208.0, 46.0, 255.0],
      [251.0, 1.0, 249.0, 255.0]
    ];

    const initialColors = initialColorsValues.map(
      color => color.map(
        value => value / 255.0
      )
    );

    const colorUniformBuffer = Buffers.createColorUniformBuffer(device, initialColors);

    // ? should we setup the variables directly in the Renderer class instead of passing it as parameters?
    const renderer = new Renderer({
      device,
      bindGroups: Buffers.createBindGroups(
        device,
        bindGroupLayout,
        [
          Buffers.createCircleParamsBuffer(device, [0.75, 0.0]), // ? can we send a simple value instead of a vector?
          Buffers.createLineBuffer(device, lines),
          colorUniformBuffer
        ]
      ),
      vertexBuffer: Buffers.createVertexBuffer(device, vertices),
      vertexCount: vertices.length / 2,
      pipelineLayout: PipelineLayout.create(device, bindGroupLayout),
      ...CanvasContext.configure(canvas, device),
      colorUniformBuffer
    });

    const updateColors = () => {
      renderer
        .updateColorUniforms([
          hexToVec4(document.getElementById('bgTopColor').value),
          hexToVec4(document.getElementById('bgBottomColor').value),
          hexToVec4(document.getElementById('circleTopColor').value),
          hexToVec4(document.getElementById('circleBottomColor').value)
        ])
        .render();
    }

    const hexToVec4 = (hex) => {
      const color = parseInt(hex.slice(1), 16);
      const r = ((color >> 16) & 255) / 255;
      const g = ((color >> 8) & 255) / 255;
      const b = (color & 255) / 255;
      return [r, g, b, 1.0];
    }

    document.getElementById('updateColorsButton').addEventListener('click', updateColors);

    renderer.render();

  } catch (err) {
    console.error("Failed to initialize WebGPU:", err);
  }
});
