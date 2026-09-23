/* -------------------------------------------------------------------------- */
/*                               PAGE GEOMETRY                                */
/* -------------------------------------------------------------------------- */

export const PAGE = {
  width: 210, // A4 Portrait width in mm
  height: 297, // A4 Portrait height in mm
  marginX: 18,
  marginTop: 17,
  marginBottom: 16,
} as const;

export function getContentWidth(): number {
  return PAGE.width - PAGE.marginX * 2;
}

export function getLeftMargin(): number {
  return PAGE.marginX;
}

export function getRightMargin(): number {
  return PAGE.width - PAGE.marginX;
}
