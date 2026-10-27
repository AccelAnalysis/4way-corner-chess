import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'The request body must be valid JSON.');
  }
}

export function ok(data, init = {}) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function errorResponse(error) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  if (error?.name === 'GameRuleError') {
    return NextResponse.json(
      { ok: false, error: { code: error.code || 'ILLEGAL_MOVE', message: error.message } },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { ok: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
    { status: 500 },
  );
}

export function requireString(value, fieldName, { min = 1, max = 200 } = {}) {
  const normalized = String(value || '').trim();
  if (normalized.length < min || normalized.length > max) {
    throw new ApiError(400, 'INVALID_FIELD', `${fieldName} must contain ${min}-${max} characters.`);
  }
  return normalized;
}
