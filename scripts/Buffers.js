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

  static createLineBuffer(device, lines) {
    const maxLines = 5; // TODO: use global variable or something similar instead of magic number
    const paddedLines = lines.map(line => [...line, 0.0, 0.0]);
    while (paddedLines.length < maxLines)
      paddedLines.push([0.0, 0.0, 0.0, 0.0]);
    const lineArray = new Float32Array(paddedLines.flat());
    const lineBuffer = device.createBuffer({
      size: lineArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(lineBuffer, 0, lineArray);
    return lineBuffer;
  }

  static createBindGroups(device, bindGroupLayout, circleParamsBuffer, lineBuffer) {
    return [
      device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: circleParamsBuffer } },
          { binding: 1, resource: { buffer: lineBuffer } }
        ]
      })
    ];
  }
}
