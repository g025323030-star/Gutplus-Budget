/**
 * Unit tests for ExchangeRateService.
 *
 * The TypeORM AppDataSource and global fetch are fully mocked so these tests
 * run without a database or network connection.
 */

import { CurrencyCode } from '@gutplus/shared';

// ---------------------------------------------------------------------------
// Mock AppDataSource before importing the service (module-level mock)
// ---------------------------------------------------------------------------

const mockFindOne = jest.fn();
const mockInsertQueryBuilder = {
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  orIgnore: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue(undefined),
};
const mockCreate = jest.fn((data: object) => ({ ...data }));
const mockCreateQueryBuilder = jest.fn(() => mockInsertQueryBuilder);

const mockRepository = {
  findOne: mockFindOne,
  create: mockCreate,
  createQueryBuilder: mockCreateQueryBuilder,
};

jest.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockRepository),
  },
}));

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// ---------------------------------------------------------------------------
// Import the service AFTER mocks are in place
// ---------------------------------------------------------------------------

import { ExchangeRateService } from './exchange-rate.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRate = (currency: CurrencyCode, rateToIls: string, rateDate: string) => ({
  currency,
  rateToIls,
  rateDate,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExchangeRateService();
  });

  // -------------------------------------------------------------------------
  // getRateToIls
  // -------------------------------------------------------------------------

  describe('getRateToIls', () => {
    it('returns "1" immediately for ILS without any DB or network call', async () => {
      const result = await service.getRateToIls(CurrencyCode.ILS);

      expect(result).toBe('1');
      expect(mockFindOne).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns stored rate on cache hit (today\'s rate in DB), no fetch', async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockFindOne.mockResolvedValueOnce(makeRate(CurrencyCode.USD, '3.720000', today));

      const result = await service.getRateToIls(CurrencyCode.USD);

      expect(result).toBe('3.720000');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches from Frankfurter when no cached rate, persists and returns', async () => {
      // No DB cache
      mockFindOne.mockResolvedValueOnce(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rates: { ILS: 3.72 } }),
      } as Response);

      const result = await service.getRateToIls(CurrencyCode.USD);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('base=USD');
      expect(result).toBe('3.720000');
      // Should have tried to persist
      expect(mockInsertQueryBuilder.execute).toHaveBeenCalled();
    });

    it('falls back to most recent stored rate when fetch fails', async () => {
      // First findOne: no today cache; second (order DESC): fallback row
      mockFindOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeRate(CurrencyCode.EUR, '4.000000', '2026-01-01'));

      mockFetch.mockRejectedValueOnce(new Error('network error'));

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      const result = await service.getRateToIls(CurrencyCode.EUR);

      expect(result).toBe('4.000000');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('throws when fetch fails and no stored rate exists', async () => {
      mockFindOne.mockResolvedValue(null);
      mockFetch.mockRejectedValueOnce(new Error('network error'));

      jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      await expect(service.getRateToIls(CurrencyCode.GBP)).rejects.toThrow(
        /No exchange rate available/,
      );
    });
  });

  // -------------------------------------------------------------------------
  // convertToIls
  // -------------------------------------------------------------------------

  describe('convertToIls', () => {
    it('returns the amount unchanged for ILS', async () => {
      const result = await service.convertToIls('100.50', CurrencyCode.ILS);
      expect(result).toBe('100.50');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('converts using cached rate with decimal-safe multiplication', async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockFindOne.mockResolvedValueOnce(makeRate(CurrencyCode.USD, '3.720000', today));

      // 100.00 * 3.720000 = 372.00
      const result = await service.convertToIls('100.00', CurrencyCode.USD);
      expect(result).toBe('372.00');
    });

    it('rounds to 2 decimal places correctly', async () => {
      const today = new Date().toISOString().slice(0, 10);
      // 1.99 * 3.123456 = 6.215678... → rounds to 6.22
      mockFindOne.mockResolvedValueOnce(makeRate(CurrencyCode.USD, '3.123456', today));

      const result = await service.convertToIls('1.99', CurrencyCode.USD);
      // 1.99 * 3.123456 = 6.215677...44 → 6.22
      expect(result).toBe('6.22');
    });
  });
});
