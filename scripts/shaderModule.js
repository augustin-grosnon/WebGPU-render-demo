export const shaderCode = `
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
    circleTopColor: vec4f,
    circleBottomColor: vec4f,
  };

  @group(0) @binding(0) var<uniform> circleParams: vec2f;
  @group(0) @binding(1) var<uniform> lines: array<vec4f, 5>; // ? is there any way to avoid fixed-size arrays?
  @group(0) @binding(2) var<uniform> colors: ColorUniforms;

  fn getBackgroundGradient(pos: vec2f) -> vec4f {
    return mix(colors.bgBottomColor, colors.bgTopColor, pos.y * 0.5 + 0.5);
  }

  fn getCircleGradient(pos: vec2f, center: vec2f, radius: f32) -> vec4f {
    let circleY = (pos.y - center.y + radius) / (2.0 * radius);
    return mix(colors.circleBottomColor, colors.circleTopColor, circleY);
  }

  fn isPixelInLines(pixelY: f32, lines: array<vec4f, 5>) -> bool {
    for (var i = 0u; i < 5u; i++) {
      if ((pixelY >= lines[i].x && pixelY <= lines[i].y) || (pixelY <= lines[i].x && pixelY >= lines[i].y)) {
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

// ? add border around elems?
