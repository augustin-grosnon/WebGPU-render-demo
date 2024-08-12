export class Buffers {
  static createVertexArray() {
    return new Float32Array([
      -1.0, -1.0, 1.0, -1.0, 1.0, 1.0,
      -1.0, -1.0, 1.0, 1.0, -1.0, 1.0
    ]);
  }

  static createVertexBuffer(device, vertices) {
    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);
    return vertexBuffer;
  }

  static createColorUniformBuffer(device, colors) {
    const colorArray = new Float32Array(colors.flat());
    const colorBuffer = device.createBuffer({
      size: colorArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(colorBuffer, 0, colorArray);
    return colorBuffer;
  }

  static createBindGroup(device, layout, uniformBuffers) {
    return device.createBindGroup({
      layout,
      entries: uniformBuffers.map((buffer, index) => ({
        binding: index,
        resource: { buffer }
      }))
    });
  }
}
