import { Adapter } from './Adapter.js';
import { Device } from './Device.js';
import { Renderer } from './Renderer.js';

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const canvas = document.querySelector("canvas");

    if (!navigator.gpu)
      throw new Error("WebGPU not supported on this browser.");

    const adapter = await Adapter.get();
    const device = await Device.get(adapter);

    const renderer = new Renderer(device, canvas);

    const updateColors = () => {
      renderer
        .updateColorUniforms([
          hexToVec4(document.getElementById('bgTopColor').value),
          hexToVec4(document.getElementById('bgBottomColor').value),
          hexToVec4(document.getElementById('shapeTopColor').value),
          hexToVec4(document.getElementById('shapeBottomColor').value)
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

    document.getElementById('toggleShaderButton').addEventListener('click', () => {
      renderer.currentShader = renderer.currentShader === 'default' ? 'demo' : 'default';
      renderer.updateShader().render();
    });

    const downloadTextFile = (filename, text) => {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    document.getElementById('downloadShaderButton').addEventListener('click', () => {
      const shaderCode = renderer.shaderBuilder.generateShader(true);
      downloadTextFile('shader.wgsl', shaderCode);
    });

    renderer.render();

  } catch (err) {
    console.error("Failed to initialize WebGPU:", err);
  }
});
