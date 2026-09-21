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
        onSuccess(result.publicId);
      } else {
        setState("INVALID_QR");
        // Resume scanning automatically after 2.2 seconds if camera is still live
        setTimeout(() => {
          if (!isLocked.current && streamRef.current) {
            setState("SCANNING");
          }
        }, 2200);
      }
    },
    [onSuccess, stopTracks]
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
        // Dynamically load jsqr fallback on-demand
        const jsqrPkg = await import("jsqr");
        jsQRModule = jsqrPkg.default;
      } catch (err) {
        setErrorMessage("Failed to initialize QR decoder module.");
        setState("ERROR");
        return;
      }
    }

    if (!canvasRef.current && typeof document !== "undefined") {
      canvasRef.current = document.createElement("canvas");
    }

    const processFrame = async () => {
      if (isLocked.current || !video || video.readyState < video.HAVE_CURRENT_DATA) {
        if (!isLocked.current) {
          animationFrameId.current = requestAnimationFrame(processFrame);
        }
        return;
      }

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

          if (width > 0 && height > 0) {
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
        }
      } catch {
        // Drop bad frame and continue
      }

      if (!isLocked.current) {
        animationFrameId.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameId.current = requestAnimationFrame(processFrame);
  }, [handleDecodedString]);

  // Start Camera Stream
  const startScanner = useCallback(async () => {
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
      return;
    }

    setState("REQUESTING_PERMISSION");

    try {
      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
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
      streamRef.current = stream;

      // Inspect torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any =
          typeof videoTrack.getCapabilities === "function"
            ? videoTrack.getCapabilities()
            : null;
        if (capabilities && "torch" in capabilities) {
          setIsTorchAvailable(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState("SCANNING");
        startDecodeLoop();
      }
    } catch (err: any) {
      stopTracks();
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
    }
  }, [facingMode, startDecodeLoop, stopTracks]);

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

  // Lifecycle control based on active prop
  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopTracks();
      setState("IDLE");
      isLocked.current = false;
    }

    return () => {
      stopTracks();
      isLocked.current = false;
    };
  }, [active, facingMode, startScanner, stopTracks]);

  // Visibility change listener: Stop tracks when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopTracks();
      } else if (active && document.visibilityState === "visible") {
        startScanner();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [active, startScanner, stopTracks]);

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
    startScanner,
    stopScanner: stopTracks,
    scanFile,
    retryScan: () => {
      isLocked.current = false;
      setState("SCANNING");
    },
  };
}
