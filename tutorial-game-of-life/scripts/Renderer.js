import { simulationShaderCode } from './shaders/simulationShaderModule.js';
import { cellShaderCode } from './shaders/cellShaderModule.js';
import { GRID_SIZE, WORKGROUP_SIZE } from "./values.js";

export class Renderer {
  constructor({
    device,
    bindGroups,
    vertexBuffer,
    vertexCount,
    pipelineLayout,
    context,
    format
  }) {
    this.device = device;
    this.context = context;
    this.bindGroups = bindGroups;
    this.vertexBuffer = vertexBuffer;
    this.vertexCount = vertexCount;
    this.step = 0;
    this.workgroupsRepartition = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    this.fullSize = GRID_SIZE * GRID_SIZE;

    this.computePipeline = this.createComputePipeline(device, pipelineLayout);
    this.renderPipeline = this.createRenderPipeline(device, format, pipelineLayout);
  }

  createComputePipeline(device, pipelineLayout) {
    const simulationShaderModule = device.createShaderModule({
      code: simulationShaderCode
    });
    return device.createComputePipeline({
      layout: pipelineLayout,
      compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain"
      }
    });
  }

  createRenderPipeline(device, format, pipelineLayout) {
    const cellShaderModule = device.createShaderModule({
      code: cellShaderCode
    });
    return device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [{
          arrayStride: 8,
          attributes: [{ format: "float32x2", offset: 0, shaderLocation: 0 }]
        }]
      },
      fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format }]
      }
    });
  }

  beginRenderPass(encoder, context) {
    return encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
        storeOp: "store",
      }],
    });
  }

  render() {
    const encoder = this.device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.bindGroups[this.step % 2]);
    computePass.dispatchWorkgroups(this.workgroupsRepartition, this.workgroupsRepartition);
    computePass.end();

    const pass = this.beginRenderPass(encoder, this.context);
    pass.setPipeline(this.renderPipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroups[this.step % 2]);
    pass.draw(this.vertexCount, this.fullSize);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
    ++this.step;
  }
}
