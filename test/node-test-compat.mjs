import {
  afterEach as nodeAfterEach,
  beforeEach as nodeBeforeEach,
  describe as nodeDescribe,
  it as nodeIt,
} from 'node:test';

const wrapMaybeDone = (fn) => {
  if (typeof fn !== 'function' || fn.length === 0) {
    return fn;
  }

  return async () => new Promise((resolve, reject) => {
    let settled = false;

    const done = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    try {
      fn(done);
    } catch (error) {
      reject(error);
    }
  });
};

export const describe = (name, optionsOrFn, maybeFn) => {
  if (typeof optionsOrFn === 'function') {
    return nodeDescribe(name, wrapMaybeDone(optionsOrFn));
  }

  return nodeDescribe(name, optionsOrFn, wrapMaybeDone(maybeFn));
};

export const it = (name, optionsOrFn, maybeFn) => {
  if (typeof optionsOrFn === 'function') {
    return nodeIt(name, wrapMaybeDone(optionsOrFn));
  }

  return nodeIt(name, optionsOrFn, wrapMaybeDone(maybeFn));
};

export const beforeEach = (fn, options) => nodeBeforeEach(wrapMaybeDone(fn), options);
export const afterEach = (fn, options) => nodeAfterEach(wrapMaybeDone(fn), options);