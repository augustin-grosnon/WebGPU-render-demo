import { GRID_SIZE } from "./values.js";

export class Buffers {
  static createUniformBuffer(device) {
    const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
    const uniformBuffer = device.createBuffer({
      size: uniformArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
    return uniformBuffer;
  }

  static createVertexArray() {
    return new Float32Array([
      -0.8, -0.8, 0.8, -0.8, 0.8, 0.8,
      -0.8, -0.8, 0.8, 0.8, -0.8, 0.8
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

  static createCells(device) {
    const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
    for (let i = 0; i < cellStateArray.length; ++i)
      cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;

    const cellStateStorage = [
      device.createBuffer({
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      }),
      device.createBuffer({
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      })
    ];

    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

    return cellStateStorage;
  }

  static createBindGroups(device, bindGroupLayout, uniformBuffer, cellStateStorage) {
    return [
      device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: { buffer: cellStateStorage[0] } },
          { binding: 2, resource: { buffer: cellStateStorage[1] } }
        ]
      }),
      device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: { buffer: cellStateStorage[1] } },
          { binding: 2, resource: { buffer: cellStateStorage[0] } }
        ]
      })
    ];
  }
}
