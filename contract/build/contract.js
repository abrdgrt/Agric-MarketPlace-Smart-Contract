function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;
  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }
  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);
  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }
  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }
  return desc;
}

// make PromiseIndex a nominal typing
var PromiseIndexBrand;
(function (PromiseIndexBrand) {
  PromiseIndexBrand[PromiseIndexBrand["_"] = -1] = "_";
})(PromiseIndexBrand || (PromiseIndexBrand = {}));
const TYPE_KEY = "typeInfo";
var TypeBrand;
(function (TypeBrand) {
  TypeBrand["BIGINT"] = "bigint";
  TypeBrand["DATE"] = "date";
})(TypeBrand || (TypeBrand = {}));
const ERR_INCONSISTENT_STATE = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";
const ERR_INDEX_OUT_OF_BOUNDS = "Index out of bounds";
function u8ArrayToBytes(array) {
  return array.reduce((result, value) => `${result}${String.fromCharCode(value)}`, "");
}
// TODO this function is a bit broken and the type can't be string
// TODO for more info: https://github.com/near/near-sdk-js/issues/78
function bytesToU8Array(bytes) {
  return Uint8Array.from([...bytes].map(byte => byte.charCodeAt(0)));
}
/**
 * Asserts that the expression passed to the function is truthy, otherwise throws a new Error with the provided message.
 *
 * @param expression - The expression to be asserted.
 * @param message - The error message to be printed.
 */
function assert$1(expression, message) {
  if (!expression) {
    throw new Error("assertion failed: " + message);
  }
}
function getValueWithOptions(value, options = {
  deserializer: deserialize
}) {
  const deserialized = deserialize(value);
  if (deserialized === undefined || deserialized === null) {
    return options?.defaultValue ?? null;
  }
  if (options?.reconstructor) {
    return options.reconstructor(deserialized);
  }
  return deserialized;
}
function serializeValueWithOptions(value, {
  serializer
} = {
  serializer: serialize
}) {
  return serializer(value);
}
function serialize(valueToSerialize) {
  return JSON.stringify(valueToSerialize, function (key, value) {
    if (typeof value === "bigint") {
      return {
        value: value.toString(),
        [TYPE_KEY]: TypeBrand.BIGINT
      };
    }
    if (typeof this[key] === "object" && this[key] !== null && this[key] instanceof Date) {
      return {
        value: this[key].toISOString(),
        [TYPE_KEY]: TypeBrand.DATE
      };
    }
    return value;
  });
}
function deserialize(valueToDeserialize) {
  return JSON.parse(valueToDeserialize, (_, value) => {
    if (value !== null && typeof value === "object" && Object.keys(value).length === 2 && Object.keys(value).every(key => ["value", TYPE_KEY].includes(key))) {
      switch (value[TYPE_KEY]) {
        case TypeBrand.BIGINT:
          return BigInt(value["value"]);
        case TypeBrand.DATE:
          return new Date(value["value"]);
      }
    }
    return value;
  });
}

/**
 * A Promise result in near can be one of:
 * - NotReady = 0 - the promise you are specifying is still not ready, not yet failed nor successful.
 * - Successful = 1 - the promise has been successfully executed and you can retrieve the resulting value.
 * - Failed = 2 - the promise execution has failed.
 */
var PromiseResult;
(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));
/**
 * A promise error can either be due to the promise failing or not yet being ready.
 */
var PromiseError;
(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function assertNumber(n) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}
function chain(...args) {
  const wrap = (a, b) => c => a(b(c));
  const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, undefined);
  const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, undefined);
  return {
    encode,
    decode
  };
}
function alphabet(alphabet) {
  return {
    encode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map(i => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length) throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i];
      });
    },
    decode: input => {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('alphabet.decode input should be array of strings');
      return input.map(letter => {
        if (typeof letter !== 'string') throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    }
  };
}
function join(separator = '') {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: from => {
      if (!Array.isArray(from) || from.length && typeof from[0] !== 'string') throw new Error('join.encode input should be array of strings');
      for (let i of from) if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);
      return from.join(separator);
    },
    decode: to => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    }
  };
}
function padding(bits, chr = '=') {
  assertNumber(bits);
  if (typeof chr !== 'string') throw new Error('padding chr should be string');
  return {
    encode(data) {
      if (!Array.isArray(data) || data.length && typeof data[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of data) if (typeof i !== 'string') throw new Error(`padding.encode: non-string input=${i}`);
      while (data.length * bits % 8) data.push(chr);
      return data;
    },
    decode(input) {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('padding.encode input should be array of strings');
      for (let i of input) if (typeof i !== 'string') throw new Error(`padding.decode: non-string input=${i}`);
      let end = input.length;
      if (end * bits % 8) throw new Error('Invalid padding: string should have whole number of bytes');
      for (; end > 0 && input[end - 1] === chr; end--) {
        if (!((end - 1) * bits % 8)) throw new Error('Invalid padding: string has too much padding');
      }
      return input.slice(0, end);
    }
  };
}
function normalize(fn) {
  if (typeof fn !== 'function') throw new Error('normalize fn should be function');
  return {
    encode: from => from,
    decode: to => fn(to)
  };
}
function convertRadix(data, from, to) {
  if (from < 2) throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
  if (to < 2) throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
  if (!Array.isArray(data)) throw new Error('convertRadix: data should be array');
  if (!data.length) return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data);
  digits.forEach(d => {
    assertNumber(d);
    if (d < 0 || d >= from) throw new Error(`Wrong integer: ${d}`);
  });
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < digits.length; i++) {
      const digit = digits[i];
      const digitBase = from * carry + digit;
      if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
        throw new Error('convertRadix: carry overflow');
      }
      carry = digitBase % to;
      digits[i] = Math.floor(digitBase / to);
      if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase) throw new Error('convertRadix: carry overflow');
      if (!done) continue;else if (!digits[i]) pos = i;else done = false;
    }
    res.push(carry);
    if (done) break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++) res.push(0);
  return res.reverse();
}
const gcd = (a, b) => !b ? a : gcd(b, a % b);
const radix2carry = (from, to) => from + (to - gcd(from, to));
function convertRadix2(data, from, to, padding) {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);
  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const mask = 2 ** to - 1;
  const res = [];
  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to) res.push((carry >> pos - to & mask) >>> 0);
    carry &= 2 ** pos - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}
function radix(num) {
  assertNumber(num);
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix.encode input should be Uint8Array');
      return convertRadix(Array.from(bytes), 2 ** 8, num);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix.decode input should be array of strings');
      return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
    }
  };
}
function radix2(bits, revPadding = false) {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32) throw new Error('radix2: carry overflow');
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
const base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
const base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize(s => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
const base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
const base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));
const genBase58 = abc => chain(radix(58), alphabet(abc), join(''));
const base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
const base58xmr = {
  encode(data) {
    let res = '';
    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
    }
    return res;
  },
  decode(str) {
    let res = [];
    for (let i = 0; i < str.length; i += 11) {
      const slice = str.slice(i, i + 11);
      const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
      const block = base58.decode(slice);
      for (let j = 0; j < block.length - blockLen; j++) {
        if (block[j] !== 0) throw new Error('base58xmr: wrong padding');
      }
      res = res.concat(Array.from(block.slice(block.length - blockLen)));
    }
    return Uint8Array.from(res);
  }
};
const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1) chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 0x1f;
  for (let v of words) chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}
function genBech32(encoding) {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
  const _words = radix2(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode(prefix, words, limit = 90) {
    if (typeof prefix !== 'string') throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || words.length && typeof words[0] !== 'number') throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit) throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    prefix = prefix.toLowerCase();
    return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
  }
  function decode(str, limit = 90) {
    if (typeof str !== 'string') throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || limit !== false && str.length > limit) throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1) throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);
    const _words = str.slice(sepIndex + 1);
    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return {
      prefix,
      words
    };
  }
  const decodeUnsafe = unsafeWrapper(decode);
  function decodeToBytes(str) {
    const {
      prefix,
      words
    } = decode(str, false);
    return {
      prefix,
      words,
      bytes: fromWords(words)
    };
  }
  return {
    encode,
    decode,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
genBech32('bech32');
genBech32('bech32m');
const utf8 = {
  encode: data => new TextDecoder().decode(data),
  decode: str => new TextEncoder().encode(str)
};
const hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize(s => {
  if (typeof s !== 'string' || s.length % 2) throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));
const CODERS = {
  utf8,
  hex,
  base16,
  base32,
  base64,
  base64url,
  base58,
  base58xmr
};
`Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;

var CurveType;
(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));
var DataLength;
(function (DataLength) {
  DataLength[DataLength["ED25519"] = 32] = "ED25519";
  DataLength[DataLength["SECP256K1"] = 64] = "SECP256K1";
})(DataLength || (DataLength = {}));

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
/**
 * Logs parameters in the NEAR WASM virtual machine.
 *
 * @param params - Parameters to log.
 */
function log(...params) {
  env.log(params.reduce((accumulated, parameter, index) => {
    // Stringify undefined
    const param = parameter === undefined ? "undefined" : parameter;
    // Convert Objects to strings and convert to string
    const stringified = typeof param === "object" ? JSON.stringify(param) : `${param}`;
    if (index === 0) {
      return stringified;
    }
    return `${accumulated} ${stringified}`;
  }, ""));
}
/**
 * Returns the account ID of the account that called the function.
 * Can only be called in a call or initialize function.
 */
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
/**
 * Returns the account ID of the current contract - the contract that is being executed.
 */
function currentAccountId() {
  env.current_account_id(0);
  return env.read_register(0);
}
/**
 * Returns the current block timestamp.
 */
function blockTimestamp() {
  return env.block_timestamp();
}
/**
 * Returns the amount of NEAR attached to this function call.
 * Can only be called in payable functions.
 */
function attachedDeposit() {
  return env.attached_deposit();
}
/**
 * Reads the value from NEAR storage that is stored under the provided key.
 *
 * @param key - The key to read from storage.
 */
function storageRead(key) {
  const returnValue = env.storage_read(key, 0);
  if (returnValue !== 1n) {
    return null;
  }
  return env.read_register(0);
}
/**
 * Checks for the existance of a value under the provided key in NEAR storage.
 *
 * @param key - The key to check for in storage.
 */
function storageHasKey(key) {
  return env.storage_has_key(key) === 1n;
}
/**
 * Get the last written or removed value from NEAR storage.
 */
function storageGetEvicted() {
  return env.read_register(EVICTED_REGISTER);
}
/**
 * Writes the provided bytes to NEAR storage under the provided key.
 *
 * @param key - The key under which to store the value.
 * @param value - The value to store.
 */
function storageWrite(key, value) {
  return env.storage_write(key, value, EVICTED_REGISTER) === 1n;
}
/**
 * Removes the value of the provided key from NEAR storage.
 *
 * @param key - The key to be removed.
 */
function storageRemove(key) {
  return env.storage_remove(key, EVICTED_REGISTER) === 1n;
}
/**
 * Returns the arguments passed to the current smart contract call.
 */
function input() {
  env.input(0);
  return env.read_register(0);
}
/**
 * Join an arbitrary array of NEAR promises.
 *
 * @param promiseIndexes - An arbitrary array of NEAR promise indexes to join.
 */
function promiseAnd(...promiseIndexes) {
  return env.promise_and(...promiseIndexes);
}
/**
 * Create a NEAR promise which will have multiple promise actions inside.
 *
 * @param accountId - The account ID of the target contract.
 */
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
/**
 * Attach a callback NEAR promise to a batch of NEAR promise actions.
 *
 * @param promiseIndex - The NEAR promise index of the batch.
 * @param accountId - The account ID of the target contract.
 */
function promiseBatchThen(promiseIndex, accountId) {
  return env.promise_batch_then(promiseIndex, accountId);
}
/**
 * Attach a create account promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a create account action to.
 */
function promiseBatchActionCreateAccount(promiseIndex) {
  env.promise_batch_action_create_account(promiseIndex);
}
/**
 * Attach a deploy contract promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a deploy contract action to.
 * @param code - The WASM byte code of the contract to be deployed.
 */
function promiseBatchActionDeployContract(promiseIndex, code) {
  env.promise_batch_action_deploy_contract(promiseIndex, code);
}
/**
 * Attach a function call promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a function call action to.
 * @param methodName - The name of the method to be called.
 * @param args - The arguments to call the method with.
 * @param amount - The amount of NEAR to attach to the call.
 * @param gas - The amount of Gas to attach to the call.
 */
function promiseBatchActionFunctionCall(promiseIndex, methodName, args, amount, gas) {
  env.promise_batch_action_function_call(promiseIndex, methodName, args, amount, gas);
}
/**
 * Attach a transfer promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a transfer action to.
 * @param amount - The amount of NEAR to transfer.
 */
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
/**
 * Attach a stake promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a stake action to.
 * @param amount - The amount of NEAR to stake.
 * @param publicKey - The public key with which to stake.
 */
function promiseBatchActionStake(promiseIndex, amount, publicKey) {
  env.promise_batch_action_stake(promiseIndex, amount, publicKey);
}
/**
 * Attach a add full access key promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a add full access key action to.
 * @param publicKey - The public key to add as a full access key.
 * @param nonce - The nonce to use.
 */
function promiseBatchActionAddKeyWithFullAccess(promiseIndex, publicKey, nonce) {
  env.promise_batch_action_add_key_with_full_access(promiseIndex, publicKey, nonce);
}
/**
 * Attach a add access key promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a add access key action to.
 * @param publicKey - The public key to add.
 * @param nonce - The nonce to use.
 * @param allowance - The allowance of the access key.
 * @param receiverId - The account ID of the receiver.
 * @param methodNames - The names of the method to allow the key for.
 */
function promiseBatchActionAddKeyWithFunctionCall(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames) {
  env.promise_batch_action_add_key_with_function_call(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames);
}
/**
 * Attach a delete key promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a delete key action to.
 * @param publicKey - The public key to delete.
 */
function promiseBatchActionDeleteKey(promiseIndex, publicKey) {
  env.promise_batch_action_delete_key(promiseIndex, publicKey);
}
/**
 * Attach a delete account promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a delete account action to.
 * @param beneficiaryId - The account ID of the beneficiary - the account that receives the remaining amount of NEAR.
 */
function promiseBatchActionDeleteAccount(promiseIndex, beneficiaryId) {
  env.promise_batch_action_delete_account(promiseIndex, beneficiaryId);
}
/**
 * Attach a function call with weight promise action to the NEAR promise index with the provided promise index.
 *
 * @param promiseIndex - The index of the promise to attach a function call with weight action to.
 * @param methodName - The name of the method to be called.
 * @param args - The arguments to call the method with.
 * @param amount - The amount of NEAR to attach to the call.
 * @param gas - The amount of Gas to attach to the call.
 * @param weight - The weight of unused Gas to use.
 */
function promiseBatchActionFunctionCallWeight(promiseIndex, methodName, args, amount, gas, weight) {
  env.promise_batch_action_function_call_weight(promiseIndex, methodName, args, amount, gas, weight);
}
/**
 * Executes the promise in the NEAR WASM virtual machine.
 *
 * @param promiseIndex - The index of the promise to execute.
 */
function promiseReturn(promiseIndex) {
  env.promise_return(promiseIndex);
}

/**
 * Tells the SDK to use this function as the initialization function of the contract.
 *
 * @param _empty - An empty object.
 */
function initialize(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
/**
 * Tells the SDK to expose this function as a view function.
 *
 * @param _empty - An empty object.
 */
function view(_empty) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, _descriptor
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {};
}
function call({
  privateFunction = false,
  payableFunction = false
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target, _key, descriptor) {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw new Error("Function is private");
      }
      if (!payableFunction && attachedDeposit() > 0n) {
        throw new Error("Function is not payable");
      }
      return originalMethod.apply(this, args);
    };
  };
}
function NearBindgen({
  requireInit = false,
  serializer = serialize,
  deserializer = deserialize
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }
      static _getState() {
        const rawState = storageRead("STATE");
        return rawState ? this._deserialize(rawState) : null;
      }
      static _saveToStorage(objectToSave) {
        storageWrite("STATE", this._serialize(objectToSave));
      }
      static _getArgs() {
        return JSON.parse(input() || "{}");
      }
      static _serialize(value, forReturn = false) {
        if (forReturn) {
          return JSON.stringify(value, (_, value) => typeof value === "bigint" ? `${value}` : value);
        }
        return serializer(value);
      }
      static _deserialize(value) {
        return deserializer(value);
      }
      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          const reconstructor = classObject[item].constructor?.reconstruct;
          classObject[item] = reconstructor ? reconstructor(plainObject[item]) : plainObject[item];
        }
        return classObject;
      }
      static _requireInit() {
        return requireInit;
      }
    };
  };
}

/**
 * A lookup map that stores data in NEAR storage.
 */
class LookupMap {
  /**
   * @param keyPrefix - The byte prefix to use when storing elements inside this collection.
   */
  constructor(keyPrefix) {
    this.keyPrefix = keyPrefix;
  }
  /**
   * Checks whether the collection contains the value.
   *
   * @param key - The value for which to check the presence.
   */
  containsKey(key) {
    const storageKey = this.keyPrefix + key;
    return storageHasKey(storageKey);
  }
  /**
   * Get the data stored at the provided key.
   *
   * @param key - The key at which to look for the data.
   * @param options - Options for retrieving the data.
   */
  get(key, options) {
    const storageKey = this.keyPrefix + key;
    const value = storageRead(storageKey);
    return getValueWithOptions(value, options);
  }
  /**
   * Removes and retrieves the element with the provided key.
   *
   * @param key - The key at which to remove data.
   * @param options - Options for retrieving the data.
   */
  remove(key, options) {
    const storageKey = this.keyPrefix + key;
    if (!storageRemove(storageKey)) {
      return options?.defaultValue ?? null;
    }
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Store a new value at the provided key.
   *
   * @param key - The key at which to store in the collection.
   * @param newValue - The value to store in the collection.
   * @param options - Options for retrieving and storing the data.
   */
  set(key, newValue, options) {
    const storageKey = this.keyPrefix + key;
    const storageValue = serializeValueWithOptions(newValue, options);
    if (!storageWrite(storageKey, storageValue)) {
      return options?.defaultValue ?? null;
    }
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Extends the current collection with the passed in array of key-value pairs.
   *
   * @param keyValuePairs - The key-value pairs to extend the collection with.
   * @param options - Options for storing the data.
   */
  extend(keyValuePairs, options) {
    for (const [key, value] of keyValuePairs) {
      this.set(key, value, options);
    }
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    return new LookupMap(data.keyPrefix);
  }
}

function indexToKey(prefix, index) {
  const data = new Uint32Array([index]);
  const array = new Uint8Array(data.buffer);
  const key = u8ArrayToBytes(array);
  return prefix + key;
}
/**
 * An iterable implementation of vector that stores its content on the trie.
 * Uses the following map: index -> element
 */
class Vector {
  /**
   * @param prefix - The byte prefix to use when storing elements inside this collection.
   * @param length - The initial length of the collection. By default 0.
   */
  constructor(prefix, length = 0) {
    this.prefix = prefix;
    this.length = length;
  }
  /**
   * Checks whether the collection is empty.
   */
  isEmpty() {
    return this.length === 0;
  }
  /**
   * Get the data stored at the provided index.
   *
   * @param index - The index at which to look for the data.
   * @param options - Options for retrieving the data.
   */
  get(index, options) {
    if (index >= this.length) {
      return options?.defaultValue ?? null;
    }
    const storageKey = indexToKey(this.prefix, index);
    const value = storageRead(storageKey);
    return getValueWithOptions(value, options);
  }
  /**
   * Removes an element from the vector and returns it in serialized form.
   * The removed element is replaced by the last element of the vector.
   * Does not preserve ordering, but is `O(1)`.
   *
   * @param index - The index at which to remove the element.
   * @param options - Options for retrieving and storing the data.
   */
  swapRemove(index, options) {
    assert$1(index < this.length, ERR_INDEX_OUT_OF_BOUNDS);
    if (index + 1 === this.length) {
      return this.pop(options);
    }
    const key = indexToKey(this.prefix, index);
    const last = this.pop(options);
    assert$1(storageWrite(key, serializeValueWithOptions(last, options)), ERR_INCONSISTENT_STATE);
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Adds data to the collection.
   *
   * @param element - The data to store.
   * @param options - Options for storing the data.
   */
  push(element, options) {
    const key = indexToKey(this.prefix, this.length);
    this.length += 1;
    storageWrite(key, serializeValueWithOptions(element, options));
  }
  /**
   * Removes and retrieves the element with the highest index.
   *
   * @param options - Options for retrieving the data.
   */
  pop(options) {
    if (this.isEmpty()) {
      return options?.defaultValue ?? null;
    }
    const lastIndex = this.length - 1;
    const lastKey = indexToKey(this.prefix, lastIndex);
    this.length -= 1;
    assert$1(storageRemove(lastKey), ERR_INCONSISTENT_STATE);
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Replaces the data stored at the provided index with the provided data and returns the previously stored data.
   *
   * @param index - The index at which to replace the data.
   * @param element - The data to replace with.
   * @param options - Options for retrieving and storing the data.
   */
  replace(index, element, options) {
    assert$1(index < this.length, ERR_INDEX_OUT_OF_BOUNDS);
    const key = indexToKey(this.prefix, index);
    assert$1(storageWrite(key, serializeValueWithOptions(element, options)), ERR_INCONSISTENT_STATE);
    const value = storageGetEvicted();
    return getValueWithOptions(value, options);
  }
  /**
   * Extends the current collection with the passed in array of elements.
   *
   * @param elements - The elements to extend the collection with.
   */
  extend(elements) {
    for (const element of elements) {
      this.push(element);
    }
  }
  [Symbol.iterator]() {
    return new VectorIterator(this);
  }
  /**
   * Create a iterator on top of the default collection iterator using custom options.
   *
   * @param options - Options for retrieving and storing the data.
   */
  createIteratorWithOptions(options) {
    return {
      [Symbol.iterator]: () => new VectorIterator(this, options)
    };
  }
  /**
   * Return a JavaScript array of the data stored within the collection.
   *
   * @param options - Options for retrieving and storing the data.
   */
  toArray(options) {
    const array = [];
    const iterator = options ? this.createIteratorWithOptions(options) : this;
    for (const value of iterator) {
      array.push(value);
    }
    return array;
  }
  /**
   * Remove all of the elements stored within the collection.
   */
  clear() {
    for (let index = 0; index < this.length; index++) {
      const key = indexToKey(this.prefix, index);
      storageRemove(key);
    }
    this.length = 0;
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    const vector = new Vector(data.prefix, data.length);
    return vector;
  }
}
/**
 * An iterator for the Vector collection.
 */
class VectorIterator {
  /**
   * @param vector - The vector collection to create an iterator for.
   * @param options - Options for retrieving and storing data.
   */
  constructor(vector, options) {
    this.vector = vector;
    this.options = options;
    this.current = 0;
  }
  next() {
    if (this.current >= this.vector.length) {
      return {
        value: null,
        done: true
      };
    }
    const value = this.vector.get(this.current, this.options);
    this.current += 1;
    return {
      value,
      done: false
    };
  }
}

/**
 * An unordered map that stores data in NEAR storage.
 */
class UnorderedMap {
  /**
   * @param prefix - The byte prefix to use when storing elements inside this collection.
   */
  constructor(prefix) {
    this.prefix = prefix;
    this.keys = new Vector(`${prefix}u`); // intentional different prefix with old UnorderedMap
    this.values = new LookupMap(`${prefix}m`);
  }
  /**
   * The number of elements stored in the collection.
   */
  get length() {
    return this.keys.length;
  }
  /**
   * Checks whether the collection is empty.
   */
  isEmpty() {
    return this.keys.isEmpty();
  }
  /**
   * Get the data stored at the provided key.
   *
   * @param key - The key at which to look for the data.
   * @param options - Options for retrieving the data.
   */
  get(key, options) {
    const valueAndIndex = this.values.get(key);
    if (valueAndIndex === null) {
      return options?.defaultValue ?? null;
    }
    const [value] = valueAndIndex;
    return getValueWithOptions(value, options);
  }
  /**
   * Store a new value at the provided key.
   *
   * @param key - The key at which to store in the collection.
   * @param value - The value to store in the collection.
   * @param options - Options for retrieving and storing the data.
   */
  set(key, value, options) {
    const valueAndIndex = this.values.get(key);
    const serialized = serializeValueWithOptions(value, options);
    if (valueAndIndex === null) {
      const newElementIndex = this.length;
      this.keys.push(key);
      this.values.set(key, [serialized, newElementIndex]);
      return null;
    }
    const [oldValue, oldIndex] = valueAndIndex;
    this.values.set(key, [serialized, oldIndex]);
    return getValueWithOptions(oldValue, options);
  }
  /**
   * Removes and retrieves the element with the provided key.
   *
   * @param key - The key at which to remove data.
   * @param options - Options for retrieving the data.
   */
  remove(key, options) {
    const oldValueAndIndex = this.values.remove(key);
    if (oldValueAndIndex === null) {
      return options?.defaultValue ?? null;
    }
    const [value, index] = oldValueAndIndex;
    assert$1(this.keys.swapRemove(index) !== null, ERR_INCONSISTENT_STATE);
    // the last key is swapped to key[index], the corresponding [value, index] need update
    if (!this.keys.isEmpty() && index !== this.keys.length) {
      // if there is still elements and it was not the last element
      const swappedKey = this.keys.get(index);
      const swappedValueAndIndex = this.values.get(swappedKey);
      assert$1(swappedValueAndIndex !== null, ERR_INCONSISTENT_STATE);
      this.values.set(swappedKey, [swappedValueAndIndex[0], index]);
    }
    return getValueWithOptions(value, options);
  }
  /**
   * Remove all of the elements stored within the collection.
   */
  clear() {
    for (const key of this.keys) {
      // Set instead of remove to avoid loading the value from storage.
      this.values.set(key, null);
    }
    this.keys.clear();
  }
  [Symbol.iterator]() {
    return new UnorderedMapIterator(this);
  }
  /**
   * Create a iterator on top of the default collection iterator using custom options.
   *
   * @param options - Options for retrieving and storing the data.
   */
  createIteratorWithOptions(options) {
    return {
      [Symbol.iterator]: () => new UnorderedMapIterator(this, options)
    };
  }
  /**
   * Return a JavaScript array of the data stored within the collection.
   *
   * @param options - Options for retrieving and storing the data.
   */
  toArray(options) {
    const array = [];
    const iterator = options ? this.createIteratorWithOptions(options) : this;
    for (const value of iterator) {
      array.push(value);
    }
    return array;
  }
  /**
   * Extends the current collection with the passed in array of key-value pairs.
   *
   * @param keyValuePairs - The key-value pairs to extend the collection with.
   */
  extend(keyValuePairs) {
    for (const [key, value] of keyValuePairs) {
      this.set(key, value);
    }
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    const map = new UnorderedMap(data.prefix);
    // reconstruct keys Vector
    map.keys = new Vector(`${data.prefix}u`);
    map.keys.length = data.keys.length;
    // reconstruct values LookupMap
    map.values = new LookupMap(`${data.prefix}m`);
    return map;
  }
}
/**
 * An iterator for the UnorderedMap collection.
 */
class UnorderedMapIterator {
  /**
   * @param unorderedMap - The unordered map collection to create an iterator for.
   * @param options - Options for retrieving and storing data.
   */
  constructor(unorderedMap, options) {
    this.options = options;
    this.keys = new VectorIterator(unorderedMap.keys);
    this.map = unorderedMap.values;
  }
  next() {
    const key = this.keys.next();
    if (key.done) {
      return {
        value: [key.value, null],
        done: key.done
      };
    }
    const valueAndIndex = this.map.get(key.value);
    assert$1(valueAndIndex !== null, ERR_INCONSISTENT_STATE);
    return {
      done: key.done,
      value: [key.value, getValueWithOptions(valueAndIndex[0], this.options)]
    };
  }
}

function serializeIndex(index) {
  const data = new Uint32Array([index]);
  const array = new Uint8Array(data.buffer);
  return u8ArrayToBytes(array);
}
function deserializeIndex(rawIndex) {
  const array = bytesToU8Array(rawIndex);
  const [data] = new Uint32Array(array.buffer);
  return data;
}
/**
 * An unordered set that stores data in NEAR storage.
 */
class UnorderedSet {
  /**
   * @param prefix - The byte prefix to use when storing elements inside this collection.
   */
  constructor(prefix) {
    this.prefix = prefix;
    this.elementIndexPrefix = `${prefix}i`;
    this.elements = new Vector(`${prefix}e`);
  }
  /**
   * The number of elements stored in the collection.
   */
  get length() {
    return this.elements.length;
  }
  /**
   * Checks whether the collection is empty.
   */
  isEmpty() {
    return this.elements.isEmpty();
  }
  /**
   * Checks whether the collection contains the value.
   *
   * @param element - The value for which to check the presence.
   * @param options - Options for storing data.
   */
  contains(element, options) {
    const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
    return storageHasKey(indexLookup);
  }
  /**
   * If the set did not have this value present, `true` is returned.
   * If the set did have this value present, `false` is returned.
   *
   * @param element - The value to store in the collection.
   * @param options - Options for storing the data.
   */
  set(element, options) {
    const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
    if (storageRead(indexLookup)) {
      return false;
    }
    const nextIndex = this.length;
    const nextIndexRaw = serializeIndex(nextIndex);
    storageWrite(indexLookup, nextIndexRaw);
    this.elements.push(element, options);
    return true;
  }
  /**
   * Returns true if the element was present in the set.
   *
   * @param element - The entry to remove.
   * @param options - Options for retrieving and storing data.
   */
  remove(element, options) {
    const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
    const indexRaw = storageRead(indexLookup);
    if (!indexRaw) {
      return false;
    }
    // If there is only one element then swap remove simply removes it without
    // swapping with the last element.
    if (this.length === 1) {
      storageRemove(indexLookup);
      const index = deserializeIndex(indexRaw);
      this.elements.swapRemove(index);
      return true;
    }
    // If there is more than one element then swap remove swaps it with the last
    // element.
    const lastElement = this.elements.get(this.length - 1, options);
    assert$1(!!lastElement, ERR_INCONSISTENT_STATE);
    storageRemove(indexLookup);
    // If the removed element was the last element from keys, then we don't need to
    // reinsert the lookup back.
    if (lastElement !== element) {
      const lastLookupElement = this.elementIndexPrefix + serializeValueWithOptions(lastElement, options);
      storageWrite(lastLookupElement, indexRaw);
    }
    const index = deserializeIndex(indexRaw);
    this.elements.swapRemove(index);
    return true;
  }
  /**
   * Remove all of the elements stored within the collection.
   */
  clear(options) {
    for (const element of this.elements) {
      const indexLookup = this.elementIndexPrefix + serializeValueWithOptions(element, options);
      storageRemove(indexLookup);
    }
    this.elements.clear();
  }
  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
  /**
   * Create a iterator on top of the default collection iterator using custom options.
   *
   * @param options - Options for retrieving and storing the data.
   */
  createIteratorWithOptions(options) {
    return {
      [Symbol.iterator]: () => new VectorIterator(this.elements, options)
    };
  }
  /**
   * Return a JavaScript array of the data stored within the collection.
   *
   * @param options - Options for retrieving and storing the data.
   */
  toArray(options) {
    const array = [];
    const iterator = options ? this.createIteratorWithOptions(options) : this;
    for (const value of iterator) {
      array.push(value);
    }
    return array;
  }
  /**
   * Extends the current collection with the passed in array of elements.
   *
   * @param elements - The elements to extend the collection with.
   */
  extend(elements) {
    for (const element of elements) {
      this.set(element);
    }
  }
  /**
   * Serialize the collection.
   *
   * @param options - Options for storing the data.
   */
  serialize(options) {
    return serializeValueWithOptions(this, options);
  }
  /**
   * Converts the deserialized data from storage to a JavaScript instance of the collection.
   *
   * @param data - The deserialized data to create an instance from.
   */
  static reconstruct(data) {
    const set = new UnorderedSet(data.prefix);
    // reconstruct Vector
    const elementsPrefix = data.prefix + "e";
    set.elements = new Vector(elementsPrefix);
    set.elements.length = data.elements.length;
    return set;
  }
}

/**
 * A promise action which can be executed on the NEAR blockchain.
 */
class PromiseAction {}
/**
 * A create account promise action.
 *
 * @extends {PromiseAction}
 */
class CreateAccount extends PromiseAction {
  add(promiseIndex) {
    promiseBatchActionCreateAccount(promiseIndex);
  }
}
/**
 * A deploy contract promise action.
 *
 * @extends {PromiseAction}
 */
class DeployContract extends PromiseAction {
  /**
   * @param code - The code of the contract to be deployed.
   */
  constructor(code) {
    super();
    this.code = code;
  }
  add(promiseIndex) {
    promiseBatchActionDeployContract(promiseIndex, this.code);
  }
}
/**
 * A function call promise action.
 *
 * @extends {PromiseAction}
 */
class FunctionCall extends PromiseAction {
  /**
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   */
  constructor(functionName, args, amount, gas) {
    super();
    this.functionName = functionName;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
  }
  add(promiseIndex) {
    promiseBatchActionFunctionCall(promiseIndex, this.functionName, this.args, this.amount, this.gas);
  }
}
/**
 * A function call weight promise action.
 *
 * @extends {PromiseAction}
 */
class FunctionCallWeight extends PromiseAction {
  /**
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   * @param weight - The weight of unused Gas to use.
   */
  constructor(functionName, args, amount, gas, weight) {
    super();
    this.functionName = functionName;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
    this.weight = weight;
  }
  add(promiseIndex) {
    promiseBatchActionFunctionCallWeight(promiseIndex, this.functionName, this.args, this.amount, this.gas, this.weight);
  }
}
/**
 * A transfer promise action.
 *
 * @extends {PromiseAction}
 */
class Transfer extends PromiseAction {
  /**
   * @param amount - The amount of NEAR to tranfer.
   */
  constructor(amount) {
    super();
    this.amount = amount;
  }
  add(promiseIndex) {
    promiseBatchActionTransfer(promiseIndex, this.amount);
  }
}
/**
 * A stake promise action.
 *
 * @extends {PromiseAction}
 */
class Stake extends PromiseAction {
  /**
   * @param amount - The amount of NEAR to tranfer.
   * @param publicKey - The public key to use for staking.
   */
  constructor(amount, publicKey) {
    super();
    this.amount = amount;
    this.publicKey = publicKey;
  }
  add(promiseIndex) {
    promiseBatchActionStake(promiseIndex, this.amount, this.publicKey.data);
  }
}
/**
 * A add full access key promise action.
 *
 * @extends {PromiseAction}
 */
class AddFullAccessKey extends PromiseAction {
  /**
   * @param publicKey - The public key to add as a full access key.
   * @param nonce - The nonce to use.
   */
  constructor(publicKey, nonce) {
    super();
    this.publicKey = publicKey;
    this.nonce = nonce;
  }
  add(promiseIndex) {
    promiseBatchActionAddKeyWithFullAccess(promiseIndex, this.publicKey.data, this.nonce);
  }
}
/**
 * A add access key promise action.
 *
 * @extends {PromiseAction}
 */
class AddAccessKey extends PromiseAction {
  /**
   * @param publicKey - The public key to add as a access key.
   * @param allowance - The allowance for the key in yoctoNEAR.
   * @param receiverId - The account ID of the reciever.
   * @param functionNames - The names of funcitons to authorize.
   * @param nonce - The nonce to use.
   */
  constructor(publicKey, allowance, receiverId, functionNames, nonce) {
    super();
    this.publicKey = publicKey;
    this.allowance = allowance;
    this.receiverId = receiverId;
    this.functionNames = functionNames;
    this.nonce = nonce;
  }
  add(promiseIndex) {
    promiseBatchActionAddKeyWithFunctionCall(promiseIndex, this.publicKey.data, this.nonce, this.allowance, this.receiverId, this.functionNames);
  }
}
/**
 * A delete key promise action.
 *
 * @extends {PromiseAction}
 */
class DeleteKey extends PromiseAction {
  /**
   * @param publicKey - The public key to delete from the account.
   */
  constructor(publicKey) {
    super();
    this.publicKey = publicKey;
  }
  add(promiseIndex) {
    promiseBatchActionDeleteKey(promiseIndex, this.publicKey.data);
  }
}
/**
 * A delete account promise action.
 *
 * @extends {PromiseAction}
 */
class DeleteAccount extends PromiseAction {
  /**
   * @param beneficiaryId - The beneficiary of the account deletion - the account to recieve all of the remaining funds of the deleted account.
   */
  constructor(beneficiaryId) {
    super();
    this.beneficiaryId = beneficiaryId;
  }
  add(promiseIndex) {
    promiseBatchActionDeleteAccount(promiseIndex, this.beneficiaryId);
  }
}
class PromiseSingle {
  constructor(accountId, actions, after, promiseIndex) {
    this.accountId = accountId;
    this.actions = actions;
    this.after = after;
    this.promiseIndex = promiseIndex;
  }
  constructRecursively() {
    if (this.promiseIndex !== null) {
      return this.promiseIndex;
    }
    const promiseIndex = this.after ? promiseBatchThen(this.after.constructRecursively(), this.accountId) : promiseBatchCreate(this.accountId);
    this.actions.forEach(action => action.add(promiseIndex));
    this.promiseIndex = promiseIndex;
    return promiseIndex;
  }
}
class PromiseJoint {
  constructor(promiseA, promiseB, promiseIndex) {
    this.promiseA = promiseA;
    this.promiseB = promiseB;
    this.promiseIndex = promiseIndex;
  }
  constructRecursively() {
    if (this.promiseIndex !== null) {
      return this.promiseIndex;
    }
    const result = promiseAnd(this.promiseA.constructRecursively(), this.promiseB.constructRecursively());
    this.promiseIndex = result;
    return result;
  }
}
/**
 * A high level class to construct and work with NEAR promises.
 */
class NearPromise {
  /**
   * @param subtype - The subtype of the promise.
   * @param shouldReturn - Whether the promise should return.
   */
  constructor(subtype, shouldReturn) {
    this.subtype = subtype;
    this.shouldReturn = shouldReturn;
  }
  /**
   * Creates a new promise to the provided account ID.
   *
   * @param accountId - The account ID on which to call the promise.
   */
  static new(accountId) {
    const subtype = new PromiseSingle(accountId, [], null, null);
    return new NearPromise(subtype, false);
  }
  addAction(action) {
    if (this.subtype instanceof PromiseJoint) {
      throw new Error("Cannot add action to a joint promise.");
    }
    this.subtype.actions.push(action);
    return this;
  }
  /**
   * Creates a create account promise action and adds it to the current promise.
   */
  createAccount() {
    return this.addAction(new CreateAccount());
  }
  /**
   * Creates a deploy contract promise action and adds it to the current promise.
   *
   * @param code - The code of the contract to be deployed.
   */
  deployContract(code) {
    return this.addAction(new DeployContract(code));
  }
  /**
   * Creates a function call promise action and adds it to the current promise.
   *
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   */
  functionCall(functionName, args, amount, gas) {
    return this.addAction(new FunctionCall(functionName, args, amount, gas));
  }
  /**
   * Creates a function call weight promise action and adds it to the current promise.
   *
   * @param functionName - The name of the function to be called.
   * @param args - The arguments to be passed to the function.
   * @param amount - The amount of NEAR to attach to the call.
   * @param gas - The amount of Gas to attach to the call.
   * @param weight - The weight of unused Gas to use.
   */
  functionCallWeight(functionName, args, amount, gas, weight) {
    return this.addAction(new FunctionCallWeight(functionName, args, amount, gas, weight));
  }
  /**
   * Creates a transfer promise action and adds it to the current promise.
   *
   * @param amount - The amount of NEAR to tranfer.
   */
  transfer(amount) {
    return this.addAction(new Transfer(amount));
  }
  /**
   * Creates a stake promise action and adds it to the current promise.
   *
   * @param amount - The amount of NEAR to tranfer.
   * @param publicKey - The public key to use for staking.
   */
  stake(amount, publicKey) {
    return this.addAction(new Stake(amount, publicKey));
  }
  /**
   * Creates a add full access key promise action and adds it to the current promise.
   * Uses 0n as the nonce.
   *
   * @param publicKey - The public key to add as a full access key.
   */
  addFullAccessKey(publicKey) {
    return this.addFullAccessKeyWithNonce(publicKey, 0n);
  }
  /**
   * Creates a add full access key promise action and adds it to the current promise.
   * Allows you to specify the nonce.
   *
   * @param publicKey - The public key to add as a full access key.
   * @param nonce - The nonce to use.
   */
  addFullAccessKeyWithNonce(publicKey, nonce) {
    return this.addAction(new AddFullAccessKey(publicKey, nonce));
  }
  /**
   * Creates a add access key promise action and adds it to the current promise.
   * Uses 0n as the nonce.
   *
   * @param publicKey - The public key to add as a access key.
   * @param allowance - The allowance for the key in yoctoNEAR.
   * @param receiverId - The account ID of the reciever.
   * @param functionNames - The names of funcitons to authorize.
   */
  addAccessKey(publicKey, allowance, receiverId, functionNames) {
    return this.addAccessKeyWithNonce(publicKey, allowance, receiverId, functionNames, 0n);
  }
  /**
   * Creates a add access key promise action and adds it to the current promise.
   * Allows you to specify the nonce.
   *
   * @param publicKey - The public key to add as a access key.
   * @param allowance - The allowance for the key in yoctoNEAR.
   * @param receiverId - The account ID of the reciever.
   * @param functionNames - The names of funcitons to authorize.
   * @param nonce - The nonce to use.
   */
  addAccessKeyWithNonce(publicKey, allowance, receiverId, functionNames, nonce) {
    return this.addAction(new AddAccessKey(publicKey, allowance, receiverId, functionNames, nonce));
  }
  /**
   * Creates a delete key promise action and adds it to the current promise.
   *
   * @param publicKey - The public key to delete from the account.
   */
  deleteKey(publicKey) {
    return this.addAction(new DeleteKey(publicKey));
  }
  /**
   * Creates a delete account promise action and adds it to the current promise.
   *
   * @param beneficiaryId - The beneficiary of the account deletion - the account to recieve all of the remaining funds of the deleted account.
   */
  deleteAccount(beneficiaryId) {
    return this.addAction(new DeleteAccount(beneficiaryId));
  }
  /**
   * Joins the provided promise with the current promise, making the current promise a joint promise subtype.
   *
   * @param other - The promise to join with the current promise.
   */
  and(other) {
    const subtype = new PromiseJoint(this, other, null);
    return new NearPromise(subtype, false);
  }
  /**
   * Adds a callback to the current promise.
   *
   * @param other - The promise to be executed as the promise.
   */
  then(other) {
    assert$1(other.subtype instanceof PromiseSingle, "Cannot callback joint promise.");
    assert$1(other.subtype.after === null, "Cannot callback promise which is already scheduled after another");
    other.subtype.after = this;
    return other;
  }
  /**
   * Sets the shouldReturn field to true.
   */
  asReturn() {
    this.shouldReturn = true;
    return this;
  }
  /**
   * Recursively goes through the current promise to get the promise index.
   */
  constructRecursively() {
    const result = this.subtype.constructRecursively();
    if (this.shouldReturn) {
      promiseReturn(result);
    }
    return result;
  }
  /**
   * Called by NearBindgen, when return object is a NearPromise instance.
   */
  onReturn() {
    this.asReturn().constructRecursively();
  }
}

function assert(statement, message) {
  if (!statement) {
    throw Error(message);
  }
}
function ensure_all_arguments_gets_passed_in(expected_value, actual_value) {
  let expected_value_is_array_condition = Array.isArray(expected_value);
  let actual_value_is_array_condition = Array.isArray(actual_value);
  let same_length_condition = expected_value.length === actual_value.length;
  let all_items_match = expected_value.every((val, index) => val === actual_value[index]);
  assert(expected_value_is_array_condition && actual_value_is_array_condition && same_length_condition && all_items_match, `An invalid parameter or an invalid number of parameters was passed.`);
}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _class, _class2;
var Status;
(function (Status) {
  Status["ORDER_OPEN"] = "ORDER OPEN";
  Status["ORDER_CONFIRMED"] = "ORDER CONFIRMED";
  Status["DISPUTE_CREATED"] = "DISPUTE CREATED";
  Status["BUYER_LOST_DISPUTE"] = "BUYER LOST DISPUTE";
  Status["BUYER_WON_DISPUTE"] = "BUYER WON DISPUTE";
  Status["DISPUTE_SETTLED"] = "DISPUTE SETTLED";
  Status["RETURNING_GOODS_TO_FARMER"] = "RETURNING GOODS TO FARMER";
  Status["GOODS_DELIVERED_TO_FARMER"] = "GOODS RETURNED TO FARMER";
  Status["DELIVERING_GOODS"] = "DELIVERING GOODS";
  Status["GOODS_DELIVERED"] = "GOODS DELIVERED";
  Status["DISPUTED_ORDER_CLOSED"] = "DISPUTED ORDER CLOSED";
  Status["ORDER_CLOSED"] = "ORDER CLOSED";
  Status["ORDER_COMPLETED"] = "ORDER COMPLETED";
})(Status || (Status = {}));
var order_completed;
(function (order_completed) {
  order_completed["NO"] = "NO";
  order_completed["YES"] = "YES";
})(order_completed || (order_completed = {}));
var is_available;
(function (is_available) {
  is_available["NO"] = "NO";
  is_available["YES"] = "YES";
})(is_available || (is_available = {}));
const SECONDS_TO_NANO_SECONDS = 10n ** 9n;

// const DAY_TIMESTAMP: bigint = 0n;
// const WEEK_TIMESTAMP: bigint = 0n;

const DAY_TIMESTAMP = 86400n * SECONDS_TO_NANO_SECONDS;
const WEEK_TIMESTAMP = 604800n * SECONDS_TO_NANO_SECONDS;
const MINIMUM_PRODUCT_PRICE = 0n;
const eFama_funds_address = "efarma_marketplace.testnet";

//we want to send a minimum price that we can use to revert the transaction
//a function to check order status
let eFamaMarketPlace = (_dec = NearBindgen({
  requireInit: true
}), _dec2 = initialize(), _dec3 = view(), _dec4 = view(), _dec5 = view(), _dec6 = view(), _dec7 = view(), _dec8 = view(), _dec9 = view(), _dec10 = view(), _dec11 = view(), _dec12 = view(), _dec13 = view(), _dec14 = call({}), _dec15 = call({}), _dec16 = call({}), _dec17 = call({}), _dec18 = call({
  payableFunction: true
}), _dec19 = call({}), _dec20 = call({}), _dec21 = call({}), _dec22 = call({}), _dec23 = call({}), _dec24 = call({}), _dec25 = call({}), _dec26 = call({}), _dec27 = call({}), _dec28 = call({}), _dec29 = call({}), _dec(_class = (_class2 = class eFamaMarketPlace {
  constructor() {
    this.moderator_addresses = new UnorderedSet("moderator_address");
    this.escrow_balance = 0n;
    this.escrow_fee = 25n;
    this.total_items = 0n;
    this.total_confirmed = 0n;
    this.total_disputed = 0n;
    this.active_disputes = [0n, []];
    this.orders = new UnorderedMap("orders");
    this.orders_by_product_id = new LookupMap("orders_by_product_id");
    this.orders_by_address = new LookupMap("orders_by_address");
    this.address_of_order_id = new LookupMap("address_of_order_id");
    this.is_completed = new LookupMap("is_completed");
    this.farmers_products = new LookupMap("farm_products");
    this.contract_deployed_timestamp = blockTimestamp();
    this.disputed_orders = new LookupMap("disputed_orders");
    this.refunded_orders = new LookupMap("refunded_orders");
    this.minimum_order_amount = MINIMUM_PRODUCT_PRICE;
  }
  //initialize the contract with the moderator address
  init({
    moderator_address
  }) {
    this.moderator_addresses.set(moderator_address);
    return this.moderator_addresses.contains(moderator_address);
  }
  //fetch the total balance present in the smart contract on this efama smart contract
  get_present_efama_balance() {
    return this.escrow_balance.toString();
  }
  //fetch the present commission being charged by efama on this efama smart contract
  get_efama_commision_fee() {
    return this.escrow_fee.toString();
  }
  //fetch the total number of completed orders on this efama smart contract
  get_efama_total_confirmed() {
    return this.total_confirmed.toString();
  }
  //fetch the total number of previously disputed orders on this efama smart contract
  get_efama_total_disputes() {
    return this.total_disputed.toString();
  }
  //fetch an array of all the orders made on this efama smart contract
  get_all_efama_orders({}) {
    if (this.orders.length < 1) ;
    let all_orders = this.orders;
    // let temp_array: UnorderedSet<order_struct> = new UnorderedSet('temp_array')
    let temp_array = [];
    for (let [key, order] of all_orders) {
      temp_array.push(order);
    }
    return temp_array;
  }
  //fetch a product by it's product id. 
  view_farmers_listed_products({
    product_id
  }) {
    let function_arguments = Object.keys({
      "product_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    if (!this.farmers_products.containsKey(product_id)) return {};
    return this.farmers_products.get(product_id);
  }
  //** */
  //fetch an order by it's order id 
  get_order_status_by_order_id({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let order_details = this.orders.get(order_id);
    return order_details ? order_details : {};
  }
  //fetch all orders made by a single account using the account address.
  get_orders_by_an_address({
    owner_address
  }) {
    let order_found_for_this_address_condition = this.orders_by_address.containsKey(owner_address);
    let function_arguments = Object.keys({
      "owner_address": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let unordered_orders_array = this.orders_by_address.get(owner_address);
    return order_found_for_this_address_condition ? unordered_orders_array : [];
  }
  //fetch the address of the person who created an order by it's order id
  get_owner_of_order_by_order_id({
    order_id
  }) {
    let address_has_created_an_order_condition = this.address_of_order_id.containsKey(order_id);
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    return address_has_created_an_order_condition ? this.address_of_order_id.get(order_id) : '';
  }
  //fetch all orders made for a single product using it's product id
  get_all_orders_made_for_a_product({
    product_id
  }) {
    let product_id_found_condition = this.address_of_order_id.containsKey(product_id);
    let function_arguments = Object.keys({
      "product_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    return product_id_found_condition ? this.orders_by_product_id.get(product_id) : {};
  }
  //fetch an array of the moderator addresses added to this efama smart contractf
  get_efama_moderator_addresses({}) {
    assert(!this.moderator_addresses.isEmpty(), 'There is nothing to display');
    let moderator_address_array = this.moderator_addresses.toArray();
    return moderator_address_array;
  }
  //remove a previously added efama moderator address and return the status of the transaction as either true or false
  remove_efama_moderator_account({
    moderator_address
  }) {
    let function_arguments = Object.keys({
      "moderator_address": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    assert(this.moderator_addresses.contains(predecessorAccountId()), "The address doesn't belong to a moderator'");
    assert(this.moderator_addresses.length >= 1, 'There is only one address present, you might get locked out.');
    log(` eFama Moderator Account Removed - ${moderator_address}`);
    this.moderator_addresses.remove(moderator_address);
    return !this.moderator_addresses.contains(moderator_address);
  }
  // This method changes the state, for which it cost gas
  //add to the previously added moderator addresses on this efama smart contract
  add_another_efama_moderator_account({
    moderator_address
  }) {
    let function_arguments = Object.keys({
      "moderator_address": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    assert(this.moderator_addresses.contains(predecessorAccountId()), "Only moderators are allowed to add other moderators :)");
    log(`New eFama Moderator Account - ${moderator_address} Added.`);
    this.moderator_addresses.set(moderator_address);
    return this.moderator_addresses.contains(moderator_address);
  }
  //create a farm product listing. Change the state of the farmers_object attribute. The product must cost more than the minimum price set for every product. 
  create_a_farm_product_listing({
    product_id,
    product_cost,
    quantity_listed,
    product_unit,
    edit_status
  }) {
    let function_arguments = Object.keys({
      product_id: 1,
      product_cost: 1,
      quantity_listed: 1,
      product_unit: 1,
      edit_status: 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let product_id_exists_condition = this.farmers_products.containsKey(product_id);
    let product_id_exists_and_product_creator_calls_method = product_id_exists_condition && this.farmers_products.get(product_id)?.farmers_address === predecessorAccountId();
    let edit_condition = edit_status.toLowerCase().trim() === "true";
    let product_exists_and_edit_clause_triggered_by_owner_condition = product_id_exists_and_product_creator_calls_method && edit_condition;
    let farm_data_obj;
    let correct_metric_unit_input_condition = product_unit.toLowerCase() === "g" || product_unit.toLowerCase() === "ml" ? true : false;
    assert(product_cost > this.minimum_order_amount, "The product costs less than the minimum price for listable goods.");
    assert(!product_id_exists_condition || product_exists_and_edit_clause_triggered_by_owner_condition, 'There is already a product listed with this product id and you are not the owner.');
    assert(correct_metric_unit_input_condition, "You used the wrong unit for your product. Only grams (g) and millilitres (ml) are presently supported");
    if (product_exists_and_edit_clause_triggered_by_owner_condition) {
      farm_data_obj = {
        ...this.farmers_products.get(product_id),
        last_edited_time_stamp: blockTimestamp(),
        quantity_listed,
        product_unit,
        product_cost,
        available: is_available.YES
      };
    } else {
      farm_data_obj = {
        available: is_available.YES,
        farmers_address: predecessorAccountId(),
        timestamp: blockTimestamp(),
        last_edited_time_stamp: blockTimestamp(),
        product_cost,
        quantity_listed,
        product_unit
      };
    }
    this.farmers_products.set(product_id, farm_data_obj);
    return this.farmers_products.containsKey(product_id);
  }
  //delete a farmer product listing. Must be called by the farmer that listed it
  delete_farmer_product_listing({
    product_id
  }) {
    let function_arguments = Object.keys({
      "product_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    // check that the product exists first
    let product_details = this.farmers_products.get(product_id);
    let product_orders = this.orders_by_product_id.get(product_id);
    let product_found_using_id_condition = this.orders_by_product_id.containsKey(product_id);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    assert(this.farmers_products.containsKey(product_id), "The product with the specified product id was not found.");
    assert(product_details.farmers_address === predecessorAccountId(), "You are not the product owner. Kindly use a product id that you own");
    //assert that the array is not empty
    if (product_found_using_id_condition && product_orders.length > 0) {
      for (let order of product_orders) {
        assert(order.present_order_status === Status.ORDER_CLOSED, "There is a pending order.");
      }
    }
    this.farmers_products.remove(product_id);
    log([`The product with product id of (${product_id}) was successfully deleted`]);
    return this.farmers_products.containsKey(product_id);
  }

  //place an order for a listed product id. 
  place_an_order_for_a_product_listing({
    product_id,
    memo,
    order_quantity,
    product_listed_unit
  }) {
    let function_arguments = Object.keys({
      product_id: 1,
      memo: 1,
      order_quantity: 1,
      product_listed_unit: 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let listed_product = this.farmers_products.get(product_id);
    let product_found = this.farmers_products.containsKey(product_id);

    //throw error if product was not found
    assert(product_found, "The product with the product id specified wasn't found.");
    assert(product_listed_unit.toLowerCase() === listed_product.product_unit.toLowerCase(), `You used the wrong metric unit`);
    assert(listed_product.quantity_listed - order_quantity >= 0n, `There isn't enough produce to complete your order. There is just ${listed_product.quantity_listed} (${listed_product.product_unit}) units left`);
    assert(attachedDeposit() === BigInt(listed_product.product_cost) * BigInt(order_quantity), `You sent ${attachedDeposit()} Near. Instead of ${listed_product.product_cost * order_quantity}`);
    assert(listed_product.available === is_available.YES, "Sorry, this product is no longer available.");
    let total_order_cost = BigInt(listed_product.product_cost) * BigInt(order_quantity);
    this.total_items += 1n;
    let order = {
      product_id: product_id,
      order_id: this.total_items,
      memo: memo,
      farmer_address: listed_product.farmers_address,
      present_order_status: Status.ORDER_OPEN,
      present_order_status_changed_timestamp: blockTimestamp(),
      order_quantity: order_quantity,
      order_started: false,
      delivery_confirmed: false,
      product_price: listed_product.product_cost,
      amount: total_order_cost,
      order_made_timestamp: blockTimestamp(),
      refund_requested: false,
      refund_approved: false,
      dispute_created: false,
      buyer_dispute_won: false,
      buyer_dispute_reason: '',
      to_pay: listed_product.farmers_address,
      order_owner: predecessorAccountId()
    };
    this.orders.set(order.order_id.toString(), order);
    let orders_by_product_id_unordered_set = this.orders_by_product_id.containsKey(order.product_id) ? this.orders_by_product_id.get(order.product_id) : [];
    orders_by_product_id_unordered_set.push(order);
    this.orders_by_product_id.set(order.product_id, orders_by_product_id_unordered_set);
    let orders_by_address_unordered_set = this.orders_by_address.containsKey(order.order_owner) ? this.orders_by_address.get(order.order_owner) : [];
    orders_by_address_unordered_set.push(order);
    this.orders_by_address.set(order.order_owner, orders_by_address_unordered_set);
    this.address_of_order_id.set(order.order_id.toString(), predecessorAccountId());
    this.is_completed.set(order.order_id.toString(), order_completed.NO);
    this.escrow_balance += attachedDeposit();
    listed_product.quantity_listed = BigInt(listed_product.quantity_listed) - BigInt(order_quantity);
    if (BigInt(listed_product.quantity_listed) <= 0n) {
      listed_product.available = is_available.NO;
      this.farmers_products.set(product_id, listed_product);
    }
    log([product_id, "NEW ORDER", Status.ORDER_OPEN, predecessorAccountId()]);
    return this.orders.get(order.order_id.toString());
  }
  accept_buyers_order({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    let order_details = this.orders.get(order_id);
    let order_farmers_address = order_details.farmer_address;
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    assert(order_details != null, "Invalid order_id used.");
    assert(order_details.present_order_status === Status.ORDER_OPEN, "Order has already been accepted by the farmer");
    assert(order_farmers_address === predecessorAccountId(), "Only the account that was used to list the product can accept it's product orders");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed");
    order_details.present_order_status = Status.ORDER_CONFIRMED;
    order_details.order_started = true;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    let farmers_product = this.farmers_products.get(order_details.product_id);
    farmers_product.quantity_listed -= order_details.order_quantity;
    this.farmers_products.set(order_details.product_id, farmers_product);
    this.orders.set(order_id, order_details);
    return this.orders.get(order_id).order_started;
  }

  //how should the dispute be settled, once a refund is
  change_order_status_to_delivery_started({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let order_details = this.orders.get(order_id);
    let order_farmers_address = order_details.farmer_address;

    //only trigger when the order is still in the confirmation stage
    assert(order_details != null, "The order id wasn't found.");
    assert(order_farmers_address === predecessorAccountId(), "Only the product owner can make changes to this order.");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed.");
    assert(order_details.present_order_status === Status.ORDER_CONFIRMED, "The status of the delivery must be order confirmed to call this function. You might have already called this order or you must first confirm the order.");

    // only trigger when the product is in the proper status
    // only trigger when the order is still available
    //can only be triggered by the farmer

    order_details.present_order_status = Status.DELIVERING_GOODS;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    this.orders.set(order_id, order_details);
    log([order_id, "DELIVERY HAS BEEN INITIATED", Status.DELIVERING_GOODS, predecessorAccountId()]);
    return this.orders.get(order_id).present_order_status === Status.DELIVERING_GOODS;
  }
  confirm_order_has_been_delivered({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let order_details = this.orders.get(order_id);
    assert(order_details != null, "The order id wasn't found.");
    assert(order_details.farmer_address === predecessorAccountId(), "Only the product owner can make changes to this order.");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed.");
    assert(order_details.present_order_status === Status.DELIVERING_GOODS, "The order has already been marked as delivered or you've yet to indicate that the shipment has started.");
    order_details.delivery_confirmed = true;
    order_details.present_order_status = Status.GOODS_DELIVERED;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    this.orders.set(order_id, order_details);
    return this.orders.get(order_id).present_order_status === Status.GOODS_DELIVERED;
  }
  mark_order_as_completed({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let order_details = this.orders.get(order_id);

    //only trigger when the order is still in the confirmation stage
    assert(order_details != null, "The order id wasn't found.");
    assert(order_details.order_owner === predecessorAccountId(), "Only the buyer can make indicate the order has been completed.");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed.");
    assert(order_details.present_order_status === Status.GOODS_DELIVERED || order_details.present_order_status === Status.DISPUTE_CREATED, "Only orders that have been delivered or have just had a dispute created can be marked as completed");
    this.is_completed.set(order_id, order_completed.YES);
    order_details.present_order_status = Status.ORDER_CLOSED;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    this.orders.set(order_id, order_details);
    log([order_id, "ORDER COMPLETED", Status.ORDER_CLOSED, predecessorAccountId()]);
    return this.is_completed.get(order_id) === order_completed.YES;
  }

  //the service hasn't been set as delivery_confirmed by the user and only the escrow is allowed to call the function
  request_an_order_refund({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let order_details = this.orders.get(order_id);
    let order_was_made_less_than_12_hours_ago_condition = order_details.order_made_timestamp + DAY_TIMESTAMP / 2n > blockTimestamp();
    //only trigger when the order is still in the confirmation stage
    assert(order_details.present_order_status === Status.ORDER_OPEN, "The order status must be set as open for a refund to be issued.");
    assert(order_was_made_less_than_12_hours_ago_condition, "All orders older than 12 hours can't be refunded.");
    assert(order_details.order_owner === predecessorAccountId(), "Only the buyer can request for a refund for this order");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed.");
    order_details.refund_requested = true;
    order_details.refund_approved = true;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    order_details.to_pay = order_details.order_owner;
    order_details.present_order_status = Status.ORDER_CLOSED;
    this.orders.set(order_id, order_details);
    this.is_completed.set(order_id, order_completed.YES);
    log([order_id, "REFUND REQUESTED", Status.ORDER_CLOSED, predecessorAccountId()]);
    return this.orders.get(order_id).refund_approved;
  }
  create_dispute_for_a_delivered_order({
    order_id,
    dispute_reason
  }) {
    let function_arguments = Object.keys({
      "order_id": 1,
      "dispute_reason": "dispute reason"
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let order_details = this.orders.get(order_id);
    let order_is_delivered_condition = order_details.present_order_status === Status.GOODS_DELIVERED;
    let present_moment_timestamp = BigInt(blockTimestamp());
    let timestamp_24_hours_after_order_delivery = BigInt(order_details.present_order_status_changed_timestamp) + BigInt(DAY_TIMESTAMP);
    let order_delivered_less_than_24_hours_ago_condition = present_moment_timestamp <= timestamp_24_hours_after_order_delivery;
    assert(order_details !== null, `The order with the specified order id wasn't found.`);
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been marked as completed");
    assert(order_details.order_owner === predecessorAccountId(), "Only the owner of the order can create a dispute");
    assert(order_is_delivered_condition && order_delivered_less_than_24_hours_ago_condition, `Only orders that have been marked as delivered less than a day ago are eligble to create disputes`);
    order_details.present_order_status = Status.DISPUTE_CREATED;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    order_details.buyer_dispute_reason = dispute_reason;
    order_details.dispute_created = true;
    this.orders.set(order_id, order_details);
    this.total_disputed++;
    return this.orders.get(order_id).dispute_created;
  }
  update_client_dispute_request({
    order_id,
    status
  }) {
    let function_arguments = Object.keys({
      "order_id": 1,
      "status": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    // we want to check that if we have changed the status to completed, then we only have about 2 days to re-edit it

    let order_details = this.orders.get(order_id);
    let less_than_a_day_after_order_status_updated_condition = order_details.present_order_status_changed_timestamp + DAY_TIMESTAMP > blockTimestamp();
    let dispute_created_condition = order_details.present_order_status === Status.DISPUTE_CREATED;
    let dispute_settlement_adjustment_condition = (order_details.present_order_status === Status.BUYER_LOST_DISPUTE || order_details.present_order_status === Status.BUYER_WON_DISPUTE) && less_than_a_day_after_order_status_updated_condition;
    assert(this.moderator_addresses.contains(predecessorAccountId()), "Only moderators are allowed to update the status of a disputed order.");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed");
    assert(dispute_created_condition || dispute_settlement_adjustment_condition, "There is either no dispute for this present order or you've exceeded the timeframe for changing your decision.");

    //we want to revert everything here,
    // we want to set the order status to closed and transfer the money back to the seller, charging them for gas
    if (status.toLowerCase().trim() === "accept") {
      order_details.buyer_dispute_won = true;
      order_details.present_order_status_changed_timestamp = blockTimestamp();
      order_details.present_order_status = Status.BUYER_WON_DISPUTE;
      order_details.to_pay = order_details.order_owner;
    } else if (status.toLowerCase().trim() === "reject") {
      order_details.buyer_dispute_won = false;
      order_details.present_order_status_changed_timestamp = blockTimestamp();
      order_details.present_order_status = Status.BUYER_LOST_DISPUTE;
      order_details.to_pay = order_details.farmer_address;
      log([`ORDER WITH ORDER_ID ${order_id} DISPUTE HAS BEEN SETTLED`, Status.BUYER_LOST_DISPUTE, predecessorAccountId()]);
      //we want to revert the state here
    }
    //if it is sucessful then transfer the funds and charge them for the gas
    this.orders.set(order_id, order_details);
    log([order_id, `${status.toUpperCase()}: BUYER ORDER DISPUTE SETTLED`, order_details.present_order_status, predecessorAccountId()]);
    return order_details.present_order_status;
  }
  //change the status of a disputed order to delivery started. Dispute must have been won to call this method.
  change_dispute_order_status_to_delivery_started({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    let order_details = this.orders.get(order_id);
    let dispute_settled_condition = order_details.present_order_status === Status.BUYER_WON_DISPUTE;
    assert(order_details != null, "The order id specified wasn't found");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed.");
    assert(order_details.order_owner === predecessorAccountId(), "Only the owner of the order can indicate shipment has started to the farmer (seller)");
    assert(dispute_settled_condition, "The order status can only be changed when the buyers dispute has been marked as won. Kindly ensure you haven't called this function before.");
    order_details.present_order_status = Status.RETURNING_GOODS_TO_FARMER;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    this.orders.set(order_id, order_details);
    log([order_id, "DELIVERY HAS BEEN INITIATED", Status.DELIVERING_GOODS, predecessorAccountId()]);
    return true;
  }

  //change the status of a disputed order to delivered, must order id must indicate that the shipment has started to call this method.
  change_dispute_order_status_to_delivered({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    let order_details = this.orders.get(order_id);
    let shipment_started_to_farmer_condition = order_details.present_order_status === Status.RETURNING_GOODS_TO_FARMER;
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    assert(order_details != null, "The order id specified wasn't found");
    assert(shipment_started_to_farmer_condition, "The order has not yet been marked as being delivered to the farmer.");
    assert(order_details.order_owner === predecessorAccountId(), "Only the owner of the order can indicate that the order has been delivered to the selelr");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has already been marked as completed");
    order_details.present_order_status = Status.GOODS_DELIVERED_TO_FARMER;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    this.orders.set(order_id, order_details);
    log([`The order with order_id ${order_id} of has been sent back to the farmer`, Status.GOODS_DELIVERED_TO_FARMER, predecessorAccountId()]);
    return this.orders.get(order_id).present_order_status === Status.GOODS_DELIVERED_TO_FARMER;
  }

  //mark disputed order as completed
  mark_disputed_order_as_completed({
    order_id
  }) {
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    let order_details = this.orders.get(order_id);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    assert(order_details != null, "The order id specified wasn't found");
    assert(order_details.present_order_status === Status.GOODS_DELIVERED_TO_FARMER, "Order hasn't yet been marked as delivered by buyer");
    assert(order_details.farmer_address === predecessorAccountId(), "Only the seller for this order can indicate they've received shipment from the buyer");
    assert(this.is_completed.get(order_id) === order_completed.NO, "The order has been completed");
    order_details.delivery_confirmed = true;
    order_details.present_order_status = Status.DISPUTED_ORDER_CLOSED;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    order_details.to_pay = order_details.order_owner;
    this.orders.set(order_id, order_details);
    this.is_completed.set(order_id, order_completed.YES);
    log([order_id, "GOODS SUCCESSFULLY RETURNED TO THE FARMER", Status.DISPUTED_ORDER_CLOSED, predecessorAccountId()]);
    return this.orders.get(order_id).present_order_status === Status.DISPUTED_ORDER_CLOSED;
  }
  // withdraw payment for an order, depending on who's eligible
  withdraw_payment_for_order({
    order_id
  }) {
    let order_details = this.orders.get(order_id);
    let function_arguments = Object.keys({
      "order_id": 1
    });
    let passed_in_arguments = Object.keys(arguments[0]);
    let a_week_passed_since_order_status_was_updated = BigInt(order_details.present_order_status_changed_timestamp) + BigInt(WEEK_TIMESTAMP) < BigInt(blockTimestamp());
    let receiver_address = order_details.to_pay;
    let contract_deployed_day = new Date(Number(this.contract_deployed_timestamp) / 10 ** 6).getDay();
    let present_day = new Date(Number(blockTimestamp()) / 10 ** 6).getDay();
    let order_has_been_closed_condition = order_details.present_order_status === Status.ORDER_CLOSED;
    let buyer_lost_dispute_condition = order_details.present_order_status === Status.BUYER_LOST_DISPUTE;
    let a_week_after_seller_won_dispute_condition = buyer_lost_dispute_condition && a_week_passed_since_order_status_was_updated;
    let withdrawal_address_eligible_condition = order_details.to_pay === predecessorAccountId();
    let withdrawal_day_condition = present_day === contract_deployed_day;
    let refund_approved_for_order_condition = order_details.refund_approved === true && order_has_been_closed_condition;
    let farmer_eligible_to_be_paid = order_details.to_pay === order_details.farmer_address;
    let buyer_won_dispute_and_24_hours_has_passed = order_details.present_order_status === Status.DISPUTED_ORDER_CLOSED && order_details.present_order_status_changed_timestamp + DAY_TIMESTAMP < blockTimestamp();
    let order_confirmed_atleast_a_week_ago_condition = order_has_been_closed_condition && a_week_passed_since_order_status_was_updated;
    let farmer_order_confirmed_a_week_ago_and_eligble_for_withdrawal = order_confirmed_atleast_a_week_ago_condition && farmer_eligible_to_be_paid;
    let refund_approved_or_farmer_order_closed_or_seller_won_dispute_or_buyer_won_dispute_condition = refund_approved_for_order_condition || farmer_order_confirmed_a_week_ago_and_eligble_for_withdrawal || a_week_after_seller_won_dispute_condition || buyer_won_dispute_and_24_hours_has_passed;
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments);
    assert(order_details != null, "The order id that was specified wasn't found");
    assert(withdrawal_address_eligible_condition, "You are not the one who's supposed to be paid for this order");
    assert(withdrawal_day_condition, `Not yet pay day. Pay day is on day ${contract_deployed_day} - Today is day ${present_day}`);
    assert(refund_approved_or_farmer_order_closed_or_seller_won_dispute_or_buyer_won_dispute_condition, 'You are not eligible for a withdrawal yet.');
    let promise;
    let escrow_amount = this.escrow_fee * BigInt(order_details.amount) / 100n;
    let buyer_amount = order_details.amount - escrow_amount;
    let farmers_product = this.farmers_products.get(order_details.product_id);
    order_details.present_order_status = Status.ORDER_COMPLETED;
    order_details.present_order_status_changed_timestamp = blockTimestamp();
    this.is_completed.set(order_id, order_completed.YES);
    this.orders.set(order_id, order_details);
    this.escrow_balance -= buyer_amount;
    if (refund_approved_for_order_condition) {
      farmers_product.quantity_listed = BigInt(farmers_product.quantity_listed) + BigInt(order_details.order_quantity);
      promise = NearPromise.new(receiver_address).transfer(order_details.amount);
    } else if (a_week_after_seller_won_dispute_condition) {
      promise = NearPromise.new(receiver_address).transfer(buyer_amount).then(NearPromise.new(eFama_funds_address).transfer(escrow_amount));
    } else if (farmer_order_confirmed_a_week_ago_and_eligble_for_withdrawal) {
      promise = NearPromise.new(receiver_address).transfer(buyer_amount).then(NearPromise.new(eFama_funds_address).transfer(escrow_amount));
    } else if (buyer_won_dispute_and_24_hours_has_passed) {
      farmers_product.quantity_listed = BigInt(farmers_product.quantity_listed) + BigInt(order_details.order_quantity);
      promise = NearPromise.new(receiver_address).transfer(order_details.amount);
    }
    this.farmers_products.set(order_details.product_id, farmers_product);
    this.total_confirmed = BigInt(this.total_confirmed) + 1n;
    log([order_id, "WITHDRAWAL MADE", Status.ORDER_COMPLETED, predecessorAccountId()]);
    this.escrow_balance = BigInt(this.escrow_balance) - BigInt(order_details.amount);
    return promise.onReturn();
  }
}, (_applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_present_efama_balance", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "get_present_efama_balance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_efama_commision_fee", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "get_efama_commision_fee"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_efama_total_confirmed", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "get_efama_total_confirmed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_efama_total_disputes", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "get_efama_total_disputes"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_all_efama_orders", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "get_all_efama_orders"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "view_farmers_listed_products", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "view_farmers_listed_products"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_order_status_by_order_id", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "get_order_status_by_order_id"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_orders_by_an_address", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "get_orders_by_an_address"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_owner_of_order_by_order_id", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "get_owner_of_order_by_order_id"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_all_orders_made_for_a_product", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "get_all_orders_made_for_a_product"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_efama_moderator_addresses", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "get_efama_moderator_addresses"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "remove_efama_moderator_account", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "remove_efama_moderator_account"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "add_another_efama_moderator_account", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "add_another_efama_moderator_account"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "create_a_farm_product_listing", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "create_a_farm_product_listing"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "delete_farmer_product_listing", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "delete_farmer_product_listing"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "place_an_order_for_a_product_listing", [_dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "place_an_order_for_a_product_listing"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "accept_buyers_order", [_dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "accept_buyers_order"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "change_order_status_to_delivery_started", [_dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "change_order_status_to_delivery_started"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "confirm_order_has_been_delivered", [_dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "confirm_order_has_been_delivered"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mark_order_as_completed", [_dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "mark_order_as_completed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "request_an_order_refund", [_dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "request_an_order_refund"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "create_dispute_for_a_delivered_order", [_dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "create_dispute_for_a_delivered_order"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "update_client_dispute_request", [_dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "update_client_dispute_request"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "change_dispute_order_status_to_delivery_started", [_dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "change_dispute_order_status_to_delivery_started"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "change_dispute_order_status_to_delivered", [_dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "change_dispute_order_status_to_delivered"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mark_disputed_order_as_completed", [_dec28], Object.getOwnPropertyDescriptor(_class2.prototype, "mark_disputed_order_as_completed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "withdraw_payment_for_order", [_dec29], Object.getOwnPropertyDescriptor(_class2.prototype, "withdraw_payment_for_order"), _class2.prototype)), _class2)) || _class);
function withdraw_payment_for_order() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.withdraw_payment_for_order(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function mark_disputed_order_as_completed() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.mark_disputed_order_as_completed(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function change_dispute_order_status_to_delivered() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.change_dispute_order_status_to_delivered(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function change_dispute_order_status_to_delivery_started() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.change_dispute_order_status_to_delivery_started(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function update_client_dispute_request() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.update_client_dispute_request(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function create_dispute_for_a_delivered_order() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.create_dispute_for_a_delivered_order(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function request_an_order_refund() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.request_an_order_refund(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function mark_order_as_completed() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.mark_order_as_completed(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function confirm_order_has_been_delivered() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.confirm_order_has_been_delivered(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function change_order_status_to_delivery_started() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.change_order_status_to_delivery_started(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function accept_buyers_order() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.accept_buyers_order(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function place_an_order_for_a_product_listing() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.place_an_order_for_a_product_listing(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function delete_farmer_product_listing() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.delete_farmer_product_listing(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function create_a_farm_product_listing() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.create_a_farm_product_listing(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function add_another_efama_moderator_account() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.add_another_efama_moderator_account(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function remove_efama_moderator_account() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.remove_efama_moderator_account(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_efama_moderator_addresses() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_efama_moderator_addresses(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_all_orders_made_for_a_product() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_all_orders_made_for_a_product(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_owner_of_order_by_order_id() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_owner_of_order_by_order_id(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_orders_by_an_address() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_orders_by_an_address(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_order_status_by_order_id() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_order_status_by_order_id(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function view_farmers_listed_products() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.view_farmers_listed_products(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_all_efama_orders() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_all_efama_orders(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_efama_total_disputes() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_efama_total_disputes(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_efama_total_confirmed() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_efama_total_confirmed(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_efama_commision_fee() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_efama_commision_fee(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function get_present_efama_balance() {
  const _state = eFamaMarketPlace._getState();
  if (!_state && eFamaMarketPlace._requireInit()) {
    throw new Error("Contract must be initialized");
  }
  const _contract = eFamaMarketPlace._create();
  if (_state) {
    eFamaMarketPlace._reconstruct(_contract, _state);
  }
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.get_present_efama_balance(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}
function init() {
  const _state = eFamaMarketPlace._getState();
  if (_state) {
    throw new Error("Contract already initialized");
  }
  const _contract = eFamaMarketPlace._create();
  const _args = eFamaMarketPlace._getArgs();
  const _result = _contract.init(_args);
  eFamaMarketPlace._saveToStorage(_contract);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(eFamaMarketPlace._serialize(_result, true));
}

export { accept_buyers_order, add_another_efama_moderator_account, change_dispute_order_status_to_delivered, change_dispute_order_status_to_delivery_started, change_order_status_to_delivery_started, confirm_order_has_been_delivered, create_a_farm_product_listing, create_dispute_for_a_delivered_order, delete_farmer_product_listing, get_all_efama_orders, get_all_orders_made_for_a_product, get_efama_commision_fee, get_efama_moderator_addresses, get_efama_total_confirmed, get_efama_total_disputes, get_order_status_by_order_id, get_orders_by_an_address, get_owner_of_order_by_order_id, get_present_efama_balance, init, mark_disputed_order_as_completed, mark_order_as_completed, place_an_order_for_a_product_listing, remove_efama_moderator_account, request_an_order_refund, update_client_dispute_request, view_farmers_listed_products, withdraw_payment_for_order };
//# sourceMappingURL=contract.js.map
