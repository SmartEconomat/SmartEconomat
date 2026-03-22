export interface ExternalProductData {
  nombre: string;
  marca?: string;
  codigoBarras: string;
  imagenUrl?: string;
  alergenos?: string[];
  categoriaTags?: string[];
}

/**
 * Consulta la API pública de OpenFoodFacts para obtener datos básicos
 * de un producto a partir de su código de barras (EAN-13, UPC, etc.)
 *
 * @param barcode Código de barras a buscar
 * @returns Los datos estructurados del producto o null si no se encuentra/falla
 */
export async function fetchProductFromOFF(
  barcode: string
): Promise<ExternalProductData | null> {
  if (!barcode || barcode.trim() === '') return null;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          // Se recomienda enviar un User-Agent identificativo si es posible,
          // pero el navegador lo maneja automáticamente en peticiones CORS.
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // OFF devuelve status: 1 cuando encuentra el producto
    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;

    // OpenFoodFacts suele tener el nombre en varios idiomas.
    // Priorizamos español (es), luego genérico, luego inglés.
    const nombre =
      p.product_name_es ||
      p.product_name ||
      p.product_name_en ||
      '';

    if (!nombre) {
      return null; // Si ni siquiera tiene nombre, no nos sirve de mucho
    }

    return {
      nombre,
      marca: p.brands ? p.brands.split(',')[0].trim() : undefined,
      codigoBarras: barcode,
      imagenUrl: p.image_front_url || p.image_url || undefined,
      alergenos: p.allergens_tags || [],
      categoriaTags: p.categories_tags || [],
    };
  } catch (error) {
    console.error('Error fetching from OpenFoodFacts:', error);
    return null; // Fallback silencioso en caso de error de red
  }
}
