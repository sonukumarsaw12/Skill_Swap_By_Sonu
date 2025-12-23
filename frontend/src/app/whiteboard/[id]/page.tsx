"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';

let socket: Socket;

export default function Whiteboard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { id } = useParams(); // Partner ID
    const [user, setUser] = useState<any>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const router = useRouter();

    // Draw state
    const prevPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        setUser(userData);

        socketInitializer(userData);

        return () => {
            if (socket) socket.disconnect();
        };
    }, [id, router]);

    const socketInitializer = async (userData: any) => {
        socket = io('http://localhost:5000');
        socket.on('connect', () => {
            socket.emit('join_room', userData._id);
        });

        socket.on('draw', (data: any) => {
            const { x0, y0, x1, y1, color } = data;
            drawLine(x0, y0, x1, y1, color, false);
        });

        socket.on('clear_board', () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
    };

    const drawLine = (x0: number, y0: number, x1: number, y1: number, color: string, emit: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        if (!emit) return;

        socket.emit('draw', {
            receiverId: id,
            x0, y0, x1, y1, color
        });
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        prevPos.current = { x: offsetX, y: offsetY };
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const { x, y } = prevPos.current;

        drawLine(x, y, offsetX, offsetY, 'black', true);
        prevPos.current = { x: offsetX, y: offsetY };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearBoard = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            socket.emit('clear_board', { receiverId: id });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white shadow p-4 flex justify-between items-center z-10">
                <h1 className="text-xl font-bold">Collaborative Whiteboard</h1>
                <div className="flex gap-4">
                    <button onClick={clearBoard} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                        Clear Board
                    </button>
                    <button onClick={() => router.back()} className="text-blue-600 hover:underline">
                        Back
                    </button>
                </div>
            </header>

            <div className="flex-1 flex justify-center items-center p-8">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-300">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="cursor-crosshair"
                    />
                </div>
            </div>
        </div>
    );
}
