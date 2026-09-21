"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { parseVaahanSafeQrPayload, type QrPayloadParseResult } from "@vaahansafe/qr-core/client";
import type { ScannerState, CameraFacingMode } from "./types";

interface UseCameraScannerOptions {
  onSuccess: (publicId: string) => void;
  active: boolean;
}

export function useCameraScanner({ onSuccess, active }: UseCameraScannerOptions) {
  const [state, setState] = useState<ScannerState>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>("environment");
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLocked = useRef(false);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const lastDecodeTimeRef = useRef(0);
  const isDecodingRef = useRef(false);

  // Keep latest onSuccess callback in a ref to avoid recreating decode loop and restarting camera
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Stop every active media track cleanly
  const stopTracks = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isStartingRef.current = false;
    isDecodingRef.current = false;
    setIsTorchOn(false);
    setIsTorchAvailable(false);
  }, []);

  // Process decoded payload safely
  const handleDecodedString = useCallback(
    (decodedText: string) => {
      if (isLocked.current) return;

      setState("DETECTED");
      const result: QrPayloadParseResult = parseVaahanSafeQrPayload(decodedText);

      if (result.valid && result.publicId) {
        isLocked.current = true;
        setState("RESOLVING");
        stopTracks();
        if (onSuccessRef.current) {
          onSuccessRef.current(result.publicId);
        }
      } else {
        setState("INVALID_QR");
        // Resume scanning automatically after 2.2 seconds if camera is still live
        setTimeout(() => {
          if (!isLocked.current && streamRef.current && isMountedRef.current) {
            setState("SCANNING");
          }
        }, 2200);
      }
    },
    [stopTracks]
  );

  // Frame processing loop using BarcodeDetector or in-memory canvas jsqr
  const startDecodeLoop = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // Check for native BarcodeDetector API
    const hasNativeBarcodeDetector =
      typeof window !== "undefined" && "BarcodeDetector" in window;

    let nativeDetector: any = null;
    let jsQRModule: any = null;

    if (hasNativeBarcodeDetector) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch {
        nativeDetector = null;
      }
    }

    if (!nativeDetector) {
      try {
        const jsqrPkg = await import("jsqr");
        jsQRModule = jsqrPkg.default;
      } catch {
        if (isMountedRef.current) {
          setErrorMessage("Failed to initialize QR decoder module.");
          setState("ERROR");
        }
        return;
      }
    }

    if (!canvasRef.current && typeof document !== "undefined") {
      canvasRef.current = document.createElement("canvas");
    }

    const processFrame = async () => {
      if (isLocked.current || !video || !isMountedRef.current) return;

      const now = performance.now();
      // Throttle decode checks to ~10-12 per second (every 85ms) to guarantee silky 60fps video and eliminate frame drops
      const shouldCheck =
        !isDecodingRef.current &&
        now - lastDecodeTimeRef.current >= 85 &&
        video.readyState >= video.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0;

      if (shouldCheck) {
        isDecodingRef.current = true;
        lastDecodeTimeRef.current = now;

        try {
          if (nativeDetector) {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue) {
                handleDecodedString(rawValue);
                return;
              }
            }
          } else if (jsQRModule && canvasRef.current) {
            const canvas = canvasRef.current;
            const width = video.videoWidth;
            const height = video.videoHeight;

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              const code = jsQRModule(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              if (code && code.data) {
                handleDecodedString(code.data);
                return;
              }
            }
          }
        } catch {
          // Drop bad frame and continue
        } finally {
          isDecodingRef.current = false;
        }
      }

      if (!isLocked.current && isMountedRef.current) {
        animationFrameId.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameId.current = requestAnimationFrame(processFrame);
  }, [handleDecodedString]);

  // Start Camera Stream with cancellation guard
  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    isLocked.current = false;
    setErrorMessage(null);
    stopTracks();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setState("UNSUPPORTED");
      setErrorMessage("Camera access is not supported by this browser.");
      isStartingRef.current = false;
      return;
    }

    setState("REQUESTING_PERMISSION");

    try {
      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        if (isMountedRef.current) {
          setHasMultipleCameras(videoInputs.length > 1);
        }
      } catch {
        // Enumeration error ignored
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Guard: if aborted or unmounted while permission dialog was active
      if (!isMountedRef.current || !active) {
        stream.getTracks().forEach((t) => t.stop());
        isStartingRef.current = false;
        return;
      }

      streamRef.current = stream;

      // Inspect torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any =
          typeof videoTrack.getCapabilities === "function"
            ? videoTrack.getCapabilities()
            : null;
        if (capabilities && "torch" in capabilities && isMountedRef.current) {
          setIsTorchAvailable(true);
        }
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("muted", "true");
        video.muted = true;
        try {
          await video.play();
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.warn("[CameraScanner] Video play error:", err);
          }
        }
        if (isMountedRef.current) {
          setState("SCANNING");
          startDecodeLoop();
        }
      }
    } catch (err: any) {
      stopTracks();
      if (!isMountedRef.current) return;
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setState("PERMISSION_DENIED");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setState("NO_CAMERA");
      } else {
        setState("ERROR");
        setErrorMessage(
          err?.message || "Could not start camera stream. Please try again."
        );
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [active, facingMode, startDecodeLoop, stopTracks]);

  // Toggle Torch (Flashlight)
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !isTorchAvailable) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch {
      // Flashlight error
    }
  }, [isTorchAvailable, isTorchOn]);

  // Switch between Environment and User camera
  const switchCamera = useCallback(async () => {
    const nextMode: CameraFacingMode =
      facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
  }, [facingMode]);

  // Local File Image Scanning
  const scanFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setState("VALIDATING");

      try {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => {
          img.onload = async () => {
            try {
              let decodedText: string | null = null;

              if (typeof window !== "undefined" && "BarcodeDetector" in window) {
                try {
                  const detector = new (window as any).BarcodeDetector({
                    formats: ["qr_code"],
                  });
                  const barcodes = await detector.detect(img);
                  if (barcodes && barcodes.length > 0) {
                    decodedText = barcodes[0].rawValue;
                  }
                } catch {
                  // Fall back to canvas jsqr
                }
              }

              if (!decodedText) {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const { default: jsQR } = await import("jsqr");
                  const code = jsQR(imageData.data, imageData.width, imageData.height);
                  if (code) {
                    decodedText = code.data;
                  }
                }
              }

              if (decodedText) {
                handleDecodedString(decodedText);
              } else {
                setState("INVALID_QR");
              }
            } catch {
              setState("INVALID_QR");
            }
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      } catch {
        setState("ERROR");
      }
    },
    [handleDecodedString]
  );

  // Lifecycle control: strictly depends ONLY on active status and facingMode
  useEffect(() => {
    isMountedRef.current = true;

    if (active) {
      startScanner();
    } else {
      stopTracks();
      setState("IDLE");
      isLocked.current = false;
    }

    return () => {
      isMountedRef.current = false;
      stopTracks();
      isLocked.current = false;
    };
  }, [active, facingMode]); // Deliberately omit unstable function references

  // Visibility change listener: Stop tracks when tab is hidden, resume when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopTracks();
      } else if (active && document.visibilityState === "visible") {
        startScanner();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [active, startScanner, stopTracks]);

  // Retry scanner manually
  const retryScan = useCallback(() => {
    isLocked.current = false;
    startScanner();
  }, [startScanner]);

  return {
    state,
    errorMessage,
    videoRef,
    facingMode,
    isTorchAvailable,
    isTorchOn,
    hasMultipleCameras,
    toggleTorch,
    switchCamera,
    scanFile,
    retryScan,
  };
}
