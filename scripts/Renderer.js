import { cellShaderCode } from './shaders/cellShaderModule.js';

export class Renderer {
  constructor({
    device,
    bindGroups,
    vertexBuffer,
    vertexCount,
    pipelineLayout,
    context,
    format,
  }) {
    this.device = device;
    this.context = context;
    this.bindGroups = bindGroups;
    this.vertexBuffer = vertexBuffer;
    this.vertexCount = vertexCount;

    this.renderPipeline = this.createRenderPipeline(device, format, pipelineLayout);
  }

  createRenderPipeline(device, format, pipelineLayout) {
    const cellShaderModule = device.createShaderModule({ code: cellShaderCode });
    return device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [{
          arrayStride: 8,
          attributes: [{ format: "float32x2", offset: 0, shaderLocation: 0 }],
        }],
      },
      fragment: {
        module: cellShaderModule,
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
}
