# Moderator

**Promptfolio** is Ben McNulty's cutting-edge AI Prompt Engineering Portfolio. Collaboratively built using a combination of human intelligence and a diverse team of AI agents, this portfolio showcases the state-of-the-art in AI-human collaboration, focusing on software development, design, writing, testing, and more.

## Objective

The goal of this demo is to rate the safety of text using AI and showcase the capabilities of the OpenAI API.

## Project Structure

- **Framework**: Node-based web development
- **Deployment**: Static HTML, CSS, and JavaScript
- **Documentation**: Standards-compliant Markdown
- **Version Control**: GitHub (with repo named "promptfolio")
- **IDE**: VS Code (with GitHub Copilot for assistance)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/benmcnulty/moderator.git
   ```

2. Navigate to the project directory and install dependencies:

   ```bash
   cd moderator
   npm install
   ```

3. For local static development:

   ```bash
   npm run watch
   ```

   This will watch for changes in your source files and bundle them accordingly.

4. To start the local development server:

   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000/`.

5. To run the local development server while watching for changes in a functional local demo:

   ```bash
   npm run dev
   ```

   This will watch for changes in your source files and bundle them accordingly while the development server runs on `http://localhost:3100/`.

6. To build for production:

   ```bash
   npm run build
   ```

   This will bundle the assets into the `/dist` directory in production mode.

## Asset Management

Images, styles, templates, and other static assets should be placed in the `src/assets` directory. Webpack is configured to process these assets:

- Images smaller than 8KB are embedded directly into the final bundle as base64 for performance optimization.
- Larger images are output to the `dist/images` directory.

When incorporating images in the code, ensure they are required or imported to let webpack process them:

```javascript
import myImage from "./path/to/image.jpg";
```

or

```javascript
const myImage = require("./path/to/image.png");
```

## Connecting to the OpenAI API

If you wish to connect to the OpenAI API when building this project locally, you'll need to provide your own API key. This ensures that developers can test and utilize OpenAI functionalities seamlessly in their local development environment.

1. Obtain your OpenAI API key from the [OpenAI Dashboard](https://platform.openai.com/signup).
2. In the root directory of the project, create a `.env` file.
3. Inside the `.env` file, add your API key as follows:

```makefile
OPENAI_API_KEY=your_openai_api_key_here
```

Replace `your_openai_api_key_here` with your actual OpenAI API key.

Note: The `.env` file is not committed to the repository to ensure the security of your API key.

## Testing

All code should be tested before pushing to ensure it's error-free. If possible, write unit tests for new functionality. The website should be tested for functionality and design coherence.
