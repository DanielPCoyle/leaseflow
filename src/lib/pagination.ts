/**
 * Parse pagination parameters from URL search params.
 * Returns { skip, take, page, pageSize }.
 */
export function getPagination(searchParams: URLSearchParams | Record<string, string | undefined>, defaultPageSize = 50) {
  const get = (key: string) =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(key)
      : searchParams[key];

  const page = Math.max(1, parseInt(get("page") || "1") || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, parseInt(get("pageSize") || defaultPageSize.toString()) || defaultPageSize)
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Build pagination metadata for a response.
 */
export function getPaginationMeta(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
