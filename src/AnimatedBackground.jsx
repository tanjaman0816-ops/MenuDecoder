import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
    // Generate random particles for "seasoning/dust" effect
    const particles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
    }));

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: -1,
            pointerEvents: 'none',
            background: 'hsl(240, 10%, 5%)' // Darker deep base
        }}>
            {/* 1. Static Noise Overlay for Texture */}
            <div style={{
                position: 'absolute', inset: 0,
                opacity: 0.07,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                zIndex: 2
            }} />

            {/* 2. Dynamic Mesh Gradients */}
            <div style={{ position: 'absolute', inset: 0, filter: 'blur(80px)', zIndex: 0 }}>
                {/* Gold Highlight (Top Left) */}
                <motion.div
                    animate={{
                        x: [-50, 50, -50],
                        y: [-50, 50, -50],
                        opacity: [0.2, 0.4, 0.2],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute', top: '-10%', left: '-10%',
                        width: '60vw', height: '60vw',
                        background: 'radial-gradient(circle, hsla(45, 95%, 55%, 0.3), transparent 70%)',
                        borderRadius: '50%'
                    }}
                />

                {/* Berry Depth (Bottom Right) */}
                <motion.div
                    animate={{
                        x: [50, -50, 50],
                        y: [50, -50, 50],
                        opacity: [0.15, 0.35, 0.15]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute', bottom: '-20%', right: '-10%',
                        width: '70vw', height: '70vw',
                        background: 'radial-gradient(circle, hsla(330, 70%, 45%, 0.25), transparent 70%)',
                        borderRadius: '50%'
                    }}
                />

                {/* Basil/Teal Accent (Center-Left moving) */}
                <motion.div
                    animate={{
                        x: [-100, 200, -100],
                        y: [100, -100, 100],
                        scale: [0.8, 1.1, 0.8]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute', top: '40%', left: '20%',
                        width: '40vw', height: '40vw',
                        background: 'radial-gradient(circle, hsla(160, 60%, 40%, 0.15), transparent 60%)',
                        borderRadius: '50%'
                    }}
                />
            </div>

            {/* 3. Tech/Pattern Grid Overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 100%)',
                zIndex: 1
            }} />

            {/* 4. Floating 'Seasoning' Particles */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{
                            y: [-100, window.innerHeight + 100],
                            opacity: [0, 0.6, 0],
                            x: [p.x * window.innerWidth / 100, (p.x + Math.sin(p.id)) * window.innerWidth / 100]
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: p.id * 0.5
                        }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: -20,
                            width: p.size,
                            height: p.size,
                            background: 'white',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px rgba(255,255,255,0.8)'
                        }}
                    />
                ))}
            </div>

            {/* 5. Accent Lines (Data streams) */}
            <motion.div
                animate={{ top: ['0%', '100%'], opacity: [0, 0.5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear', delay: 2 }}
                style={{
                    position: 'absolute', left: '15%', width: '1px', height: '150px',
                    background: 'linear-gradient(to bottom, transparent, hsla(45, 95%, 55%, 0.3), transparent)',
                    zIndex: 1
                }}
            />
            <motion.div
                animate={{ top: ['100%', '0%'], opacity: [0, 0.4, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 0 }}
                style={{
                    position: 'absolute', right: '25%', width: '1px', height: '200px',
                    background: 'linear-gradient(to bottom, transparent, hsla(330, 70%, 55%, 0.3), transparent)',
                    zIndex: 1
                }}
            />
        </div>
    );
};

export default AnimatedBackground;
