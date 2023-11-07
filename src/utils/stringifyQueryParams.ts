import QueryParams from '@/typings/QueryParams';

export const stringifyQueryParams = (
  params: QueryParams,
  options: { includeStartAmp: boolean } = { includeStartAmp: true }
): string => {
  return `${options.includeStartAmp ? '&' : ''}${Object.keys(params)
    .map((key) => `${key}=${(params as any)[key]}`)
    .join('&')}`;
};
