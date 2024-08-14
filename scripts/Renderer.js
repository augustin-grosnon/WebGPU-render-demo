import { ShaderBuilder } from './ShaderBuilder.js';
import { Circle } from './shapes/Circle.js'
import { Rectangle } from './shapes/Rectangle.js'
import { Ellipse } from './shapes/Ellipse.js'
import { RoundedRectangle } from './shapes/RoundedRectangle.js'
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
      .initializeShaderBuilder()
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

    this.circleRadius = 0.75;
    this.linesPos = lineCoords.map(
      line => line.map(
        coord => -((coord / 960.0) * 2.0 - 1.0)
      )
    );
    return this.setupLineValues(this.linesPos);
  }

  setupLineValues(lines) {
    this.lines = lines.map(([start, end]) => {
      return [
        0.0,
        (start + end) * 0.5,
        this.circleRadius * 2.0,
        Math.abs(start - end)
      ];
    });

    return this;
  }

  initializeShaderBuilder() {
    this.shaderBuilder = new ShaderBuilder();

    // ? base version
    // this.shaderBuilder
    //   .addShape(Circle, {id: 'opUnion'}, [], [0.0, 0.0], this.circleRadius)
    //   .addShapes(
    //     Rectangle,
    //     {id: 'opSubtraction'},
    //     [],
    //     this.lines.map(
    //       ([xCenter, yCenter, width, height]) =>
    //       [[xCenter, yCenter], [width, height]]
    //     )
    //   )

    // ? sus
    this.shaderBuilder
      .addShape(
        Ellipse,
        {id: 'opUnion'},
        [],
        [],
        [0.0, -0.1], [0.6, 1.0])
      .addShape(
        Rectangle,
        {id: 'opSubtraction'},
        [],
        [],
        [0.0, -1.0], [1.6, 0.5]
      )
      .addShape(
        Circle,
        {id: 'opSmoothUnion', params: [0.1]},
        [
          { id: 'symX' },
        ],
        [],
        [0.4, -0.7], 0.19
      )
      .addShape(
        Ellipse,
        {id: 'opSubtraction'},
        [
          {
            id: 'translate',
            translation: [-0.2, 0.1]
          },
          {
            id: 'rotate',
            angle: Math.PI / 6
          }
        ],
        [
          {
            id: 'onion',
            thickness: 0.1
          },
          {
            id: 'onion',
            thickness: 0.02
          }
        ],
        [0.2, 0.6], [0.3, 0.2]
      )
      .addShape(
        RoundedRectangle,
        {id: 'opUnion'},
        [],
        [],
        [-0.6, 0.0], [0.2, 0.7], 0.1
      )
      .addShape(
        RoundedRectangle,
        {id: 'opSubtraction'},
        [],
        [
          {
            id: 'onion',
            thickness: 0.01
          }
        ],
        [-0.6, 0.0], [0.2, 0.7], 0.1
      );

    return this;
  }

  updateShader() {
    return this
      .initializeShaderBuilder()
      .initializeRenderPipeline();
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
    this.colorUniformBuffer = Buffers.createColorUniformBuffer(this.device, this.initialColors);
    this.bindGroupLayout = BindGroupLayout.create(this.device);
    const vertices = Buffers.createVertexArray();
    this.bindGroup = Buffers.createBindGroup(
      this.device,
      this.bindGroupLayout,
      [
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
    return this.createRenderPipeline(
      this.device,
      this.format,
      PipelineLayout.create(this.device, this.bindGroupLayout),
      this.device.createShaderModule({ code: this.shaderBuilder.generateShader() })
    );
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
      this
        .handleLineMovement(event.key)
        .updateShader()
        .render();
    });

    return this;
  }

  handleLineMovement(key) {
    const linePos = this.linesPos[this.selectedLineIndex];

    switch (key) {
      case 'ArrowUp':
        linePos[0] += 0.01;
        linePos[1] += 0.01;
        break;
      case 'ArrowDown':
        linePos[0] -= 0.01;
        linePos[1] -= 0.01;
        break;
      case 'ArrowLeft':
        linePos[0] -= 0.01;
        linePos[1] += 0.01;
        break;
      case 'ArrowRight':
        linePos[0] += 0.01;
        linePos[1] -= 0.01;
        break;
    }

    return this.setupLineValues(this.linesPos);
  }

  getLineIndexFromCoords(y) {
    const threshold = 0.02;
    for (let i = 0; i < this.linesPos.length; ++i) {
      const [start, end] = this.linesPos[i];
      const distance = Math.abs(y - (start + end) / 2);
      if (distance < threshold)
        return i;
    }
    return null;
  }

  createRenderPipeline(device, format, pipelineLayout, shaderModule) {
    this.renderPipeline = device.createRenderPipeline({
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

    return this;
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
}
