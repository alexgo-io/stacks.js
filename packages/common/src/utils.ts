import { Logger } from './logger';

// Buffer module from NodeJS that also works in the browser https://www.npmjs.com/package/buffer
// > The trailing slash is important, tells module lookup algorithm to use the npm module
// > named buffer instead of the node.js core module named buffer!
import { Buffer as BufferPolyfill } from 'buffer/';

// There can be small type definition differences between the NodeJS Buffer and polyfill Buffer,
// so export using the type definition from NodeJS (@types/node).
import type { Buffer as NodeJSBuffer } from 'buffer';

const AvailableBufferModule: typeof NodeJSBuffer =
  // eslint-disable-next-line node/prefer-global/buffer
  typeof Buffer !== 'undefined' ? Buffer : (BufferPolyfill as any);

export { AvailableBufferModule as Buffer };

/**
 *  @ignore
 */
export const BLOCKSTACK_HANDLER = 'blockstack';

/**
 * Time
 * @private
 * @ignore
 */
export function nextYear() {
  return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
}

/**
 * Time
 * @private
 * @ignore
 */
export function nextMonth() {
  return new Date(new Date().setMonth(new Date().getMonth() + 1));
}

/**
 * Time
 * @private
 * @ignore
 */
export function nextHour() {
  return new Date(new Date().setHours(new Date().getHours() + 1));
}

/**
 * Converts megabytes to bytes. Returns 0 if the input is not a finite number.
 * @ignore
 */
export function megabytesToBytes(megabytes: number): number {
  if (!Number.isFinite(megabytes)) {
    return 0;
  }
  return Math.floor(megabytes * 1024 * 1024);
}

/**
 * Calculate the AES-CBC ciphertext output byte length a given input length.
 * AES has a fixed block size of 16-bytes regardless key size.
 * @ignore
 */
export function getAesCbcOutputLength(inputByteLength: number) {
  // AES-CBC block mode rounds up to the next block size.
  const cipherTextLength = (Math.floor(inputByteLength / 16) + 1) * 16;
  return cipherTextLength;
}

/**
 * Calculate the base64 encoded string length for a given input length.
 * This is equivalent to the byte length when the string is ASCII or UTF8-8
 * encoded.
 * @param number
 */
export function getBase64OutputLength(inputByteLength: number) {
  const encodedLength = Math.ceil(inputByteLength / 3) * 4;
  return encodedLength;
}

/**
 * Query Strings
 * @private
 * @ignore
 */

export function updateQueryStringParameter(uri: string, key: string, value: string) {
  const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
  const separator = uri.indexOf('?') !== -1 ? '&' : '?';
  if (uri.match(re)) {
    return uri.replace(re, `$1${key}=${value}$2`);
  } else {
    return `${uri}${separator}${key}=${value}`;
  }
}

/**
 * Versioning
 * @param {string} v1 - the left half of the version inequality
 * @param {string} v2 - right half of the version inequality
 * @returns {bool} iff v1 >= v2
 * @private
 * @ignore
 */

export function isLaterVersion(v1: string, v2: string) {
  if (v1 === undefined || v1 === '') {
    v1 = '0.0.0';
  }

  if (v2 === undefined || v1 === '') {
    v2 = '0.0.0';
  }

  const v1tuple = v1.split('.').map(x => parseInt(x, 10));
  const v2tuple = v2.split('.').map(x => parseInt(x, 10));

  for (let index = 0; index < v2.length; index++) {
    if (index >= v1.length) {
      v2tuple.push(0);
    }
    if (v1tuple[index] < v2tuple[index]) {
      return false;
    }
  }
  return true;
}

/**
 * UUIDs
 * @private
 * @ignore
 */
export function makeUUID4() {
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Checks if both urls pass the same origin check & are absolute
 * @param  {[type]}  uri1 first uri to check
 * @param  {[type]}  uri2 second uri to check
 * @return {Boolean} true if they pass the same origin check
 * @private
 * @ignore
 */
export function isSameOriginAbsoluteUrl(uri1: string, uri2: string) {
  try {
    const parsedUri1 = new URL(uri1);
    const parsedUri2 = new URL(uri2);

    const port1 =
      parseInt(parsedUri1.port || '0', 10) | 0 || (parsedUri1.protocol === 'https:' ? 443 : 80);
    const port2 =
      parseInt(parsedUri2.port || '0', 10) | 0 || (parsedUri2.protocol === 'https:' ? 443 : 80);

    const match = {
      scheme: parsedUri1.protocol === parsedUri2.protocol,
      hostname: parsedUri1.hostname === parsedUri2.hostname,
      port: port1 === port2,
      absolute:
        (uri1.includes('http://') || uri1.includes('https://')) &&
        (uri2.includes('http://') || uri2.includes('https://')),
    };

    return match.scheme && match.hostname && match.port && match.absolute;
  } catch (error) {
    console.log(error);
    console.log('Parsing error in same URL origin check');
    // Parse error
    return false;
  }
}

/**
 * Returns the global scope `Window`, `WorkerGlobalScope`, or `NodeJS.Global` if available in the
 * currently executing environment.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/self
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/self
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope
 *
 * This could be switched to `globalThis` once it is standardized and widely available.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
 * @ignore
 */
export function getGlobalScope(): Window {
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  // This function is meant to be called when accessing APIs that are typically only available in
  // web-browser/DOM environments, but we also want to support situations where running in Node.js
  // environment, and a polyfill was added to the Node.js `global` object scope without adding the
  // `window` global object as well.
  if (typeof global !== 'undefined') {
    return global as unknown as Window;
  }
  throw new Error(
    'Unexpected runtime environment - no supported global scope (`window`, `self`, `global`) available'
  );
}

function getAPIUsageErrorMessage(
  scopeObject: unknown,
  apiName: string,
  usageDesc?: string
): string {
  if (usageDesc) {
    return `Use of '${usageDesc}' requires \`${apiName}\` which is unavailable on the '${scopeObject}' object within the currently executing environment.`;
  } else {
    return `\`${apiName}\` is unavailable on the '${scopeObject}' object within the currently executing environment.`;
  }
}

interface GetGlobalObjectOptions {
  /**
   * Throw an error if the object is not found.
   * @default false
   */
  throwIfUnavailable?: boolean;
  /**
   * Additional information to include in an error if thrown.
   */
  usageDesc?: string;
  /**
   * If the object is not found, return an new empty object instead of undefined.
   * Requires [[throwIfUnavailable]] to be falsey.
   * @default false
   */
  returnEmptyObject?: boolean;
}

/**
 * Returns an object from the global scope (`Window` or `WorkerGlobalScope`) if it
 * is available within the currently executing environment.
 * When executing within the Node.js runtime these APIs are unavailable and will be
 * `undefined` unless the API is provided via polyfill.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/self
 * @ignore
 */
export function getGlobalObject<K extends Extract<keyof Window, string>>(
  name: K,
  { throwIfUnavailable, usageDesc, returnEmptyObject }: GetGlobalObjectOptions = {}
): Window[K] | undefined {
  let globalScope: Window | undefined = undefined;
  try {
    globalScope = getGlobalScope();
    if (globalScope) {
      const obj = globalScope[name];
      if (obj) {
        return obj;
      }
    }
  } catch (error) {
    Logger.error(`Error getting object '${name}' from global scope '${globalScope}': ${error}`);
  }
  if (throwIfUnavailable) {
    const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
    Logger.error(errMsg);
    throw new Error(errMsg);
  }
  if (returnEmptyObject) {
    return {} as any;
  }
  return undefined;
}

/**
 * Returns a specified subset of objects from the global scope (`Window` or `WorkerGlobalScope`)
 * if they are available within the currently executing environment.
 * When executing within the Node.js runtime these APIs are unavailable will be `undefined`
 * unless the API is provided via polyfill.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/self
 * @ignore
 */
export function getGlobalObjects<K extends Extract<keyof Window, string>>(
  names: K[],
  { throwIfUnavailable, usageDesc, returnEmptyObject }: GetGlobalObjectOptions = {}
): Pick<Window, K> {
  let globalScope: Window | undefined;
  try {
    globalScope = getGlobalScope();
  } catch (error) {
    Logger.error(`Error getting global scope: ${error}`);
    if (throwIfUnavailable) {
      const errMsg = getAPIUsageErrorMessage(globalScope, names[0].toString(), usageDesc);
      Logger.error(errMsg);
      throw errMsg;
    } else if (returnEmptyObject) {
      globalScope = {} as any;
    }
  }

  const result: Pick<Window, K> = {} as any;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    try {
      if (globalScope) {
        const obj = globalScope[name];
        if (obj) {
          result[name] = obj;
        } else if (throwIfUnavailable) {
          const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
          Logger.error(errMsg);
          throw new Error(errMsg);
        } else if (returnEmptyObject) {
          result[name] = {} as any;
        }
      }
    } catch (error) {
      if (throwIfUnavailable) {
        const errMsg = getAPIUsageErrorMessage(globalScope, name.toString(), usageDesc);
        Logger.error(errMsg);
        throw new Error(errMsg);
      }
    }
  }
  return result;
}

export type IntegerType = number | string | bigint | Uint8Array;

// eslint-disable-next-line node/prefer-global/buffer
export function intToBytes(value: IntegerType, signed: boolean, byteLength: number): Buffer {
  return toBuffer(intToBigInt(value, signed), byteLength);
}

export function intToBigInt(value: IntegerType, signed: boolean): bigint {
  let parsedValue = value;

  if (typeof parsedValue === 'number') {
    if (!Number.isInteger(parsedValue)) {
      throw new RangeError(`Invalid value. Values of type 'number' must be an integer.`);
    }
    return BigInt(parsedValue);
  }
  if (typeof parsedValue === 'string') {
    // If hex string then convert to buffer then fall through to the buffer condition
    if (parsedValue.toLowerCase().startsWith('0x')) {
      // Trim '0x' hex-prefix
      let hex = parsedValue.slice(2);

      // Allow odd-length strings like `0xf` -- some libs output these, or even just `0x${num.toString(16)}`
      hex = hex.padStart(hex.length + (hex.length % 2), '0');

      parsedValue = AvailableBufferModule.from(hex, 'hex');
    } else {
      try {
        return BigInt(parsedValue);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new RangeError(`Invalid value. String integer '${parsedValue}' is not finite.`);
        }
      }
    }
  }
  if (typeof parsedValue === 'bigint') {
    return parsedValue;
  }
  if (parsedValue instanceof Uint8Array || AvailableBufferModule.isBuffer(parsedValue)) {
    if (signed) {
      // Allow byte arrays smaller than 128-bits to be passed.
      // This allows positive signed ints like `0x08` (8) or negative signed
      // ints like `0xf8` (-8) to be passed without having to pad to 16 bytes.
      const bn = fromTwos(BigInt(`0x${bytesToHex(parsedValue)}`), parsedValue.byteLength * 8);
      return BigInt(bn.toString());
    } else {
      return BigInt(`0x${bytesToHex(parsedValue)}`);
    }
  }
  throw new TypeError(
    `Invalid value type. Must be a number, bigint, integer-string, hex-string, BigInt instance, or Buffer.`
  );
}

export function with0x(value: string): string {
  return !value.startsWith('0x') ? `0x${value}` : value;
}

/**
 * Converts hex input string to bigint
 * @param hex - hex input string without 0x prefix and in big endian format
 * @example "6c7cde4d702830c1db34ef7c19e2776f59107afef39084776fc88bc78dbb9656"
 */
export function hexToBigInt(hex: string): bigint {
  if (typeof hex !== 'string')
    throw new TypeError('hexToNumber: expected string, got ' + typeof hex);
  // Big Endian
  return BigInt(`0x${hex}`);
}

export function utf8ToBytes(content: string) {
  return new TextEncoder().encode(content);
}

/**
 * Converts IntegerType to hex string
 */
export const intToHexString = (integer: IntegerType, lengthBytes = 8): string => {
  const value = typeof integer === 'bigint' ? integer : intToBigInt(integer, false);
  return value.toString(16).padStart(lengthBytes * 2, '0');
};

/**
 * Converts hex string to Uint8Array
 * @param {hex} hex string without 0x prefix
 * @output {Uint8Array} instance of bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
  }
  if (hex.slice(0, 2) === '0x') {
    throw new Error('input hex should be without 0x prefix');
  }
  if (hex.length % 2)
    throw new Error(`hexToBytes: received invalid unpadded hex, got: ${hex.length}`);

  const array = new Uint8Array(hex.length / 2);

  for (let i = 0; i < array.length; i++) {
    const j = i * 2;
    const hexByte = hex.slice(j, j + 2);
    const byte = Number.parseInt(hexByte, 16);
    if (Number.isNaN(byte) || byte < 0) throw new Error('Invalid byte sequence');
    array[i] = byte;
  }
  return array;
}

const byteToHexCache: string[] = new Array(0xff);

for (let n = 0; n <= 0xff; ++n) {
  byteToHexCache[n] = n.toString(16).padStart(2, '0');
}

/**
 * Converts Uint8Array to hex string
 */
export function bytesToHex(uint8a: Uint8Array): string {
  const hexOctets = new Array(uint8a.length);
  for (let i = 0; i < uint8a.length; ++i) hexOctets[i] = byteToHexCache[uint8a[i]];
  return hexOctets.join('');
}

/**
 * Converts bigint to buffer type
 * @param {value} bigint value to be converted into buffer
 * @param {length} buffer optional length
 * @return {Buffer} buffer instance in big endian format
 */
export function toBuffer(value: bigint, length: number = 16) {
  const hex = intToHexString(value, length);
  // buffer instance in big endian format
  return AvailableBufferModule.from(hexToBytes(hex));
}

/**
 * Converts from negative number to two's complement
 */
export function toTwos(value: bigint, size: number): bigint {
  // make sure its in range given the number of bits
  if (
    value < -(BigInt(1) << (BigInt(size) - BigInt(1))) ||
    value > (BigInt(1) << (BigInt(size) - BigInt(1))) - BigInt(1)
  )
    throw `Integer out of range given ${size} bits to represent.`;

  // if positive, return the positive value
  if (value >= BigInt(0)) return BigInt(value);

  // if negative, convert to twos complement representation
  const result = ~((-value - BigInt(1)) | ~((BigInt(1) << BigInt(size)) - BigInt(1)));
  return BigInt(result);
}

/**
 * Converts from two's complement to negative number
 */
export function fromTwos(value: bigint, size: number) {
  if ((value & (BigInt(1) << (BigInt(size) - BigInt(1)))) > BigInt(0))
    value = value - (BigInt(1) << BigInt(size));
  return value;
}
