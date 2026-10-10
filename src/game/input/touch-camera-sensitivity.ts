/** Mobile camera input gain is in radians per CSS pixel of finger movement. */
export const DEFAULT_TOUCH_CAMERA_SENSITIVITY = 60;
export const MIN_TOUCH_CAMERA_SENSITIVITY = 10;
export const MAX_TOUCH_CAMERA_SENSITIVITY = 100;

export function normalizeTouchCameraSensitivity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TOUCH_CAMERA_SENSITIVITY;
  return Math.max(MIN_TOUCH_CAMERA_SENSITIVITY, Math.min(MAX_TOUCH_CAMERA_SENSITIVITY, value));
}

/**
 * The former constant 0.002 rad/px required multiple full-screen swipes to
 * turn. The default 60 is about four times as responsive, while players can
 * tune from precise (10) to rapid (100) in the mobile settings.
 */
export function touchCameraRadiansPerPixel(sensitivity: number): number {
  return 0.0015 + normalizeTouchCameraSensitivity(sensitivity) * 0.00011;
}

export function mapTouchCameraDrag(
  dx: number,
  dy: number,
  sensitivity: number,
  invertY: boolean,
): { alpha: number; beta: number } {
  const gain = touchCameraRadiansPerPixel(sensitivity);
  return {
    alpha: -dx * gain,
    beta: dy * gain * 0.75 * (invertY ? -1 : 1),
  };
}
