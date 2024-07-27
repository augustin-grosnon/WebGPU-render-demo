export class Buffers {
  static createUniformBuffer(device, data) {
    const uniformArray = new Float32Array(data);
    const uniformBuffer = device.createBuffer({
      size: uniformArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
    return uniformBuffer;
  }

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

  static createBindGroups(device, bindGroupLayout, uniformBuffer) {
    return [
      device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } }
        ]
      })
    ];
  }
}
