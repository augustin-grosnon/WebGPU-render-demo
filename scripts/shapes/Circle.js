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
    return `vec2f(${center[0]}, ${center[1]}), ${radius}`;
  }
}
