# WebGPU render demo

This project demonstrates rendering shapes with gradient color and a gradient background using WebGPU. Several other features are available.

## Features

- **Shape rendering**: Rendering shapes:
  - **Circle**
  - **Ellipse**
  - **Rectangle**
  - **Rounded rectangle**
  - and many others to be added!
- **Vertical gradient**: Rendering a vertical gradient for the background and shapes.
- **Modifiers**: Apply modifiers to the shapes:
  - **round** - `rad: number`: rounding the shape
  - **onion** - `thickness: number`: apply layers, similar to an onion
  - **translate** - `translation: [x: number, y: number]`: translate in x or/and y axis
  - **rotate** - `angle: number`: rotate the shape
  - **scale** - `scale`: set the scale
  - **symX**: apply symetry (x axis)
  - **symY**: apply symetry (y axis)
  - **repeat** - `spacing: [x: number, y: number]`: repeat infinitely based on a spacing
  - **limitedRepeat** - `spacing: [x: number, y: number], limits: [x: number, y: number]`: repeat based on a spacing until the given limit
- **Operations**: Apply operations to make the shapes interact with each other. It takes the two pdf and sometimes additional parameters.
  - **opUnion**: keep all the points from the two shapes
  - **opSubtraction**: remove the second shape from the first one
  - **opIntersection**: returns the space where the two shapes intersect
  - **opXor**: returns all the points from the two shapes except those where it intersects
  - **opSmoothUnion** - `k: number`: performs an union with a smooth transition
  - **opSmoothSubtraction** - `k: number`: performs a subtraction with a smooth transition
  - **opSmoothIntersection** - `k: number`: performs an intersection with a smooth transition
- **Selecting colors**: Select personalized colors for the background and shape gradient.
- **Add shapes easily**: Add shape easily using the addShape method and specific parameters:
  1. Shape class type
  2. Operation - object (`{ id: 'operationName', otherParameters }`)
  3. Position modifiers - array of objects containing the position modifiers (`{ id: 'modifierName', otherParameters }`)
  4. SDF modifiers - array of objects containing the SDF modifiers (`{ id: 'modifierName', otherParameters }`)
  5. All the parameters for the shape
  - Example:

    ```js
      .addShape(
        Ellipse,
        {id: 'opSubtraction'},
        [
          {
            id: 'translate',
            translation: [-0.2, 0.1]
          }
        ],
        [
          {
            id: 'onion',
            thickness: 0.1
          }
        ],
        [0.2, 0.6], [0.3, 0.2]
    ```

## Technologies

- **HTML5**: For the structure of the canvas.
- **CSS**: Basic styling for the canvas.
- **JavaScript**: To handle the global logic.
- **WebGPU**: To handle rendering using the GPU.
- **SDF**: To compute all the rendering.

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
  - `ShaderBuilder.js`: Contains the WGSL shader builder that handles all the WGSL logic.
  - `shapes/`: Contains shape classes that can be added using the ShaderBuilder.
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

## Notes

- Ensure your browser supports WebGPU. You may need to enable experimental features or use a specific version of the browser.
