/**
 * BOOS BET — Política Monetária Central (FIN-004.1 / ISO 4217)
 * Princípio: No evidence, no compliance claim.
 * 
 * Moeda Principal: AOA (Kwanza Angolano, ISO 4217 Código Numérico: 973, Alfabético: AOA)
 * Escala Canónica: Fator 10^2 (Minor Units / Cêntimos inteiros).
 * Aritmética: Estritamente inteira (sem ponto flutuante em operações contábeis).
 */

export const CANONICAL_CURRENCY = 'AOA' as const;
export type CanonicalCurrency = typeof CANONICAL_CURRENCY;

export const MONETARY_SCALE = 100; // 1 Kz = 100 minor units (cêntimos)
export const MAX_SAFE_TRANSACTION_KZ = 50_000_000; // Limite prudencial por operação (50 milhões Kz)
export const MAX_SAFE_TRANSACTION_MINOR = MAX_SAFE_TRANSACTION_KZ * MONETARY_SCALE;

export interface MonetaryValidationResult {
  isValid: boolean;
  errorCode?: 'INVALID_TYPE' | 'NON_FINITE' | 'NON_POSITIVE' | 'EXCESSIVE_PRECISION' | 'OUT_OF_BOUNDS';
  errorMessage?: string;
  minorUnits: number; // Inteiro em cêntimos (ex: 500000 = 5.000,00 Kz)
  majorUnits: number; // Valor decimal correspondente (ex: 5000)
}

/**
 * Validação rigorosa de montantes financeiros de entrada.
 * PROIBIÇÃO EXPRESSA: Nunca utiliza Math.round() silencioso para mascarar entradas com precisão inválida.
 * Se o cliente enviar mais de 2 casas decimais (ex: 100.555), a entrada é expressamente REJEITADA.
 */
export function validateMonetaryInput(
  rawInput: unknown,
  options?: { allowZero?: boolean; maxKz?: number }
): MonetaryValidationResult {
  const allowZero = options?.allowZero ?? false;
  const maxLimitKz = options?.maxKz ?? MAX_SAFE_TRANSACTION_KZ;

  // 1. Verificação de tipo primitivo numérico
  if (typeof rawInput !== 'number') {
    return {
      isValid: false,
      errorCode: 'INVALID_TYPE',
      errorMessage: 'O montante financeiro deve ser fornecido como valor numérico.',
      minorUnits: 0,
      majorUnits: 0
    };
  }

  // 2. Verificação de finitude
  if (!Number.isFinite(rawInput) || Number.isNaN(rawInput)) {
    return {
      isValid: false,
      errorCode: 'NON_FINITE',
      errorMessage: 'O montante financeiro não pode ser NaN ou infinito.',
      minorUnits: 0,
      majorUnits: 0
    };
  }

  // 3. Verificação de limites de positividade
  if (allowZero ? rawInput < 0 : rawInput <= 0) {
    return {
      isValid: false,
      errorCode: 'NON_POSITIVE',
      errorMessage: allowZero
        ? 'O montante financeiro não pode ser negativo.'
        : 'O montante financeiro deve ser estritamente superior a zero.',
      minorUnits: 0,
      majorUnits: 0
    };
  }

  // 4. Verificação estrita de precisão (máximo 2 casas decimais sem arredondamento silencioso)
  // Converte para string representativa e analisa casas decimais
  const stringRepresentation = rawInput.toString();
  const decimalParts = stringRepresentation.split('.');
  if (decimalParts.length === 2 && decimalParts[1].length > 2) {
    return {
      isValid: false,
      errorCode: 'EXCESSIVE_PRECISION',
      errorMessage: `Precisão monetária inválida: a moeda AOA admite no máximo 2 casas decimais (recebido: ${decimalParts[1].length}). Proibido arredondamento silencioso.`,
      minorUnits: 0,
      majorUnits: 0
    };
  }

  // 5. Conversão exata para unidades menores inteiras (cêntimos)
  const minorUnitsCandidate = Math.round(rawInput * MONETARY_SCALE);

  // Verificação de integridade inteira segura (evita overflow do JS Number)
  if (!Number.isSafeInteger(minorUnitsCandidate) || rawInput > maxLimitKz) {
    return {
      isValid: false,
      errorCode: 'OUT_OF_BOUNDS',
      errorMessage: `O montante excede o limite prudencial máximo autorizado de ${maxLimitKz.toLocaleString('pt-AO')} Kz.`,
      minorUnits: 0,
      majorUnits: 0
    };
  }

  return {
    isValid: true,
    minorUnits: minorUnitsCandidate,
    majorUnits: rawInput
  };
}

/**
 * Converte minor units (cêntimos inteiros) em major units (Kwanzas decimais)
 */
export function minorToMajor(minorUnits: number): number {
  if (!Number.isSafeInteger(minorUnits)) {
    throw new Error('minorUnits deve ser um número inteiro seguro.');
  }
  return minorUnits / MONETARY_SCALE;
}

/**
 * Converte major units válidos em minor units inteiros
 */
export function majorToMinor(majorUnits: number): number {
  const validation = validateMonetaryInput(majorUnits, { allowZero: true });
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Montante inválido para conversão.');
  }
  return validation.minorUnits;
}

/**
 * Formatação canónica de exibição para Kwanza angolano (AOA)
 */
export function formatAoa(minorUnits: number): string {
  const major = minorToMajor(minorUnits);
  return `${major.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
}
export const formatAOA = formatAoa;

/**
 * Adição segura em minor units com verificação de overflow
 */
export function safeAddMinor(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new Error('Operandos devem ser inteiros seguros.');
  }
  const result = a + b;
  if (!Number.isSafeInteger(result)) {
    throw new Error('Overflow numérico em operação monetária de adição.');
  }
  return result;
}

/**
 * Subtração segura em minor units com garantia de não-negatividade opcional
 */
export function safeSubtractMinor(a: number, b: number, preventNegative: boolean = true): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new Error('Operandos devem ser inteiros seguros.');
  }
  const result = a - b;
  if (!Number.isSafeInteger(result)) {
    throw new Error('Overflow numérico em operação monetária de subtração.');
  }
  if (preventNegative && result < 0) {
    throw new Error('Subtração monetária resultaria em saldo negativo não autorizado.');
  }
  return result;
}
