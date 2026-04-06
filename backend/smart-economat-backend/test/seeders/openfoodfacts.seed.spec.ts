import type { SeedContext } from '../../src/seeders/seed-context';
import {
  type OffProduct,
  uploadOpenFoodFactsProductImage,
} from '../../src/seeders/openfoodfacts.seed';

describe('openfoodfacts.seed', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reuses cached uploads for repeated product images', async () => {
    const store = new Map<string, unknown>();
    const postMultipart = jest.fn().mockResolvedValue({
      id: 'archivo-1',
      url: '/uploads/off-image.jpg',
      urlOptimized: '/uploads/off-image-optimized.jpg',
    });
    const context = {
      getState: <T>(key: string) => store.get(key) as T,
      set: (key: string, value: unknown) => store.set(key, value),
      postMultipart,
    } as unknown as SeedContext;

    const fetchMock = jest.fn().mockResolvedValue(
      new Response(Buffer.from('image-binary'), {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
        },
      })
    );
    global.fetch = fetchMock as typeof fetch;

    const firstProduct: OffProduct = {
      code: '1234567890123',
      image_url: 'https://images.test/off.jpg',
    };
    const secondProduct: OffProduct = {
      code: '1234567890123',
      image_url: 'https://images.test/off.jpg',
    };

    const firstRef = await uploadOpenFoodFactsProductImage(
      context,
      firstProduct
    );
    const secondRef = await uploadOpenFoodFactsProductImage(
      context,
      secondProduct
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(postMultipart).toHaveBeenCalledTimes(1);
    expect(firstRef).toEqual({
      key: 'code:1234567890123',
      sourceUrl: 'https://images.test/off.jpg',
      url: '/uploads/off-image.jpg',
      urlOptimized: '/uploads/off-image-optimized.jpg',
      archivoId: 'archivo-1',
    });
    expect(secondRef).toEqual(firstRef);
    expect(firstProduct.seedImageUrl).toBe('/uploads/off-image.jpg');
    expect(secondProduct.seedImageUrl).toBe('/uploads/off-image.jpg');
    expect(
      context.getState<Array<{ key: string }>>('seedUploadedImageRefs')
    ).toHaveLength(1);
  });
});
