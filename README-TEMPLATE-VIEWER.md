# Template Viewer Guide

## Quick Start

1. **Start a local web server** (required because templates use `module.exports`):

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js (if you have http-server)
npx http-server -p 8000

# Option 3: PHP
php -S localhost:8000
```

2. **Open in your browser**:
   - Navigate to `http://localhost:8000/view-template.html`

3. **View your artwork!**
   - Click "🔄 New Seed" to generate different variations
   - Use "↻ Redraw" to render again with the same seed
   - Change the seed value and click "✓ Set Seed" for specific variations

## Features

- ✅ Automatic template loading
- ✅ Interactive seed control
- ✅ Click canvas to regenerate
- ✅ Beautiful dark UI
- ✅ Template metadata display

## Customizing

### Load Different Templates

Edit `view-template.html` and update the `templateFiles` array:

```javascript
const templateFiles = [
  'templates/generated/your-template-name.js',
  // Add more templates here
];
```

### Adjust Canvas Size

Change the canvas dimensions in the `p5.setup()` function:

```javascript
p5.createCanvas(1200, 1200); // Change size here
```

### Enable Animation

Remove `p5.noLoop()` to enable animation (if your template supports it):

```javascript
// Remove this line for animation:
// p5.noLoop();
```

### Custom Parameters

If your template accepts parameters, modify the render call:

```javascript
const params = {
  palette: ["#ff0000", "#00ff00", "#0000ff"],
  // Add other parameters from template.meta.inputs
};
template.render(p5, params, currentSeed);
```

## Troubleshooting

**"Template not loaded" error:**
- Make sure you're running a local web server (not opening the file directly)
- Check that the template file path is correct
- Ensure the template file exists in `templates/generated/`

**Blank canvas:**
- Check the browser console for JavaScript errors
- Verify the template code is valid
- Try a different seed value

**CORS errors:**
- You must use a local web server (not `file://` protocol)
- Make sure all paths are relative to the server root
