import { useEffect, useRef, useState, useCallback } from 'react';
import { factoryNodes, serviceNodes, connections } from './data';
import { Building2, ShieldCheck } from 'lucide-react';

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  key: string;
}

export default function NetworkScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const rafRef = useRef<number>(0);
  const pendingRef = useRef(false);

  const computeLines = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const sceneRect = scene.getBoundingClientRect();
    const nodes = scene.querySelectorAll<HTMLElement>('[data-network-node]');
    const positions = new Map<string, { cx: number; cy: number }>();

    nodes.forEach((node) => {
      const id = node.dataset.networkNode;
      if (!id) return;
      const rect = node.getBoundingClientRect();
      positions.set(id, {
        cx: rect.left + rect.width / 2 - sceneRect.left,
        cy: rect.top + rect.height / 2 - sceneRect.top,
      });
    });

    const newLines: Line[] = [];
    connections.forEach((c, i) => {
      const p1 = positions.get(c.from);
      const p2 = positions.get(c.to);
      if (!p1 || !p2) return;
      newLines.push({
        x1: p1.cx,
        y1: p1.cy,
        x2: p2.cx,
        y2: p2.cy,
        key: `${c.from}-${c.to}-${i}`,
      });
    });

    setLines(newLines);
  }, []);

  // ResizeObserver + rAF batching
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const schedule = () => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        pendingRef.current = false;
        computeLines();
      });
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(scene);

    // Delayed initial measurement after fonts/layout settle
    const t1 = setTimeout(schedule, 80);
    const t2 = setTimeout(schedule, 400);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [computeLines]);

  // Mouse parallax
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let raf = 0;

    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * -22;
        const y = (e.clientY / window.innerHeight - 0.5) * -14;
        scene.style.setProperty('--px', `${x}px`);
        scene.style.setProperty('--py', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const allNodes = [...factoryNodes, ...serviceNodes];

  return (
    <div
      ref={sceneRef}
      className="maintly-scene"
      aria-hidden="true"
      style={{ transform: 'translate(var(--px, 0), var(--py, 0))' }}
    >
      {/* SVG connection graph */}
      <svg className="maintly-svg-overlay">
        <defs>
          <linearGradient id="conn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.30)" />
            <stop offset="55%" stopColor="rgba(20,184,166,0.20)" />
            <stop offset="100%" stopColor="rgba(20,184,166,0.08)" />
          </linearGradient>
          <filter id="conn-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {lines.map((l, index) => (
          <g key={l.key}>
            <line
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="url(#conn-grad)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
              filter="url(#conn-glow)"
              opacity="0.8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-10"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </line>
            {/* Pulse dot at midpoint */}
            <circle r="2.5" fill="rgba(239,68,68,0.7)" filter="url(#conn-glow)">
              <animateMotion
                dur={`${2.5 + (index % 4) * 0.28}s`}
                repeatCount="indefinite"
                path={`M${l.x1},${l.y1} L${l.x2},${l.y2}`}
              />
            </circle>
          </g>
        ))}
      </svg>

      {/* 3D isometric grid floor */}
      <div className="maintly-scene-grid" />

      {/* Subtle noise / texture */}
      <div className="maintly-scene-noise" />

      {/* Network nodes */}
      {allNodes.map((node) => (
        <div
          key={node.id}
          data-network-node={node.id}
          className="maintly-network-node"
          style={{
            top: node.position.top,
            left: node.position.left,
            animationDuration: `${node.float.dur}s`,
            animationDelay: `${node.float.delay}s`,
            ['--fy' as string]: `${node.float.ampY}px`,
            ['--fx' as string]: `${node.float.ampX}px`,
          }}
        >
          <div className="maintly-node-card">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-black ${node.tone}`}
            >
              {node.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-gray-900">
                {node.name}
              </span>
              <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-gray-400">
                {node.type === 'Servis' ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <Building2 className="h-3 w-3" />
                )}
                {node.type} · {node.city}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
