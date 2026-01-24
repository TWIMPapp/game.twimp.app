import QueryParams from '@/typings/QueryParams';

export const stringifyQueryParams = (
  params: QueryParams,
  options: { includeStartAmp: boolean } = { includeStartAmp: true }
): string => {
  const keys = Object.keys(params);
  if (keys.length === 0) return '';
  return `${options.includeStartAmp ? '?' : ''}${keys
    .map((key) => `${key}=${(params as any)[key]}`)
    .join('&')}`;
};
