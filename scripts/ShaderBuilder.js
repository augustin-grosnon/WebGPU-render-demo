export class ShaderBuilder {
  constructor() {
    this.sdfFunctions = new Set();
    this.sdfFunctionNames = new Set();
    this.operations = new Set();
    this.shapeOperationsCode = '';
  }

  addShape(ShapeClass, operation, ...params) {
    const functionName = ShapeClass.getSDFunctionName();

    if (!this.sdfFunctionNames.has(functionName)) {
      this.sdfFunctions.add(ShapeClass.getSDFunction());
      this.sdfFunctionNames.add(functionName);
    }
    if (!this.operations.has(operation))
      this.operations.add(operation);
    this.operations.add(operation);
    this.shapeOperationsCode += ShapeClass.generateOperationCode(operation, ...params);

    return this;
  }

  addShapes(ShapeClass, operation, paramsArray) {
    const functionName = ShapeClass.getSDFunctionName();

    if (!this.sdfFunctionNames.has(functionName)) {
      this.sdfFunctions.add(ShapeClass.getSDFunction());
      this.sdfFunctionNames.add(functionName);
    }
    if (!this.operations.has(operation))
      this.operations.add(operation);
    this.operations.add(operation);
    this.shapeOperationsCode += paramsArray.reduce((acc, params) => {
      return acc + ShapeClass.generateOperationCode(operation, ...params);
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

  static generateOperationCode(operation, center, radius) {
    return `sdf = ${operation}(sdf, sdCircle(input.fragPos, vec2f(${center[0]}, ${center[1]}), ${radius}));\n`;
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

  static generateOperationCode(operation, center, size) {
    return `sdf = ${operation}(sdf, sdRectangle(input.fragPos, vec2f(${center[0]}, ${center[1]}), vec2f(${size[0]}, ${size[1]})));\n`;
  }
}

export class Triangle {
  static getSDFunction() {
    return `
      fn sdTriangle(pos: vec2f, p0: vec2f, p1: vec2f, p2: vec2f) -> f32 {
        let e0 = length(cross(vec3f(p1 - p0, 0.0), vec3f(pos - p0, 0.0))) / length(p1 - p0);
        let e1 = length(cross(vec3f(p2 - p1, 0.0), vec3f(pos - p1, 0.0))) / length(p2 - p1);
        let e2 = length(cross(vec3f(p0 - p2, 0.0), vec3f(pos - p2, 0.0))) / length(p0 - p2);

        return min(min(e0, e1), e2);
      }
    `;
  }

  static getSDFunctionName() {
    return 'sdTriangle';
  }

  static generateOperationCode(operation, p0, p1, p2) {
    return `sdf = ${operation}(sdf, sdTriangle(input.fragPos, vec2f(${p0[0]}, ${p0[1]}), vec2f(${p1[0]}, ${p1[1]}), vec2f(${p2[0]}, ${p2[1]})));\n`;
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

  static generateOperationCode(operation, center, radii) {
    return `sdf = ${operation}(sdf, sdEllipse(input.fragPos, vec2f(${center[0]}, ${center[1]}), vec2f(${radii[0]}, ${radii[1]})));\n`;
  }
}

export class RoundedSquare {
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

  static generateOperationCode(operation, center, size, radius) {
    return `sdf = ${operation}(sdf, sdRoundedSquare(input.fragPos, vec2f(${center[0]}, ${center[1]}), vec2f(${size[0]}, ${size[1]}), ${radius}));\n`;
  }
}
