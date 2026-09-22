"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { parseVaahanSafeQrPayload } from "@vaahansafe/qr-core/client";

interface ActivationScannerProps {
  onScanSuccess: (publicId: string) => void;
  onFallbackToManual: () => void;
}

export function ActivationScanner({
  onScanSuccess,
  onFallbackToManual,
}: ActivationScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanStatus, setScanStatus] = useState<"IDLE" | "SCANNING" | "DETECTED" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDecodingRef = useRef(false);
  const isLockedRef = useRef(false);
  const lastDecodeTimeRef = useRef(0);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
    setIsTorchAvailable(false);
  }, []);

  const handleDecodedString = useCallback(
    (decodedText: string) => {
      if (isLockedRef.current) return;

      const result = parseVaahanSafeQrPayload(decodedText);
      if (result.valid && result.publicId) {
        isLockedRef.current = true;
        setScanStatus("DETECTED");
        stopCamera();
        onScanSuccessRef.current(result.publicId);
      }
    },
    [stopCamera]
  );

  const startCamera = useCallback(async () => {
    isLockedRef.current = false;
    setErrorMessage(null);
    setScanStatus("SCANNING");
    stopCamera();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setHasPermission(false);
      setErrorMessage("Camera access is not supported in this browser.");
      setScanStatus("ERROR");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === "function") {
        const caps = track.getCapabilities() as any;
        setIsTorchAvailable(Boolean(caps?.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check BarcodeDetector API
      const hasBarcodeDetector =
        typeof window !== "undefined" && "BarcodeDetector" in window;

      let barcodeDetector: any = null;
      let jsQrDecoder: typeof import("jsqr").default | null = null;
      if (hasBarcodeDetector) {
        try {
          barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          barcodeDetector = null;
        }
      }
      if (!barcodeDetector) {
        try {
          jsQrDecoder = (await import("jsqr")).default;
          canvasRef.current = document.createElement("canvas");
        } catch {
          stopCamera();
          setErrorMessage("This browser could not start the QR decoder. Enter the QR ID manually.");
          setScanStatus("ERROR");
          return;
        }
      }

      // Frame Processing Loop
      const processFrame = async () => {
        if (
          !isLockedRef.current &&
          videoRef.current &&
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
        ) {
          if (!isDecodingRef.current && performance.now() - lastDecodeTimeRef.current >= 100) {
            isDecodingRef.current = true;
            lastDecodeTimeRef.current = performance.now();
            try {
              if (barcodeDetector) {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0]?.rawValue) {
                  handleDecodedString(barcodes[0].rawValue);
                  return;
                }
              } else if (jsQrDecoder && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext("2d", { willReadFrequently: true });
                if (context && canvas.width > 0 && canvas.height > 0) {
                  context.drawImage(video, 0, 0);
                  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQrDecoder(frame.data, frame.width, frame.height, {
                    inversionAttempts: "dontInvert",
                  });
                  if (code?.data) {
                    handleDecodedString(code.data);
                    return;
                  }
                }
              }
            } catch {
              // Ignore decode drop
            } finally {
              isDecodingRef.current = false;
            }
          }
        }

        if (!isLockedRef.current) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
      };

      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (err: any) {
      console.warn("[VaahanSafe Activate] Camera start failure:", err);
      setHasPermission(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. You can enter the QR ID manually.");
      } else {
        setErrorMessage("Could not connect to camera device.");
      }
      setScanStatus("ERROR");
    }
  }, [facingMode, handleDecodedString, stopCamera]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current || !isTorchAvailable) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      } catch {
        // Torch constraint rejected
      }
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // 1. Inactive State — Clean interactive card with "Activate Camera" button
  if (!isActive) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-12 text-center shadow-xs">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
          {/* Reticle / Camera Illustration */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5">
            <span className="absolute -top-1 -left-1 h-3.5 w-3.5 border-t-2 border-l-2 border-primary" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 border-t-2 border-r-2 border-primary" />
            <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 border-b-2 border-l-2 border-primary" />
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 border-b-2 border-r-2 border-primary" />
            <VaahanIcon name="camera" size={32} className="text-primary" />
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <Button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsActive(true);
              }}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
            >
              <VaahanIcon name="camera" size={16} />
              <span>Activate Camera</span>
            </Button>

            <button
              type="button"
              onClick={onFallbackToManual}
              className="w-full py-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              <VaahanIcon name="edit" size={13} />
              <span>Enter sticker ID manually</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active State — Live Viewfinder with controls & error fallback
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
      {/* Live Video Feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-[360px] sm:h-[400px] object-cover"
        aria-label="Live QR scanner viewfinder"
      />

      {/* Target Viewfinder Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative h-52 w-52 rounded-2xl border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
          {/* Corner Brackets */}
          <span className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-primary" />
          <span className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-primary" />
          <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-primary" />
          <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-primary" />

          {/* Scanning Line Animation */}
          {scanStatus === "SCANNING" && (
            <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-primary/80 shadow-[0_0_8px_rgba(204,120,92,0.8)] animate-pulse" />
          )}
        </div>
      </div>

      {/* Recognized Transition Overlay */}
      {scanStatus === "DETECTED" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white space-y-2 z-20">
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">
            QR Recognized
          </span>
          <span className="font-mono text-[11px] text-white/80">
            Continuing to physical possession verification...
          </span>
        </div>
      )}

      {/* Viewfinder Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-white/90">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CAMERA ACTIVE</span>
        </div>

        <div className="flex items-center gap-2">
          {isTorchAvailable && (
            <button
              type="button"
              onClick={toggleTorch}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
              aria-label={isTorchOn ? "Turn torch off" : "Turn torch on"}
            >
              <VaahanIcon name="sun" size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={switchCamera}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
            aria-label="Switch camera"
          >
            <VaahanIcon name="refresh" size={15} />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              stopCamera();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
            aria-label="Stop camera"
          >
            <VaahanIcon name="close" size={15} />
          </button>
        </div>
      </div>

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-white space-y-4 z-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <VaahanIcon name="alert" size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Camera Unavailable</p>
            <p className="text-xs text-white/70 max-w-xs">{errorMessage}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            <Button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                startCamera();
              }}
              className="flex-1 h-10 rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <VaahanIcon name="refresh" size={14} className="mr-1.5" />
              Activate Camera
            </Button>
            <Button
              type="button"
              onClick={onFallbackToManual}
              variant="secondary"
              className="flex-1 h-10 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Enter ID Manually
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
