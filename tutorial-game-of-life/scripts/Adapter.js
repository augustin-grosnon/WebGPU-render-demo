export class Adapter {
  static async get() {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter)
      throw new Error("No appropriate GPUAdapter found.");
    console.log("GPUAdapter found:", adapter);
    return adapter;
  }
}
