'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Maximize2,
  Minimize2,
  AlertCircle,
  Sparkles,
  Film,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ProVideoItem } from '@/lib/server-mock-store';

export interface ProVideoPlayerProps {
  video: ProVideoItem;
  subjectName?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  className?: string;
}

function extractYouTubeId(url?: string): string {
  if (!url) return '';
  if (url.includes('embed/')) {
    const parts = url.split('embed/');
    return parts[1]?.split(/[?&]/)[0] || '';
  }
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|v\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : '';
}

function getSubjectPosterSvg(subject: string, topic: string): string {
  const norm = (subject || '').toLowerCase();
  let bg1 = '#1E1B4B';
  let bg2 = '#4338CA';
  let badge = '📐 MATHEMATICS';

  if (norm.includes('sci')) {
    bg1 = '#064E3B';
    bg2 = '#059669';
    badge = '🔬 SCIENCE';
  } else if (norm.includes('soc')) {
    bg1 = '#7C2D12';
    bg2 = '#D97706';
    badge = '🌍 SOCIAL SCIENCE';
  } else if (norm.includes('phy')) {
    bg1 = '#0F172A';
    bg2 = '#2563EB';
    badge = '⚛️ PHYSICS';
  } else if (norm.includes('chem')) {
    bg1 = '#312E81';
    bg2 = '#7C3AED';
    badge = '🧪 CHEMISTRY';
  } else if (norm.includes('bio')) {
    bg1 = '#14532D';
    bg2 = '#16A34A';
    badge = '🧬 BIOLOGY';
  }

  const cleanTopic = (topic || '').replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="640" cy="360" r="320" fill="white" opacity="0.03"/>
    <text x="80" y="140" fill="#A3E635" font-family="system-ui, sans-serif" font-size="28" font-weight="900" letter-spacing="3">${badge} • CENTUM 100/100</text>
    <text x="80" y="320" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="44" font-weight="900">${cleanTopic.slice(0, 48)}</text>
    <text x="80" y="380" fill="#DDD6FE" font-family="system-ui, sans-serif" font-size="32" font-weight="700">${cleanTopic.slice(48, 96)}</text>
    <rect x="80" y="560" width="260" height="56" rx="28" fill="#7C3AED" opacity="0.95"/>
    <text x="210" y="596" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">▶ 16:9 MASTERCLASS</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ProVideoPlayer({
  video,
  subjectName = 'Maths',
  onFullscreenChange,
  className = '',
}: ProVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check portrait rule first: vertical/portrait formats are strictly banned from app
  const isPortraitMeta =
    video.aspectRatio === 'portrait' ||
    video.aspectRatio === '9:16' ||
    video.aspectRatio === 'vertical';

  const [isPortraitDetected, setIsPortraitDetected] = useState(isPortraitMeta);
  const isPortrait = isPortraitMeta || isPortraitDetected;

  // Primary source: Drive streaming URL
  const initialSourceMode = video.driveFileId ? 'drive' : 'youtube';
  const [sourceMode, setSourceMode] = useState<'drive' | 'youtube'>(initialSourceMode);
  const [hasFallbackTriggered, setHasFallbackTriggered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const driveStreamUrl = video.driveFileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(video.driveFileId)}`
    : '';

  const ytId = extractYouTubeId(video.ytUrl);
  const ytEmbedUrl = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`
    : (video.ytUrl || '');

  const posterUrl = getSubjectPosterSvg(subjectName, video.topic);

  // Sync fullscreen change events across standard & webkit
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
      onFullscreenChange?.(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [onFullscreenChange]);

  // Handle native video error -> automatic fallback to YouTube unlisted
  const handleNativeError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn(
      `[ProVideoPlayer] Drive native stream error for video "${video.id}" (${video.topic}). Switching to YouTube fallback.`,
      e
    );
    setSourceMode('youtube');
    setHasFallbackTriggered(true);

    // Telemetry log event to measure Drive reliability
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('centum:video_served', {
            detail: {
              videoId: video.id,
              path: 'youtube_fallback',
              reason: 'drive_error_or_404',
              driveFileId: video.driveFileId,
              ytUrl: video.ytUrl,
              timestamp: new Date().toISOString(),
            },
          })
        );
      } catch (err) {
        // silent
      }
    }
  };

  const handleNativePlay = () => {
    setIsPlaying(true);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('centum:video_served', {
            detail: {
              videoId: video.id,
              path: 'drive_native',
              driveFileId: video.driveFileId,
              timestamp: new Date().toISOString(),
            },
          })
        );
      } catch (err) {}
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoHeight > videoWidth) {
        console.warn(`[ProVideoPlayer] Portrait dimensions detected (${videoWidth}x${videoHeight}). Suppressing player.`);
        setIsPortraitDetected(true);
      }
    }
  };

  // Fullscreen API with mobile-safe WebKit fallback
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const videoElem = videoRef.current;
    if (!container) return;

    try {
      const currentFs =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement;

      if (currentFs) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      } else {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if (videoElem && (videoElem as any).webkitEnterFullscreen) {
          // Mobile Safari iOS native video fullscreen
          (videoElem as any).webkitEnterFullscreen();
        }
      }
    } catch (err) {
      console.warn('[ProVideoPlayer] Fullscreen toggle failed:', err);
    }
  };

  // 1. RULE: Portrait metadata video shows "format pending" placeholder
  if (isPortrait) {
    return (
      <div
        className={`relative w-full aspect-[16/9] bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#4C1D95] rounded-2xl border-2 border-amber-400/40 p-4 sm:p-6 flex flex-col items-center justify-center text-center text-white shadow-lg overflow-hidden ${className}`}
        data-testid="format-pending-placeholder"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center mb-2.5 shadow-md shadow-amber-400/20">
          <Film className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
          <span>Format Pending • 16:9 Landscape Only</span>
        </div>
        <h4 className="text-sm sm:text-base font-black text-white max-w-md line-clamp-1 mb-1">
          {video.topic}
        </h4>
        <p className="text-xs font-semibold text-white/75 max-w-sm leading-relaxed mb-3">
          Vertical and portrait formats are not supported in the app. Our production team is currently rendering the full 16:9 landscape masterclass for this topic.
        </p>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/10 text-white border border-white/20">
            {video.videoType}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#A3E635]/20 text-[#A3E635]">
            Target: {Math.round(video.targetSec / 60)} mins
          </span>
        </div>
      </div>
    );
  }

  // 2. LANDSCAPE 16:9 HTML5 VIDEO PLAYER WITH YOUTUBE FALLBACK
  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] bg-black rounded-2xl overflow-hidden shadow-xl border border-[#DDD6FE]/20 group ${className}`}
      data-testid="pro-video-player"
    >
      {/* Stream Source Badge & Fallback Info Bar */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 pointer-events-none">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm backdrop-blur-md ${
            sourceMode === 'drive'
              ? 'bg-[#10B981]/90 text-white'
              : 'bg-[#7C3AED]/90 text-white'
          }`}
        >
          <span>{sourceMode === 'drive' ? '⚡ Drive Native' : '📺 YouTube Backup'}</span>
        </span>
        {hasFallbackTriggered && (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/90 text-white backdrop-blur-md animate-fade-in">
            Switched from Drive (404/Limit)
          </span>
        )}
      </div>

      {/* Custom Fullscreen ⛶ Button (Top-Right) */}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 hover:scale-105 active:scale-95"
        title={isFullscreen ? 'Exit Fullscreen (⛶)' : 'Fullscreen 16:9 (⛶)'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4 text-[#A3E635]" />
        ) : (
          <Maximize2 className="w-4 h-4 text-white" />
        )}
      </button>

      {/* PRIMARY: HTML5 <video> using Drive Native Stream */}
      {sourceMode === 'drive' ? (
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          poster={posterUrl}
          disablePictureInPicture={true}
          controlsList="nodownload"
          className="w-full h-full object-contain bg-black"
          onError={handleNativeError}
          onPlay={handleNativePlay}
          onLoadedMetadata={handleLoadedMetadata}
        >
          {driveStreamUrl && <source src={driveStreamUrl} type="video/mp4" />}
          Your browser does not support HTML5 video streaming.
        </video>
      ) : (
        /* FALLBACK: YouTube Unlisted Minimal Chrome Embed */
        <iframe
          src={ytEmbedUrl}
          title={video.topic}
          className="w-full h-full bg-black border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}

      {/* Manual Switcher (hover / control on player bottom right) */}
      {video.driveFileId && video.ytUrl && (
        <div className="absolute bottom-2 right-12 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setSourceMode(sourceMode === 'drive' ? 'youtube' : 'drive')}
            className="px-2 py-1 rounded text-[9px] font-black bg-black/70 hover:bg-black/95 text-white/90 border border-white/20 flex items-center gap-1 backdrop-blur-md cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Switch to {sourceMode === 'drive' ? 'YouTube' : 'Drive'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
export default ProVideoPlayer;
