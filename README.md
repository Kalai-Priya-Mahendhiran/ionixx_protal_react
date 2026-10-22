# IONIXX Diff & Validate

A powerful, privacy-focused tool for comparing and validating JSON, XML, and text content. All processing happens locally in your browser, ensuring your data never leaves your device.

## Features

- **JSON Validation & Comparison**: Validate JSON syntax and compare JSON structures
- **XML Validation & Comparison**: Validate XML syntax and compare XML documents
- **Text Comparison**: Compare text files with diff highlighting
- **Configurable Options**: Ignore whitespace, case sensitivity, and key order
- **File Upload Support**: Upload files up to 2MB each
- **Copy & Download**: Copy content to clipboard or download as files
- **Persistent Storage**: Your work is automatically saved locally
- **Privacy First**: All processing happens in your browser

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 12+ (`npm install -g pnpm` or `corepack enable`)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ionixx-diff-validate
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### JSON Validation
1. Select "JSON Validate" mode
2. Paste or upload your JSON content in the left pane
3. Click "Validate" to check for syntax errors
4. View detailed error messages with line and column numbers

### JSON Comparison
1. Select "JSON Compare" mode
2. Paste or upload JSON content in both left and right panes
3. Configure comparison options (ignore key order, case sensitivity, etc.)
4. Click "Compare" to see structural differences
5. View side-by-side diff with color-coded changes

### XML Validation
1. Select "XML Validate" mode
2. Paste or upload your XML content in the left pane
3. Click "Validate" to check for syntax and structural errors
4. View detailed error messages for mismatched or unclosed tags

### XML Comparison
1. Select "XML Compare" mode
2. Paste or upload XML content in both left and right panes
3. Configure comparison options
4. Click "Compare" to see structural differences

### Text Comparison
1. Select "Text Compare" mode
2. Paste or upload text content in both left and right panes
3. Configure comparison options (ignore whitespace, case sensitivity)
4. Click "Compare" to see line-by-line differences

## Configuration Options

- **Ignore Whitespace**: Remove extra whitespace before comparison
- **Case Sensitive**: Toggle case sensitivity for text comparison
- **Ignore Key Order**: Ignore the order of object keys in JSON comparison

## File Support

- **JSON**: `.json` files
- **XML**: `.xml` files  
- **Text**: `.txt`, `.md`, and other text files
- **Size Limit**: 2MB per file

## Privacy

This tool processes all content locally in your browser. No data is transmitted to external servers or stored in the cloud. Your work is automatically saved locally using browser storage for convenience.

## Technology Stack

- **Framework**: Next.js 16+
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Diff Library**: react-diff-viewer-continued
- **Testing**: Jest + React Testing Library

## Development

### Running Tests

```bash
pnpm test
```

### Building for Production

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions, feedback, or support:
- Email: support@ionixx.com
- GitHub: github.com/ionixx
