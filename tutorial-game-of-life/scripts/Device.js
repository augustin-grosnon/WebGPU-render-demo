export class Device {
  static async get(adapter) {
    const device = await adapter.requestDevice();
    console.log("GPUDevice obtained:", device);
    return device;
  }
}
