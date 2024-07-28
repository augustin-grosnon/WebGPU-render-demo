import { shaderCode } from './shaderModule.js';
import { CanvasContext } from './CanvasContext.js';
import { BindGroupLayout } from './BindGroupLayout.js';
import { PipelineLayout } from './PipelineLayout.js';
import { Buffers } from './Buffers.js';

export class Renderer {
  constructor(device, canvas) {
    this.device = device;
    this.selectedLineIndex = null;

    this
      .initializeLines()
      .initializeColors()
      .initializeBuffers()
      .initializeCanvasContext(canvas)
      .initializeRenderPipeline()
      .setupEventListeners(canvas);
  }

  initializeLines() {
    const lineCoords = [
      [428.0, 440.0],
      [480.0, 500.0],
      [544.0, 568.0],
      [620.0, 662.0],
      [714.0, 770.0],
    ];

    this.lines = lineCoords.map(
      line => line.map(
        coord => -((coord / 960.0) * 2.0 - 1.0)
      )
    ); // * setup values for webgpu render

    return this;
  }

  initializeColors() {
    const initialColorsValues = [
      [134.0, 109.0, 255.0, 255.0],
      [0.0, 0.0, 132.0, 255.0],
      [254.0, 208.0, 46.0, 255.0],
      [251.0, 1.0, 249.0, 255.0]
    ];

    this.initialColors = initialColorsValues.map(
      color => color.map(
        value => value / 255.0
      )
    );

    return this;
  }

  initializeBuffers() {
    this.lineBuffer = Buffers.createLineBuffer(this.device, this.lines);
    this.colorUniformBuffer = Buffers.createColorUniformBuffer(this.device, this.initialColors);
    this.circleParamsBuffer = Buffers.createCircleParamsBuffer(this.device, [0.75, 0.0]);
    this.bindGroupLayout = BindGroupLayout.create(this.device);
    const vertices = Buffers.createVertexArray();
    this.bindGroup = Buffers.createBindGroup(
      this.device,
      this.bindGroupLayout,
      [
        this.circleParamsBuffer,
        this.lineBuffer,
        this.colorUniformBuffer
      ]
    );
    this.vertexBuffer = Buffers.createVertexBuffer(this.device, vertices);
    this.vertexCount = vertices.length / 2;

    return this;
  }

  initializeCanvasContext(canvas) {
    const { context, format } = CanvasContext.configure(canvas, this.device);
    this.context = context;
    this.format = format;

    return this;
  }

  initializeRenderPipeline() {
    this.renderPipeline = this.createRenderPipeline(
      this.device,
      this.format,
      PipelineLayout.create(this.device, this.bindGroupLayout)
    );

    return this;
  }

  setupEventListeners(canvas) {
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const y = ((event.clientY - rect.top) / canvas.height) * -2 + 1;
      this.selectedLineIndex = this.getLineIndexFromCoords(y);
    });

    document.addEventListener('keydown', (event) => {
      if (this.selectedLineIndex === null)
        return;
      this.handleLineMovement(event.key);
      const lineBuffer = Buffers.createLineBuffer(this.device, this.lines);
      this.updateLineBuffer(lineBuffer);
      this.render();
    });

    return this;
  }

  handleLineMovement(key) {
    const line = this.lines[this.selectedLineIndex];
    switch (key) {
      case 'ArrowUp':
        line[0] += 0.01;
        line[1] += 0.01;
        break;
      case 'ArrowDown':
        line[0] -= 0.01;
        line[1] -= 0.01;
        break;
      case 'ArrowLeft':
        line[0] -= 0.01;
        line[1] += 0.01;
        break;
      case 'ArrowRight':
        line[0] += 0.01;
        line[1] -= 0.01;
        break;
    }

    return this;
  }

  getLineIndexFromCoords(y) {
    const threshold = 0.02;
    for (let i = 0; i < this.lines.length; ++i) {
      const [start, end] = this.lines[i];
      const distance = Math.abs(y - (start + end) / 2);
      if (distance < threshold)
        return i;
    }
    return null;
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
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(this.vertexCount);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }

  updateColorUniforms(colors) {
    const colorData = new Float32Array(colors.flat());
    this.device.queue.writeBuffer(this.colorUniformBuffer, 0, colorData);
    return this;
  }

  updateLineBuffer(lineBuffer) {
    this.lineBuffer = lineBuffer;
    this.bindGroup = Buffers.createBindGroup(this.device, this.bindGroupLayout, [
      this.circleParamsBuffer,
      lineBuffer,
      this.colorUniformBuffer
    ]);
  }
}
