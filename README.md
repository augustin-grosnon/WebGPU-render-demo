# WebGPU render demo

This project demonstrates rendering a circle with gradient color and a gradient background using WebGPU. It also supports carving lines in the circle at specific positions on the canvas. Several other features are available.

## Features

- **Circle rendering**: Render a circle with a vertical gradient.
- **Background gradient**: Render a background with a vertical gradient.
- **Carving lines**: Carve lines at specific positions in the circle.
- **Moving lines**: Move the lines up and down using directional arrows.
- **Selecting line width**: Change the width of a specific line using direction arrows.
- **Selecting colors**: Select personalized colors for the render.

## Technologies

- **HTML5**: For the structure of the canvas.
- **CSS**: Basic styling for the canvas.
- **JavaScript**: To handle the global logic.
- **WebGPU**: To handle rendering using the GPU.

## Project structure

- `index.html`: The main HTML file that includes the canvas and links to JavaScript files.
- `styles/`: Directory containing CSS files.
- `scripts/`: Directory containing JavaScript files:
  - `Buffers.js`: Defines the `Buffers` class for managing GPU buffers.
  - `Adapter.js`: Defines the `Adapter` class for handling the GPU adapter.
  - `Device.js`: Defines the `Device` class for handling the GPU device.
  - `CanvasContext.js`: Defines the `CanvasContext` class for configuring the canvas context.
  - `BindGroupLayout.js`: Defines the `BindGroupLayout` class for managing bind group layouts.
  - `PipelineLayout.js`: Defines the `PipelineLayout` class for managing pipeline layouts.
  - `Renderer.js`: Defines the `Renderer` class for handling rendering logic.
  - `shaderCode.js`: Contains the WGSL shader code for the vertex and fragment shaders.
  - `main.js`: Initializes the rendering process and sets up the canvas.

## Setup and running the project

1. **Clone the repository**

   ```bash
   git clone https://github.com/augustin-grosnon/WebGPU-render-demo.git
   cd WebGPU-render-demo
   ```

2. **Run the project**

   To run the project, you will need to upload the code using a local server. Here’s how you can do it using Python:

   - **Python 3**

     ```bash
     python -m http.server
     ```

   Navigate to `http://localhost:8000` in your web browser to see the project in action.

## Usage

- **Colors**: Personalize the render by clicking on the pickers and selecting the appropriate color. You can then update the canvas by clicking on `Update colors`.

- **Select, move and update lines**: Click on a line to select it. Use the `up` and `down` arrow keys to move the selected line up or down. Use the `left` arrow key to reduce the line width and the `right` arrow key to increase it.

## Notes

- Ensure your browser supports WebGPU. You may need to enable experimental features or use a specific version of the browser.
