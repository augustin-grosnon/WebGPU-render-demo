export class BindGroupLayout {
  static create(device) {
    return device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }
      ]
    });
  }
}
