export class ShaderBuilder {
  constructor() {
    this.shapes = [];
    this.sdfFunctions = new Set();
    this.operations = new Set();
  }

  addShape(shape) {
    this.shapes.push(shape);
    this.sdfFunctions.add(shape.getSDFunction());
    this.operations.add(shape.operation);
    return this;
  }

  addShapes(shapes) {
    shapes.forEach(shape => this.addShape(shape));
    return this;
  }

  generateShader() {
    return `
      struct VertexInput {
        @location(0) pos: vec2f,
      };

      struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) fragPos: vec2f,
      };

      struct ColorUniforms {
        bgTopColor: vec4f,
        bgBottomColor: vec4f,
        shapeTopColor: vec4f,
        shapeBottomColor: vec4f,
      };

      @group(0) @binding(0) var<uniform> colors: ColorUniforms;

      ${Array.from(this.sdfFunctions).join('\n')}
      ${this.generateOperationFunctions()}

      fn getBackgroundGradient(pos: vec2f) -> vec4f {
        return mix(
          colors.bgBottomColor,
          colors.bgTopColor,
          pos.y * 0.5 + 0.5
        );
      }

      fn getShapeGradient(pos: vec2f) -> vec4f {
        return mix(
          colors.shapeBottomColor,
          colors.shapeTopColor,
          clamp((pos.y + 1.0) * 0.5, 0.0, 1.0)
        );
      }

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.pos = vec4f(input.pos, 0.0, 1.0);
        output.fragPos = input.pos;
        return output;
      }

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
        var sdf = 1e10; // ! using large value to be far by default, could be better

        ${this.generateShapeOperations()}

        if (sdf < 0.0) {
          return getShapeGradient(input.fragPos);
        } else {
          return getBackgroundGradient(input.fragPos);
        }
      }
    `;
  }

  generateShapeOperations() {
    return this.shapes.map(shape => shape.generateOperationCode()).join('\n');
  }

  generateOperationFunctions() {
    let operationFunctions = '';

    if (this.operations.has('sdUnion'))
      operationFunctions += `
        fn sdUnion(d1: f32, d2: f32) -> f32 {
          return min(d1, d2);
        }
      `;
    if (this.operations.has('sdSubtract'))
      operationFunctions += `
        fn sdSubtract(d1: f32, d2: f32) -> f32 {
          return max(d1, -d2);
        }
      `;
    if (this.operations.has('sdIntersect'))
      operationFunctions += `
        fn sdIntersect(d1: f32, d2: f32) -> f32 {
          return max(d1, d2);
        }
      `;

    return operationFunctions;
  }
}

class Shape {
  constructor(operation) {
    this.operation = operation;
  }
}

export class Circle extends Shape {
  constructor(center, radius, operation) {
    super(operation);
    this.center = center;
    this.radius = radius;
  }

  getSDFunction() {
    return `
      fn sdCircle(pos: vec2f, center: vec2f, radius: f32) -> f32 {
        return length(pos - center) - radius;
      }
    `;
  }

  generateOperationCode() {
    return `sdf = ${this.operation}(sdf, sdCircle(input.fragPos, vec2f(${this.center[0]}, ${this.center[1]}), ${this.radius}));`;
  }
}

export class Rectangle extends Shape {
  constructor(center, size, operation) {
    super(operation);
    this.center = center;
    this.size = size;
  }

  getSDFunction() {
    return `
      fn sdRectangle(pos: vec2f, center: vec2f, size: vec2f) -> f32 {
        let d = abs(pos - center) - size * 0.5;
        return length(max(d, vec2f(0.0, 0.0))) + max(min(d.x, d.y), 0.0);
      }
    `;
  }

  generateOperationCode() {
    return `sdf = ${this.operation}(sdf, sdRectangle(input.fragPos, vec2f(${this.center[0]}, ${this.center[1]}), vec2f(${this.size[0]}, ${this.size[1]})));`;
  }
}
