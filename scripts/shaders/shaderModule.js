export const shaderCode = `
  struct VertexInput {
    @location(0) pos: vec2f,
  };

  struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) fragPos: vec2f,
  };

  @group(0) @binding(0) var<uniform> circleParams: vec2f;
  @group(0) @binding(1) var<uniform> lines: array<vec4f, 5>; // ? is there any way to avoid fixed-size arrays?

  fn getBackgroundGradient(pos: vec2f) -> vec4f {
    let topColor = vec4f(134.0 / 255.0, 109.0 / 255.0, 255.0 / 255.0, 1.0);
    let bottomColor = vec4f(0.0 / 255.0, 0.0 / 255.0, 132.0 / 255.0, 1.0);
    // TODO: pass colors to fragment shader
    return mix(bottomColor, topColor, pos.y * 0.5 + 0.5);
  }

  fn getCircleGradient(pos: vec2f, center: vec2f, radius: f32) -> vec4f {
    let topColor = vec4f(254.0 / 255.0, 208.0 / 255.0, 86.0 / 255.0, 1.0);
    let bottomColor = vec4f(251.0 / 255.0, 1.0 / 255.0, 249.0 / 255.0, 1.0);
    // TODO: pass colors to fragment shader
    let circleY = (pos.y - center.y + radius) / (2.0 * radius);
    return mix(bottomColor, topColor, circleY);
  }

  fn isPixelInLines(pixelY: f32, lines: array<vec4f, 5>) -> bool {
    for (var i = 0u; i < 5u; i++) {
      if (pixelY >= lines[i].x && pixelY <= lines[i].y) {
        return true;
      }
    }
    return false;
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
    let circleCenter = vec2f(0.0, 0.0);
    let circleRadius = circleParams.x;

    let dist = length(input.fragPos - circleCenter) - circleRadius;

    if (dist >= 0.0 || isPixelInLines(input.fragPos.y, lines)) {
      return getBackgroundGradient(input.fragPos);
    } else {
      return getCircleGradient(input.fragPos, circleCenter, circleRadius);
    }
  }
`;

// TODO: add border around elems
