export class Buffers {
  static createCircleParamsBuffer(device, data) {
    const circleParamsArray = new Float32Array(data);
    const circleParamsBuffer = device.createBuffer({
      size: circleParamsArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(circleParamsBuffer, 0, circleParamsArray);
    return circleParamsBuffer;
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

  static createLineBuffer(device, lines, maxLines) {
    while (lines.length < maxLines)
      lines.push([0.0, 0.0, 0.0, 0.0]);
    const lineArray = new Float32Array(lines.flat());
    const lineBuffer = device.createBuffer({
      size: lineArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(lineBuffer, 0, lineArray);
    return lineBuffer;
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
