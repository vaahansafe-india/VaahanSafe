export interface GeographyOption {
  code: string;
  name: string;
}
export function changePartnerState<
  T extends { state_code: string; district_code: string },
>(value: T, state_code: string): T {
  return {
    ...value,
    state_code,
    district_code: value.state_code === state_code ? value.district_code : "",
  };
}
