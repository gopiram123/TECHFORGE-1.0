import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Activity, 
  PhoneCall, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Radio, 
  Heart,
  Eye,
  EyeOff
} from 'lucide-react';

interface Hospital3DHeroProps {
  onCall108?: () => void;
  className?: string;
}

export const Hospital3DHero: React.FC<Hospital3DHeroProps> = ({ onCall108, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 12, y: -16 });
  const [isHovered, setIsHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduceMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Parallax tilt on mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates (-1 to 1)
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // Apply bounded tilt: default base is (x: 12, y: -16)
    const targetTiltX = 12 - normY * 10;
    const targetTiltY = -16 + normX * 14;

    setRotate({ x: targetTiltX, y: targetTiltY });
  };

  const handleMouseEnter = () => {
    if (!reduceMotion) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth reset back to default isometric viewpoint
    setRotate({ x: 12, y: -16 });
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0B132B] via-[#0D1B3E] to-[#0A1128] text-white border border-slate-800 shadow-xl ${className}`}>
      {/* Background Ambient Glow & Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />
        {/* Subtle Isometric Grid Pattern */}
        <div 
          className="w-full h-full opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #06b6d4 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Hero Header & Brand Meta */}
      <div className="relative z-10 px-6 pt-7 sm:px-10 sm:pt-9 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide mb-3 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="uppercase text-[11px] font-bold tracking-wider">LifeLink AI • Emergency Care Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            LifeLink AI
          </h1>
          <p className="text-sm sm:text-base text-cyan-100 font-medium mt-1 tracking-normal">
            Smart Hospital Discovery. Faster Emergency Decisions.
          </p>
        </div>

        {/* Action pills & Motion Toggle */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={() => setReduceMotion(!reduceMotion)}
            title={reduceMotion ? "Enable 3D Motion" : "Reduce 3D Motion"}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 border border-slate-700/60 transition"
          >
            {reduceMotion ? <Eye className="w-3.5 h-3.5 text-teal-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{reduceMotion ? "3D Static" : "3D Active"}</span>
          </button>

          <a
            href="tel:108"
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 border border-rose-500 transition shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>Emergency 108</span>
          </a>
        </div>
      </div>

      {/* Main 3D Interactive Stage */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 px-4 py-8 sm:py-12 flex items-center justify-center cursor-default select-none min-h-[320px] sm:min-h-[380px]"
        style={{ perspective: '1100px' }}
      >
        {/* Floating Telemetry Badge 1: Top-Left */}
        <div 
          className={`absolute left-4 sm:left-10 top-4 sm:top-8 z-30 transition-all duration-300 ${
            reduceMotion ? '' : 'animate-bounce-subtle'
          }`}
          style={{
            transform: reduceMotion ? 'none' : `translate3d(${rotate.y * -0.6}px, ${rotate.x * 0.4}px, 40px)`,
          }}
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-teal-500/40 rounded-2xl p-2.5 sm:p-3 shadow-lg flex items-center space-x-2.5 text-left max-w-[190px]">
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-bold text-white">Trauma Ready</span>
              </div>
              <p className="text-[10px] text-teal-200/80 leading-tight">Level 1 Emergency Bay</p>
            </div>
          </div>
        </div>

        {/* Floating Telemetry Badge 2: Top-Right */}
        <div 
          className="absolute right-4 sm:right-10 top-4 sm:top-8 z-30 transition-all duration-300"
          style={{
            transform: reduceMotion ? 'none' : `translate3d(${rotate.y * 0.7}px, ${rotate.x * -0.5}px, 50px)`,
          }}
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-2.5 sm:p-3 shadow-lg flex items-center space-x-2.5 text-left max-w-[190px]">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-[11px] font-bold text-white">Live Capacity</span>
              </div>
              <p className="text-[10px] text-cyan-200/80 leading-tight">Bed Telemetry Verified</p>
            </div>
          </div>
        </div>

        {/* 3D Hospital Structure Isometric Root */}
        <div 
          className="relative transition-transform duration-200 ease-out flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            transform: reduceMotion 
              ? 'rotateX(14deg) rotateY(-18deg) scale(0.92)' 
              : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.02 : 0.98})`,
            willChange: 'transform',
          }}
        >
          {/* Base Ground Pedestal (Isometric Ground Plate) */}
          <div 
            className="absolute -bottom-10 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-teal-950/40 border-2 border-teal-500/20 shadow-2xl"
            style={{
              transform: 'rotateX(90deg) translateZ(-60px)',
              boxShadow: '0 0 60px rgba(13, 148, 136, 0.25)',
            }}
          />

          {/* SVG-Rendered 3D Isometric Modern Hospital Architecture */}
          <svg 
            width="340" 
            height="260" 
            viewBox="0 0 340 260" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-[280px] sm:w-[340px] h-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
          >
            <defs>
              {/* Linear Gradients for 3D Shading */}
              <linearGradient id="mainWallLeft" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id="mainWallRight" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <linearGradient id="mainRoof" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="glassFacade" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="erBayGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#BE123C" />
              </linearGradient>
              <linearGradient id="helipadRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* BASE FOUNDATION SLAB */}
            <path d="M170 245 L70 190 L170 135 L270 190 Z" fill="#0B132B" stroke="#14B8A6" strokeWidth="1.5" />
            <path d="M70 190 L70 202 L170 257 L170 245 Z" fill="#061826" stroke="#0F766E" strokeWidth="1" />
            <path d="M170 245 L170 257 L270 202 L270 190 Z" fill="#0F243A" stroke="#0F766E" strokeWidth="1" />

            {/* TOWER 1: MAIN MEDICAL CLINICAL TOWER (TALL CENTER-LEFT) */}
            {/* Left Wall */}
            <path d="M130 90 L85 115 L85 190 L130 165 Z" fill="url(#mainWallLeft)" stroke="#38BDF8" strokeWidth="0.75" />
            {/* Right Wall */}
            <path d="M130 90 L175 115 L175 190 L130 165 Z" fill="url(#mainWallRight)" stroke="#38BDF8" strokeWidth="0.75" />
            {/* Roof */}
            <path d="M130 90 L85 115 L130 140 L175 115 Z" fill="#0F2847" stroke="#38BDF8" strokeWidth="1" />

            {/* Window Grid & Medical Cross on Main Tower */}
            {/* Windows Left Facade */}
            <path d="M95 125 L120 111 L120 120 L95 134 Z" fill="#38BDF8" opacity="0.75" />
            <path d="M95 140 L120 126 L120 135 L95 149 Z" fill="#38BDF8" opacity="0.6" />
            <path d="M95 155 L120 141 L120 150 L95 164 Z" fill="#38BDF8" opacity="0.75" />
            <path d="M95 170 L120 156 L120 165 L95 179 Z" fill="#38BDF8" opacity="0.5" />

            {/* Windows Right Facade */}
            <path d="M140 123 L165 137 L165 146 L140 132 Z" fill="#7DD3FC" opacity="0.8" />
            <path d="M140 138 L165 152 L165 161 L140 147 Z" fill="#7DD3FC" opacity="0.65" />
            <path d="M140 153 L165 167 L165 176 L140 162 Z" fill="#7DD3FC" opacity="0.8" />

            {/* Illuminated Rooftop Medical Cross (Tower 1) */}
            <g transform="translate(130, 88)">
              {/* Cross Base */}
              <rect x="-10" y="-18" width="20" height="20" rx="4" fill="#0F172A" stroke="#0D9488" strokeWidth="1" />
              {/* Glowing Red/Cyan Cross */}
              <path d="M-2 -15 H2 V-11 H6 V-7 H2 V-3 H-2 V-7 H-6 V-11 H-2 Z" fill="#14B8A6" filter="url(#glowFilter)" />
              {/* Rooftop Comms Beacon */}
              <circle cx="0" cy="-22" r="2.5" fill="#F43F5E" className="animate-ping" />
              <circle cx="0" cy="-22" r="1.5" fill="#FFFFFF" />
            </g>

            {/* CONNECTING SKYBRIDGE (CONNECTS TOWER 1 & TOWER 2) */}
            <path d="M175 140 L205 145 L205 165 L175 160 Z" fill="#0284C7" opacity="0.85" stroke="#7DD3FC" strokeWidth="0.75" />
            <path d="M175 140 L205 145 L205 148 L175 143 Z" fill="#BAE6FD" />

            {/* TOWER 2: SURGICAL & ICU WING (RIGHT) WITH ROOFTOP HELIPAD */}
            {/* Left Wall */}
            <path d="M205 125 L170 145 L170 205 L205 185 Z" fill="url(#mainWallLeft)" stroke="#0D9488" strokeWidth="0.75" />
            {/* Right Wall */}
            <path d="M205 125 L245 145 L245 205 L205 185 Z" fill="url(#mainWallRight)" stroke="#0D9488" strokeWidth="0.75" />
            {/* Helipad Platform Roof */}
            <path d="M205 125 L170 145 L205 165 L245 145 Z" fill="#0F172A" stroke="#14B8A6" strokeWidth="1.5" />

            {/* HELIPAD MARKINGS */}
            {/* Helipad Yellow Outer Ring */}
            <ellipse cx="205" cy="145" rx="26" ry="14" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
            {/* Inner Circle */}
            <ellipse cx="205" cy="145" rx="16" ry="8.5" fill="#1E293B" stroke="#FBBF24" strokeWidth="1.2" />
            {/* Helipad Bold 'H' */}
            <text 
              x="205" 
              y="149" 
              fontSize="12" 
              fontWeight="900" 
              fill="#FFFFFF" 
              textAnchor="middle" 
              fontFamily="sans-serif"
            >
              H
            </text>
            {/* 4 Helipad Corner Landing Strobes */}
            <circle cx="180" cy="145" r="2" fill="#10B981" />
            <circle cx="230" cy="145" r="2" fill="#10B981" />
            <circle cx="205" cy="132" r="2" fill="#F59E0B" />
            <circle cx="205" cy="158" r="2" fill="#F59E0B" />

            {/* Windows Tower 2 Right Facade */}
            <path d="M213 162 L237 150 L237 157 L213 169 Z" fill="#2DD4BF" opacity="0.8" />
            <path d="M213 174 L237 162 L237 169 L213 181 Z" fill="#2DD4BF" opacity="0.65" />
            <path d="M213 186 L237 174 L237 181 L213 193 Z" fill="#2DD4BF" opacity="0.8" />

            {/* GROUND EMERGENCY / TRAUMA CARE BAY (FOREGROUND CENTER) */}
            {/* ER Bay Main Structure */}
            <path d="M120 185 L85 205 L125 228 L160 208 Z" fill="#0F172A" stroke="#F43F5E" strokeWidth="1.2" />
            <path d="M85 205 L85 222 L125 245 L125 228 Z" fill="#1E1B4B" stroke="#E11D48" strokeWidth="0.75" />
            <path d="M125 228 L125 245 L160 225 L160 208 Z" fill="#31102B" stroke="#E11D48" strokeWidth="0.75" />

            {/* Glowing Red Emergency Bay Entrance Tunnel */}
            <path d="M127 232 L150 219 L150 224 L127 237 Z" fill="#BE123C" filter="url(#glowFilter)" />
            {/* ER Canopy Signage: 'TRAUMA BAY' */}
            <rect x="98" y="198" width="46" height="8" rx="2" fill="#E11D48" />
            <text x="121" y="204" fontSize="5" fontWeight="900" fill="#FFFFFF" textAnchor="middle" letterSpacing="0.8">
              EMERGENCY
            </text>

            {/* AMBULANCE ON EMERGENCY APPROACH RAMP */}
            <g transform="translate(142, 230)">
              {/* Ambulance Base Body */}
              <path d="M0 0 L18 -10 L28 -4 L10 6 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
              {/* Ambulance Cab Front */}
              <path d="M10 6 L10 11 L0 5 L0 0 Z" fill="#E2E8F0" />
              <path d="M10 6 L10 11 L28 1 L28 -4 Z" fill="#94A3B8" />
              {/* Red Cross on Ambulance Side */}
              <path d="M16 -2 L22 1 L22 3 L16 0 Z" fill="#EF4444" />
              {/* Flashing Roof Beacon */}
              <circle cx="12" cy="-5" r="2" fill="#EF4444" className="animate-pulse" />
              <circle cx="16" cy="-7" r="1.5" fill="#06B6D4" className="animate-pulse" />
            </g>

            {/* Glowing Ground Runway Clearance Lights */}
            <circle cx="110" cy="238" r="1.5" fill="#38BDF8" />
            <circle cx="120" cy="244" r="1.5" fill="#38BDF8" />
            <circle cx="130" cy="249" r="1.5" fill="#38BDF8" />
            <circle cx="170" cy="232" r="1.5" fill="#F43F5E" />
            <circle cx="185" cy="223" r="1.5" fill="#F43F5E" />
          </svg>
        </div>

        {/* Floating Telemetry Badge 3: Bottom Center-Right */}
        <div 
          className="absolute right-6 sm:right-16 bottom-3 sm:bottom-6 z-30 transition-all duration-300"
          style={{
            transform: reduceMotion ? 'none' : `translate3d(${rotate.y * -0.5}px, ${rotate.x * 0.6}px, 45px)`,
          }}
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-2.5 sm:p-3 shadow-lg flex items-center space-x-2 text-left">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="text-[11px] font-bold text-emerald-300">108 Dispatch Active</div>
              <p className="text-[10px] text-slate-300 leading-tight">GPS Routing Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Feature Badges */}
      <div className="relative z-10 px-6 py-4 bg-slate-900/80 border-t border-slate-800/80 backdrop-blur-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Automatic Facility Matching</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Live Bed Capacity Tracking</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Estimated ETA & Distance</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Direct GPS Navigation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
