import { OpenFoodFactsService } from '../../../src/modules/openfoodfacts/service/openfoodfacts.service';

describe('OpenFoodFactsService', () => {
  const originalFetch = global.fetch;
  let service: OpenFoodFactsService;

  beforeEach(() => {
    process.env.OPEN_FOOD_FACTS_PROXY_REQUEST_DELAY_MS = '0';
    process.env.OPEN_FOOD_FACTS_PROXY_TIMEOUT_MS = '2000';
    service = new OpenFoodFactsService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    delete process.env.OPEN_FOOD_FACTS_PROXY_REQUEST_DELAY_MS;
    delete process.env.OPEN_FOOD_FACTS_PROXY_TIMEOUT_MS;
  });

  it('normaliza la respuesta de busqueda por codigo de barras', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 1,
          product: {
            product_name_es: 'Leche Entera',
            brands: 'Pascual, Otra marca',
            quantity: '1 l',
            allergens_tags: ['en:milk'],
            image_url: 'https://images.example/leche.jpg',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    ) as typeof fetch;

    await expect(service.searchByBarcode('1234567890123')).resolves.toEqual({
      name: 'Leche Entera',
      brand: 'Pascual',
      description: undefined,
      uom: 'L',
      quantity: 1,
      allergens: ['LACTEOS'],
      imageUrl: 'https://images.example/leche.jpg',
    });
  });

  it('normaliza la respuesta de busqueda por nombre y descarta productos sin nombre', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          products: [
            {
              product_name: 'Tomate Triturado',
              generic_name_es: 'Conserva de tomate',
              brands: 'Hacendado',
              quantity: '500 g',
              allergens_tags: ['en:celery'],
            },
            {
              product_name: '   ',
              brands: 'Ignorar',
            },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    ) as typeof fetch;

    await expect(service.searchByName('tomate')).resolves.toEqual([
      {
        name: 'Tomate Triturado',
        brand: 'Hacendado',
        description: 'Conserva de tomate',
        uom: 'G',
        quantity: 500,
        allergens: ['APIO'],
        imageUrl: undefined,
      },
    ]);
  });

  it('devuelve null cuando el producto no existe', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    ) as typeof fetch;

    await expect(service.searchByBarcode('0000000000000')).resolves.toBeNull();
  });
});
