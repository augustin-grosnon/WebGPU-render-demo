export class ShaderBuilder {
  constructor() {
    this.sdfFunctions = new Set();
    this.sdfFunctionNames = new Set();
    this.operations = new Set();
    this.shapeOperationsCode = '';
  }

  applyRounding(sdf, rad) {
    return (rad !== undefined && rad !== null && !isNaN(rad)) ? `(${sdf} - ${rad})` : sdf;
  }

  applyAnnularity(sdf, thickness) {
    return (thickness !== undefined && thickness !== null && !isNaN(thickness)) ? `(abs(${sdf}) - ${thickness})` : sdf;
  }

  applyModifier(sdf, modifier) {
    if (!modifier || typeof modifier.id !== 'string') {
      console.warn('Invalid modifier object:', modifier);
      return sdf;
    }

    switch (modifier.id) {
      case 'round':
        return this.applyRounding(sdf, modifier.rad);
      case 'onion':
        return this.applyAnnularity(sdf, modifier.thickness);
      default:
        console.warn('Unknown modifier ID:', modifier.id);
        return sdf;
    }
  }

  applyTranslation(pos, translation) {
    return `(${pos} - vec2f(${translation[0]}, ${translation[1]}))`;
  }

  applyRotation(pos, angle) {
    const cosA = `cos(${angle})`;
    const sinA = `sin(${angle})`;
    return `vec2f(${cosA} * ${pos}.x - ${sinA} * ${pos}.y, ${sinA} * ${pos}.x + ${cosA} * ${pos}.y)`;
  }

  applyScaling(pos, scale) {
    return `${pos} / ${scale}`;
  }

  applySymX(pos) {
    return `vec2f(abs(${pos}.x), ${pos}.y)`;
  }

  applySymY(pos) {
    return `vec2f(${pos}.x, abs(${pos}.y))`;
  }

  applyRepetition(pos, spacing) {
    return `(${pos} - vec2f(${spacing.x}, ${spacing.y}) * round(${pos} / vec2f(${spacing.x}, ${spacing.y})))`;
  }

  applyLimitedRepetition(pos, spacing, limits) {
    return `(${pos} - vec2f(${spacing.x}, ${spacing.y}) * clamp(round(${pos} / vec2f(${spacing.x}, ${spacing.y})), vec2f(-${limits.x}, -${limits.y}), vec2f(${limits.x}, ${limits.y})))`;
  }

  applyPositionModifiers(pos, modifiers) {
    if (!Array.isArray(modifiers)) {
      console.warn('Modifiers should be an array:', modifiers);
      return pos;
    }

    let combinedScale = 1.0;

    for (const modifier of modifiers) {
      switch (modifier.id) {
        case 'translate':
          pos = this.applyTranslation(pos, modifier.translation);
          break;
        case 'rotate':
          pos = this.applyRotation(pos, modifier.angle);
          break;
        case 'scale':
          pos = this.applyScaling(pos, modifier.scale);
          combinedScale *= modifier.scale;
          break;
        case 'symX':
          pos = this.applySymX(pos);
          break;
        case 'symY':
          pos = this.applySymY(pos);
          break;
        case 'repeat':
          pos = this.applyRepetition(pos, modifier.spacing);
          break;
        case 'limitedRepeat':
          pos = this.applyLimitedRepetition(pos, modifier.spacing, modifier.limits);
          break;
        default:
          console.warn('Unknown position modifier ID:', modifier.id);
          break;
      }
    }
    return { pos, combinedScale };
  }

  applyOperation(sdf, operation, combinedScale) {
    if (typeof operation !== 'object' || !operation.id || !this.operations.has(operation.id)) {
      console.warn('Unknown or unsupported operation:', operation);
      return '';
    }

    const { id, params = [] } = operation;

    let opParams = '${sdf}';
    if (params)
      opParams = params.join(', ');

    if (combinedScale !== 1.0)
      sdf = `(${sdf}) * ${combinedScale}`;

    return `sdf = ${id}(sdf, ${sdf}, ${opParams});\n`;
  }

  handleShapeOperation(sdfCode, operation, modifiers, combinedScale) {
    if (!Array.isArray(modifiers)) {
      console.warn('SDF modifiers should be an array:', modifiers);
      return this.applyOperation(sdfCode, operation);
    }

    for (const modifier of modifiers)
      sdfCode = this.applyModifier(sdfCode, modifier);

    return this.applyOperation(sdfCode, operation, combinedScale);
  }

  addShape(ShapeClass, operation, shapeModifiers, sdfModifiers, ...params) {
    if (typeof ShapeClass !== 'function') {
      console.error('Invalid ShapeClass:', ShapeClass);
      return this;
    }

    const functionName = ShapeClass.getSDFunctionName();

    if (!this.sdfFunctionNames.has(functionName)) {
      this.sdfFunctions.add(ShapeClass.getSDFunction());
      this.sdfFunctionNames.add(functionName);
    }
    if (!this.operations.has(operation.id))
      this.operations.add(operation.id);

    const { pos: posCode, combinedScale }  = this.applyPositionModifiers('input.fragPos', shapeModifiers);
    const sdfCode = `${ShapeClass.getSDFunctionName()}(${posCode}, ${ShapeClass.generateSDFCode(...params)})`;

    this.shapeOperationsCode += this.handleShapeOperation(
      sdfCode, operation, sdfModifiers, combinedScale
    );

    return this;
  }

  addShapes(ShapeClass, operation, shapeModifiers, sdfModifiers, paramsArray) {
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
    if (!this.operations.has(operation.id))
      this.operations.add(operation.id);
    this.shapeOperationsCode += paramsArray.reduce((acc, params) => {
      if (!Array.isArray(params)) {
        console.warn('params should be an array:', params);
        return acc;
      }

      return acc + this.handleShapeOperation(
        ShapeClass.generateSDFCode(...params), operation, shapeModifiers, sdfModifiers
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

    if (this.operations.has('opUnion'))
      operationFunctions += `
        fn opUnion(d1: f32, d2: f32) -> f32 {
          return min(d1, d2);
        }
      `;
    if (this.operations.has('opSubtraction'))
      operationFunctions += `
        fn opSubtraction(d1: f32, d2: f32) -> f32 {
          return max(d1, -d2);
        }
      `;
    if (this.operations.has('opIntersection'))
      operationFunctions += `
        fn opIntersection(d1: f32, d2: f32) -> f32 {
          return max(d1, d2);
        }
      `;
    if (this.operations.has('opXor'))
      operationFunctions += `
        fn opXor(d1: f32, d2: f32) -> f32 {
          return max(min(d1,d2),-max(d1,d2));
        }
      `;
    if (this.operations.has('opSmoothUnion'))
      operationFunctions += `
        fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {
          let h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
          return mix(d2, d1, h) - k * h * (1.0 - h);
        }
      `;
    if (this.operations.has('opSmoothSubtraction'))
      operationFunctions += `
        fn opSmoothSubtraction(d1: f32, d2: f32, k: f32) -> f32 {
          let h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
          return mix(d2, -d1, h) + k * h * (1.0 - h);
        }
      `;
    if (this.operations.has('opSmoothIntersection'))
      operationFunctions += `
        fn opSmoothIntersection(d1: f32, d2: f32, k: f32) -> f32 {
          let h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
          return mix(d2, d1, h) + k * h * (1.0 - h);
        }
      `;

    return operationFunctions;
  }
}
