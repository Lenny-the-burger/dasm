// Graphing calculator with pan and zoom
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Initial/default view state
const DEFAULT_OFFSET_X = 0;
const DEFAULT_OFFSET_Y = 0;
const DEFAULT_SCALE = 40;

// View state
let offsetX = DEFAULT_OFFSET_X;
let offsetY = DEFAULT_OFFSET_Y;
let scale = DEFAULT_SCALE; // pixels per unit

// Dragging state
let isDraggingCanvas = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Resize canvas to fill panel
function resizeCanvas() {
    const panel = canvas.parentElement;
    canvas.width = panel.clientWidth;
    canvas.height = panel.clientHeight;
    drawGrid();
}

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Convert screen coordinates to graph coordinates
function screenToGraph(screenX, screenY) {
    return {
        x: (screenX - canvas.width / 2 - offsetX) / scale,
        y: -(screenY - canvas.height / 2 - offsetY) / scale
    };
}

// Convert graph coordinates to screen coordinates
function graphToScreen(graphX, graphY) {
    return {
        x: graphX * scale + canvas.width / 2 + offsetX,
        y: -graphY * scale + canvas.height / 2 + offsetY
    };
}

// Calculate nice grid spacing
function getGridSpacing(scale) {
    const targetPixelSpacing = 50; // Target spacing in pixels
    const rawSpacing = targetPixelSpacing / scale;

    // Find nice numbers: 1, 2, 5, 10, 20, 50, 100, etc.
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawSpacing)));
    const normalized = rawSpacing / magnitude;

    let niceSpacing;
    if (normalized < 1.5) {
        niceSpacing = 1 * magnitude;
    } else if (normalized < 3.5) {
        niceSpacing = 2 * magnitude;
    } else if (normalized < 7.5) {
        niceSpacing = 5 * magnitude;
    } else {
        niceSpacing = 10 * magnitude;
    }

    return niceSpacing;
}

function drawGrid() {
    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2 + offsetX;
    const centerY = canvas.height / 2 + offsetY;

    const gridSpacing = getGridSpacing(scale);
    const pixelSpacing = gridSpacing * scale;

    // Draw vertical grid lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    const startXGraph = Math.floor((0 - centerX) / pixelSpacing) * gridSpacing;
    const endXGraph = Math.ceil((canvas.width - centerX) / pixelSpacing) * gridSpacing;

    for (let i = startXGraph; i <= endXGraph; i += gridSpacing) {
        const screenX = graphToScreen(i, 0).x;
        if (Math.abs(i) < 0.0001) continue; // Skip axis

        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal grid lines
    const startYGraph = Math.floor((-canvas.height + centerY) / pixelSpacing) * gridSpacing;
    const endYGraph = Math.ceil((centerY) / pixelSpacing) * gridSpacing;

    for (let i = startYGraph; i <= endYGraph; i += gridSpacing) {
        const screenY = graphToScreen(0, i).y;
        if (Math.abs(i) < 0.0001) continue; // Skip axis

        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#505050';
    ctx.lineWidth = 2;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // Draw axis numbers
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Check if axes are visible
    const xAxisVisible = centerY >= 0 && centerY <= canvas.height;
    const yAxisVisible = centerX >= 0 && centerX <= canvas.width;

    // X-axis numbers
    for (let i = startXGraph; i <= endXGraph; i += gridSpacing) {
        if (Math.abs(i) < 0.0001) continue; // Skip origin
        const screenX = graphToScreen(i, 0).x;

        if (screenX < 5 || screenX > canvas.width - 5) continue;

        const label = Math.abs(i) < 1e-10 ? '0' : i.toFixed(Math.max(0, -Math.floor(Math.log10(gridSpacing))));

        if (xAxisVisible) {
            // Normal axis numbers
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(label, screenX, centerY + 5);
        } else {
            // Axis is out of bounds - draw at edge
            ctx.fillStyle = '#5a5a5a'; // Darker color
            ctx.textAlign = 'center';
            if (centerY < 0) {
                // Axis is above canvas
                ctx.textBaseline = 'top';
                ctx.fillText(label, screenX, 5);
            } else {
                // Axis is below canvas
                ctx.textBaseline = 'bottom';
                ctx.fillText(label, screenX, canvas.height - 5);
            }
        }
    }

    // Y-axis numbers
    for (let i = startYGraph; i <= endYGraph; i += gridSpacing) {
        if (Math.abs(i) < 0.0001) continue; // Skip origin
        const screenY = graphToScreen(0, i).y;

        if (screenY < 15 || screenY > canvas.height - 5) continue;

        const label = Math.abs(i) < 1e-10 ? '0' : i.toFixed(Math.max(0, -Math.floor(Math.log10(gridSpacing))));

        if (yAxisVisible) {
            // Normal axis numbers
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, centerX - 5, screenY);
        } else {
            // Axis is out of bounds - draw at edge
            ctx.fillStyle = '#5a5a5a'; // Darker color
            ctx.textBaseline = 'middle';
            if (centerX < 0) {
                // Axis is to the left
                ctx.textAlign = 'left';
                ctx.fillText(label, 5, screenY);
            } else {
                // Axis is to the right
                ctx.textAlign = 'right';
                ctx.fillText(label, canvas.width - 5, screenY);
            }
        }
    }

    // Draw origin label (only if both axes are visible)
    if (xAxisVisible && yAxisVisible) {
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('0', centerX - 5, centerY + 5);
    }
}

// Initialize canvas
drawGrid();

// Home button - reset zoom and position
document.getElementById('homeButton').addEventListener('click', () => {
    offsetX = DEFAULT_OFFSET_X;
    offsetY = DEFAULT_OFFSET_Y;
    scale = DEFAULT_SCALE;
    drawGrid();
});

// Canvas mouse events for panning
canvas.addEventListener('mousedown', (e) => {
    isDraggingCanvas = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDraggingCanvas) return;

    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;

    offsetX += dx;
    offsetY += dy;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    drawGrid();
});

canvas.addEventListener('mouseup', () => {
    isDraggingCanvas = false;
});

canvas.addEventListener('mouseleave', () => {
    isDraggingCanvas = false;
});

// Canvas wheel event for zooming
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get mouse position in graph coordinates before zoom
    const graphPos = screenToGraph(mouseX, mouseY);

    // Zoom
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    scale *= zoomFactor;

    // Clamp scale (allow zooming out much farther)
    scale = Math.max(0.1, Math.min(scale, 1000));

    // Get mouse position in graph coordinates after zoom
    const newScreenPos = graphToScreen(graphPos.x, graphPos.y);

    // Adjust offset to keep mouse position fixed
    offsetX += mouseX - newScreenPos.x;
    offsetY += mouseY - newScreenPos.y;

    drawGrid();
});
