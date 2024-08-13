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
