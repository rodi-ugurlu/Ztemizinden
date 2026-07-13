import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, RadioTower, ShieldCheck } from 'lucide-react';
import { resolvePublicFileUrl } from '@/lib/api';
import { showcaseSlots, type LandingProvider } from './data';

interface NetworkSceneProps {
  providers: LandingProvider[];
  verifiedProviderCount: number;
  isLoading: boolean;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  key: string;
}

export default function NetworkScene({ providers, verifiedProviderCount, isLoading }: NetworkSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const rafRef = useRef<number>(0);
  const pendingRef = useRef(false);
  const visibleProviders = providers.slice(0, showcaseSlots.length);
  const providerCount = visibleProviders.length;

  const computeLines = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    const nodes = Array.from(scene.querySelectorAll<HTMLElement>('[data-network-node]'));
    const points = nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - sceneRect.left,
        y: rect.top + rect.height / 2 - sceneRect.top,
      };
    });

    const pairs: Array<[number, number]> = [];
    for (let index = 0; index < points.length - 1; index += 1) {
      pairs.push([index, index + 1]);
    }
    for (let index = 0; index < points.length - 2; index += 2) {
      pairs.push([index, index + 2]);
    }

    setLines(pairs.map(([from, to]) => ({
      x1: points[from].x,
      y1: points[from].y,
      x2: points[to].x,
      y2: points[to].y,
      key: `${from}-${to}`,
    })));
  }, []);

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

    const observer = new ResizeObserver(schedule);
    observer.observe(scene);
    const firstMeasurement = window.setTimeout(schedule, 80);
    const settledMeasurement = window.setTimeout(schedule, 450);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(firstMeasurement);
      window.clearTimeout(settledMeasurement);
    };
  }, [computeLines, providerCount]);

  useEffect(() => {
    const scene = sceneRef.current;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!scene || !finePointer || reducedMotion) return;

    let frame = 0;
    const handleMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * -12;
        const y = (event.clientY / window.innerHeight - 0.5) * -7;
        scene.style.setProperty('--px', `${x}px`);
        scene.style.setProperty('--py', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className="maintly-scene"
      aria-hidden="true"
      style={{ transform: 'translate3d(var(--px, 0), var(--py, 0), 0)' }}
    >
      <div className="maintly-scene-glow" />
      <div className="maintly-scene-grid" />
      <div className="maintly-scene-noise" />

      <svg className="maintly-svg-overlay">
        <defs>
          <linearGradient id="live-connection" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.14)" />
            <stop offset="52%" stopColor="rgba(239,68,68,0.48)" />
            <stop offset="100%" stopColor="rgba(20,184,166,0.18)" />
          </linearGradient>
          <filter id="live-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {lines.map((line, index) => (
          <g key={line.key}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="url(#live-connection)"
              strokeWidth="1.35"
              strokeDasharray="5 7"
              strokeLinecap="round"
              opacity="0.72"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="3s" repeatCount="indefinite" />
            </line>
            <circle r="2.6" fill="rgba(239,68,68,0.8)" filter="url(#live-glow)">
              <animateMotion
                dur={`${3.4 + (index % 4) * 0.45}s`}
                repeatCount="indefinite"
                path={`M${line.x1},${line.y1} L${line.x2},${line.y2}`}
              />
            </circle>
          </g>
        ))}
      </svg>



      {isLoading
        ? showcaseSlots.slice(0, 5).map((slot, index) => (
            <div
              key={`skeleton-${index}`}
              className="maintly-network-node maintly-network-node--skeleton"
              data-slot-index={index}
              style={{ top: slot.top, left: slot.left }}
            >
              <div className="maintly-node-card">
                <span className="maintly-node-skeleton maintly-node-skeleton--logo" />
                <span className="min-w-0 flex-1">
                  <span className="maintly-node-skeleton maintly-node-skeleton--title" />
                  <span className="maintly-node-skeleton maintly-node-skeleton--meta" />
                </span>
              </div>
            </div>
          ))
        : visibleProviders.map((provider, index) => {
            const slot = showcaseSlots[index];
            return (
              <div
                key={`${provider.name}-${provider.logoUrl ?? index}`}
                data-network-node={`${index}-${provider.name}`}
                data-slot-index={index}
                className="maintly-network-node"
                style={{
                  top: slot.top,
                  left: slot.left,
                  animationDuration: `${slot.float.dur}s`,
                  animationDelay: `${slot.float.delay}s`,
                  ['--fy' as string]: `${slot.float.ampY}px`,
                  ['--fx' as string]: `${slot.float.ampX}px`,
                }}
              >
                <div className="maintly-node-card">
                  <ProviderLogo provider={provider} eager={index < 4} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-black tracking-[-0.01em] text-slate-950">
                      {provider.name}
                    </span>
                    <span className="mt-1.5 flex min-w-0 items-center gap-1 text-[10px] font-bold text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                      <span className="truncate">{provider.city}</span>
                      <span className="text-slate-300">·</span>
                      <span className="truncate">{provider.primarySpecialty}</span>
                    </span>
                  </span>
                  <ShieldCheck className={`h-4 w-4 shrink-0 ${provider.trusted ? 'text-amber-500' : 'text-emerald-500'}`} />
                </div>
              </div>
            );
          })}
    </div>
  );
}

function ProviderLogo({ provider, eager }: { provider: LandingProvider; eager: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = provider.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');

  return (
    <span className="maintly-provider-logo">
      {!failed && provider.logoUrl ? (
        <img
          src={resolvePublicFileUrl(provider.logoUrl)}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials || 'MS'}</span>
      )}
    </span>
  );
}
