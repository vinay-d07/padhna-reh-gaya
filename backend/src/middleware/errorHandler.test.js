import { describe, it, expect, vi } from 'vitest';
import { AppError } from '../lib/errors';
import { errorHandler, notFoundHandler } from './errorHandler';

function mockReq(overrides = {}) {
  return { path: '/x', method: 'GET', originalUrl: '/x', ...overrides };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('uses an explicit AppError statusCode', () => {
    const res = mockRes();
    errorHandler(new AppError('nope', 409), mockReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'nope' });
  });

  it('infers 404 for a "not found" message', () => {
    const res = mockRes();
    errorHandler(new Error('Workspace not found'), mockReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Workspace not found' });
  });

  it('infers 400 for a validation-style message', () => {
    const res = mockRes();
    errorHandler(new Error('name is required'), mockReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('falls back to 500 and hides the message for an unrecognized error', () => {
    const res = mockRes();
    errorHandler(new Error('connection refused at 10.0.0.1'), mockReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Something went wrong' });
  });
});

describe('notFoundHandler', () => {
  it('responds 404 with the unmatched method/path', () => {
    const res = mockRes();
    notFoundHandler(mockReq({ method: 'POST', originalUrl: '/nope' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No route for POST /nope',
    });
  });
});
