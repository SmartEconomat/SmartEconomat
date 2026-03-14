#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_INPUT_RELATIVE_PATH =
  'src/seeders/datos-base-economato/lista.csv';
const cliInputPath = process.argv[2];
const resolvedInputPath = cliInputPath
  ? path.resolve(ROOT, cliInputPath)
  : path.join(ROOT, DEFAULT_INPUT_RELATIVE_PATH);
const INPUT_PATH = resolvedInputPath;
const OUTPUT_PATH = INPUT_PATH.replace(
  /\.csv$/i,
  '.productos-normalizados.json'
);
const SOURCE_BASENAME = path.basename(INPUT_PATH);

const UnidadMedida = {
  KG: 'KG',
  G: 'G',
  L: 'L',
  ML: 'ML',
  UNIDAD: 'UNIDAD',
  PAQ: 'PAQ',
};

const TipoProducto = {
  VERDURA: 'verdura',
  FRUTA: 'fruta',
  CARNE: 'carne',
  PESCADO: 'pescado',
  MARISCO: 'marisco',
  LACTEO: 'lacteo',
  HUEVO: 'huevo',
  CEREAL: 'cereal',
  LEGUMBRE: 'legumbre',
  FRUTO_SECO: 'fruto_seco',
  CONDIMENTO: 'condimento',
  ACEITE: 'aceite',
  AZUCAR: 'azucar',
  BEBIDA: 'bebida',
  OTRO: 'otro',
};

const Alergeno = {
  GLUTEN: 'GLUTEN',
  CRUSTACEOS: 'CRUSTACEOS',
  HUEVOS: 'HUEVOS',
  PESCADO: 'PESCADO',
  CACAHUETES: 'CACAHUETES',
  SOJA: 'SOJA',
  LACTEOS: 'LACTEOS',
  FRUTOS_CON_CASCARA: 'FRUTOS_CON_CASCARA',
  APIO: 'APIO',
  MOSTAZA: 'MOSTAZA',
  SESAMO: 'SESAMO',
  SULFITO: 'SULFITO',
  ALTRAMUCES: 'ALTRAMUCES',
  MOLUSCOS: 'MOLUSCOS',
};

const MINOR_WORDS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'el',
  'en',
  'la',
  'las',
  'los',
  'o',
  'para',
  'por',
  'sin',
  'u',
  'y',
]);

const RAW_NAME_FIXES = new Map([
  ['aceite ove 0,4 �', 'aceite OVE 0,4º'],
  ['conejo higado-ri��n', 'conejo hígado-riñón'],
  ['CREMA PURE DE CASTA�A', 'crema puré de castaña'],
  ['embutido alem�n', 'embutido alemán'],
  ['granos caf� chocolate', 'granos café chocolate'],
  ['grasa vegeta�l pasteleria', 'grasa vegetal pastelería'],
  ['MIEL DE CA�A', 'miel de caña'],
  ['PAN HAMBURGUESA PEQUE�O', 'pan hamburguesa pequeño'],
  ['pasta pi�a aroma', 'pasta piña aroma'],
  ['pierna a�ojo fresc.', 'pierna añojo fresc.'],
  ['pulpa pi�a cong.', 'pulpa piña cong.'],
  ['QUESO HERRE�O TIERNO', 'queso herreño tierno'],
  ['solomillo a�ojo fresc.', 'solomillo añojo fresc.'],
]);

const STRING_FIXES = [
  [/\balcochofa\b/gi, 'alcachofa'],
  [/\baljaginato\b/gi, 'alginato'],
  [/\bbacadillo\b/gi, 'bocadillo'],
  [/\bcamberbert\b/gi, 'camembert'],
  [/\bcheedar\b/gi, 'cheddar'],
  [/\bcoctel\b/gi, 'cóctel'],
  [/\bcondesada\b/gi, 'condensada'],
  [/\bdesidratad([oa])\b/gi, 'deshidratad$1'],
  [/\bmago chutney\b/gi, 'mango chutney'],
  [/\bmostazafuerte\b/gi, 'mostaza fuerte'],
  [/\bmozataza\b/gi, 'mostaza'],
  [/\bmoztaza\b/gi, 'mostaza'],
  [/\bnaranaja\b/gi, 'naranja'],
  [/\bpalomita cong\.\b/gi, 'palometa cong.'],
  [/\bsuchi\b/gi, 'sushi'],
  [/\bvegeta�l\b/gi, 'vegetal'],
  [/\bvonagre\b/gi, 'vinagre'],
  [/\barticulo(s)? celiaco(s)?\b/gi, 'artículos celiacos'],
  [/\bcafe\b/gi, 'café'],
  [/\bpure\b/gi, 'puré'],
  [/\bpinones\b/gi, 'piñones'],
  [/\bcanonigos\b/gi, 'canónigos'],
];

const SPECIAL_UPPER_WORDS = new Map([
  ['bio', 'BIO'],
  ['c/p', 'C/P'],
  ['c/h', 'C/H'],
  ['d.o.', 'D.O.'],
  ['kg', 'KG'],
  ['ml', 'ML'],
  ['ove', 'OVE'],
  ['s/h', 'S/H'],
  ['s/p', 'S/P'],
  ['uht', 'UHT'],
  ['v', 'V'],
  ['xl', 'XL'],
]);

const UNIT_MAP = new Map([
  ['kg', UnidadMedida.KG],
  ['kg.', UnidadMedida.KG],
  ['lt', UnidadMedida.L],
  ['l', UnidadMedida.L],
  ['lts', UnidadMedida.L],
  ['lts.', UnidadMedida.L],
  ['g', UnidadMedida.G],
  ['gr', UnidadMedida.G],
  ['ml', UnidadMedida.ML],
  ['mts', UnidadMedida.UNIDAD],
  ['unid', UnidadMedida.UNIDAD],
  ['unid.', UnidadMedida.UNIDAD],
  ['unidad', UnidadMedida.UNIDAD],
  ['manojo', UnidadMedida.UNIDAD],
  ['manj', UnidadMedida.UNIDAD],
  ['hoja', UnidadMedida.UNIDAD],
  ['bote', UnidadMedida.PAQ],
  ['bolsa', UnidadMedida.PAQ],
  ['bols', UnidadMedida.PAQ],
  ['caja', UnidadMedida.PAQ],
  ['caja', UnidadMedida.PAQ],
  ['paq', UnidadMedida.PAQ],
  ['paq.', UnidadMedida.PAQ],
  ['paquete', UnidadMedida.PAQ],
  ['tubo', UnidadMedida.PAQ],
]);

const glutenPatterns = [
  'avena',
  'barquillo',
  'brownie',
  'brownies',
  'canelones',
  'corn flakes',
  'cous cous',
  'crepes',
  'croissant',
  'churros',
  'empanada',
  'espagueti',
  'fettuccini',
  'fetuccini',
  'fideo',
  'fideos',
  'galleta',
  'galletas',
  'gofio',
  'harina',
  'hojaldre',
  'lasaña',
  'lasana',
  'macarron',
  'macarrones',
  'pan ',
  'pizza',
  'ravioli',
  'semola',
  'tagliatele',
  'tallarines',
  'tempura',
  'tortellini',
  'trigo',
];

const glutenSafePatterns = [
  'arroz',
  'maiz',
  'polenta',
  'garbanzo',
  'papel de arroz',
  'harina de arroz',
  'harina de maiz',
  'harina de garbanzo',
  'fideo de arroz',
  'tortillas de arroz',
];

const crustaceanPatterns = [
  'bogavante',
  'camaron',
  'cangrejo',
  'carabineros',
  'centollo',
  'cigala',
  'gamba',
  'gambas',
  'langosta',
  'langostino',
  'necora',
  'necoras',
  'txangurro',
];

const molluscPatterns = [
  'alemeja',
  'almeja',
  'almejas',
  'berberecho',
  'bigaro',
  'busgado',
  'calamar',
  'chipiron',
  'choco',
  'choquito',
  'lapa',
  'lapas',
  'mejillon',
  'molusco',
  'navaja',
  'navajas',
  'ostra',
  'ostras',
  'pulpo',
  'sepia',
  'vieira',
  'vieiras',
];

const fishPatterns = [
  'abadejo',
  'alfonsiños',
  'alfonsinos',
  'angulas',
  'anchoa',
  'anchoas',
  'atun',
  'bacalao',
  'bonito',
  'boqueron',
  'burro ',
  'caballa',
  'cabeza de pescado',
  'cabrilla',
  'cherne',
  'chicharro',
  'cola de pescado',
  'congrio',
  'corvina',
  'dorada',
  'emperador',
  'filete de corvina',
  'fumet',
  'jareas de pescado',
  'lenguado',
  'medregal',
  'merlucilla',
  'merluza',
  'mero',
  'morena',
  'pampano',
  'pargo',
  'pescadilla',
  'pescado azul',
  'peto ',
  'pez espada',
  'rape',
  'rodaballo',
  'sama',
  'salmon',
  'salmonete',
  'sardina',
  'sargo',
  'taco pescado',
  'tollos',
  'tripa de bacalao',
  'trucha',
  'ventresca de atun',
  'vieja',
  'viejas',
];

const meatPatterns = [
  'aguja de res',
  'añojo',
  'aojo',
  'babilla',
  'bacon',
  'bife',
  'bistec',
  'bola tapa',
  'bola-tapa',
  'bovril',
  'buey',
  'butifarra',
  'cabra fresca',
  'cabrito',
  'carne ',
  'carrillera',
  'carrillera',
  'carret cordero',
  'carret de cordero',
  'cerdo',
  'chistorra',
  'chopped',
  'chuleta',
  'chuletero',
  'ciervo',
  'cochinillo',
  'codillo',
  'codorniz',
  'cocido',
  'conejo',
  'confit pato',
  'cordero',
  'costilla',
  'costillar',
  'cuadril',
  'embutido',
  'entrecot',
  'faisan',
  'fiambre',
  'foie',
  'fuet',
  'gallina',
  'gallo de corral',
  'garron',
  'hamburguesa',
  'higado',
  'huesos',
  'jabali',
  'jamon',
  'lagrimas ibericas',
  'lengua res',
  'lomo ',
  'magret',
  'magro',
  'manos de cerdo',
  'morcilla',
  'morcillo',
  'morcon',
  'mortadela',
  'muslo faisan',
  'nalga',
  'ossobuco',
  'paleta cocida',
  'paleta de cerdo',
  'paleta ib',
  'panceta',
  'papada',
  'pata de cerdo',
  'pate',
  'pato',
  'pavo',
  'peceto',
  'pepitos',
  'perdiz',
  'perdices',
  'picanton',
  'pichon',
  'pierna',
  'pistola de res',
  'pollo',
  'presa',
  'pularda',
  'rabadilla',
  'rabo de buey',
  'rabo de vacuno',
  'riñon',
  'riñones',
  'salami',
  'salchicha',
  'salchichas',
  'salchichon',
  'secreto de cerdo',
  'sesos',
  'solomillo',
  'taco res',
  'tacos de cerdo',
  'ternera',
  'tocino',
];

const dairyPatterns = [
  'actimel',
  'batido cacao',
  'crema de leche',
  'cuajada',
  'helado',
  'leche ',
  'mantequilla',
  'mascarpone',
  'mozzarella',
  'nata',
  'quesadilla',
  'queso',
  'requeson',
  'yogur',
  'yogurt',
];

const eggPatterns = [
  'albumina',
  'al huevo',
  'clara ',
  'huevo',
  'huevos',
  'mayonesa',
  'yema',
];
const peanutPatterns = ['cacahuete'];
const soyPatterns = ['miso', 'soja', 'tofu'];
const nutPatterns = [
  'almendra',
  'almendras',
  'anacardo',
  'anacardos',
  'avellana',
  'avellanas',
  'macadamia',
  'nuez',
  'nueces',
  'piñon',
  'piñones',
  'pistacho',
  'pistachos',
];
const celeryPatterns = ['apio'];
const mustardPatterns = ['mostaza', 'moztaza'];
const sesamePatterns = ['ajon joli', 'ajonjoli', 'sesamo'];
const sulphitePatterns = [
  'cereza confitada',
  'ciruela pasa',
  'fruta confitada',
  'orejones',
  'pasas',
  'sake',
  'vinagre',
  'vino',
];
const lupinPatterns = ['altramuces', 'chochos'];

const fruitPatterns = [
  'albaricoque',
  'arandano',
  'arandanos',
  'brevas',
  'caqui',
  'castaña',
  'castañas',
  'cereza',
  'ciruela',
  'coco',
  'datil',
  'durazno',
  'fresa',
  'frambuesa',
  'fruta',
  'granada',
  'grosella',
  'guayaba',
  'guayabo',
  'higo',
  'kiwi',
  'lima',
  'limon',
  'limones',
  'lychee',
  'mandarina',
  'mandarinas',
  'mango',
  'manzana',
  'melon',
  'membrillo',
  'mora',
  'moras',
  'naranja',
  'nectarina',
  'nispero',
  'nisperos',
  'orejones',
  'papaya',
  'parchita',
  'pera',
  'piña',
  'platano',
  'platano',
  'pomelo',
  'praguayos',
  'praline avellana',
  'pulpa',
  'sandia',
  'uvas',
  'uva ',
  'yuca',
];

const vegetablePatterns = [
  'acelga',
  'aguacate',
  'aji',
  'ajo',
  'ajos',
  'alcachofa',
  'apio',
  'batata',
  'batavia',
  'berenjena',
  'berros',
  'beterrada',
  'brocoli',
  'brecol',
  'brotes',
  'calabacin',
  'calabaza',
  'canónigos',
  'canonigos',
  'cardo',
  'cebolla',
  'cebolleta',
  'cebollino',
  'chalota',
  'champiñon',
  'chile',
  'cilantro',
  'col ',
  'coliflor',
  'cogollo',
  'endivia',
  'ensalada',
  'escarola',
  'espinaca',
  'esparrago',
  'flor calabacin',
  'germinado',
  'guisante',
  'guindilla',
  'habichuela',
  'hinojo',
  'hierba buena',
  'judia',
  'judias',
  'lechuga',
  'menestra',
  'mezcla verduras',
  'micro mezclum',
  'mini pepino',
  'mini pimiento',
  'minimazorcas',
  'nabo',
  'ñame',
  'ñoras',
  'papa',
  'papas',
  'pepinillo',
  'pepino',
  'perejil',
  'pimiento',
  'puerro',
  'rabanito',
  'rabano',
  'remolacha',
  'reina luisa',
  'romero',
  'rucola',
  'seta',
  'setas',
  'tomate',
  'tomillo',
  'zanahoria',
];

const legumePatterns = [
  'altramuces',
  'alubia',
  'chochos',
  'garbanzo',
  'haba',
  'habas',
  'judia',
  'judias',
  'lenteja',
  'pochas',
  'soja germinada',
  'soja',
];

const cerealPatterns = [
  'arroz',
  'avena',
  'barquillo',
  'brownie',
  'canelones',
  'cereal',
  'corn flakes',
  'cous cous',
  'croissant',
  'empanada',
  'espagueti',
  'fideo',
  'fideos',
  'galleta',
  'galletas',
  'gofio',
  'harina',
  'hojaldre',
  'lasaña',
  'lasana',
  'macarron',
  'macarrones',
  'nachos',
  'pan ',
  'papel de arroz',
  'pasta',
  'pizza',
  'polenta',
  'ravioli',
  'semola',
  'tagliatele',
  'tallarines',
  'tempura',
  'tortellini',
  'tortillas de arroz',
  'trigo',
];

const nutCategoryPatterns = [
  'almendra',
  'almendras',
  'anacardo',
  'anacardos',
  'avellana',
  'avellanas',
  'macadamia',
  'nuez',
  'nueces',
  'piñones',
  'pistacho',
  'pistachos',
  'pipas',
];
const oilPatterns = ['aceite'];
const sugarPatterns = [
  'azucar',
  'bombon',
  'bombones',
  'caramelo',
  'chocolate',
  'chocolatinas',
  'dextrosa',
  'edulcorante',
  'fructosa',
  'glucosa',
  'maltosa',
  'mazapan',
  'miel',
  'polvorones',
  'sacarina',
  'turron',
  'viruta de chocolate',
];
const beveragePatterns = ['agua', 'bebida', 'sake', 'vino'];
const condimentPatterns = [
  'agar agar',
  'aji',
  'albahaca',
  'anticristalizante',
  'azafran',
  'caldo',
  'canela',
  'cardamomo',
  'carga gas sifon',
  'cayena',
  'clavo',
  'cloruro calcico',
  'colorante',
  'comino',
  'condimento',
  'confitura',
  'curry',
  'edulcorante',
  'enebro',
  'eneldo',
  'esencia',
  'estragon',
  'gel de silice',
  'gelatina',
  'jengibre',
  'ketchup',
  'laurel',
  'levadura',
  'mojo',
  'mostaza',
  'oregano',
  'pectina',
  'pimienta',
  'sal ',
  'sal de',
  'salsa',
  'salvia',
  'sirope',
  'sumfill',
  'tabasco',
  'vainilla',
  'vinagre',
  'wasabi',
];

function readInput() {
  return fs.readFileSync(INPUT_PATH, 'utf8');
}

function simplify(text) {
  return ` ${String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#/%.,+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

function cleanSpaces(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,;:/()%-])\s*/g, '$1')
    .replace(/\s*-\s*/g, '-')
    .trim();
}

function fixRawName(value) {
  const trimmed = String(value || '').trim();
  return RAW_NAME_FIXES.get(trimmed) || trimmed;
}

function applyStringFixes(value) {
  let name = value;
  for (const [pattern, replacement] of STRING_FIXES) {
    name = name.replace(pattern, replacement);
  }

  name = name
    .replace(/\bcong\.?\b/gi, 'congelado')
    .replace(/\bfresc\.?\b/gi, 'fresco')
    .replace(/\brefrig\.?\b/gi, 'refrigerado')
    .replace(/\bs\/h\b/gi, 'sin hueso')
    .replace(/\bc\/h\b/gi, 'con hueso')
    .replace(/\bs\/p\b/gi, 'sin piel')
    .replace(/\bc\/p\b/gi, 'con piel')
    .replace(/\bc-fruta\b/gi, 'con fruta')
    .replace(/\bc-c\b/gi, 'con cereales')
    .replace(/\bpn\b/gi, 'pata negra')
    .replace(/\bmml\b/gi, 'ml')
    .replace(/\b39mm\b/gi, '39 mm')
    .replace(/\b49mm\b/gi, '49 mm')
    .replace(/\b60mm\b/gi, '60 mm')
    .replace(/\b82mm\b/gi, '82 mm')
    .replace(/\b1\.5 lt\b/gi, '1.5 L')
    .replace(/\b75cl\b/gi, '75 cl')
    .replace(/\b100cl\b/gi, '100 cl')
    .replace(/\b50cl\b/gi, '50 cl')
    .replace(/\b25 g\b/gi, '25 g')
    .replace(/\b20 mml\b/gi, '20 ml')
    .replace(/\b1\/2\b/g, '1/2');

  return cleanSpaces(name);
}

function smartTitleCase(value) {
  const parts = cleanSpaces(value).split(/(\s+|[-/()#,])/);
  let wordIndex = 0;

  return parts
    .map((part) => {
      if (!part || /^(\s+|[-/()#,])$/.test(part)) {
        return part;
      }

      const lower = part.toLowerCase();
      if (SPECIAL_UPPER_WORDS.has(lower)) {
        wordIndex += 1;
        return SPECIAL_UPPER_WORDS.get(lower);
      }

      if (/^[0-9]+([.,/][0-9]+)*$/.test(part)) {
        wordIndex += 1;
        return part;
      }

      if (/^[A-Z0-9#]{2,}$/.test(part)) {
        if (/[0-9#]/.test(part)) {
          wordIndex += 1;
          return part;
        }
      }

      if (lower === 'd.o') {
        wordIndex += 1;
        return 'D.O.';
      }

      if (wordIndex > 0 && MINOR_WORDS.has(lower)) {
        wordIndex += 1;
        return lower;
      }

      wordIndex += 1;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('')
    .replace(/\bKg\b/g, 'KG')
    .replace(/\bMl\b/g, 'ML')
    .replace(/\bLt\b/g, 'L')
    .replace(/\bPaq\b/g, 'PAQ');
}

function normalizeName(name) {
  return smartTitleCase(applyStringFixes(fixRawName(name)));
}

function parsePrice(text) {
  const match = String(text || '')
    .replace(',', '.')
    .match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseYield(text) {
  const match = String(text || '')
    .replace(',', '.')
    .match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function normalizeUnit(rawUnit, peerUnit, simplifiedName) {
  const normalizedRaw = String(rawUnit || '')
    .trim()
    .toLowerCase();
  if (UNIT_MAP.has(normalizedRaw)) {
    return UNIT_MAP.get(normalizedRaw);
  }
  if (peerUnit) {
    return peerUnit;
  }
  if (
    simplifiedName.includes(' agua ') ||
    simplifiedName.includes(' vino ') ||
    simplifiedName.includes(' sake ')
  ) {
    return UnidadMedida.L;
  }
  if (simplifiedName.includes(' aceite ')) {
    return UnidadMedida.KG;
  }
  return UnidadMedida.UNIDAD;
}

function includesAny(text, patterns) {
  return patterns.some((pattern) =>
    text.includes(` ${simplify(pattern).trim()} `)
  );
}

function isUtensilOrSupplyContext(text) {
  return (
    text.includes(' cuchilla ') ||
    text.includes(' cuchillas ') ||
    text.includes(' corta pan ')
  );
}

function inferTipoProducto(originalName, normalizedName) {
  const text = simplify(`${originalName} ${normalizedName}`);
  const isPlantMilk =
    text.includes(' leche de almendra ') ||
    text.includes(' leche de almendras ') ||
    text.includes(' leche de avena ') ||
    text.includes(' leche de coco ') ||
    text.includes(' leche de soja ');
  const isPlantYogurt =
    text.includes(' yogur vegetal ') ||
    text.includes(' yogur sabia ') ||
    (text.includes(' yogur ') && text.includes(' soja '));

  if (includesAny(text, oilPatterns)) return TipoProducto.ACEITE;
  if (isPlantMilk) return TipoProducto.BEBIDA;
  if (isPlantYogurt) return TipoProducto.OTRO;
  if (!isPlantMilk && includesAny(text, dairyPatterns))
    return TipoProducto.LACTEO;
  if (includesAny(text, eggPatterns)) return TipoProducto.HUEVO;
  if (
    includesAny(text, crustaceanPatterns) ||
    includesAny(text, molluscPatterns)
  ) {
    return TipoProducto.MARISCO;
  }
  if (includesAny(text, fishPatterns)) return TipoProducto.PESCADO;
  if (includesAny(text, meatPatterns)) return TipoProducto.CARNE;
  if (isUtensilOrSupplyContext(text)) return TipoProducto.OTRO;
  if (includesAny(text, nutCategoryPatterns)) return TipoProducto.FRUTO_SECO;
  if (includesAny(text, legumePatterns)) return TipoProducto.LEGUMBRE;
  if (includesAny(text, cerealPatterns)) return TipoProducto.CEREAL;
  if (includesAny(text, fruitPatterns)) return TipoProducto.FRUTA;
  if (includesAny(text, beveragePatterns)) return TipoProducto.BEBIDA;
  if (includesAny(text, sugarPatterns)) return TipoProducto.AZUCAR;
  if (includesAny(text, vegetablePatterns)) return TipoProducto.VERDURA;
  if (includesAny(text, condimentPatterns)) return TipoProducto.CONDIMENTO;
  return TipoProducto.OTRO;
}

function inferAlergenos(originalName, normalizedName) {
  const text = simplify(`${originalName} ${normalizedName}`);
  const alergenos = new Set();

  const isPlantBasedDairyName =
    text.includes(' leche de almendra ') ||
    text.includes(' leche de almendras ') ||
    text.includes(' leche de avena ') ||
    text.includes(' leche de coco ') ||
    text.includes(' leche de soja ') ||
    text.includes(' yogur vegetal ') ||
    text.includes(' yogur sabia ') ||
    text.includes(' yogur sabores bio soja ');
  const isSupplyContext = isUtensilOrSupplyContext(text);

  if (
    includesAny(text, glutenPatterns) &&
    !isSupplyContext &&
    !includesAny(text, glutenSafePatterns)
  ) {
    alergenos.add(Alergeno.GLUTEN);
  }
  if (includesAny(text, crustaceanPatterns)) {
    alergenos.add(Alergeno.CRUSTACEOS);
  }
  if (includesAny(text, eggPatterns)) {
    alergenos.add(Alergeno.HUEVOS);
  }
  if (includesAny(text, fishPatterns)) {
    alergenos.add(Alergeno.PESCADO);
  }
  if (includesAny(text, peanutPatterns)) {
    alergenos.add(Alergeno.CACAHUETES);
  }
  if (includesAny(text, soyPatterns)) {
    alergenos.add(Alergeno.SOJA);
  }
  if (!isPlantBasedDairyName && includesAny(text, dairyPatterns)) {
    alergenos.add(Alergeno.LACTEOS);
  }
  if (includesAny(text, nutPatterns)) {
    alergenos.add(Alergeno.FRUTOS_CON_CASCARA);
  }
  if (includesAny(text, celeryPatterns)) {
    alergenos.add(Alergeno.APIO);
  }
  if (includesAny(text, mustardPatterns)) {
    alergenos.add(Alergeno.MOSTAZA);
  }
  if (includesAny(text, sesamePatterns)) {
    alergenos.add(Alergeno.SESAMO);
  }
  if (includesAny(text, sulphitePatterns)) {
    alergenos.add(Alergeno.SULFITO);
  }
  if (includesAny(text, lupinPatterns)) {
    alergenos.add(Alergeno.ALTRAMUCES);
  }
  if (includesAny(text, molluscPatterns)) {
    alergenos.add(Alergeno.MOLUSCOS);
  }

  return [...alergenos].sort();
}

function buildDescription({
  nombreOriginal,
  unidadOriginal,
  precioUnitario,
  rendimiento,
  tipo,
  alergenos,
}) {
  const fragments = [
    `Producto normalizado desde ${SOURCE_BASENAME}. Nombre original: ${nombreOriginal}.`,
    `Unidad original: ${unidadOriginal || 'SIN_UNIDAD'}.`,
    `Categoría inferida: ${tipo}.`,
  ];

  if (precioUnitario !== null) {
    fragments.push(`Precio de referencia: ${precioUnitario.toFixed(2)} EUR.`);
  }
  if (rendimiento !== null) {
    fragments.push(`Rendimiento: ${rendimiento.toFixed(2)}%.`);
  }
  if (alergenos.length > 0) {
    fragments.push(`Alérgenos inferidos: ${alergenos.join(', ')}.`);
  }

  return fragments.join(' ');
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`No existe el CSV de entrada: ${INPUT_PATH}`);
  }

  const raw = readInput();
  const lines = raw.split(/\r?\n/);
  const rows = [];
  const peerLookup = new Map();

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    const [rawName = '', rawUnit = '', rawPrice = '', rawYield = ''] =
      line.split(';');
    const nombreOriginal = rawName.trim();
    const unidadOriginal = rawUnit.trim();
    const precioOriginal = rawPrice.trim();
    const rendimientoOriginal = rawYield.trim();

    if (!nombreOriginal && !unidadOriginal && !precioOriginal) {
      continue;
    }

    const key = simplify(nombreOriginal).trim();
    if (!peerLookup.has(key)) {
      peerLookup.set(key, []);
    }

    const previewUnit = UNIT_MAP.get(unidadOriginal.toLowerCase()) || null;
    const previewPrice = parsePrice(precioOriginal);

    peerLookup.get(key).push({ unit: previewUnit, price: previewPrice });
    rows.push({
      sourceRow: index + 1,
      nombreOriginal,
      unidadOriginal,
      precioOriginal,
      rendimientoOriginal,
    });
  }

  const productos = rows.map((row) => {
    const normalizedName = normalizeName(row.nombreOriginal);
    const nameKey = simplify(row.nombreOriginal).trim();
    const peers = (peerLookup.get(nameKey) || []).filter(
      (peer) => peer.unit || peer.price !== null
    );
    const peerUnit = peers.find((peer) => peer.unit)?.unit || null;
    const peerPrice = peers.find((peer) => peer.price !== null)?.price ?? null;
    const simplifiedName = simplify(normalizedName);
    const unidad = normalizeUnit(row.unidadOriginal, peerUnit, simplifiedName);
    const precioUnitario = parsePrice(row.precioOriginal) ?? peerPrice;
    const rendimiento = parseYield(row.rendimientoOriginal);
    const tipo = inferTipoProducto(row.nombreOriginal, normalizedName);
    const alergenos = inferAlergenos(row.nombreOriginal, normalizedName);
    const observaciones = [];

    if (!row.unidadOriginal.trim() && peerUnit) {
      observaciones.push(
        `Unidad inferida desde producto homónimo: ${peerUnit}`
      );
    }
    if (!row.precioOriginal.trim() && peerPrice !== null) {
      observaciones.push(
        `Precio inferido desde producto homónimo: ${peerPrice.toFixed(2)} EUR`
      );
    }
    if (!row.precioOriginal.trim() && peerPrice === null) {
      observaciones.push('Precio no disponible en el CSV de origen');
    }

    return {
      sourceRow: row.sourceRow,
      nombre: normalizedName,
      marca: null,
      descripcion: buildDescription({
        nombreOriginal: row.nombreOriginal,
        unidadOriginal: row.unidadOriginal,
        precioUnitario,
        rendimiento,
        tipo,
        alergenos,
      }),
      unidad,
      fechaCaducidad: null,
      pathImg: null,
      tipo,
      codigoBarras: null,
      contenido: 1,
      alergenos,
      metadataCsv: {
        nombreOriginal: row.nombreOriginal,
        unidadOriginal: row.unidadOriginal || null,
        precioOriginal: row.precioOriginal || null,
        precioUnitario,
        rendimientoOriginal: row.rendimientoOriginal || null,
        rendimiento,
        observacionesNormalizacion: observaciones,
      },
    };
  });

  const summary = {
    totalProductos: productos.length,
    categorias: productos.reduce((acc, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1;
      return acc;
    }, {}),
    alergenos: productos.reduce((acc, item) => {
      for (const alergeno of item.alergenos) {
        acc[alergeno] = (acc[alergeno] || 0) + 1;
      }
      return acc;
    }, {}),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.relative(ROOT, INPUT_PATH).replace(/\\/g, '/'),
    outputFile: path.relative(ROOT, OUTPUT_PATH).replace(/\\/g, '/'),
    entityShape: 'CreateProductoDto-compatible plus metadataCsv',
    totalSourceProducts: productos.length,
    summary,
    productos,
  };

  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  console.log(`JSON generado en ${OUTPUT_PATH}`);
  console.log(`Productos exportados: ${productos.length}`);
}

main();
