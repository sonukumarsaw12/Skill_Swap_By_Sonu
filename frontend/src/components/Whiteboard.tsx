import React, { useEffect, useRef, useState } from "react";
import {
    Pencil,
    Eraser,
    Minus,
    Square,
    Circle,
    Type,
    Undo,
    Trash2,
    Download,
    X,
    ChevronLeft,
    Palette
} from "lucide-react";

interface WhiteboardProps {
    socket: any;
    user: any;
    receiverId: string;
    onClose: () => void;
}

type Tool = "pen" | "eraser" | "line" | "rect" | "circle" | "text";

const TOOLS = [
    { id: 'pen', icon: Pencil, label: 'Pencil' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
];

const COLORS = [
    "#000000", // Black
    "#ef4444", // Red
    "#3b82f6", // Blue
    "#22c55e", // Green
    "#eab308", // Yellow
    "#a855f7", // Purple
];

const Whiteboard: React.FC<WhiteboardProps> = ({ socket, user, receiverId, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState("#000000");
    const [lineWidth, setLineWidth] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // History for Undo/Redo (Local state primarily for simplicity in MVP)
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Shape Preview State
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const snapshot = useRef<ImageData | null>(null); // Snapshot before shape draw

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set dimensions logic
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
        }

        const context = canvas.getContext("2d");
        if (context) {
            context.lineCap = "round";
            context.lineJoin = "round";
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            contextRef.current = context;

            // Save initial blank state
            const blank = context.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([blank]);
            setHistoryStep(0);
        }

        const handleResize = () => {
            // In a real app we'd redraw history; here simply keeping it fixed ensures data isn't lost but might crop.
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update Context Styles
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            contextRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth, tool]);

    // --- Socket Listeners ---
    useEffect(() => {
        if (!socket) return;

        socket.on("draw", (data: any) => {
            if (!contextRef.current || !canvasRef.current) return;
            const ctx = contextRef.current;
            const prevStyle = ctx.strokeStyle;
            const prevWidth = ctx.lineWidth;

            ctx.lineWidth = data.width;
            ctx.strokeStyle = data.color;

            if (data.type === 'line' || !data.type) { // Legacy 'draw' support
                ctx.beginPath();
                ctx.moveTo(data.prevX, data.prevY);
                ctx.lineTo(data.x, data.y);
                ctx.stroke();
                ctx.closePath();
            } else if (data.type === 'shape') {
                ctx.beginPath();
                if (data.shape === 'rect') {
                    ctx.rect(data.x, data.y, data.w, data.h);
                } else if (data.shape === 'circle') {
                    ctx.arc(data.currX, data.currY, data.radius, 0, 2 * Math.PI);
                } else if (data.shape === 'straight_line') {
                    ctx.moveTo(data.startX, data.startY);
                    ctx.lineTo(data.endX, data.endY);
                }
                ctx.stroke();
                ctx.closePath();
            } else if (data.type === 'text') {
                ctx.font = `${data.width * 5}px Arial`;
                ctx.fillStyle = data.color;
                ctx.fillText(data.text, data.x, data.y);
            }

            // Restore
            ctx.strokeStyle = prevStyle;
            ctx.lineWidth = prevWidth;

            // Note: Incoming data doesn't update local history in this simple implementation
            // Ideally we push to history here too.
        });

        socket.on("clear_board", () => {
            if (canvasRef.current && contextRef.current) {
                contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                saveHistory();
            }
        });

        return () => {
            socket.off("draw");
            socket.off("clear_board");
        };
    }, [socket]);

    // --- Drawing Handlers ---

    const saveHistory = () => {
        if (!canvasRef.current || !contextRef.current) return;
        const newHistory = history.slice(0, historyStep + 1);
        const imgData = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        newHistory.push(imgData);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const undo = () => {
        if (historyStep > 0 && contextRef.current && canvasRef.current) {
            const prevStep = historyStep - 1;
            const imgData = history[prevStep];
            contextRef.current.putImageData(imgData, 0, 0);
            setHistoryStep(prevStep);
            // Note: Syncing Undo is hard, so this is LOCAL ONLY.
        }
    };

    const downloadBoard = () => {
        if (!canvasRef.current) return;

        // Create a temporary canvas to handle background
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            // Draw original canvas on top
            ctx.drawImage(canvas, 0, 0);

            const link = document.createElement('a');
            link.download = `whiteboard-${Date.now()}.jpg`;
            link.href = tempCanvas.toDataURL('image/jpeg', 0.9); // 0.9 quality
            link.click();
        }
    };

    // Track last touch position for shape finalization
    const lastTouchPos = useRef<{ x: number, y: number } | null>(null);

    // Performance: Throttle socket events to ~60fps
    const lastEmit = useRef<number>(0);
    const socketPrev = useRef<{ x: number, y: number } | null>(null);

    const onMouseDown = (e: React.MouseEvent) => {
        // Prevent default browser behavior (text selection, drag-and-drop) which causes lag
        e.preventDefault();

        const { offsetX, offsetY } = e.nativeEvent;
        startPos.current = { x: offsetX, y: offsetY };
        socketPrev.current = { x: offsetX, y: offsetY }; // Initialize socket prev
        setIsDrawing(true);
        lastEmit.current = Date.now(); // Reset timer

        if (tool === 'text') {
            const text = prompt("Enter text:");
            if (text && contextRef.current) {
                contextRef.current.font = `${lineWidth * 5}px Arial`;
                contextRef.current.fillStyle = color;
                contextRef.current.fillText(text, offsetX, offsetY);

                socket.emit("draw", {
                    receiverId,
                    type: 'text',
                    text,
                    x: offsetX,
                    y: offsetY,
                    color,
                    width: lineWidth
                });

                saveHistory();
            }
            setIsDrawing(false); // Text is instant
            return;
        }

        // Save snapshot for shapes preview
        if (contextRef.current && canvasRef.current && tool !== 'pen' && tool !== 'eraser') {
            snapshot.current = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !startPos.current || !contextRef.current || !canvasRef.current) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = contextRef.current;
        const now = Date.now();

        if (tool === 'pen' || tool === 'eraser') {
            // Draw Locally Immediately (Optimistic)
            ctx.beginPath();
            ctx.moveTo(startPos.current.x, startPos.current.y);
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
            ctx.closePath();

            // Update Local Start Pos
            startPos.current = { x: offsetX, y: offsetY };

            // Throttle Socket Emission (limit to ~66fps or 15ms)
            if (now - lastEmit.current > 15 && socketPrev.current) {
                socket.emit("draw", {
                    receiverId,
                    type: 'line',
                    prevX: socketPrev.current.x,
                    prevY: socketPrev.current.y,
                    x: offsetX,
                    y: offsetY,
                    color: tool === 'eraser' ? '#ffffff' : color,
                    width: lineWidth
                });
                lastEmit.current = now;
                socketPrev.current = { x: offsetX, y: offsetY }; // Update socket prev to current
            }

        } else {
            // Shapes: Restore snapshot then draw preview
            // ... shape logic remains same as it is mostly local preview until MouseUp ...
            if (snapshot.current) {
                ctx.putImageData(snapshot.current, 0, 0);
            }

            ctx.beginPath();
            if (tool === 'rect') {
                ctx.rect(startPos.current.x, startPos.current.y, offsetX - startPos.current.x, offsetY - startPos.current.y);
            } else if (tool === 'circle') {
                const radius = Math.sqrt(Math.pow(offsetX - startPos.current.x, 2) + Math.pow(offsetY - startPos.current.y, 2));
                ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI);
            } else if (tool === 'line') {
                ctx.moveTo(startPos.current.x, startPos.current.y);
                ctx.lineTo(offsetX, offsetY);
            }
            ctx.stroke();
            ctx.closePath();
        }
    };

    const onMouseUp = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const { offsetX, offsetY } = e.nativeEvent;

        // Finalize Shape Emit
        if (tool !== 'pen' && tool !== 'eraser' && startPos.current && tool !== 'text') {
            // Emit shape command
            let shapeData: any = {
                receiverId,
                type: 'shape',
                color,
                width: lineWidth
            };

            if (tool === 'rect') {
                shapeData.shape = 'rect';
                shapeData.x = startPos.current.x;
                shapeData.y = startPos.current.y;
                shapeData.w = offsetX - startPos.current.x;
                shapeData.h = offsetY - startPos.current.y;
            } else if (tool === 'circle') {
                shapeData.shape = 'circle';
                shapeData.currX = startPos.current.x;
                shapeData.currY = startPos.current.y;
                shapeData.radius = Math.sqrt(Math.pow(offsetX - startPos.current.x, 2) + Math.pow(offsetY - startPos.current.y, 2));
            } else if (tool === 'line') {
                shapeData.shape = 'straight_line';
                shapeData.startX = startPos.current.x;
                shapeData.startY = startPos.current.y;
                shapeData.endX = offsetX;
                shapeData.endY = offsetY;
            }

            socket.emit("draw", shapeData);
        }

        saveHistory();
        startPos.current = null;
        snapshot.current = null;
    };

    const clearBoard = () => {
        if (canvasRef.current && contextRef.current) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            socket.emit("clear_board", { receiverId });
            saveHistory();
        }
    };

    // Dynamic Cursor
    const getCursorStyle = () => {
        if (tool === 'text') return 'text';
        if (tool === 'eraser') {
            const size = Math.max(lineWidth * 2, 16);
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="white" stroke="#000" stroke-width="1"/></svg>`;
            return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${size / 2} ${size / 2}, auto`;
        }
        if (['pen', 'line', 'rect', 'circle'].includes(tool)) {
            const size = Math.max(lineWidth + 8, 16); // Slightly larger than brush
            // Circle with active color and white border for contrast
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${encodeURIComponent(color)}" stroke="white" stroke-width="2" style="filter:drop-shadow(0px 1px 2px rgba(0,0,0,0.3));"/></svg>`;
            return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${size / 2} ${size / 2}, crosshair`;
        }
        return 'default';
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // e.preventDefault(); // Removed to fix passive listener error, relying on touch-action: none
        if (!canvasRef.current) return;
        const touch = e.touches[0];
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        startPos.current = { x: offsetX, y: offsetY };
        lastTouchPos.current = { x: offsetX, y: offsetY }; // Track initial touch
        socketPrev.current = { x: offsetX, y: offsetY };
        setIsDrawing(true);
        lastEmit.current = Date.now();

        if (tool === 'text') {
            const text = prompt("Enter text:");
            if (text && contextRef.current) {
                contextRef.current.font = `${lineWidth * 5}px Arial`;
                contextRef.current.fillStyle = color;
                contextRef.current.fillText(text, offsetX, offsetY);

                socket.emit("draw", {
                    receiverId,
                    type: 'text',
                    text,
                    x: offsetX,
                    y: offsetY,
                    color,
                    width: lineWidth
                });
                saveHistory();
            }
            setIsDrawing(false);
            return;
        }

        if (contextRef.current && tool !== 'pen' && tool !== 'eraser') {
            snapshot.current = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // e.preventDefault(); // Removed to fix passive listener error
        if (!isDrawing || !startPos.current || !contextRef.current || !canvasRef.current) return;

        const touch = e.touches[0];
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        lastTouchPos.current = { x: offsetX, y: offsetY }; // Update last known pos

        const ctx = contextRef.current;
        const now = Date.now();

        if (tool === 'pen' || tool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(startPos.current.x, startPos.current.y);
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
            ctx.closePath();

            startPos.current = { x: offsetX, y: offsetY };

            if (now - lastEmit.current > 15 && socketPrev.current) {
                socket.emit("draw", {
                    receiverId,
                    type: 'line',
                    prevX: socketPrev.current.x,
                    prevY: socketPrev.current.y,
                    x: offsetX,
                    y: offsetY,
                    color: tool === 'eraser' ? '#ffffff' : color,
                    width: lineWidth
                });
                lastEmit.current = now;
                socketPrev.current = { x: offsetX, y: offsetY };
            }
        } else {
            if (snapshot.current) {
                ctx.putImageData(snapshot.current, 0, 0);
            }

            ctx.beginPath();
            if (tool === 'rect') {
                ctx.rect(startPos.current.x, startPos.current.y, offsetX - startPos.current.x, offsetY - startPos.current.y);
            } else if (tool === 'circle') {
                const radius = Math.sqrt(Math.pow(offsetX - startPos.current.x, 2) + Math.pow(offsetY - startPos.current.y, 2));
                ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI);
            } else if (tool === 'line') {
                ctx.moveTo(startPos.current.x, startPos.current.y);
                ctx.lineTo(offsetX, offsetY);
            }
            ctx.stroke();
            ctx.closePath();
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        // e.preventDefault(); // Removed
        if (!isDrawing) return;
        setIsDrawing(false);

        // Finalize Shape Emit using lastTouchPos
        if (tool !== 'pen' && tool !== 'eraser' && startPos.current && tool !== 'text' && lastTouchPos.current) {
            const offsetX = lastTouchPos.current.x;
            const offsetY = lastTouchPos.current.y;

            // Emit shape command
            let shapeData: any = {
                receiverId,
                type: 'shape',
                color,
                width: lineWidth
            };

            if (tool === 'rect') {
                shapeData.shape = 'rect';
                shapeData.x = startPos.current.x;
                shapeData.y = startPos.current.y;
                shapeData.w = offsetX - startPos.current.x;
                shapeData.h = offsetY - startPos.current.y;
            } else if (tool === 'circle') {
                shapeData.shape = 'circle';
                shapeData.currX = startPos.current.x;
                shapeData.currY = startPos.current.y;
                shapeData.radius = Math.sqrt(Math.pow(offsetX - startPos.current.x, 2) + Math.pow(offsetY - startPos.current.y, 2));
            } else if (tool === 'line') {
                shapeData.shape = 'straight_line';
                shapeData.startX = startPos.current.x;
                shapeData.startY = startPos.current.y;
                shapeData.endX = offsetX;
                shapeData.endY = offsetY;
            }

            socket.emit("draw", shapeData);
        }

        saveHistory();
        startPos.current = null;
        snapshot.current = null;
        lastTouchPos.current = null;
    };


    return (
        <div className="absolute inset-0 z-40 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 select-none">
            <div className="relative w-full h-full max-w-[95%] max-h-[90%] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">

                {/* Close Button Top Right (Desktop) */}
                <button
                    onClick={onClose}
                    className="hidden md:block absolute top-4 right-4 z-50 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all active:scale-95 shadow-lg"
                    title="Close Whiteboard"
                >
                    <X size={20} className="text-gray-600" />
                </button>

                {/* Canvas Area */}
                <div className="flex-1 relative bg-white">
                    {/* --- Mobile Layout (Phone & Tablet) --- */}

                    {/* Left Vertical Tools */}
                    <div className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-gray-100/50">
                        {TOOLS.map((t) => (
                            <button
                                key={`mobile-tool-${t.id}`}
                                onClick={() => setTool(t.id as Tool)}
                                className={`p-2.5 rounded-xl transition-all duration-200 group relative ${tool === t.id
                                    ? 'bg-indigo-100 text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <t.icon size={22} className="transition-transform active:scale-90" />
                                {tool === t.id && (
                                    <span className="absolute top-1 right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Top Horizontal Properties */}
                    <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[95%] bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl border border-gray-100/50">

                        {/* Colors - Scrollable */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pr-4 border-r border-gray-100 max-w-[40%]">
                            {COLORS.map((c) => (
                                <button
                                    key={`mobile-color-${c}`}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 shrink-0 transition-all ${color === c ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pl-4">
                            <select
                                value={lineWidth}
                                onChange={(e) => setLineWidth(Number(e.target.value))}
                                className="w-16 h-9 bg-gray-50 border-none rounded-lg text-xs font-medium text-gray-600 focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="2">2px</option>
                                <option value="5">5px</option>
                                <option value="10">10px</option>
                            </select>

                            <button onClick={undo} disabled={historyStep <= 0} className="text-gray-500 active:text-gray-900 disabled:opacity-30">
                                <Undo size={20} />
                            </button>

                            <button onClick={clearBoard} className="text-red-500 active:text-red-700">
                                <Trash2 size={20} />
                            </button>

                            <button onClick={downloadBoard} className="text-indigo-600 active:text-indigo-800">
                                <Download size={20} />
                            </button>

                            <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-600 active:bg-gray-200 ml-2">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* --- Desktop Layout (Bottom Floating Pill) --- */}
                    <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-50 items-center justify-center gap-4 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-gray-100/50 transition-all hover:scale-[1.01]">

                        {/* Tools Group */}
                        <div className="flex items-center gap-1 pr-4 border-r border-gray-200 shrink-0">
                            {TOOLS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTool(t.id as Tool)}
                                    className={`p-3 rounded-xl transition-all duration-200 group relative ${tool === t.id
                                        ? 'bg-indigo-100 text-indigo-600 shadow-sm scale-110'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    title={t.label}
                                >
                                    <t.icon size={20} className="transition-transform group-active:scale-90" />
                                    {tool === t.id && (
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Colors Group */}
                        <div className="flex items-center gap-2 pr-4 border-r border-gray-200 shrink-0">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${color === c ? 'border-indigo-500 scale-125 shadow-md' : 'border-transparent hover:scale-110'
                                        }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Line Width */}
                            <select
                                value={lineWidth}
                                onChange={(e) => setLineWidth(Number(e.target.value))}
                                className="w-16 h-10 bg-gray-50 border-none rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                title="Brush Size"
                            >
                                <option value="2">2px</option>
                                <option value="5">5px</option>
                                <option value="10">10px</option>
                                <option value="20">20px</option>
                            </select>

                            <div className="w-px h-6 bg-gray-200 mx-1"></div>

                            <button onClick={undo} disabled={historyStep <= 0} className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl disabled:opacity-30 transition active:scale-95" title="Undo">
                                <Undo size={20} />
                            </button>

                            <button onClick={clearBoard} className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition active:scale-95" title="Clear All">
                                <Trash2 size={20} />
                            </button>

                            <button onClick={downloadBoard} className="p-3 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition active:scale-95" title="Save Image">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        onMouseDown={onMouseDown}
                        onMouseUp={onMouseUp}
                        onMouseMove={onMouseMove}
                        onMouseLeave={onMouseUp}
                        // Add touch listeners
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className="block w-full h-full touch-none"
                        style={{ cursor: getCursorStyle(), touchAction: 'none' }}
                    />
                </div>
            </div>
        </div>
    );

};

export default Whiteboard;
