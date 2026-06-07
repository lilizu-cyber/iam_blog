const ReadModelStore = require('../../../src/backend/infrastructure/ReadModelStore');

describe('ReadModelStore.convertUpdate', () => {
  let store;

  beforeEach(() => {
    store = new ReadModelStore('postgresql://example');
    store.sequelize = {
      literal: (value) => ({ literal: value }),
    };
  });

  it('keeps camelCase attribute names for $set values', () => {
    const publishedAt = new Date('2026-06-07T12:00:00.000Z');
    const result = store.convertUpdate({
      $set: {
        status: 'published',
        publishedAt,
        isIAMRelated: true,
      },
      $inc: { version: 1 },
    });

    expect(result.status).toBe('published');
    expect(result.publishedAt).toBe(publishedAt);
    expect(result.isIAMRelated).toBe(true);
    expect(result.published_at).toBeUndefined();
    expect(result.is_iam_related).toBeUndefined();
  });

  it('uses attribute keys with snake_case SQL for $inc', () => {
    const result = store.convertUpdate({
      $inc: { viewCount: 1 },
    });

    expect(result.viewCount).toEqual({ literal: 'view_count + 1' });
  });

  it('ignores createdAt updates', () => {
    const result = store.convertUpdate({
      $set: {
        createdAt: new Date(),
        title: 'Updated',
      },
    });

    expect(result.createdAt).toBeUndefined();
    expect(result.title).toBe('Updated');
  });
});
