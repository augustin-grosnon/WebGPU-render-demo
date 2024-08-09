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
  @group(0) @binding(1) var<uniform> lines: array<vec4f, 5>;
  @group(0) @binding(2) var<uniform> colors: ColorUniforms;

  fn getBackgroundGradient(pos: vec2f) -> vec4f {
    return mix(colors.bgBottomColor, colors.bgTopColor, pos.y * 0.5 + 0.5);
  }

  fn getCircleGradient(pos: vec2f, center: vec2f, radius: f32) -> vec4f {
    let circleY = (pos.y - center.y + radius) / (2.0 * radius);
    return mix(colors.circleBottomColor, colors.circleTopColor, circleY);
  }

  @vertex
  fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.pos = vec4f(input.pos, 0.0, 1.0);
    output.fragPos = input.pos;
    return output;
  }

  fn sdUnion(d1: f32, d2: f32) -> f32 {
    return min(d1, d2);
  }

  fn sdSubstract(d1: f32, d2: f32) -> f32 {
    return max(d1, -d2);
  }

  fn sdIntersect(d1: f32, d2: f32) -> f32 {
    return max(d1, d2);
  }

  fn sdCircle(pos: vec2f, center: vec2f, radius: f32) -> f32 {
    return length(pos - center) - radius;
  }

  fn sdRectangle(pos: vec2f, center: vec2f, size: vec2f) -> f32 {
    let d = abs(pos - center) - size * 0.5;
    return length(max(d, vec2f(0.0, 0.0))) + min(max(d.x, d.y), 0.0);
  }

  fn sdVerticalLine(pos: vec2f, lineStart: f32, lineEnd: f32, circleRadius: f32) -> f32 {
    let rectCenter = vec2f(0.0, (lineStart + lineEnd) * 0.5);
    let rectSize = vec2f(circleRadius * 2.0, abs(lineStart - lineEnd));
    // ! the previous two should be done only one time at start, not everytime
    return sdRectangle(pos, rectCenter, rectSize);
  }

  @fragment
  fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let circleCenter = vec2f(0.0, 0.0);
    let circleRadius = circleParams.x;

    var sdf = sdCircle(input.fragPos, circleCenter, circleRadius);

    for (var i = 0u; i < 5u; i++) {
      let lineSdf = sdVerticalLine(input.fragPos, lines[i].x, lines[i].y, circleRadius);
      sdf = sdSubstract(sdf, lineSdf);
    }

    if (sdf < 0.0) {
      return getCircleGradient(input.fragPos, circleCenter, circleRadius);
    } else {
      return getBackgroundGradient(input.fragPos);
    }
  }
`;
