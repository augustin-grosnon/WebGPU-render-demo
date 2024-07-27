export class PipelineLayout {
  static create(device, bindGroupLayout) {
    return device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });
  }
}
