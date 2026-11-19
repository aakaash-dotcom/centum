'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RefreshCw,
  FileText,
  AlertCircle,
  FoldHorizontal,
  Download,
  Image as ImageIcon,
} from 'lucide-react';

interface CentumPdfViewerProps {
  fileId: string;
  title?: string;
  className?: string;
  isImage?: boolean;
  imageUrl?: string;
  onDownload?: () => void;
}

export default function CentumPdfViewer({
  fileId,
  title = 'CENTUM Document',
  className = '',
  isImage = false,
  imageUrl,
  onDownload,
}: CentumPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Document Type & Media State
  const [docType, setDocType] = useState<'pdf' | 'image'>('pdf');
  const [activeImageSrc, setActiveImageSrc] = useState<string>('');

  // PDF Document State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');

  // Display State
  const [scale, setScale] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'width' | 'custom'>('width');
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'scroll' | 'single'>('scroll');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Status State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track page viewports & rendered canvases
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }[]>([]);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  // 1. Load Document (PDF or Diagram Image)
  const loadPdf = useCallback(async () => {
    if (!fileId) return;

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingPercent(10);

    // Direct image check
    const isDirectImg =
      Boolean(isImage) ||
      /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(fileId) ||
      (typeof imageUrl === 'string' && imageUrl.length > 0);

    if (isDirectImg) {
      setDocType('image');
      setActiveImageSrc(imageUrl || fileId);
      setNumPages(1);
      setCurrentPage(1);
      setIsLoading(false);
      return;
    }

    const proxyUrl = `/api/drive/pdf?id=${encodeURIComponent(fileId)}`;

    try {
      // Probe file type from server (handles Google Drive image files)
      try {
        const probeRes = await fetch(proxyUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-1024' },
        });
        const cType = probeRes.headers.get('content-type') || '';
        const xDocType = probeRes.headers.get('x-document-type') || '';
        if (cType.startsWith('image/') || xDocType === 'image') {
          setDocType('image');
          setActiveImageSrc(proxyUrl);
          setNumPages(1);
          setCurrentPage(1);
          setIsLoading(false);
          return;
        }
      } catch {}

      setDocType('pdf');

      // @ts-ignore
      const pdfjs: any = await import(/* webpackIgnore: true */ '/pdf.min.mjs');
      if (typeof window !== 'undefined') {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      }

      const loadingTask = pdfjs.getDocument({
        url: proxyUrl,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/standard_fonts/',
      });

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          const pct = Math.round((progressData.loaded / progressData.total) * 90);
          setLoadingPercent(Math.max(10, Math.min(95, pct)));
        }
      };

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setPageInput('1');

      // Fetch sample dimension from page 1 to set aspect ratio
      const firstPage = await doc.getPage(1);
      const defaultVp = firstPage.getViewport({ scale: 1.0, rotation: 0 });

      const dims: { width: number; height: number }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        dims.push({ width: defaultVp.width, height: defaultVp.height });
      }
      setPageDimensions(dims);

      setLoadingPercent(100);
      setIsLoading(false);
    } catch (err: any) {
      console.error('[CentumPdfViewer] Error loading document:', err);
      setErrorMessage(
        err?.message || 'Failed to load document. Please check your connection or download directly.'
      );
      setIsLoading(false);
    }
  }, [fileId, isImage, imageUrl]);

  useEffect(() => {
    loadPdf();
    return () => {
      // Cancel pending renders
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch {}
      });
      renderTasksRef.current.clear();
    };
  }, [loadPdf]);

  // 2. Compute Responsive Width Scale
  const calculateFitWidthScale = useCallback(() => {
    if (!scrollContainerRef.current || pageDimensions.length === 0) return 1.0;
    const containerWidth = scrollContainerRef.current.clientWidth - 32; // minus padding
    const pageWidth = pageDimensions[0]?.width || 600;
    if (containerWidth <= 0 || pageWidth <= 0) return 1.0;

    // Apply rotation dimension swap if 90 or 270 deg
    const effectiveWidth = rotation % 180 === 0 ? pageWidth : (pageDimensions[0]?.height || 800);
    const computed = containerWidth / effectiveWidth;
    return Math.max(0.4, Math.min(3.0, computed));
  }, [pageDimensions, rotation]);

  // Handle window resize or fitMode change
  useEffect(() => {
    if (fitMode === 'width') {
      const newScale = calculateFitWidthScale();
      setScale(newScale);
    }
  }, [fitMode, calculateFitWidthScale]);

  useEffect(() => {
    const handleResize = () => {
      if (fitMode === 'width') {
        setScale(calculateFitWidthScale());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitMode, calculateFitWidthScale]);

  // 3. Render Page onto Canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current[pageNumber - 1];
      if (!canvas) return;

      // Cancel any ongoing render task on this page
      const existingTask = renderTasksRef.current.get(pageNumber);
      if (existingTask) {
        try {
          existingTask.cancel();
        } catch {}
        renderTasksRef.current.delete(pageNumber);
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale, rotation });

        // Cap DPR to 2 to prevent excessive memory allocation on high-DPI mobile screens
        const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.set(pageNumber, renderTask);

        await renderTask.promise;
        renderTasksRef.current.delete(pageNumber);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[CentumPdfViewer] Error rendering page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, scale, rotation]
  );

  // 4. Reset & Re-render visible pages on scale/rotation changes
  useEffect(() => {
    // Cancel in-flight render tasks
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {}
    });
    renderTasksRef.current.clear();

    // Re-seed with current page and its neighbor
    setVisiblePages(new Set([currentPage, Math.min(currentPage + 1, numPages || 1)]));
  }, [scale, rotation, currentPage, numPages]);

  // 5. IntersectionObserver: Lazily mark pages visible as user scrolls within 400px
  useEffect(() => {
    if (viewMode !== 'scroll' || !scrollContainerRef.current || numPages === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for environments without IntersectionObserver
      const initial = new Set<number>();
      for (let i = 1; i <= Math.min(numPages, 10); i++) initial.add(i);
      setVisiblePages(initial);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          let changed = false;
          const next = new Set(prev);
          entries.forEach((entry) => {
            const pageNum = Number(entry.target.getAttribute('data-page-number'));
            if (pageNum && entry.isIntersecting) {
              if (!next.has(pageNum)) {
                next.add(pageNum);
                changed = true;
              }
            }
          });
          return changed ? next : prev;
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '400px 0px',
        threshold: 0.01,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [viewMode, numPages, scale, rotation]);

  // 6. Trigger Rendering for active/visible pages only
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || isLoading) return;

    if (viewMode === 'single') {
      renderPage(currentPage);
    } else {
      visiblePages.forEach((pageNum) => {
        renderPage(pageNum);
      });
    }
  }, [pdfDoc, numPages, viewMode, currentPage, visiblePages, isLoading, renderPage]);

  // 7. Scroll Spy to Update Current Page Indicator
  useEffect(() => {
    if (viewMode !== 'scroll' || !scrollContainerRef.current) return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const containerTop = container.scrollTop;
      const containerMiddle = containerTop + container.clientHeight / 3;

      for (let i = 0; i < pageRefs.current.length; i++) {
        const el = pageRefs.current[i];
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (containerMiddle >= top && containerMiddle <= bottom) {
            const pageNum = i + 1;
            if (pageNum !== currentPage) {
              setCurrentPage(pageNum);
              setPageInput(String(pageNum));
            }
            break;
          }
        }
      }
    };

    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode, currentPage]);

  // 6. Navigation Handlers
  const goToPage = (target: number) => {
    const valid = Math.max(1, Math.min(numPages, target));
    setCurrentPage(valid);
    setPageInput(String(valid));

    if (viewMode === 'scroll') {
      const pageEl = pageRefs.current[valid - 1];
      if (pageEl && scrollContainerRef.current) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed)) {
        goToPage(parsed);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  // 7. Zoom Handlers
  const zoomIn = () => {
    setFitMode('custom');
    setScale((prev) => Math.min(prev * 1.25, 3.0));
  };

  const zoomOut = () => {
    setFitMode('custom');
    setScale((prev) => Math.max(prev / 1.25, 0.4));
  };

  const toggleFitWidth = () => {
    if (fitMode === 'width') {
      setFitMode('custom');
      setScale(1.0);
    } else {
      setFitMode('width');
      setScale(calculateFitWidthScale());
    }
  };

  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // 8. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 9. Download Handler (calls onDownload if provided, or default browser download)
  const handleDownloadAction = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    try {
      const link = document.createElement('a');
      const targetSrc =
        docType === 'image' && activeImageSrc
          ? activeImageSrc
          : `/api/drive/download?id=${encodeURIComponent(fileId)}`;
      link.href = targetSrc;
      link.download = `${title || 'centum-document'}.${docType === 'image' ? 'png' : 'pdf'}`;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = `/api/drive/download?id=${encodeURIComponent(fileId)}`;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col w-full h-full bg-[#180A2E] text-white rounded-2xl overflow-hidden border border-[#EDE9FE]/20 shadow-md ${className}`}
    >
      {/* CENTUM-Branded Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#250E46] border-b border-[#3B1768] text-xs select-none z-10">
        {/* Left: Branding & Page Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#7C3AED]/30 text-[#DDD6FE] font-bold text-[11px] shrink-0">
            {docType === 'image' ? (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span className="hidden sm:inline">CENTUM Diagram</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span className="hidden sm:inline">CENTUM Doc</span>
              </>
            )}
          </div>

          {docType === 'pdf' ? (
            <div className="flex items-center gap-1 bg-[#1A0933] rounded-lg px-1.5 py-0.5 border border-[#4C1D95]/40">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                aria-label="Previous Page"
                className="p-1 rounded hover:bg-[#3B1768] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-[#E9D5FF]" />
              </button>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#DDD6FE]">
                <input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onKeyDown={handlePageInputKeyDown}
                  onBlur={() => setPageInput(String(currentPage))}
                  aria-label="Current page number"
                  className="w-8 text-center bg-[#2D1254] rounded px-1 py-0.5 text-white font-bold text-[11px] focus:outline-none focus:ring-1 focus:ring-[#A78BFA]"
                />
                <span className="text-[#A78BFA]">/</span>
                <span>{numPages || 1}</span>
              </div>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= numPages || isLoading}
                aria-label="Next Page"
                className="p-1 rounded hover:bg-[#3B1768] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-[#E9D5FF]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-[#1A0933] rounded-lg px-2 py-0.5 border border-[#4C1D95]/40 text-[11px] font-bold text-[#DDD6FE]">
              <span>Diagram View</span>
            </div>
          )}
        </div>

        {/* Center: Zoom & View Controls */}
        <div className="flex items-center gap-1 bg-[#1A0933] rounded-lg p-0.5 border border-[#4C1D95]/40">
          <button
            type="button"
            onClick={zoomOut}
            disabled={isLoading || scale <= 0.4}
            aria-label="Zoom Out"
            className="p-1.5 rounded hover:bg-[#3B1768] disabled:opacity-30 transition-colors cursor-pointer text-[#DDD6FE]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-1.5 text-[11px] font-bold text-[#E9D5FF] min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={isLoading || scale >= 3.0}
            aria-label="Zoom In"
            className="p-1.5 rounded hover:bg-[#3B1768] disabled:opacity-30 transition-colors cursor-pointer text-[#DDD6FE]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFitWidth}
            disabled={isLoading}
            aria-label="Fit to Width"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              fitMode === 'width' ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#3B1768] text-[#DDD6FE]'
            }`}
            title="Fit Width"
          >
            <FoldHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Tools & Fullscreen */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={rotateClockwise}
            disabled={isLoading}
            aria-label="Rotate Page"
            className="p-1.5 rounded-lg bg-[#1A0933] hover:bg-[#3B1768] text-[#DDD6FE] border border-[#4C1D95]/40 transition-colors cursor-pointer"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {docType === 'pdf' && (
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'scroll' ? 'single' : 'scroll'))}
              disabled={isLoading}
              aria-label="Toggle Scroll Mode"
              className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-[#1A0933] hover:bg-[#3B1768] text-[#DDD6FE] text-[11px] font-medium border border-[#4C1D95]/40 transition-colors cursor-pointer"
              title="Toggle between Continuous Scroll and Single Page"
            >
              {viewMode === 'scroll' ? 'Continuous' : 'Single'}
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-[#1A0933] hover:bg-[#3B1768] text-[#DDD6FE] border border-[#4C1D95]/40 transition-colors cursor-pointer"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownloadAction}
            aria-label={docType === 'image' ? 'Download Diagram' : 'Download Document'}
            className="p-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors cursor-pointer"
            title={docType === 'image' ? 'Download Diagram' : 'Download PDF'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Document Viewport Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-auto bg-[#0E0419] p-3 sm:p-6 flex flex-col items-center relative touch-pan-x touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0E0419]/90 backdrop-blur-xs p-6 text-center">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-4 border-[#3B1768] border-t-[#A78BFA] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#A78BFA]">
                {loadingPercent}%
              </div>
            </div>
            <p className="text-sm font-bold text-[#FAF5FF] mb-1">
              {docType === 'image' ? 'Opening CENTUM Diagram...' : 'Opening CENTUM Material...'}
            </p>
            <p className="text-xs text-[#A78BFA]/80 max-w-xs">{title}</p>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="my-auto max-w-md p-6 bg-[#1F0A38] rounded-2xl border border-red-500/40 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Unable to Render Document</h3>
            <p className="text-xs text-red-200/80 mb-4">{errorMessage}</p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={loadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B1768] hover:bg-[#4C1D95] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAction}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        {/* Rendered View: Image Diagram or PDF Pages */}
        {!errorMessage && (
          docType === 'image' && activeImageSrc ? (
            <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-auto">
              <div
                className="transition-transform duration-150 flex items-center justify-center max-w-full"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={activeImageSrc}
                  alt={title}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none bg-white/5"
                  draggable={false}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setErrorMessage('Unable to load diagram image. Please verify file availability.');
                    setIsLoading(false);
                  }}
                />
              </div>
            </div>
          ) : numPages > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:gap-6 my-auto">
            {viewMode === 'scroll'
              ? Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1;
                  const baseWidth = pageDimensions[index]?.width || 600;
                  const baseHeight = pageDimensions[index]?.height || 800;
                  const effectiveWidth = rotation % 180 === 0 ? baseWidth : baseHeight;
                  const effectiveHeight = rotation % 180 === 0 ? baseHeight : baseWidth;
                  const pageWidth = Math.floor(effectiveWidth * scale);
                  const pageHeight = Math.floor(effectiveHeight * scale);

                  return (
                    <div
                      key={`page-${pageNum}`}
                      data-page-number={pageNum}
                      ref={(el) => {
                        pageRefs.current[index] = el;
                      }}
                      style={{
                        width: `${pageWidth}px`,
                        minHeight: `${pageHeight}px`,
                      }}
                      className="relative bg-white rounded-lg shadow-xl overflow-hidden transition-transform duration-150 flex items-center justify-center"
                    >
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[index] = el;
                        }}
                        className="block max-w-full h-auto"
                      />
                      <div className="absolute bottom-1 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono select-none pointer-events-none">
                        Page {pageNum}
                      </div>
                    </div>
                  );
                })
              : (() => {
                  const baseWidth = pageDimensions[currentPage - 1]?.width || 600;
                  const baseHeight = pageDimensions[currentPage - 1]?.height || 800;
                  const effectiveWidth = rotation % 180 === 0 ? baseWidth : baseHeight;
                  const effectiveHeight = rotation % 180 === 0 ? baseHeight : baseWidth;
                  const pageWidth = Math.floor(effectiveWidth * scale);
                  const pageHeight = Math.floor(effectiveHeight * scale);

                  return (
                    <div
                      ref={(el) => {
                        pageRefs.current[currentPage - 1] = el;
                      }}
                      style={{
                        width: `${pageWidth}px`,
                        minHeight: `${pageHeight}px`,
                      }}
                      className="relative bg-white rounded-lg shadow-xl overflow-hidden transition-transform duration-150 flex items-center justify-center"
                    >
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[currentPage - 1] = el;
                        }}
                        className="block max-w-full h-auto"
                      />
                      <div className="absolute bottom-1 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono select-none pointer-events-none">
                        Page {currentPage} of {numPages}
                      </div>
                    </div>
                  );
                })()}
          </div>
        ) : null)}
      </div>
    </div>
  );
}
