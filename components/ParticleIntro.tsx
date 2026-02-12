import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  active: boolean; // True if part of the text
}

// Interface for the moving energy agents
interface Agent {
  x: number;
  y: number;
  angle: number;
  speed: number;
  radiusX: number;
  radiusY: number;
  color: string;
  history: { x: number, y: number }[];
  historyLimit: number;
}

const ParticleIntro: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [windowSize, setWindowSize] = useState({ 
    w: Math.floor(typeof window !== 'undefined' ? (window.innerWidth || 1000) : 1000), 
    h: Math.floor(typeof window !== 'undefined' ? (window.innerHeight || 800) : 800) 
  });
  const mouseRef = useRef({ x: 0, y: 0, radius: 150 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ 
        w: Math.floor(window.innerWidth), 
        h: Math.floor(window.innerHeight) 
      });
    };
    
    mouseRef.current = { x: -1000, y: -1000, radius: 150 };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Safety check: Do not proceed if dimensions are invalid
    if (windowSize.w <= 0 || windowSize.h <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = windowSize.w;
    canvas.height = windowSize.h;

    let particles: Particle[] = [];
    
    // --- Initialize Text Particles ---
    const FONT_SIZE = Math.min(windowSize.w / 5, 250);
    const PARTICLE_DENSITY = 4;
    const TEXT = "SAQIB";

    const initParticles = () => {
      // Double check dimensions before calling getImageData
      if (windowSize.w <= 0 || windowSize.h <= 0) return;

      particles = [];
      
      // Draw temporary text to read pixels
      ctx.fillStyle = 'white';
      ctx.font = `900 ${FONT_SIZE}px Orbitron`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TEXT, windowSize.w / 2, windowSize.h / 2);

      try {
        const textData = ctx.getImageData(0, 0, windowSize.w, windowSize.h);
        const pixels = textData.data;
        
        ctx.clearRect(0, 0, windowSize.w, windowSize.h);

        for (let y = 0; y < windowSize.h; y += PARTICLE_DENSITY) {
          for (let x = 0; x < windowSize.w; x += PARTICLE_DENSITY) {
            const index = (y * windowSize.w + x) * 4;
            if (pixels[index + 3] > 128) {
              // Generate random bright RGB colors
              const r = Math.floor(Math.random() * 200 + 55); 
              const g = Math.floor(Math.random() * 200 + 55);
              const b = Math.floor(Math.random() * 200 + 55);
              const color = `rgb(${r},${g},${b})`;

              particles.push({
                x: Math.random() * windowSize.w,
                y: Math.random() * windowSize.h,
                baseX: x,
                baseY: y,
                vx: 0,
                vy: 0,
                size: Math.random() * 2 + 1,
                color: color, 
                active: true
              });
            }
          }
        }
      } catch (e) {
        console.warn("Failed to get image data:", e);
      }
    };

    // --- Initialize Agents (The Streams) ---
    // We create two agents: Blue and Orange
    const agents: Agent[] = [
      {
        x: 0, y: windowSize.h / 2,
        angle: 0,
        speed: 0.02,
        radiusX: windowSize.w * 0.4,
        radiusY: windowSize.h * 0.25,
        color: '#00C2FF', // Cyan/Blue
        history: [],
        historyLimit: 40
      },
      {
        x: 0, y: windowSize.h / 2,
        angle: Math.PI, // Start opposite
        speed: 0.02,
        radiusX: windowSize.w * 0.4,
        radiusY: windowSize.h * 0.25,
        color: '#FF8F00', // Orange/Gold
        history: [],
        historyLimit: 40
      }
    ];

    document.fonts.ready.then(() => {
      initParticles();
    });

    // --- Animation Loop ---
    let time = 0;
    const animate = () => {
      // 1. Fade background (Trail effect)
      // Use darker fade for higher contrast with the glow
      ctx.fillStyle = 'rgba(5, 5, 16, 0.2)'; 
      ctx.fillRect(0, 0, windowSize.w, windowSize.h);

      time += 0.02;

      // 2. Update and Draw Agents (The Swirling Streams)
      ctx.globalCompositeOperation = 'lighter'; // Additive blending for neon glow
      
      agents.forEach((agent, i) => {
         // Update Position (Lissajous-like movement)
         const centerX = windowSize.w / 2;
         const centerY = windowSize.h / 2;

         // Figure-8 pattern / Helix
         agent.x = centerX + Math.cos(agent.angle + time) * agent.radiusX;
         agent.y = centerY + Math.sin(agent.angle * 2 + time) * agent.radiusY;

         // Store history for the trail
         agent.history.push({ x: agent.x, y: agent.y });
         if (agent.history.length > agent.historyLimit) {
            agent.history.shift();
         }

         // Draw Trail
         ctx.beginPath();
         if (agent.history.length > 0) {
             ctx.moveTo(agent.history[0].x, agent.history[0].y);
             for (let i = 1; i < agent.history.length; i++) {
                 ctx.lineTo(agent.history[i].x, agent.history[i].y);
             }
         }
         
         // Style the line
         ctx.strokeStyle = agent.color;
         ctx.lineWidth = 3;
         ctx.lineCap = 'round';
         ctx.lineJoin = 'round';
         ctx.shadowBlur = 20; // Intense Glow
         ctx.shadowColor = agent.color;
         ctx.stroke();
         
         // Draw Head (The Star)
         ctx.beginPath();
         ctx.arc(agent.x, agent.y, 6, 0, Math.PI * 2);
         ctx.fillStyle = '#ffffff';
         ctx.shadowBlur = 30;
         ctx.shadowColor = agent.color;
         ctx.fill();
      });

      // 3. Update and Draw Text Particles
      // Reset composite operation so text draws normally on top
      ctx.globalCompositeOperation = 'source-over'; 

      particles.forEach(p => {
        // Interaction Physics
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = mouseRef.current.radius;
        
        if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            p.x -= Math.cos(angle) * force * 5;
            p.y -= Math.sin(angle) * force * 5;
        } else {
            // Return to base
            if (p.x !== p.baseX) p.x -= (p.x - p.baseX) / 15;
            if (p.y !== p.baseY) p.y -= (p.y - p.baseY) / 15;
        }

        // Draw Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Dynamic coloring based on proximity to Agents
        let closeToAgent = false;
        let activeColor = '#ffffff';
        
        agents.forEach(agent => {
            const dAgent = Math.sqrt((p.x - agent.x)**2 + (p.y - agent.y)**2);
            if (dAgent < 150) {
                closeToAgent = true;
                activeColor = agent.color;
            }
        });

        if (closeToAgent) {
            ctx.fillStyle = activeColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = activeColor;
        } else {
            ctx.fillStyle = p.color; // Use the particle's inherent color
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
      });
      
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
    }
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [windowSize]);

  return (
    <div className="fixed inset-0 bg-cyber-bg">
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {/* Top UI Overlay */}
        <div className="absolute top-10 left-10 pointer-events-none animate-fade-in-up z-10">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyber-primary rounded-full animate-pulse"></div>
                <span className="font-orbitron text-cyber-primary text-sm tracking-widest">AGENTS: ACTIVE</span>
            </div>
            <div className="h-[1px] w-20 bg-gradient-to-r from-cyber-primary to-transparent mt-2"></div>
        </div>
        
        {/* Bottom Subtitle */}
        <div className="absolute bottom-[15%] w-full text-center pointer-events-none z-10">
             <p className="font-rajdhani text-gray-400 text-sm tracking-[0.5em] uppercase opacity-80">
                Convergence of Intelligence
             </p>
        </div>
        
        <style>{`
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 1s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default ParticleIntro;