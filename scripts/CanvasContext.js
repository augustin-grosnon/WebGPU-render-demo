export class CanvasContext {
  static configure(canvas, device) {
    const context = canvas.getContext("webgpu");
    if (!context)
      throw new Error("Failed to get WebGPU context.");
    console.log("WebGPU context obtained:", context);

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device: device,
      format: format
    });
    return { context, format };
  }
}
