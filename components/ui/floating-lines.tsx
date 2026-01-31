"use client";

import React, { useEffect, useRef } from "react";

interface FloatingLinesProps {
    enabledWaves?: ("top" | "middle" | "bottom")[];
    lineCount?: number | number[];
    lineDistance?: number | number[];
    bendRadius?: number;
    bendStrength?: number;
    interactive?: boolean;
    parallax?: boolean;
    className?: string;
    lineColor?: string;
    lineWidth?: number;
    speed?: number;
}

export default function FloatingLines({
    enabledWaves = ["top", "middle", "bottom"],
    lineCount = 5,
    lineDistance = 5,
    bendRadius = 5,
    bendStrength = -0.5,
    interactive = true,
    parallax = true,
    className = "",
    lineColor = "rgba(255, 255, 255, 0.1)",
    lineWidth = 1,
    speed = 0.5,
}: FloatingLinesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        resize();
        window.addEventListener("resize", resize);

        const handleMouseMove = (e: MouseEvent) => {
            if (!interactive) return;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        if (interactive) {
            canvas.addEventListener("mousemove", handleMouseMove);
        }

        const getLineCount = (index: number): number => {
            if (Array.isArray(lineCount)) {
                return lineCount[index] || 5;
            }
            return lineCount;
        };

        const getLineDistance = (index: number): number => {
            if (Array.isArray(lineDistance)) {
                return lineDistance[index] || 5;
            }
            return lineDistance;
        };

        const waves: Array<{
            y: number;
            lines: Array<{ offset: number; phase: number }>;
        }> = [];

        enabledWaves.forEach((wave, waveIndex) => {
            const count = getLineCount(waveIndex);
            const distance = getLineDistance(waveIndex);
            let baseY = 0;

            if (wave === "top") baseY = canvas.offsetHeight * 0.2;
            else if (wave === "middle") baseY = canvas.offsetHeight * 0.5;
            else if (wave === "bottom") baseY = canvas.offsetHeight * 0.8;

            const lines = Array.from({ length: count }, (_, i) => ({
                offset: i * distance,
                phase: Math.random() * Math.PI * 2,
            }));

            waves.push({ y: baseY, lines });
        });

        let time = 0;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
            time += speed * 0.01;

            waves.forEach((wave, waveIndex) => {
                wave.lines.forEach((line, lineIndex) => {
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = lineWidth;
                    ctx.beginPath();

                    const points = 100;
                    for (let i = 0; i <= points; i++) {
                        const x = (canvas.offsetWidth / points) * i;
                        let y = wave.y + line.offset;

                        // Wave motion
                        const waveOffset =
                            Math.sin(x * 0.01 + time + line.phase) * bendRadius;
                        y += waveOffset * bendStrength;

                        // Interactive mouse influence
                        if (interactive && mouseRef.current) {
                            const dx = x - mouseRef.current.x;
                            const dy = y - mouseRef.current.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const maxDistance = 150;

                            if (distance < maxDistance) {
                                const force = (1 - distance / maxDistance) * 20;
                                y += (dy / distance) * force;
                            }
                        }

                        // Parallax effect
                        if (parallax) {
                            const parallaxAmount = (waveIndex + 1) * 2;
                            y += Math.sin(time * 0.5 + lineIndex) * parallaxAmount;
                        }

                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }

                    ctx.stroke();
                });
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            if (interactive) {
                canvas.removeEventListener("mousemove", handleMouseMove);
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [
        enabledWaves,
        lineCount,
        lineDistance,
        bendRadius,
        bendStrength,
        interactive,
        parallax,
        lineColor,
        lineWidth,
        speed,
    ]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: interactive ? "auto" : "none",
            }}
        />
    );
}
