import { shaderCode } from './shaderModule.js';

export class Renderer {
  constructor({
    device,
    bindGroups,
    vertexBuffer,
    vertexCount,
    pipelineLayout,
    context,
    format,
    colorUniformBuffer
  }) {
    this.device = device;
    this.context = context;
    this.bindGroups = bindGroups;
    this.vertexBuffer = vertexBuffer;
    this.vertexCount = vertexCount;
    this.colorUniformBuffer = colorUniformBuffer;

    this.renderPipeline = this.createRenderPipeline(device, format, pipelineLayout);
  }

  createRenderPipeline(device, format, pipelineLayout) {
    const shaderModule = device.createShaderModule({ code: shaderCode });
    return device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
        buffers: [{
          arrayStride: 8,
          attributes: [{ format: "float32x2", offset: 0, shaderLocation: 0 }],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format }],
      },
    });
  }

  beginRenderPass(encoder, context) {
    return encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: "store",
      }],
    });
  }

  render() {
    const encoder = this.device.createCommandEncoder();

    const pass = this.beginRenderPass(encoder, this.context);
    pass.setPipeline(this.renderPipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroups[0]);
    pass.draw(this.vertexCount);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }

  updateColorUniforms(colors) {
    const colorData = new Float32Array(colors.flat());
    this.device.queue.writeBuffer(this.colorUniformBuffer, 0, colorData);
    return this;
  }
}
