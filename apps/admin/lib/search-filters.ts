const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function adminSearchFilters(
  fields: readonly string[],
  term: string,
  uuidFields: readonly string[] = [],
) {
  return fields.flatMap((field) =>
    uuidFields.includes(field)
      ? UUID.test(term)
        ? [`${field}.eq.${term}`]
        : []
      : [`${field}.ilike.%${term}%`],
  );
}
