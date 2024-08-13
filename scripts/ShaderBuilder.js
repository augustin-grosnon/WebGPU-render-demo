export class ShaderBuilder {
  constructor() {
    this.sdfFunctions = new Set();
    this.sdfFunctionNames = new Set();
    this.operations = new Set();
    this.shapeOperationsCode = '';
  }

  applyRounding(sdf, r) {
    return (r !== undefined && r !== null && !isNaN(r)) ? `(${sdf} - ${r})` : sdf;
  }

  applyAnnularity(sdf, r) {
    return (r !== undefined && r !== null && !isNaN(r)) ? `(abs(${sdf}) - ${r})` : sdf;
  }

  applyModifier(sdf, modifier) {
    if (!modifier || typeof modifier.id !== 'string') {
      console.warn('Invalid modifier object:', modifier);
      return sdf;
    }

    switch (modifier.id) {
      case 'round':
        return this.applyRounding(sdf, modifier.r);
      case 'onion':
        return this.applyAnnularity(sdf, modifier.r);
      default:
        console.warn('Unknown modifier ID:', modifier.id);
        return sdf;
    }
  }

  applyOperation(sdf, operation) {
    if (typeof operation !== 'string' || !this.operations.has(operation)) {
      console.warn('Unknown or unsupported operation:', operation);
      return '';
    }
    return `sdf = ${operation}(sdf, ${sdf});\n`;
  }

  handleShapeOperation(sdfCode, operation, modifiers) {
    if (!Array.isArray(modifiers)) {
      console.warn('Modifiers should be an array:', modifiers);
      return this.applyOperation(sdfCode, operation);
    }

    for (const modifier of modifiers)
      sdfCode = this.applyModifier(sdfCode, modifier);

    return this.applyOperation(sdfCode, operation);
  }

  addShape(ShapeClass, operation, modifiers, ...params) {
    if (typeof ShapeClass !== 'function') {
      console.error('Invalid ShapeClass:', ShapeClass);
      return this;
    }

    const functionName = ShapeClass.getSDFunctionName();

    if (!this.sdfFunctionNames.has(functionName)) {
      this.sdfFunctions.add(ShapeClass.getSDFunction());
      this.sdfFunctionNames.add(functionName);
    }
    if (!this.operations.has(operation))
      this.operations.add(operation);
    this.operations.add(operation);
    this.shapeOperationsCode += this.handleShapeOperation(
      ShapeClass.generateSDFCode(...params), operation, modifiers
    );

    return this;
  }

  addShapes(ShapeClass, operation, modifiers, paramsArray) {
    if (typeof ShapeClass !== 'function') {
      console.error('Invalid ShapeClass:', ShapeClass);
      return this;
    }
    if (!Array.isArray(paramsArray)) {
      console.warn('paramsArray should be an array:', paramsArray);
      return this;
    }

    const functionName = ShapeClass.getSDFunctionName();

    if (!this.sdfFunctionNames.has(functionName)) {
      this.sdfFunctions.add(ShapeClass.getSDFunction());
      this.sdfFunctionNames.add(functionName);
    }
    if (!this.operations.has(operation))
      this.operations.add(operation);
    this.operations.add(operation);
    this.shapeOperationsCode += paramsArray.reduce((acc, params) => {
      if (!Array.isArray(params)) {
        console.warn('params should be an array:', params);
        return acc;
      }

      return acc + this.handleShapeOperation(
        ShapeClass.generateSDFCode(...params), operation, modifiers
      );
    }, '');

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

        ${this.shapeOperationsCode} // ! loop unrolling might cause issues with high shape amount

        if (sdf < 0.0) {
          return getShapeGradient(input.fragPos);
        } else {
          return getBackgroundGradient(input.fragPos);
        }
      }
    `;
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

export class Circle {
  static getSDFunction() {
    return `
      fn sdCircle(pos: vec2f, center: vec2f, radius: f32) -> f32 {
        return length(pos - center) - radius;
      }
    `;
  }

  static getSDFunctionName() {
    return 'sdCircle';
  }

  static generateSDFCode(center, radius) {
    return `sdCircle(input.fragPos, vec2f(${center[0]}, ${center[1]}), ${radius})`;
  }
}

export class Rectangle {
  static getSDFunction() {
    return `
      fn sdRectangle(pos: vec2f, center: vec2f, size: vec2f) -> f32 {
        let d = abs(pos - center) - size * 0.5;
        return length(max(d, vec2f(0.0, 0.0))) + max(min(d.x, d.y), 0.0);
      }
    `;
  }

  static getSDFunctionName() {
    return 'sdRectangle';
  }

  static generateSDFCode(center, size) {
    return `sdRectangle(input.fragPos, vec2f(${center[0]}, ${center[1]}), vec2f(${size[0]}, ${size[1]}))`;
  }
}

export class Ellipse {
  static getSDFunction() {
    return `
      fn sdEllipse(pos: vec2f, center: vec2f, radii: vec2f) -> f32 {
        let d = abs(pos - center) / radii;
        return length(max(d, vec2f(0.0, 0.0))) - 1.0;
      }
    `;
  }

  static getSDFunctionName() {
    return 'sdEllipse';
  }

  static generateSDFCode(center, radii) {
    return `sdEllipse(input.fragPos, vec2f(${center[0]}, ${center[1]}), vec2f(${radii[0]}, ${radii[1]}))`;
  }
}

export class RoundedRectangle { // TODO: remove when rectangle will work correctly
  static getSDFunction() {
    return `
      fn sdRoundedSquare(pos: vec2f, center: vec2f, size: vec2f, radius: f32) -> f32 {
        let d = abs(pos - center) - (size * 0.5 - vec2f(radius, radius));
        let inside = length(max(d, vec2f(0.0, 0.0)));
        let outside = length(max(d - vec2f(radius, radius), vec2f(0.0, 0.0)));
        return min(inside, outside) - radius;
      }
    `;
  }

  static getSDFunctionName() {
    return 'sdRoundedSquare';
  }

  static generateSDFCode(center, size, radius) {
    return `sdRoundedSquare(input.fragPos, vec2f(${center[0]}, ${center[1]}), vec2f(${size[0]}, ${size[1]}), ${radius})`;
  }
}
