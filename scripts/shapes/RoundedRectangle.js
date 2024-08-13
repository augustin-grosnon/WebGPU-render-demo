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
