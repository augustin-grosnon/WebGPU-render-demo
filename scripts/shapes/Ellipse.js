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
    return `vec2f(${center[0]}, ${center[1]}), vec2f(${radii[0]}, ${radii[1]})`;
  }
}
