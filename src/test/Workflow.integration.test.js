import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn((db, name) => ({ db, name })),
  doc: vi.fn((db, name, id) => ({ db, name, id })),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  doc: firestoreMocks.doc,
  updateDoc: firestoreMocks.updateDoc,
  getDoc: firestoreMocks.getDoc,
  onSnapshot: firestoreMocks.onSnapshot,
  setDoc: firestoreMocks.setDoc,
}));

vi.mock('../firebase', () => ({
  db: {},
}));

import { createDealRecord, createOperationRecord, updateOperationRecord } from '../services/liveCollections';

describe('Workflow integration: listing -> offer -> deal -> operation -> status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a deal, creates an operation from accepted deal, and updates stage with a valid transition', async () => {
    firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'deal-1' });

    const deal = await createDealRecord(
      {
        listing: {
          id: 'listing-1',
          title: 'Cotton Fabric Scraps',
          ownerId: 'owner-1',
          factoryName: 'Rajesh Textiles',
          city: 'Tiruppur',
          unit: 'kg',
        },
        offer: 450,
        quantity: 1,
      },
      'buyer-1',
    );

    expect(deal.id).toBe('deal-1');
    expect(deal.buyerId).toBe('buyer-1');
    expect(deal.sellerId).toBe('owner-1');
    expect(deal.status).toBe('Negotiation');

    firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'op-1' });

    const operation = await createOperationRecord(
      {
        ...deal,
        id: 'deal-1',
      },
      'logistics-1',
    );

    expect(operation.id).toBe('op-1');
    expect(operation.dealId).toBe('deal-1');
    expect(operation.stage).toBe('Pickup Scheduled');

    firestoreMocks.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ stage: 'Pickup Scheduled' }),
    });
    firestoreMocks.updateDoc.mockResolvedValueOnce(undefined);

    await expect(updateOperationRecord('op-1', { stage: 'In Transit' })).resolves.toBeUndefined();
    expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
  });

  it('blocks invalid operation stage transitions and logs analytics event', async () => {
    firestoreMocks.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ stage: 'Pickup Scheduled' }),
    });

    firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'log-1' });

    await expect(updateOperationRecord('op-99', { stage: 'Delivered' })).rejects.toThrow(
      /Invalid stage transition/i,
    );

    expect(firestoreMocks.addDoc).toHaveBeenCalled();
    const eventWrite = firestoreMocks.addDoc.mock.calls.find(
      (call) => call?.[0]?.name === 'analyticsEvents',
    );
    expect(eventWrite).toBeTruthy();
  });
});
