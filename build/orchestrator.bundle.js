module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 33);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const zlib = __webpack_require__(39);

const AVAILABLE_WINDOW_BITS = [8, 9, 10, 11, 12, 13, 14, 15];
const DEFAULT_WINDOW_BITS = 15;
const DEFAULT_MEM_LEVEL = 8;
const TRAILER = Buffer.from([0x00, 0x00, 0xff, 0xff]);
const EMPTY_BLOCK = Buffer.from([0x00]);

/**
 * Per-message Compression Extensions implementation
 */
class PerMessageDeflate {
  constructor (options, isServer, maxPayload) {
    this._options = options || {};
    this._isServer = !!isServer;
    this._inflate = null;
    this._deflate = null;
    this.params = null;
    this._maxPayload = maxPayload || 0;
    this.threshold = this._options.threshold === undefined ? 1024 : this._options.threshold;
  }

  /**
   * Create extension parameters offer
   *
   * @api public
   */

  offer () {
    var params = {};
    if (this._options.serverNoContextTakeover) {
      params.server_no_context_takeover = true;
    }
    if (this._options.clientNoContextTakeover) {
      params.client_no_context_takeover = true;
    }
    if (this._options.serverMaxWindowBits) {
      params.server_max_window_bits = this._options.serverMaxWindowBits;
    }
    if (this._options.clientMaxWindowBits) {
      params.client_max_window_bits = this._options.clientMaxWindowBits;
    } else if (this._options.clientMaxWindowBits == null) {
      params.client_max_window_bits = true;
    }
    return params;
  }

  /**
   * Accept extension offer
   *
   * @api public
   */
  accept (paramsList) {
    paramsList = this.normalizeParams(paramsList);

    var params;
    if (this._isServer) {
      params = this.acceptAsServer(paramsList);
    } else {
      params = this.acceptAsClient(paramsList);
    }

    this.params = params;
    return params;
  }

  /**
   * Releases all resources used by the extension
   *
   * @api public
   */
  cleanup () {
    if (this._inflate) {
      if (this._inflate.writeInProgress) {
        this._inflate.pendingClose = true;
      } else {
        this._inflate.close();
        this._inflate = null;
      }
    }
    if (this._deflate) {
      if (this._deflate.writeInProgress) {
        this._deflate.pendingClose = true;
      } else {
        this._deflate.close();
        this._deflate = null;
      }
    }
  }

  /**
   * Accept extension offer from client
   *
   * @api private
   */

  acceptAsServer (paramsList) {
    var accepted = {};
    var result = paramsList.some((params) => {
      accepted = {};
      if (this._options.serverNoContextTakeover === false && params.server_no_context_takeover) {
        return;
      }
      if (this._options.serverMaxWindowBits === false && params.server_max_window_bits) {
        return;
      }
      if (typeof this._options.serverMaxWindowBits === 'number' &&
          typeof params.server_max_window_bits === 'number' &&
          this._options.serverMaxWindowBits > params.server_max_window_bits) {
        return;
      }
      if (typeof this._options.clientMaxWindowBits === 'number' && !params.client_max_window_bits) {
        return;
      }

      if (this._options.serverNoContextTakeover || params.server_no_context_takeover) {
        accepted.server_no_context_takeover = true;
      }
      if (this._options.clientNoContextTakeover) {
        accepted.client_no_context_takeover = true;
      }
      if (this._options.clientNoContextTakeover !== false && params.client_no_context_takeover) {
        accepted.client_no_context_takeover = true;
      }
      if (typeof this._options.serverMaxWindowBits === 'number') {
        accepted.server_max_window_bits = this._options.serverMaxWindowBits;
      } else if (typeof params.server_max_window_bits === 'number') {
        accepted.server_max_window_bits = params.server_max_window_bits;
      }
      if (typeof this._options.clientMaxWindowBits === 'number') {
        accepted.client_max_window_bits = this._options.clientMaxWindowBits;
      } else if (this._options.clientMaxWindowBits !== false && typeof params.client_max_window_bits === 'number') {
        accepted.client_max_window_bits = params.client_max_window_bits;
      }
      return true;
    });

    if (!result) {
      throw new Error(`Doesn't support the offered configuration`);
    }

    return accepted;
  }

  /**
   * Accept extension response from server
   *
   * @api privaye
   */

  acceptAsClient (paramsList) {
    var params = paramsList[0];
    if (this._options.clientNoContextTakeover != null) {
      if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
        throw new Error('Invalid value for "client_no_context_takeover"');
      }
    }
    if (this._options.clientMaxWindowBits != null) {
      if (this._options.clientMaxWindowBits === false && params.client_max_window_bits) {
        throw new Error('Invalid value for "client_max_window_bits"');
      }
      if (typeof this._options.clientMaxWindowBits === 'number' &&
          (!params.client_max_window_bits || params.client_max_window_bits > this._options.clientMaxWindowBits)) {
        throw new Error('Invalid value for "client_max_window_bits"');
      }
    }
    return params;
  }

  /**
   * Normalize extensions parameters
   *
   * @api private
   */

  normalizeParams (paramsList) {
    return paramsList.map((params) => {
      Object.keys(params).forEach((key) => {
        var value = params[key];
        if (value.length > 1) {
          throw new Error('Multiple extension parameters for ' + key);
        }

        value = value[0];

        switch (key) {
          case 'server_no_context_takeover':
          case 'client_no_context_takeover':
            if (value !== true) {
              throw new Error(`invalid extension parameter value for ${key} (${value})`);
            }
            params[key] = true;
            break;
          case 'server_max_window_bits':
          case 'client_max_window_bits':
            if (typeof value === 'string') {
              value = parseInt(value, 10);
              if (!~AVAILABLE_WINDOW_BITS.indexOf(value)) {
                throw new Error(`invalid extension parameter value for ${key} (${value})`);
              }
            }
            if (!this._isServer && value === true) {
              throw new Error(`Missing extension parameter value for ${key}`);
            }
            params[key] = value;
            break;
          default:
            throw new Error(`Not defined extension parameter (${key})`);
        }
      });
      return params;
    });
  }

  /**
   * Decompress data.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  decompress (data, fin, callback) {
    const endpoint = this._isServer ? 'client' : 'server';

    if (!this._inflate) {
      const maxWindowBits = this.params[`${endpoint}_max_window_bits`];
      this._inflate = zlib.createInflateRaw({
        windowBits: typeof maxWindowBits === 'number' ? maxWindowBits : DEFAULT_WINDOW_BITS
      });
    }
    this._inflate.writeInProgress = true;

    var totalLength = 0;
    const buffers = [];
    var err;

    const onData = (data) => {
      totalLength += data.length;
      if (this._maxPayload < 1 || totalLength <= this._maxPayload) {
        return buffers.push(data);
      }

      err = new Error('max payload size exceeded');
      err.closeCode = 1009;
      this._inflate.reset();
    };

    const onError = (err) => {
      cleanup();
      callback(err);
    };

    const cleanup = () => {
      if (!this._inflate) return;

      this._inflate.removeListener('error', onError);
      this._inflate.removeListener('data', onData);
      this._inflate.writeInProgress = false;

      if (
        fin && this.params[`${endpoint}_no_context_takeover`] ||
        this._inflate.pendingClose
      ) {
        this._inflate.close();
        this._inflate = null;
      }
    };

    this._inflate.on('error', onError).on('data', onData);
    this._inflate.write(data);
    if (fin) this._inflate.write(TRAILER);

    this._inflate.flush(() => {
      cleanup();
      if (err) callback(err);
      else callback(null, Buffer.concat(buffers, totalLength));
    });
  }

  /**
   * Compress message
   *
   * @api public
   */

  compress (data, fin, callback) {
    if (!data || data.length === 0) {
      return callback(null, EMPTY_BLOCK);
    }

    var endpoint = this._isServer ? 'server' : 'client';

    if (!this._deflate) {
      var maxWindowBits = this.params[endpoint + '_max_window_bits'];
      this._deflate = zlib.createDeflateRaw({
        flush: zlib.Z_SYNC_FLUSH,
        windowBits: typeof maxWindowBits === 'number' ? maxWindowBits : DEFAULT_WINDOW_BITS,
        memLevel: this._options.memLevel || DEFAULT_MEM_LEVEL
      });
    }
    this._deflate.writeInProgress = true;

    const buffers = [];

    const onData = (data) => buffers.push(data);
    const onError = (err) => {
      cleanup();
      callback(err);
    };
    const cleanup = () => {
      if (!this._deflate) return;
      this._deflate.removeListener('error', onError);
      this._deflate.removeListener('data', onData);
      this._deflate.writeInProgress = false;
      if ((fin && this.params[endpoint + '_no_context_takeover']) || this._deflate.pendingClose) {
        this._deflate.close();
        this._deflate = null;
      }
    };

    this._deflate.on('error', onError).on('data', onData);
    this._deflate.write(data);
    this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
      cleanup();
      var data = Buffer.concat(buffers);
      if (fin) {
        data = data.slice(0, data.length - 4);
      }
      callback(null, data);
    });
  }
}

PerMessageDeflate.extensionName = 'permessage-deflate';

module.exports = PerMessageDeflate;


/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = __webpack_require__(1)
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = __webpack_require__(72)

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function posix(path) {
	return path.charAt(0) === '/';
}

function win32(path) {
	// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = Boolean(device && device.charAt(1) !== ':');

	// UNC paths are always absolute
	return Boolean(result[2] || isUnc);
}

module.exports = process.platform === 'win32' ? win32 : posix;
module.exports.posix = posix;
module.exports.win32 = win32;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const http = __webpack_require__(4);
const https = __webpack_require__(12);

const defaults = __webpack_require__(13);
const externalRequest = __webpack_require__(35);

// callback(err, protocol)
module.exports.Protocol = promisesWrapper(function (options, callback) {
    // if the local protocol is requested
    if (!options.remote) {
        const localDescriptor = __webpack_require__(36);
        callback(null, {
            'remote': false,
            'descriptor': localDescriptor
        });
        return;
    }
    // try to fecth the browser version information and the protocol (remotely)
    module.exports.Version(options, function (err, info) {
        if (err) {
            callback(err);
            return;
        }
        // fetch the reported browser info (Node.js returns an array)
        const browser = (info[0] || info).Browser;
        // use the proper protocol fetcher
        let fetcher;
        if (browser.match(/^(Headless)?Chrome\//)) {
            // https://bugs.chromium.org/p/chromium/issues/detail?id=538300#c10
            const firstJsonProtocolVersion = '60.0.3097.0';
            const firstJsonProtocolBuild = explodeChromeVersion(firstJsonProtocolVersion)[2];
            const chromeBuild = explodeChromeVersion(info.Browser.split('/')[1])[2];
            if (chromeBuild < firstJsonProtocolBuild) {
                fetcher = fetchFromChromeRepo;
            } else {
                fetcher = fetchFromHttpEndpoint;
            }
        } else if (browser.match(/^Microsoft Edge /)) {
            fetcher = fetchFromHttpEndpoint;
        } else if (browser.match(/^node.js\//)) {
            fetcher = fetchFromHttpEndpoint;
        } else {
            callback(new Error('Unknown implementation'));
            return;
        }
        fetcher(options, info, function (err, descriptor) {
            if (err) {
                callback(err);
                return;
            }
            // use the remotely fetched descriptor
            callback(null, {
                'remote': true,
                'descriptor': descriptor
            });
        });
    });
});

module.exports.List = promisesWrapper(function (options, callback) {
    options.path = '/json/list';
    devToolsInterface(options, function (err, tabs) {
        if (err) {
            callback(err);
        } else {
            callback(null, JSON.parse(tabs));
        }
    });
});

module.exports.New = promisesWrapper(function (options, callback) {
    options.path = '/json/new';
    if (Object.prototype.hasOwnProperty.call(options, 'url')) {
        options.path += '?' + options.url;
    }
    devToolsInterface(options, function (err, tab) {
        if (err) {
            callback(err);
        } else {
            callback(null, JSON.parse(tab));
        }
    });
});

module.exports.Activate = promisesWrapper(function (options, callback) {
    options.path = '/json/activate/' + options.id;
    devToolsInterface(options, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
});

module.exports.Close = promisesWrapper(function (options, callback) {
    options.path = '/json/close/' + options.id;
    devToolsInterface(options, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
});

module.exports.Version = promisesWrapper(function (options, callback) {
    options.path = '/json/version';
    devToolsInterface(options, function (err, versionInfo) {
        if (err) {
            callback(err);
        } else {
            callback(null, JSON.parse(versionInfo));
        }
    });
});

// options.path must be specified; callback(err, data)
function devToolsInterface(options, callback) {
    options.host = options.host || defaults.HOST;
    options.port = options.port || defaults.PORT;
    options.secure = !!(options.secure);
    externalRequest(options.secure ? https : http, options, callback);
}

// wrapper that allows to return a promise if the callback is omitted, it works
// for DevTools methods
function promisesWrapper(func) {
    return function (options, callback) {
        // options is an optional argument
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }
        options = options || {};
        // just call the function otherwise wrap a promise around its execution
        if (typeof callback === 'function') {
            func(options, callback);
        } else {
            return new Promise(function (fulfill, reject) {
                func(options, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        fulfill(result);
                    }
                });
            });
        }
    };
}

function explodeChromeVersion(v) {
    return v.split('.').map(function (x) {
        return parseInt(x);
    });
}

// callback(err, descriptor)
// XXX this function needs a proper refactor but the inconsistency of the
// fetching process makes it useless for now
function fetchFromChromeRepo(options, info, callback) {
    // attempt to fetch the protocol directly from the Chromium repository
    // according to the current version
    //
    // Thanks to Paul Irish.
    // (see https://github.com/cyrus-and/chrome-remote-interface/issues/10#issuecomment-146032907)
    const webKitVersion = info['WebKit-Version'];
    const v8Version = info['V8-Version'];
    const match = webKitVersion.match(/\s\(@(\b[0-9a-f]{5,40}\b)/);
    const hash = match[1];
    const fromChromiumDotOrg = (hash <= 202666);
    let urls;
    if (fromChromiumDotOrg) {
        urls = [`https://src.chromium.org/blink/trunk/Source/devtools/protocol.json?p=${hash}`];
    } else {
        const lastBeforeSplitChromeVersion = '53.0.2758.1'; // before the split (https://crbug.com/580337)
        const lastBeforeV8ChromeVersion = '55.0.2854.3'; // before using the JSON from the V8 repo
        const chromeVersion = explodeChromeVersion(info.Browser.split('/')[1]);
        // according to https://www.chromium.org/developers/version-numbers (patch not meaningful)
        const beforeSplit = (chromeVersion[2] <= explodeChromeVersion(lastBeforeSplitChromeVersion)[2]);
        const beforeFromV8 = (chromeVersion[2] <= explodeChromeVersion(lastBeforeV8ChromeVersion)[2]);
        if (beforeSplit) {
            urls = [`https://chromium.googlesource.com/chromium/src/+/${hash}/third_party/WebKit/Source/devtools/protocol.json?format=TEXT`];
        } else if (beforeFromV8) {
            urls = [`https://chromium.googlesource.com/chromium/src/+/${hash}/third_party/WebKit/Source/core/inspector/browser_protocol.json?format=TEXT`,
                    `https://chromium.googlesource.com/chromium/src/+/${hash}/third_party/WebKit/Source/platform/v8_inspector/js_protocol.json?format=TEXT`];
        } else if (v8Version) {
            urls = [`https://chromium.googlesource.com/chromium/src/+/${hash}/third_party/WebKit/Source/core/inspector/browser_protocol.json?format=TEXT`,
                    `https://chromium.googlesource.com/v8/v8/+/${v8Version}/src/inspector/js_protocol.json?format=TEXT`];
        } else {
            console.error('Warning: the protocol might be outdated, see: https://groups.google.com/d/topic/chrome-debugging-protocol/HjyOKainKus/discussion');
            // releases which do not provide a V8 version get an old version of the V8 protocol
            urls = [`https://chromium.googlesource.com/chromium/src/+/${hash}/third_party/WebKit/Source/core/inspector/browser_protocol.json?format=TEXT`,
                    `https://chromium.googlesource.com/chromium/src/+/${lastBeforeV8ChromeVersion}/third_party/WebKit/Source/platform/v8_inspector/js_protocol.json?format=TEXT`];
        }
    }
    const descriptors = [];
    urls.forEach(function (url) {
        externalRequest(https, url, function (err, data) {
            let descriptor;
            if (!err) {
                try {
                    // the file is served base64 encoded from googlesource.com
                    if (!fromChromiumDotOrg) {
                        data = new Buffer(data, 'base64').toString();
                    }
                    descriptor = JSON.parse(data);
                } catch (_) {
                    // abort later
                }
            }
            descriptors.push(descriptor);
            if (descriptors.length === urls.length) {
                // all must be defined
                if (descriptors.indexOf(undefined) !== -1) {
                    callback(new Error('Cannot fetch from Chromium repo'));
                    return;
                }
                // merge the domains
                descriptors.forEach(function (descriptor, i) {
                    if (i === 0) {
                        return;
                    }
                    Array.prototype.push.apply(descriptors[0].domains, descriptor.domains);
                });
                callback(null, descriptors[0]);
            }
        });
    });
}

// callback(err, descriptor)
function fetchFromHttpEndpoint(options, info, callback) {
    options.path = '/json/protocol';
    devToolsInterface(options, function (err, descriptor) {
        if (err) {
            callback(err);
        } else {
            callback(null, JSON.parse(descriptor));
        }
    });
}


/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports.HOST = 'localhost';
module.exports.PORT = 9222;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



const EventEmitter = __webpack_require__(2);
const crypto = __webpack_require__(7);
const Ultron = __webpack_require__(15);
const https = __webpack_require__(12);
const http = __webpack_require__(4);
const url = __webpack_require__(16);

const PerMessageDeflate = __webpack_require__(5);
const EventTarget = __webpack_require__(40);
const Extensions = __webpack_require__(17);
const Receiver = __webpack_require__(18);
const Sender = __webpack_require__(21);

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const closeTimeout = 30 * 1000; // Allow 30 seconds to terminate the connection cleanly.
const protocolVersion = 13;
const noop = () => {};

/**
 * Class representing a WebSocket.
 *
 * @extends EventEmitter
 */
class WebSocket extends EventEmitter {
  /**
   * Create a new `WebSocket`.
   *
   * @param {String} address The URL to which to connect
   * @param {(String|String[])} protocols The subprotocols
   * @param {Object} options Connection options
   */
  constructor (address, protocols, options) {
    super();

    if (typeof protocols === 'object' && !Array.isArray(protocols)) {
      options = protocols;
      protocols = null;
    }

    if (typeof protocols === 'string') protocols = [protocols];
    if (!Array.isArray(protocols)) protocols = [];

    this.readyState = WebSocket.CONNECTING;
    this.bytesReceived = 0;
    this.extensions = {};
    this.protocol = '';

    this._finalize = this.finalize.bind(this);
    this._binaryType = 'nodebuffer';
    this._finalizeCalled = false;
    this._closeMessage = null;
    this._closeTimer = null;
    this._closeCode = null;
    this._receiver = null;
    this._sender = null;
    this._socket = null;
    this._ultron = null;

    if (Array.isArray(address)) {
      initAsServerClient.call(this, address[0], address[1], address[2], options);
    } else {
      initAsClient.call(this, address, protocols, options);
    }
  }

  get CONNECTING () { return WebSocket.CONNECTING; }
  get CLOSING () { return WebSocket.CLOSING; }
  get CLOSED () { return WebSocket.CLOSED; }
  get OPEN () { return WebSocket.OPEN; }

  /**
   * @type {Number}
   */
  get bufferedAmount () {
    var amount = 0;

    if (this._socket) {
      amount = this._socket.bufferSize + this._sender.bufferedBytes;
    }
    return amount;
  }

  /**
   * This deviates from the WHATWG interface since ws doesn't support the required
   * default "blob" type (instead we define a custom "nodebuffer" type).
   *
   * @type {String}
   */
  get binaryType () {
    return this._binaryType;
  }

  set binaryType (type) {
    if (type === 'arraybuffer' || type === 'nodebuffer') {
      this._binaryType = type;
    } else {
      throw new SyntaxError('unsupported binaryType: must be either "nodebuffer" or "arraybuffer"');
    }
  }

  /**
   * Set up the socket and the internal resources.
   *
   * @param {net.Socket} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @private
   */
  setSocket (socket, head) {
    socket.setTimeout(0);
    socket.setNoDelay();

    this._receiver = new Receiver(this.extensions, this.maxPayload);
    this._sender = new Sender(socket, this.extensions);
    this._ultron = new Ultron(socket);
    this._socket = socket;

    // socket cleanup handlers
    this._ultron.on('close', this._finalize);
    this._ultron.on('error', this._finalize);
    this._ultron.on('end', this._finalize);

    // ensure that the head is added to the receiver
    if (head && head.length > 0) {
      socket.unshift(head);
      head = null;
    }

    // subsequent packets are pushed to the receiver
    this._ultron.on('data', (data) => {
      this.bytesReceived += data.length;
      this._receiver.add(data);
    });

    // receiver event handlers
    this._receiver.onmessage = (data, flags) => this.emit('message', data, flags);
    this._receiver.onping = (data, flags) => {
      this.pong(data, !this._isServer, true);
      this.emit('ping', data, flags);
    };
    this._receiver.onpong = (data, flags) => this.emit('pong', data, flags);
    this._receiver.onclose = (code, reason) => {
      this._closeMessage = reason;
      this._closeCode = code;
      this.close(code, reason);
    };
    this._receiver.onerror = (error, code) => {
      // close the connection when the receiver reports a HyBi error code
      this.close(code, '');
      this.emit('error', error);
    };

    // sender event handlers
    this._sender.onerror = (error) => {
      this.close(1002, '');
      this.emit('error', error);
    };

    this.readyState = WebSocket.OPEN;
    this.emit('open');
  }

  /**
   * Clean up and release internal resources.
   *
   * @param {(Boolean|Error)} Indicates whether or not an error occurred
   * @private
   */
  finalize (error) {
    if (this._finalizeCalled) return;

    this.readyState = WebSocket.CLOSING;
    this._finalizeCalled = true;

    clearTimeout(this._closeTimer);
    this._closeTimer = null;

    //
    // If the connection was closed abnormally (with an error), or if the close
    // control frame was malformed or not received then the close code must be
    // 1006.
    //
    if (error) this._closeCode = 1006;

    if (this._socket) {
      this._ultron.destroy();
      this._socket.on('error', function onerror () {
        this.destroy();
      });

      if (!error) this._socket.end();
      else this._socket.destroy();

      this._socket = null;
      this._ultron = null;
    }

    if (this._sender) {
      this._sender = this._sender.onerror = null;
    }

    if (this._receiver) {
      this._receiver.cleanup(() => this.emitClose());
      this._receiver = null;
    } else {
      this.emitClose();
    }
  }

  /**
   * Emit the `close` event.
   *
   * @private
   */
  emitClose () {
    this.readyState = WebSocket.CLOSED;
    this.emit('close', this._closeCode || 1006, this._closeMessage || '');

    if (this.extensions[PerMessageDeflate.extensionName]) {
      this.extensions[PerMessageDeflate.extensionName].cleanup();
    }

    this.extensions = null;

    this.removeAllListeners();
    this.on('error', noop); // Catch all errors after this.
  }

  /**
   * Pause the socket stream.
   *
   * @public
   */
  pause () {
    if (this.readyState !== WebSocket.OPEN) throw new Error('not opened');

    this._socket.pause();
  }

  /**
   * Resume the socket stream
   *
   * @public
   */
  resume () {
    if (this.readyState !== WebSocket.OPEN) throw new Error('not opened');

    this._socket.resume();
  }

  /**
   * Start a closing handshake.
   *
   * @param {Number} code Status code explaining why the connection is closing
   * @param {String} data A string explaining why the connection is closing
   * @public
   */
  close (code, data) {
    if (this.readyState === WebSocket.CLOSED) return;
    if (this.readyState === WebSocket.CONNECTING) {
      if (this._req && !this._req.aborted) {
        this._req.abort();
        this.emit('error', new Error('closed before the connection is established'));
        this.finalize(true);
      }
      return;
    }

    if (this.readyState === WebSocket.CLOSING) {
      if (this._closeCode) this.terminate();
      return;
    }

    this.readyState = WebSocket.CLOSING;
    this._sender.close(code, data, !this._isServer, (err) => {
      if (err) this.emit('error', err);

      if (this._closeCode) {
        this.terminate();
      } else {
        //
        // Ensure that the connection is cleaned up even when the closing
        // handshake fails.
        //
        clearTimeout(this._closeTimer);
        this._closeTimer = setTimeout(this._finalize, closeTimeout, true);
      }
    });
  }

  /**
   * Send a ping message.
   *
   * @param {*} data The message to send
   * @param {Boolean} mask Indicates whether or not to mask `data`
   * @param {Boolean} failSilently Indicates whether or not to throw if `readyState` isn't `OPEN`
   * @public
   */
  ping (data, mask, failSilently) {
    if (this.readyState !== WebSocket.OPEN) {
      if (failSilently) return;
      throw new Error('not opened');
    }

    if (typeof data === 'number') data = data.toString();
    if (mask === undefined) mask = !this._isServer;
    this._sender.ping(data, mask);
  }

  /**
   * Send a pong message.
   *
   * @param {*} data The message to send
   * @param {Boolean} mask Indicates whether or not to mask `data`
   * @param {Boolean} failSilently Indicates whether or not to throw if `readyState` isn't `OPEN`
   * @public
   */
  pong (data, mask, failSilently) {
    if (this.readyState !== WebSocket.OPEN) {
      if (failSilently) return;
      throw new Error('not opened');
    }

    if (typeof data === 'number') data = data.toString();
    if (mask === undefined) mask = !this._isServer;
    this._sender.pong(data, mask);
  }

  /**
   * Send a data message.
   *
   * @param {*} data The message to send
   * @param {Object} options Options object
   * @param {Boolean} options.compress Specifies whether or not to compress `data`
   * @param {Boolean} options.binary Specifies whether `data` is binary or text
   * @param {Boolean} options.fin Specifies whether the fragment is the last one
   * @param {Boolean} options.mask Specifies whether or not to mask `data`
   * @param {Function} cb Callback which is executed when data is written out
   * @public
   */
  send (data, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    if (this.readyState !== WebSocket.OPEN) {
      if (cb) cb(new Error('not opened'));
      else throw new Error('not opened');
      return;
    }

    if (typeof data === 'number') data = data.toString();
    else if (!data) data = '';

    const opts = Object.assign({
      fin: true,
      binary: typeof data !== 'string',
      mask: !this._isServer,
      compress: true
    }, options);

    if (!this.extensions[PerMessageDeflate.extensionName]) {
      opts.compress = false;
    }

    this._sender.send(data, opts, cb);
  }

  /**
   * Half-close the socket sending a FIN packet.
   *
   * @public
   */
  terminate () {
    if (this.readyState === WebSocket.CLOSED) return;
    if (this.readyState === WebSocket.CONNECTING) {
      if (this._req && !this._req.aborted) {
        this._req.abort();
        this.emit('error', new Error('closed before the connection is established'));
        this.finalize(true);
      }
      return;
    }

    if (this._socket) {
      this.readyState = WebSocket.CLOSING;
      this._socket.end();

      //
      // Add a timeout to ensure that the connection is completely cleaned up
      // within 30 seconds, even if the other peer does not send a FIN packet.
      //
      clearTimeout(this._closeTimer);
      this._closeTimer = setTimeout(this._finalize, closeTimeout, true);
    }
  }
}

WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

//
// Add the `onopen`, `onerror`, `onclose`, and `onmessage` attributes.
// See https://html.spec.whatwg.org/multipage/comms.html#the-websocket-interface
//
['open', 'error', 'close', 'message'].forEach((method) => {
  Object.defineProperty(WebSocket.prototype, `on${method}`, {
    /**
     * Return the listener of the event.
     *
     * @return {(Function|undefined)} The event listener or `undefined`
     * @public
     */
    get () {
      const listeners = this.listeners(method);
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i]._listener) return listeners[i]._listener;
      }
    },
    /**
     * Add a listener for the event.
     *
     * @param {Function} listener The listener to add
     * @public
     */
    set (listener) {
      const listeners = this.listeners(method);
      for (var i = 0; i < listeners.length; i++) {
        //
        // Remove only the listeners added via `addEventListener`.
        //
        if (listeners[i]._listener) this.removeListener(method, listeners[i]);
      }
      this.addEventListener(method, listener);
    }
  });
});

WebSocket.prototype.addEventListener = EventTarget.addEventListener;
WebSocket.prototype.removeEventListener = EventTarget.removeEventListener;

module.exports = WebSocket;

/**
 * Initialize a WebSocket server client.
 *
 * @param {http.IncomingMessage} req The request object
 * @param {net.Socket} socket The network socket between the server and client
 * @param {Buffer} head The first packet of the upgraded stream
 * @param {Object} options WebSocket attributes
 * @param {Number} options.protocolVersion The WebSocket protocol version
 * @param {Object} options.extensions The negotiated extensions
 * @param {Number} options.maxPayload The maximum allowed message size
 * @param {String} options.protocol The chosen subprotocol
 * @private
 */
function initAsServerClient (req, socket, head, options) {
  this.protocolVersion = options.protocolVersion;
  this.extensions = options.extensions;
  this.maxPayload = options.maxPayload;
  this.protocol = options.protocol;

  this.upgradeReq = req;
  this._isServer = true;

  this.setSocket(socket, head);
}

/**
 * Initialize a WebSocket client.
 *
 * @param {String} address The URL to which to connect
 * @param {String[]} protocols The list of subprotocols
 * @param {Object} options Connection options
 * @param {String} options.protocol Value of the `Sec-WebSocket-Protocol` header
 * @param {(Boolean|Object)} options.perMessageDeflate Enable/disable permessage-deflate
 * @param {String} options.localAddress Local interface to bind for network connections
 * @param {Number} options.protocolVersion Value of the `Sec-WebSocket-Version` header
 * @param {Object} options.headers An object containing request headers
 * @param {String} options.origin Value of the `Origin` or `Sec-WebSocket-Origin` header
 * @param {http.Agent} options.agent Use the specified Agent
 * @param {String} options.host Value of the `Host` header
 * @param {Number} options.family IP address family to use during hostname lookup (4 or 6).
 * @param {Function} options.checkServerIdentity A function to validate the server hostname
 * @param {Boolean} options.rejectUnauthorized Verify or not the server certificate
 * @param {String} options.passphrase The passphrase for the private key or pfx
 * @param {String} options.ciphers The ciphers to use or exclude
 * @param {(String|String[]|Buffer|Buffer[])} options.cert The certificate key
 * @param {(String|String[]|Buffer|Buffer[])} options.key The private key
 * @param {(String|Buffer)} options.pfx The private key, certificate, and CA certs
 * @param {(String|String[]|Buffer|Buffer[])} options.ca Trusted certificates
 * @private
 */
function initAsClient (address, protocols, options) {
  options = Object.assign({
    protocol: protocols.join(','),
    perMessageDeflate: true,
    localAddress: null,
    protocolVersion,
    headers: null,
    origin: null,
    agent: null,
    host: null,
    family: null,

    //
    // SSL options.
    //
    checkServerIdentity: null,
    rejectUnauthorized: null,
    passphrase: null,
    ciphers: null,
    cert: null,
    key: null,
    pfx: null,
    ca: null
  }, options);

  if (options.protocolVersion !== 8 && options.protocolVersion !== 13) {
    throw new Error('unsupported protocol version');
  }

  this.protocolVersion = options.protocolVersion;
  this._isServer = false;
  this.url = address;

  const serverUrl = url.parse(address);
  const isUnixSocket = serverUrl.protocol === 'ws+unix:';

  if (!serverUrl.host && !isUnixSocket) throw new Error('invalid url');

  const isSecure = serverUrl.protocol === 'wss:' || serverUrl.protocol === 'https:';
  const key = crypto.randomBytes(16).toString('base64');
  const port = serverUrl.port || (isSecure ? 443 : 80);
  const httpObj = isSecure ? https : http;

  //
  // Prepare extensions.
  //
  const extensionsOffer = {};
  var perMessageDeflate;

  if (options.perMessageDeflate) {
    perMessageDeflate = new PerMessageDeflate(
      options.perMessageDeflate !== true ? options.perMessageDeflate : {},
      false
    );
    extensionsOffer[PerMessageDeflate.extensionName] = perMessageDeflate.offer();
  }

  const requestOptions = {
    host: serverUrl.hostname,
    port,
    path: '/',
    headers: {
      'Sec-WebSocket-Version': options.protocolVersion,
      'Sec-WebSocket-Key': key,
      'Connection': 'Upgrade',
      'Upgrade': 'websocket'
    }
  };

  if (options.headers) Object.assign(requestOptions.headers, options.headers);
  if (Object.keys(extensionsOffer).length) {
    requestOptions.headers['Sec-WebSocket-Extensions'] = Extensions.format(extensionsOffer);
  }
  if (options.protocol) {
    requestOptions.headers['Sec-WebSocket-Protocol'] = options.protocol;
  }
  if (options.origin) {
    if (options.protocolVersion < 13) {
      requestOptions.headers['Sec-WebSocket-Origin'] = options.origin;
    } else {
      requestOptions.headers.Origin = options.origin;
    }
  }
  if (options.host) requestOptions.headers.Host = options.host;
  if (options.family) requestOptions.family = options.family;

  if (options.localAddress) requestOptions.localAddress = options.localAddress;
  if (isUnixSocket) requestOptions.socketPath = serverUrl.pathname;
  if (serverUrl.auth) requestOptions.auth = serverUrl.auth;

  //
  // Make sure that path starts with `/`.
  //
  if (serverUrl.path) {
    if (serverUrl.path.charAt(0) !== '/') {
      requestOptions.path = `/${serverUrl.path}`;
    } else {
      requestOptions.path = serverUrl.path;
    }
  }

  var agent = options.agent;

  //
  // A custom agent is required for these options.
  //
  if (
    options.rejectUnauthorized != null ||
    options.checkServerIdentity ||
    options.passphrase ||
    options.ciphers ||
    options.cert ||
    options.key ||
    options.pfx ||
    options.ca
  ) {
    if (options.passphrase) requestOptions.passphrase = options.passphrase;
    if (options.ciphers) requestOptions.ciphers = options.ciphers;
    if (options.cert) requestOptions.cert = options.cert;
    if (options.key) requestOptions.key = options.key;
    if (options.pfx) requestOptions.pfx = options.pfx;
    if (options.ca) requestOptions.ca = options.ca;
    if (options.checkServerIdentity) {
      requestOptions.checkServerIdentity = options.checkServerIdentity;
    }
    if (options.rejectUnauthorized != null) {
      requestOptions.rejectUnauthorized = options.rejectUnauthorized;
    }

    if (!agent) agent = new httpObj.Agent(requestOptions);
  }

  if (agent) requestOptions.agent = agent;

  this._req = httpObj.get(requestOptions);

  this._req.on('error', (error) => {
    if (this._req.aborted) return;

    this._req = null;
    this.emit('error', error);
    this.finalize(true);
  });

  this._req.on('response', (res) => {
    if (!this.emit('unexpected-response', this._req, res)) {
      this._req.abort();
      this.emit('error', new Error(`unexpected server response (${res.statusCode})`));
      this.finalize(true);
    }
  });

  this._req.on('upgrade', (res, socket, head) => {
    this._req = null;

    const digest = crypto.createHash('sha1')
      .update(key + GUID, 'binary')
      .digest('base64');

    if (res.headers['sec-websocket-accept'] !== digest) {
      socket.destroy();
      this.emit('error', new Error('invalid server key'));
      return this.finalize(true);
    }

    const serverProt = res.headers['sec-websocket-protocol'];
    const protList = (options.protocol || '').split(/, */);
    var protError;

    if (!options.protocol && serverProt) {
      protError = 'server sent a subprotocol even though none requested';
    } else if (options.protocol && !serverProt) {
      protError = 'server sent no subprotocol even though requested';
    } else if (serverProt && protList.indexOf(serverProt) === -1) {
      protError = 'server responded with an invalid protocol';
    }

    if (protError) {
      socket.destroy();
      this.emit('error', new Error(protError));
      return this.finalize(true);
    }

    if (serverProt) this.protocol = serverProt;

    const serverExtensions = Extensions.parse(res.headers['sec-websocket-extensions']);

    if (perMessageDeflate && serverExtensions[PerMessageDeflate.extensionName]) {
      try {
        perMessageDeflate.accept(serverExtensions[PerMessageDeflate.extensionName]);
      } catch (err) {
        socket.destroy();
        this.emit('error', new Error('invalid extension parameter'));
        return this.finalize(true);
      }

      this.extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
    }

    this.setSocket(socket, head);
  });
}


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var has = Object.prototype.hasOwnProperty;

/**
 * An auto incrementing id which we can use to create "unique" Ultron instances
 * so we can track the event emitters that are added through the Ultron
 * interface.
 *
 * @type {Number}
 * @private
 */
var id = 0;

/**
 * Ultron is high-intelligence robot. It gathers intelligence so it can start improving
 * upon his rudimentary design. It will learn from your EventEmitting patterns
 * and exterminate them.
 *
 * @constructor
 * @param {EventEmitter} ee EventEmitter instance we need to wrap.
 * @api public
 */
function Ultron(ee) {
  if (!(this instanceof Ultron)) return new Ultron(ee);

  this.id = id++;
  this.ee = ee;
}

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @returns {Ultron}
 * @api public
 */
Ultron.prototype.on = function on(event, fn, context) {
  fn.__ultron = this.id;
  this.ee.on(event, fn, context);

  return this;
};
/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @returns {Ultron}
 * @api public
 */
Ultron.prototype.once = function once(event, fn, context) {
  fn.__ultron = this.id;
  this.ee.once(event, fn, context);

  return this;
};

/**
 * Remove the listeners we assigned for the given event.
 *
 * @returns {Ultron}
 * @api public
 */
Ultron.prototype.remove = function remove() {
  var args = arguments
    , ee = this.ee
    , event;

  //
  // When no event names are provided we assume that we need to clear all the
  // events that were assigned through us.
  //
  if (args.length === 1 && 'string' === typeof args[0]) {
    args = args[0].split(/[, ]+/);
  } else if (!args.length) {
    if (ee.eventNames) {
      args = ee.eventNames();
    } else if (ee._events) {
      args = [];

      for (event in ee._events) {
        if (has.call(ee._events, event)) args.push(event);
      }

      if (Object.getOwnPropertySymbols) {
        args = args.concat(Object.getOwnPropertySymbols(ee._events));
      }
    }
  }

  for (var i = 0; i < args.length; i++) {
    var listeners = ee.listeners(args[i]);

    for (var j = 0; j < listeners.length; j++) {
      event = listeners[j];

      //
      // Once listeners have a `listener` property that stores the real listener
      // in the EventEmitter that ships with Node.js.
      //
      if (event.listener) {
        if (event.listener.__ultron !== this.id) continue;
        delete event.listener.__ultron;
      } else {
        if (event.__ultron !== this.id) continue;
        delete event.__ultron;
      }

      ee.removeListener(args[i], event);
    }
  }

  return this;
};

/**
 * Destroy the Ultron instance, remove all listeners and release all references.
 *
 * @returns {Boolean}
 * @api public
 */
Ultron.prototype.destroy = function destroy() {
  if (!this.ee) return false;

  this.remove();
  this.ee = null;

  return true;
};

//
// Expose the module.
//
module.exports = Ultron;


/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Module exports.
 */

exports.parse = parse;
exports.format = format;

/**
 * Parse extensions header value
 */

function parse (value) {
  value = value || '';

  var extensions = {};

  value.split(',').forEach(function (v) {
    var params = v.split(';');
    var token = params.shift().trim();
    var paramsList = extensions[token] = extensions[token] || [];
    var parsedParams = {};

    params.forEach(function (param) {
      var parts = param.trim().split('=');
      var key = parts[0];
      var value = parts[1];
      if (value === undefined) {
        value = true;
      } else {
        // unquote value
        if (value[0] === '"') {
          value = value.slice(1);
        }
        if (value[value.length - 1] === '"') {
          value = value.slice(0, value.length - 1);
        }
      }
      (parsedParams[key] = parsedParams[key] || []).push(value);
    });

    paramsList.push(parsedParams);
  });

  return extensions;
}

/**
 * Format extensions header value
 */

function format (value) {
  return Object.keys(value).map(function (token) {
    var paramsList = value[token];
    if (!Array.isArray(paramsList)) {
      paramsList = [paramsList];
    }
    return paramsList.map(function (params) {
      return [token].concat(Object.keys(params).map(function (k) {
        var p = params[k];
        if (!Array.isArray(p)) p = [p];
        return p.map(function (v) {
          return v === true ? k : k + '=' + v;
        }).join('; ');
      })).join('; ');
    }).join(', ');
  }).join(', ');
}


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



const PerMessageDeflate = __webpack_require__(5);
const isValidUTF8 = __webpack_require__(41);
const bufferUtil = __webpack_require__(19);
const ErrorCodes = __webpack_require__(20);

const EMPTY_BUFFER = Buffer.alloc(0);

const GET_INFO = 0;
const GET_PAYLOAD_LENGTH_16 = 1;
const GET_PAYLOAD_LENGTH_64 = 2;
const HAVE_LENGTH = 3;
const GET_MASK = 4;
const GET_DATA = 5;
const HANDLE_DATA = 6;
const INFLATING = 7;

/**
 * HyBi Receiver implementation.
 */
class Receiver {
  /**
   * Creates a Receiver instance.
   *
   * @param {Object} extensions An object containing the negotiated extensions
   * @param {Number} maxPayload The maximum allowed message length
   */
  constructor (extensions, maxPayload) {
    this.extensions = extensions || {};
    this.maxPayload = maxPayload | 0;

    this.bufferedBytes = 0;
    this.buffers = [];

    this.compressed = false;
    this.payloadLength = 0;
    this.fragmented = 0;
    this.masked = false;
    this.fin = false;
    this.mask = null;
    this.opcode = 0;

    this.totalPayloadLength = 0;
    this.messageLength = 0;
    this.fragments = [];

    this.cleanupCallback = null;
    this.hadError = false;
    this.dead = false;

    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.onping = null;
    this.onpong = null;

    this.state = GET_INFO;
  }

  /**
   * Consumes bytes from the available buffered data.
   *
   * @param {Number} bytes The number of bytes to consume
   * @return {Buffer} Consumed bytes
   * @private
   */
  readBuffer (bytes) {
    var offset = 0;
    var dst;
    var l;

    this.bufferedBytes -= bytes;

    if (bytes === this.buffers[0].length) return this.buffers.shift();

    if (bytes < this.buffers[0].length) {
      dst = this.buffers[0].slice(0, bytes);
      this.buffers[0] = this.buffers[0].slice(bytes);
      return dst;
    }

    dst = new Buffer(bytes);

    while (bytes > 0) {
      l = this.buffers[0].length;

      if (bytes >= l) {
        this.buffers[0].copy(dst, offset);
        offset += l;
        this.buffers.shift();
      } else {
        this.buffers[0].copy(dst, offset, 0, bytes);
        this.buffers[0] = this.buffers[0].slice(bytes);
      }

      bytes -= l;
    }

    return dst;
  }

  /**
   * Checks if the number of buffered bytes is bigger or equal than `n` and
   * calls `cleanup` if necessary.
   *
   * @param {Number} n The number of bytes to check against
   * @return {Boolean} `true` if `bufferedBytes >= n`, else `false`
   * @private
   */
  hasBufferedBytes (n) {
    if (this.bufferedBytes >= n) return true;

    if (this.dead) this.cleanup(this.cleanupCallback);
    return false;
  }

  /**
   * Adds new data to the parser.
   *
   * @public
   */
  add (data) {
    if (this.dead) return;

    this.bufferedBytes += data.length;
    this.buffers.push(data);
    this.startLoop();
  }

  /**
   * Starts the parsing loop.
   *
   * @private
   */
  startLoop () {
    while (true) {
      if (this.state === GET_INFO) {
        if (!this.getInfo()) break;
      } else if (this.state === GET_PAYLOAD_LENGTH_16) {
        if (!this.getPayloadLength16()) break;
      } else if (this.state === GET_PAYLOAD_LENGTH_64) {
        if (!this.getPayloadLength64()) break;
      } else if (this.state === HAVE_LENGTH) {
        if (!this.haveLength()) break;
      } else if (this.state === GET_MASK) {
        if (!this.getMask()) break;
      } else if (this.state === GET_DATA) {
        if (!this.getData()) break;
      } else { // `HANDLE_DATA` or `INFLATING`
        break;
      }
    }
  }

  /**
   * Reads the first two bytes of a frame.
   *
   * @return {Boolean} `true` if the operation is successful, else `false`
   * @private
   */
  getInfo () {
    if (!this.hasBufferedBytes(2)) return false;

    const buf = this.readBuffer(2);

    if ((buf[0] & 0x30) !== 0x00) {
      this.error(new Error('RSV2 and RSV3 must be clear'), 1002);
      return false;
    }

    const compressed = (buf[0] & 0x40) === 0x40;

    if (compressed && !this.extensions[PerMessageDeflate.extensionName]) {
      this.error(new Error('RSV1 must be clear'), 1002);
      return false;
    }

    this.fin = (buf[0] & 0x80) === 0x80;
    this.opcode = buf[0] & 0x0f;
    this.payloadLength = buf[1] & 0x7f;

    if (this.opcode === 0x00) {
      if (compressed) {
        this.error(new Error('RSV1 must be clear'), 1002);
        return false;
      }

      if (!this.fragmented) {
        this.error(new Error(`invalid opcode: ${this.opcode}`), 1002);
        return false;
      } else {
        this.opcode = this.fragmented;
      }
    } else if (this.opcode === 0x01 || this.opcode === 0x02) {
      if (this.fragmented) {
        this.error(new Error(`invalid opcode: ${this.opcode}`), 1002);
        return false;
      }

      this.compressed = compressed;
    } else if (this.opcode > 0x07 && this.opcode < 0x0b) {
      if (!this.fin) {
        this.error(new Error('FIN must be set'), 1002);
        return false;
      }

      if (compressed) {
        this.error(new Error('RSV1 must be clear'), 1002);
        return false;
      }

      if (this.payloadLength > 0x7d) {
        this.error(new Error('invalid payload length'), 1002);
        return false;
      }
    } else {
      this.error(new Error(`invalid opcode: ${this.opcode}`), 1002);
      return false;
    }

    if (!this.fin && !this.fragmented) this.fragmented = this.opcode;

    this.masked = (buf[1] & 0x80) === 0x80;

    if (this.payloadLength === 126) this.state = GET_PAYLOAD_LENGTH_16;
    else if (this.payloadLength === 127) this.state = GET_PAYLOAD_LENGTH_64;
    else this.state = HAVE_LENGTH;

    return true;
  }

  /**
   * Gets extended payload length (7+16).
   *
   * @return {Boolean} `true` if payload length has been read, else `false`
   * @private
   */
  getPayloadLength16 () {
    if (!this.hasBufferedBytes(2)) return false;

    this.payloadLength = this.readBuffer(2).readUInt16BE(0, true);
    this.state = HAVE_LENGTH;
    return true;
  }

  /**
   * Gets extended payload length (7+64).
   *
   * @return {Boolean} `true` if payload length has been read, else `false`
   * @private
   */
  getPayloadLength64 () {
    if (!this.hasBufferedBytes(8)) return false;

    const buf = this.readBuffer(8);
    const num = buf.readUInt32BE(0, true);

    //
    // The maximum safe integer in JavaScript is 2^53 - 1. An error is returned
    // if payload length is greater than this number.
    //
    if (num > Math.pow(2, 53 - 32) - 1) {
      this.error(new Error('max payload size exceeded'), 1009);
      return false;
    }

    this.payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4, true);
    this.state = HAVE_LENGTH;
    return true;
  }

  /**
   * Payload length has been read.
   *
   * @return {Boolean} `false` if payload length exceeds `maxPayload`, else `true`
   * @private
   */
  haveLength () {
    if (this.opcode < 0x08 && this.maxPayloadExceeded(this.payloadLength)) {
      return false;
    }

    if (this.masked) this.state = GET_MASK;
    else this.state = GET_DATA;
    return true;
  }

  /**
   * Reads mask bytes.
   *
   * @return {Boolean} `true` if the mask has been read, else `false`
   * @private
   */
  getMask () {
    if (!this.hasBufferedBytes(4)) return false;

    this.mask = this.readBuffer(4);
    this.state = GET_DATA;
    return true;
  }

  /**
   * Reads data bytes.
   *
   * @return {Boolean} `true` if the data bytes have been read, else `false`
   * @private
   */
  getData () {
    var data = EMPTY_BUFFER;

    if (this.payloadLength) {
      if (!this.hasBufferedBytes(this.payloadLength)) return false;

      data = this.readBuffer(this.payloadLength);
      if (this.masked) bufferUtil.unmask(data, this.mask);
    }

    this.state = HANDLE_DATA;

    if (this.opcode > 0x07) {
      this.controlMessage(data);
    } else if (this.compressed) {
      this.state = INFLATING;
      this.decompress(data);
    } else if (this.pushFragment(data)) {
      this.dataMessage();
    }

    return true;
  }

  /**
   * Decompresses data.
   *
   * @param {Buffer} data Compressed data
   * @private
   */
  decompress (data) {
    const extension = this.extensions[PerMessageDeflate.extensionName];

    extension.decompress(data, this.fin, (err, buf) => {
      if (err) {
        this.error(err, err.closeCode === 1009 ? 1009 : 1007);
        return;
      }

      if (this.pushFragment(buf)) this.dataMessage();
      if (this.state === GET_INFO) this.startLoop();
    });
  }

  /**
   * Handles a data message.
   *
   * @private
   */
  dataMessage () {
    if (this.fin) {
      const buf = this.fragments.length > 1
        ? Buffer.concat(this.fragments, this.messageLength)
        : this.fragments.length === 1
          ? this.fragments[0]
          : EMPTY_BUFFER;

      this.totalPayloadLength = 0;
      this.fragments.length = 0;
      this.messageLength = 0;
      this.fragmented = 0;

      if (this.opcode === 2) {
        this.onmessage(buf, { masked: this.masked, binary: true });
      } else {
        if (!isValidUTF8(buf)) {
          this.error(new Error('invalid utf8 sequence'), 1007);
          return;
        }

        this.onmessage(buf.toString(), { masked: this.masked });
      }
    }

    this.state = GET_INFO;
  }

  /**
   * Handles a control message.
   *
   * @param {Buffer} data Data to handle
   * @private
   */
  controlMessage (data) {
    if (this.opcode === 0x08) {
      if (data.length === 0) {
        this.onclose(1000, '', { masked: this.masked });
        this.cleanup(this.cleanupCallback);
      } else if (data.length === 1) {
        this.error(new Error('invalid payload length'), 1002);
      } else {
        const code = data.readUInt16BE(0, true);

        if (!ErrorCodes.isValidErrorCode(code)) {
          this.error(new Error(`invalid status code: ${code}`), 1002);
          return;
        }

        const buf = data.slice(2);

        if (!isValidUTF8(buf)) {
          this.error(new Error('invalid utf8 sequence'), 1007);
          return;
        }

        this.onclose(code, buf.toString(), { masked: this.masked });
        this.cleanup(this.cleanupCallback);
      }

      return;
    }

    const flags = { masked: this.masked, binary: true };

    if (this.opcode === 0x09) this.onping(data, flags);
    else this.onpong(data, flags);

    this.state = GET_INFO;
  }

  /**
   * Handles an error.
   *
   * @param {Error} err The error
   * @param {Number} code Close code
   * @private
   */
  error (err, code) {
    this.onerror(err, code);
    this.hadError = true;
    this.cleanup(this.cleanupCallback);
  }

  /**
   * Checks payload size, disconnects socket when it exceeds `maxPayload`.
   *
   * @param {Number} length Payload length
   * @private
   */
  maxPayloadExceeded (length) {
    if (length === 0 || this.maxPayload < 1) return false;

    const fullLength = this.totalPayloadLength + length;

    if (fullLength <= this.maxPayload) {
      this.totalPayloadLength = fullLength;
      return false;
    }

    this.error(new Error('max payload size exceeded'), 1009);
    return true;
  }

  /**
   * Appends a fragment in the fragments array after checking that the sum of
   * fragment lengths does not exceed `maxPayload`.
   *
   * @param {Buffer} fragment The fragment to add
   * @return {Boolean} `true` if `maxPayload` is not exceeded, else `false`
   * @private
   */
  pushFragment (fragment) {
    if (fragment.length === 0) return true;

    const totalLength = this.messageLength + fragment.length;

    if (this.maxPayload < 1 || totalLength <= this.maxPayload) {
      this.messageLength = totalLength;
      this.fragments.push(fragment);
      return true;
    }

    this.error(new Error('max payload size exceeded'), 1009);
    return false;
  }

  /**
   * Releases resources used by the receiver.
   *
   * @param {Function} cb Callback
   * @public
   */
  cleanup (cb) {
    this.dead = true;

    if (!this.hadError && this.state === INFLATING) {
      this.cleanupCallback = cb;
    } else {
      this.extensions = null;
      this.fragments = null;
      this.buffers = null;
      this.mask = null;

      this.cleanupCallback = null;
      this.onmessage = null;
      this.onclose = null;
      this.onerror = null;
      this.onping = null;
      this.onpong = null;

      if (cb) cb();
    }
  }
}

module.exports = Receiver;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */

try {
  const bufferUtil = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"bufferutil\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

  module.exports = bufferUtil.BufferUtil || bufferUtil;
} catch (e) {
  module.exports = __webpack_require__(43);
}


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



module.exports = {
  isValidErrorCode: function (code) {
    return (code >= 1000 && code <= 1013 && code !== 1004 && code !== 1005 && code !== 1006) ||
      (code >= 3000 && code <= 4999);
  },
  1000: 'normal',
  1001: 'going away',
  1002: 'protocol error',
  1003: 'unsupported data',
  1004: 'reserved',
  1005: 'reserved for extensions',
  1006: 'reserved for extensions',
  1007: 'inconsistent or invalid data',
  1008: 'policy violation',
  1009: 'message too big',
  1010: 'extension handshake missing',
  1011: 'an unexpected condition prevented the request from being fulfilled',
  1012: 'service restart',
  1013: 'try again later'
};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



const crypto = __webpack_require__(7);

const PerMessageDeflate = __webpack_require__(5);
const bufferUtil = __webpack_require__(19);
const ErrorCodes = __webpack_require__(20);

/**
 * HyBi Sender implementation.
 */
class Sender {
  /**
   * Creates a Sender instance.
   *
   * @param {net.Socket} socket The connection socket
   * @param {Object} extensions An object containing the negotiated extensions
   */
  constructor (socket, extensions) {
    this.perMessageDeflate = (extensions || {})[PerMessageDeflate.extensionName];
    this._socket = socket;

    this.firstFragment = true;
    this.compress = false;

    this.processing = false;
    this.bufferedBytes = 0;
    this.queue = [];

    this.onerror = null;
  }

  /**
   * Sends a close message to the other peer.
   *
   * @param {(Number|undefined)} code The status code component of the body
   * @param {String} data The message component of the body
   * @param {Boolean} mask Specifies whether or not to mask the message
   * @param {Function} cb Callback
   * @public
   */
  close (code, data, mask, cb) {
    if (code !== undefined && (typeof code !== 'number' || !ErrorCodes.isValidErrorCode(code))) {
      throw new Error('first argument must be a valid error code number');
    }

    const buf = Buffer.allocUnsafe(2 + (data ? Buffer.byteLength(data) : 0));

    buf.writeUInt16BE(code || 1000, 0, true);
    if (buf.length > 2) buf.write(data, 2);

    if (this.perMessageDeflate) {
      this.enqueue([this.doClose, buf, mask, cb]);
    } else {
      this.doClose(buf, mask, cb);
    }
  }

  /**
   * Frames and sends a close message.
   *
   * @param {Buffer} data The message to send
   * @param {Boolean} mask Specifies whether or not to mask `data`
   * @param {Function} cb Callback
   * @private
   */
  doClose (data, mask, cb) {
    this.frameAndSend(data, {
      readOnly: false,
      opcode: 0x08,
      rsv1: false,
      fin: true,
      mask
    }, cb);

    if (this.perMessageDeflate) this.continue();
  }

  /**
   * Sends a ping message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} mask Specifies whether or not to mask `data`
   * @public
   */
  ping (data, mask) {
    var readOnly = true;

    if (data && !Buffer.isBuffer(data)) {
      if (data instanceof ArrayBuffer) {
        data = Buffer.from(data);
      } else if (ArrayBuffer.isView(data)) {
        data = viewToBuffer(data);
      } else {
        data = Buffer.from(data);
        readOnly = false;
      }
    }

    if (this.perMessageDeflate) {
      this.enqueue([this.doPing, data, mask, readOnly]);
    } else {
      this.doPing(data, mask, readOnly);
    }
  }

  /**
   * Frames and sends a ping message.
   *
   * @param {*} data The message to send
   * @param {Boolean} mask Specifies whether or not to mask `data`
   * @param {Boolean} readOnly Specifies whether `data` can be modified
   * @private
   */
  doPing (data, mask, readOnly) {
    this.frameAndSend(data, {
      opcode: 0x09,
      rsv1: false,
      fin: true,
      readOnly,
      mask
    });

    if (this.perMessageDeflate) this.continue();
  }

  /**
   * Sends a pong message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} mask Specifies whether or not to mask `data`
   * @public
   */
  pong (data, mask) {
    var readOnly = true;

    if (data && !Buffer.isBuffer(data)) {
      if (data instanceof ArrayBuffer) {
        data = Buffer.from(data);
      } else if (ArrayBuffer.isView(data)) {
        data = viewToBuffer(data);
      } else {
        data = Buffer.from(data);
        readOnly = false;
      }
    }

    if (this.perMessageDeflate) {
      this.enqueue([this.doPong, data, mask, readOnly]);
    } else {
      this.doPong(data, mask, readOnly);
    }
  }

  /**
   * Frames and sends a pong message.
   *
   * @param {*} data The message to send
   * @param {Boolean} mask Specifies whether or not to mask `data`
   * @param {Boolean} readOnly Specifies whether `data` can be modified
   * @private
   */
  doPong (data, mask, readOnly) {
    this.frameAndSend(data, {
      opcode: 0x0a,
      rsv1: false,
      fin: true,
      readOnly,
      mask
    });

    if (this.perMessageDeflate) this.continue();
  }

  /**
   * Sends a data message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Object} options Options object
   * @param {Boolean} options.compress Specifies whether or not to compress `data`
   * @param {Boolean} options.binary Specifies whether `data` is binary or text
   * @param {Boolean} options.fin Specifies whether the fragment is the last one
   * @param {Boolean} options.mask Specifies whether or not to mask `data`
   * @param {Function} cb Callback
   * @public
   */
  send (data, options, cb) {
    var opcode = options.binary ? 2 : 1;
    var rsv1 = options.compress;
    var readOnly = true;

    if (data && !Buffer.isBuffer(data)) {
      if (data instanceof ArrayBuffer) {
        data = Buffer.from(data);
      } else if (ArrayBuffer.isView(data)) {
        data = viewToBuffer(data);
      } else {
        data = Buffer.from(data);
        readOnly = false;
      }
    }

    if (this.firstFragment) {
      this.firstFragment = false;
      if (rsv1 && data && this.perMessageDeflate) {
        rsv1 = data.length >= this.perMessageDeflate.threshold;
      }
      this.compress = rsv1;
    } else {
      rsv1 = false;
      opcode = 0;
    }

    if (options.fin) this.firstFragment = true;

    if (this.perMessageDeflate) {
      this.enqueue([this.dispatch, data, {
        compress: this.compress,
        mask: options.mask,
        fin: options.fin,
        readOnly,
        opcode,
        rsv1
      }, cb]);
    } else {
      this.frameAndSend(data, {
        mask: options.mask,
        fin: options.fin,
        rsv1: false,
        readOnly,
        opcode
      }, cb);
    }
  }

  /**
   * Dispatches a data message.
   *
   * @param {Buffer} data The message to send
   * @param {Object} options Options object
   * @param {Number} options.opcode The opcode
   * @param {Boolean} options.readOnly Specifies whether `data` can be modified
   * @param {Boolean} options.fin Specifies whether or not to set the FIN bit
   * @param {Boolean} options.compress Specifies whether or not to compress `data`
   * @param {Boolean} options.mask Specifies whether or not to mask `data`
   * @param {Boolean} options.rsv1 Specifies whether or not to set the RSV1 bit
   * @param {Function} cb Callback
   * @private
   */
  dispatch (data, options, cb) {
    if (!options.compress) {
      this.frameAndSend(data, options, cb);
      this.continue();
      return;
    }

    this.perMessageDeflate.compress(data, options.fin, (err, buf) => {
      if (err) {
        if (cb) cb(err);
        else this.onerror(err);
        return;
      }

      options.readOnly = false;
      this.frameAndSend(buf, options, cb);
      this.continue();
    });
  }

  /**
   * Frames and sends a piece of data according to the HyBi WebSocket protocol.
   *
   * @param {Buffer} data The data to send
   * @param {Object} options Options object
   * @param {Number} options.opcode The opcode
   * @param {Boolean} options.readOnly Specifies whether `data` can be modified
   * @param {Boolean} options.fin Specifies whether or not to set the FIN bit
   * @param {Boolean} options.mask Specifies whether or not to mask `data`
   * @param {Boolean} options.rsv1 Specifies whether or not to set the RSV1 bit
   * @param {Function} cb Callback
   * @private
   */
  frameAndSend (data, options, cb) {
    if (!data) {
      const bytes = [options.opcode, 0];

      if (options.fin) bytes[0] |= 0x80;
      if (options.mask) {
        bytes[1] |= 0x80;
        bytes.push(0, 0, 0, 0);
      }

      sendFramedData(this, Buffer.from(bytes), null, cb);
      return;
    }

    const mergeBuffers = data.length < 1024 || options.mask && options.readOnly;
    var dataOffset = options.mask ? 6 : 2;
    var payloadLength = data.length;

    if (data.length >= 65536) {
      dataOffset += 8;
      payloadLength = 127;
    } else if (data.length > 125) {
      dataOffset += 2;
      payloadLength = 126;
    }

    const outputBuffer = Buffer.allocUnsafe(
      mergeBuffers ? data.length + dataOffset : dataOffset
    );

    outputBuffer[0] = options.fin ? options.opcode | 0x80 : options.opcode;
    if (options.rsv1) outputBuffer[0] |= 0x40;

    if (payloadLength === 126) {
      outputBuffer.writeUInt16BE(data.length, 2, true);
    } else if (payloadLength === 127) {
      outputBuffer.writeUInt32BE(0, 2, true);
      outputBuffer.writeUInt32BE(data.length, 6, true);
    }

    if (options.mask) {
      const mask = getRandomMask();

      outputBuffer[1] = payloadLength | 0x80;
      outputBuffer[dataOffset - 4] = mask[0];
      outputBuffer[dataOffset - 3] = mask[1];
      outputBuffer[dataOffset - 2] = mask[2];
      outputBuffer[dataOffset - 1] = mask[3];

      if (mergeBuffers) {
        bufferUtil.mask(data, mask, outputBuffer, dataOffset, data.length);
      } else {
        bufferUtil.mask(data, mask, data, 0, data.length);
      }
    } else {
      outputBuffer[1] = payloadLength;
      if (mergeBuffers) data.copy(outputBuffer, dataOffset);
    }

    sendFramedData(this, outputBuffer, mergeBuffers ? null : data, cb);
  }

  /**
   * Executes a queued send operation.
   *
   * @private
   */
  dequeue () {
    if (this.processing) return;

    const params = this.queue.shift();
    if (!params) return;

    if (params[1]) this.bufferedBytes -= params[1].length;
    this.processing = true;

    params[0].apply(this, params.slice(1));
  }

  /**
   * Signals the completion of a send operation.
   *
   * @private
   */
  continue () {
    process.nextTick(() => {
      this.processing = false;
      this.dequeue();
    });
  }

  /**
   * Enqueues a send operation.
   *
   * @param {Array} params Send operation parameters.
   * @private
   */
  enqueue (params) {
    if (params[1]) this.bufferedBytes += params[1].length;
    this.queue.push(params);
    this.dequeue();
  }
}

module.exports = Sender;

/**
 * Converts an `ArrayBuffer` view into a buffer.
 *
 * @param {(DataView|TypedArray)} view The view to convert
 * @return {Buffer} Converted view
 * @private
 */
function viewToBuffer (view) {
  const buf = Buffer.from(view.buffer);

  if (view.byteLength !== view.buffer.byteLength) {
    return buf.slice(view.byteOffset, view.byteOffset + view.byteLength);
  }

  return buf;
}

/**
 * Generates a random mask.
 *
 * @return {Buffer} The mask
 * @private
 */
function getRandomMask () {
  return crypto.randomBytes(4);
}

/**
 * Sends a frame.
 *
 * @param {Sender} sender Sender instance
 * @param {Buffer} outputBuffer The data to send
 * @param {Buffer} data Additional data to send if frame is split into two buffers
 * @param {Function} cb Callback
 * @private
 */
function sendFramedData (sender, outputBuffer, data, cb) {
  if (data) {
    sender._socket.write(outputBuffer);
    sender._socket.write(data, cb);
  } else {
    sender._socket.write(outputBuffer, cb);
  }
}


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

const chalk = __webpack_require__(46);
const appName = __webpack_require__(56)['name'];
const prefix = `[${appName}]:`;

/**
 * Logs with `neswitch` prefix.
 */
class Logger {
  constructor({ logColor, errorColor, prefix }) {
    this.prefix = prefix;
    this.logColor = logColor;
    this.errorColor = errorColor;
  }

  log() {
    console.log(`${chalk[this.logColor](prefix)}`, ...arguments);
  }
}

module.exports = new Logger({ logColor: 'blue', errorColor: 'red', prefix });

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

/* MIT license */
var cssKeywords = __webpack_require__(51);

// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in cssKeywords) {
	if (cssKeywords.hasOwnProperty(key)) {
		reverseKeywords[cssKeywords[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var v;

	if (max === 0) {
		s = 0;
	} else {
		s = (delta / max * 1000) / 10;
	}

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	v = ((max / 255) * 1000) / 10;

	return [h, s, v];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in cssKeywords) {
		if (cssKeywords.hasOwnProperty(keyword)) {
			var value = cssKeywords[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return cssKeywords[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};


/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */


const debug = __webpack_require__(61);
const EventEmitter = __webpack_require__(2).EventEmitter;
const isWindows = process.platform === 'win32';

// process.browser is set when browserify'd via the `process` npm module
const isBrowser = process.browser;

const colors = {
  red: isBrowser ? 'crimson' : 1,
  yellow: isBrowser ? 'gold' : 3,
  cyan: isBrowser ? 'darkturquoise' : 6,
  green: isBrowser ? 'forestgreen' : 2,
  blue: isBrowser ? 'steelblue' : 4,
  magenta: isBrowser ? 'palevioletred' : 5
};

// whitelist non-red/yellow colors for debug()
debug.colors = [colors.cyan, colors.green, colors.blue, colors.magenta];

class Emitter extends EventEmitter {
  /**
   * Fires off all status updates. Listen with
   * `require('lib/log').events.addListener('status', callback)`
   * @param {string} title
   * @param {!Array<*>} argsArray
   */
  issueStatus(title, argsArray) {
    if (title === 'status' || title === 'statusEnd') {
      this.emit(title, [title, ...argsArray]);
    }
  }

  /**
   * Fires off all warnings. Listen with
   * `require('lib/log').events.addListener('warning', callback)`
   * @param {string} title
   * @param {!Array<*>} argsArray
   */
  issueWarning(title, argsArray) {
    this.emit('warning', [title, ...argsArray]);
  }
}

const loggersByTitle = {};
const loggingBufferColumns = 25;

class Log {

  static _logToStdErr(title, argsArray) {
    const log = Log.loggerfn(title);
    log(...argsArray);
  }

  static loggerfn(title) {
    let log = loggersByTitle[title];
    if (!log) {
      log = debug(title);
      loggersByTitle[title] = log;
      // errors with red, warnings with yellow.
      if (title.endsWith('error')) {
        log.color = colors.red;
      } else if (title.endsWith('warn')) {
        log.color = colors.yellow;
      }
    }
    return log;
  }

  static setLevel(level) {
    switch (level) {
      case 'silent':
        debug.enable('-*');
        break;
      case 'verbose':
        debug.enable('*');
        break;
      case 'error':
        debug.enable('-*, *:error');
        break;
      default:
        debug.enable('*, -*:verbose');
    }
  }

  /**
   * A simple formatting utility for event logging.
   * @param {string} prefix
   * @param {!Object} data A JSON-serializable object of event data to log.
   * @param {string=} level Optional logging level. Defaults to 'log'.
   */
  static formatProtocol(prefix, data, level) {
    const columns = (!process || process.browser) ? Infinity : process.stdout.columns;
    const method = data.method || '?????';
    const maxLength = columns - method.length - prefix.length - loggingBufferColumns;
    // IO.read blacklisted here to avoid logging megabytes of trace data
    const snippet = (data.params && method !== 'IO.read') ?
      JSON.stringify(data.params).substr(0, maxLength) : '';
    Log._logToStdErr(`${prefix}:${level || ''}`, [method, snippet]);
  }

  static log(title, ...args) {
    Log.events.issueStatus(title, args);
    return Log._logToStdErr(title, args);
  }

  static warn(title, ...args) {
    Log.events.issueWarning(title, args);
    return Log._logToStdErr(`${title}:warn`, args);
  }

  static error(title, ...args) {
    return Log._logToStdErr(`${title}:error`, args);
  }

  static verbose(title, ...args) {
    Log.events.issueStatus(title, args);
    return Log._logToStdErr(`${title}:verbose`, args);
  }

  /**
   * Add surrounding escape sequences to turn a string green when logged.
   * @param {string} str
   * @return {string}
   */
  static greenify(str) {
    return `${Log.green}${str}${Log.reset}`;
  }

  /**
   * Add surrounding escape sequences to turn a string red when logged.
   * @param {string} str
   * @return {string}
   */
  static redify(str) {
    return `${Log.red}${str}${Log.reset}`;
  }

  static get green() {
    return '\x1B[32m';
  }

  static get red() {
    return '\x1B[31m';
  }

  static get yellow() {
    return '\x1b[33m';
  }

  static get purple() {
    return '\x1b[95m';
  }

  static get reset() {
    return '\x1B[0m';
  }

  static get bold() {
    return '\x1b[1m';
  }

  static get dim() {
    return '\x1b[2m';
  }

  static get tick() {
    return isWindows ? '\u221A' : '✓';
  }

  static get cross() {
    return isWindows ? '\u00D7' : '✘';
  }

  static get whiteSmallSquare() {
    return isWindows ? '\u0387' : '▫';
  }

  static get heavyHorizontal() {
    return isWindows ? '\u2500' : '━';
  }

  static get heavyVertical() {
    return isWindows ? '\u2502 ' : '┃ ';
  }

  static get heavyUpAndRight() {
    return isWindows ? '\u2514' : '┗';
  }

  static get heavyVerticalAndRight() {
    return isWindows ? '\u251C' : '┣';
  }

  static get heavyDownAndHorizontal() {
    return isWindows ? '\u252C' : '┳';
  }

  static get doubleLightHorizontal() {
    return '──';
  }
}

Log.events = new Emitter();

module.exports = Log;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = __webpack_require__(63);

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}


/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

// Approach:
//
// 1. Get the minimatch set
// 2. For each pattern in the set, PROCESS(pattern, false)
// 3. Store matches per-set, then uniq them
//
// PROCESS(pattern, inGlobStar)
// Get the first [n] items from pattern that are all strings
// Join these together.  This is PREFIX.
//   If there is no more remaining, then stat(PREFIX) and
//   add to matches if it succeeds.  END.
//
// If inGlobStar and PREFIX is symlink and points to dir
//   set ENTRIES = []
// else readdir(PREFIX) as ENTRIES
//   If fail, END
//
// with ENTRIES
//   If pattern[n] is GLOBSTAR
//     // handle the case where the globstar match is empty
//     // by pruning it out, and testing the resulting pattern
//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
//     // handle other cases.
//     for ENTRY in ENTRIES (not dotfiles)
//       // attach globstar + tail onto the entry
//       // Mark that this entry is a globstar match
//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
//
//   else // not globstar
//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
//       Test ENTRY against pattern[n]
//       If fails, continue
//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
//
// Caveat:
//   Cache all stats and readdirs results to minimize syscall.  Since all
//   we ever care about is existence and directory-ness, we can just keep
//   `true` for files, and [children,...] for directories, or `false` for
//   things that don't exist.

module.exports = glob

var fs = __webpack_require__(0)
var rp = __webpack_require__(29)
var minimatch = __webpack_require__(9)
var Minimatch = minimatch.Minimatch
var inherits = __webpack_require__(75)
var EE = __webpack_require__(2).EventEmitter
var path = __webpack_require__(1)
var assert = __webpack_require__(8)
var isAbsolute = __webpack_require__(10)
var globSync = __webpack_require__(77)
var common = __webpack_require__(30)
var alphasort = common.alphasort
var alphasorti = common.alphasorti
var setopts = common.setopts
var ownProp = common.ownProp
var inflight = __webpack_require__(78)
var util = __webpack_require__(3)
var childrenIgnored = common.childrenIgnored
var isIgnored = common.isIgnored

var once = __webpack_require__(32)

function glob (pattern, options, cb) {
  if (typeof options === 'function') cb = options, options = {}
  if (!options) options = {}

  if (options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return globSync(pattern, options)
  }

  return new Glob(pattern, options, cb)
}

glob.sync = globSync
var GlobSync = glob.GlobSync = globSync.GlobSync

// old api surface
glob.glob = glob

function extend (origin, add) {
  if (add === null || typeof add !== 'object') {
    return origin
  }

  var keys = Object.keys(add)
  var i = keys.length
  while (i--) {
    origin[keys[i]] = add[keys[i]]
  }
  return origin
}

glob.hasMagic = function (pattern, options_) {
  var options = extend({}, options_)
  options.noprocess = true

  var g = new Glob(pattern, options)
  var set = g.minimatch.set

  if (!pattern)
    return false

  if (set.length > 1)
    return true

  for (var j = 0; j < set[0].length; j++) {
    if (typeof set[0][j] !== 'string')
      return true
  }

  return false
}

glob.Glob = Glob
inherits(Glob, EE)
function Glob (pattern, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = null
  }

  if (options && options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return new GlobSync(pattern, options)
  }

  if (!(this instanceof Glob))
    return new Glob(pattern, options, cb)

  setopts(this, pattern, options)
  this._didRealPath = false

  // process each pattern in the minimatch set
  var n = this.minimatch.set.length

  // The matches are stored as {<filename>: true,...} so that
  // duplicates are automagically pruned.
  // Later, we do an Object.keys() on these.
  // Keep them as a list so we can fill in when nonull is set.
  this.matches = new Array(n)

  if (typeof cb === 'function') {
    cb = once(cb)
    this.on('error', cb)
    this.on('end', function (matches) {
      cb(null, matches)
    })
  }

  var self = this
  this._processing = 0

  this._emitQueue = []
  this._processQueue = []
  this.paused = false

  if (this.noprocess)
    return this

  if (n === 0)
    return done()

  var sync = true
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false, done)
  }
  sync = false

  function done () {
    --self._processing
    if (self._processing <= 0) {
      if (sync) {
        process.nextTick(function () {
          self._finish()
        })
      } else {
        self._finish()
      }
    }
  }
}

Glob.prototype._finish = function () {
  assert(this instanceof Glob)
  if (this.aborted)
    return

  if (this.realpath && !this._didRealpath)
    return this._realpath()

  common.finish(this)
  this.emit('end', this.found)
}

Glob.prototype._realpath = function () {
  if (this._didRealpath)
    return

  this._didRealpath = true

  var n = this.matches.length
  if (n === 0)
    return this._finish()

  var self = this
  for (var i = 0; i < this.matches.length; i++)
    this._realpathSet(i, next)

  function next () {
    if (--n === 0)
      self._finish()
  }
}

Glob.prototype._realpathSet = function (index, cb) {
  var matchset = this.matches[index]
  if (!matchset)
    return cb()

  var found = Object.keys(matchset)
  var self = this
  var n = found.length

  if (n === 0)
    return cb()

  var set = this.matches[index] = Object.create(null)
  found.forEach(function (p, i) {
    // If there's a problem with the stat, then it means that
    // one or more of the links in the realpath couldn't be
    // resolved.  just return the abs value in that case.
    p = self._makeAbs(p)
    rp.realpath(p, self.realpathCache, function (er, real) {
      if (!er)
        set[real] = true
      else if (er.syscall === 'stat')
        set[p] = true
      else
        self.emit('error', er) // srsly wtf right here

      if (--n === 0) {
        self.matches[index] = set
        cb()
      }
    })
  })
}

Glob.prototype._mark = function (p) {
  return common.mark(this, p)
}

Glob.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}

Glob.prototype.abort = function () {
  this.aborted = true
  this.emit('abort')
}

Glob.prototype.pause = function () {
  if (!this.paused) {
    this.paused = true
    this.emit('pause')
  }
}

Glob.prototype.resume = function () {
  if (this.paused) {
    this.emit('resume')
    this.paused = false
    if (this._emitQueue.length) {
      var eq = this._emitQueue.slice(0)
      this._emitQueue.length = 0
      for (var i = 0; i < eq.length; i ++) {
        var e = eq[i]
        this._emitMatch(e[0], e[1])
      }
    }
    if (this._processQueue.length) {
      var pq = this._processQueue.slice(0)
      this._processQueue.length = 0
      for (var i = 0; i < pq.length; i ++) {
        var p = pq[i]
        this._processing--
        this._process(p[0], p[1], p[2], p[3])
      }
    }
  }
}

Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
  assert(this instanceof Glob)
  assert(typeof cb === 'function')

  if (this.aborted)
    return

  this._processing++
  if (this.paused) {
    this._processQueue.push([pattern, index, inGlobStar, cb])
    return
  }

  //console.error('PROCESS %d', this._processing, pattern)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // see if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index, cb)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip _processing
  if (childrenIgnored(this, read))
    return cb()

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb)
}

Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}

Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return cb()

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return cb()

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this._emitMatch(index, e)
    }
    // This was the last one, and no stats were needed
    return cb()
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix) {
      if (prefix !== '/')
        e = prefix + '/' + e
      else
        e = prefix + e
    }
    this._process([e].concat(remain), index, inGlobStar, cb)
  }
  cb()
}

Glob.prototype._emitMatch = function (index, e) {
  if (this.aborted)
    return

  if (isIgnored(this, e))
    return

  if (this.paused) {
    this._emitQueue.push([index, e])
    return
  }

  var abs = isAbsolute(e) ? e : this._makeAbs(e)

  if (this.mark)
    e = this._mark(e)

  if (this.absolute)
    e = abs

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true

  var st = this.statCache[abs]
  if (st)
    this.emit('stat', e, st)

  this.emit('match', e)
}

Glob.prototype._readdirInGlobStar = function (abs, cb) {
  if (this.aborted)
    return

  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false, cb)

  var lstatkey = 'lstat\0' + abs
  var self = this
  var lstatcb = inflight(lstatkey, lstatcb_)

  if (lstatcb)
    fs.lstat(abs, lstatcb)

  function lstatcb_ (er, lstat) {
    if (er && er.code === 'ENOENT')
      return cb()

    var isSym = lstat && lstat.isSymbolicLink()
    self.symlinks[abs] = isSym

    // If it's not a symlink or a dir, then it's definitely a regular file.
    // don't bother doing a readdir in that case.
    if (!isSym && lstat && !lstat.isDirectory()) {
      self.cache[abs] = 'FILE'
      cb()
    } else
      self._readdir(abs, false, cb)
  }
}

Glob.prototype._readdir = function (abs, inGlobStar, cb) {
  if (this.aborted)
    return

  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb)
  if (!cb)
    return

  //console.error('RD %j %j', +inGlobStar, abs)
  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs, cb)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return cb()

    if (Array.isArray(c))
      return cb(null, c)
  }

  var self = this
  fs.readdir(abs, readdirCb(this, abs, cb))
}

function readdirCb (self, abs, cb) {
  return function (er, entries) {
    if (er)
      self._readdirError(abs, er, cb)
    else
      self._readdirEntries(abs, entries, cb)
  }
}

Glob.prototype._readdirEntries = function (abs, entries, cb) {
  if (this.aborted)
    return

  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries
  return cb(null, entries)
}

Glob.prototype._readdirError = function (f, er, cb) {
  if (this.aborted)
    return

  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f)
      this.cache[abs] = 'FILE'
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd)
        error.path = this.cwd
        error.code = er.code
        this.emit('error', error)
        this.abort()
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict) {
        this.emit('error', er)
        // If the error is handled, then we abort
        // if not, we threw out of here
        this.abort()
      }
      if (!this.silent)
        console.error('glob error', er)
      break
  }

  return cb()
}

Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}


Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
  //console.error('pgs2', prefix, remain[0], entries)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return cb()

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false, cb)

  var isSym = this.symlinks[abs]
  var len = entries.length

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return cb()

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true, cb)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true, cb)
  }

  cb()
}

Glob.prototype._processSimple = function (prefix, index, cb) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var self = this
  this._stat(prefix, function (er, exists) {
    self._processSimple2(prefix, index, er, exists, cb)
  })
}
Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

  //console.error('ps2', prefix, exists)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return cb()

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this._emitMatch(index, prefix)
  cb()
}

// Returns either 'DIR', 'FILE', or false
Glob.prototype._stat = function (f, cb) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return cb()

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return cb(null, c)

    if (needDir && c === 'FILE')
      return cb()

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (stat !== undefined) {
    if (stat === false)
      return cb(null, stat)
    else {
      var type = stat.isDirectory() ? 'DIR' : 'FILE'
      if (needDir && type === 'FILE')
        return cb()
      else
        return cb(null, type, stat)
    }
  }

  var self = this
  var statcb = inflight('stat\0' + abs, lstatcb_)
  if (statcb)
    fs.lstat(abs, statcb)

  function lstatcb_ (er, lstat) {
    if (lstat && lstat.isSymbolicLink()) {
      // If it's a symlink, then treat it as the target, unless
      // the target does not exist, then treat it as a file.
      return fs.stat(abs, function (er, stat) {
        if (er)
          self._stat2(f, abs, null, lstat, cb)
        else
          self._stat2(f, abs, er, stat, cb)
      })
    } else {
      self._stat2(f, abs, er, lstat, cb)
    }
  }
}

Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
  if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
    this.statCache[abs] = false
    return cb()
  }

  var needDir = f.slice(-1) === '/'
  this.statCache[abs] = stat

  if (abs.slice(-1) === '/' && stat && !stat.isDirectory())
    return cb(null, false, stat)

  var c = true
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE'
  this.cache[abs] = this.cache[abs] || c

  if (needDir && c === 'FILE')
    return cb()

  return cb(null, c, stat)
}


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = realpath
realpath.realpath = realpath
realpath.sync = realpathSync
realpath.realpathSync = realpathSync
realpath.monkeypatch = monkeypatch
realpath.unmonkeypatch = unmonkeypatch

var fs = __webpack_require__(0)
var origRealpath = fs.realpath
var origRealpathSync = fs.realpathSync

var version = process.version
var ok = /^v[0-5]\./.test(version)
var old = __webpack_require__(71)

function newError (er) {
  return er && er.syscall === 'realpath' && (
    er.code === 'ELOOP' ||
    er.code === 'ENOMEM' ||
    er.code === 'ENAMETOOLONG'
  )
}

function realpath (p, cache, cb) {
  if (ok) {
    return origRealpath(p, cache, cb)
  }

  if (typeof cache === 'function') {
    cb = cache
    cache = null
  }
  origRealpath(p, cache, function (er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb)
    } else {
      cb(er, result)
    }
  })
}

function realpathSync (p, cache) {
  if (ok) {
    return origRealpathSync(p, cache)
  }

  try {
    return origRealpathSync(p, cache)
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache)
    } else {
      throw er
    }
  }
}

function monkeypatch () {
  fs.realpath = realpath
  fs.realpathSync = realpathSync
}

function unmonkeypatch () {
  fs.realpath = origRealpath
  fs.realpathSync = origRealpathSync
}


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

exports.alphasort = alphasort
exports.alphasorti = alphasorti
exports.setopts = setopts
exports.ownProp = ownProp
exports.makeAbs = makeAbs
exports.finish = finish
exports.mark = mark
exports.isIgnored = isIgnored
exports.childrenIgnored = childrenIgnored

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}

var path = __webpack_require__(1)
var minimatch = __webpack_require__(9)
var isAbsolute = __webpack_require__(10)
var Minimatch = minimatch.Minimatch

function alphasorti (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

function alphasort (a, b) {
  return a.localeCompare(b)
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || []

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore]

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap)
  }
}

// ignore patterns are always in dot:true mode.
function ignoreMap (pattern) {
  var gmatcher = null
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '')
    gmatcher = new Minimatch(gpattern, { dot: true })
  }

  return {
    matcher: new Minimatch(pattern, { dot: true }),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {}

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern
  }

  self.silent = !!options.silent
  self.pattern = pattern
  self.strict = options.strict !== false
  self.realpath = !!options.realpath
  self.realpathCache = options.realpathCache || Object.create(null)
  self.follow = !!options.follow
  self.dot = !!options.dot
  self.mark = !!options.mark
  self.nodir = !!options.nodir
  if (self.nodir)
    self.mark = true
  self.sync = !!options.sync
  self.nounique = !!options.nounique
  self.nonull = !!options.nonull
  self.nosort = !!options.nosort
  self.nocase = !!options.nocase
  self.stat = !!options.stat
  self.noprocess = !!options.noprocess
  self.absolute = !!options.absolute

  self.maxLength = options.maxLength || Infinity
  self.cache = options.cache || Object.create(null)
  self.statCache = options.statCache || Object.create(null)
  self.symlinks = options.symlinks || Object.create(null)

  setupIgnores(self, options)

  self.changedCwd = false
  var cwd = process.cwd()
  if (!ownProp(options, "cwd"))
    self.cwd = cwd
  else {
    self.cwd = path.resolve(options.cwd)
    self.changedCwd = self.cwd !== cwd
  }

  self.root = options.root || path.resolve(self.cwd, "/")
  self.root = path.resolve(self.root)
  if (process.platform === "win32")
    self.root = self.root.replace(/\\/g, "/")

  // TODO: is an absolute `cwd` supposed to be resolved against `root`?
  // e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
  self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd)
  if (process.platform === "win32")
    self.cwdAbs = self.cwdAbs.replace(/\\/g, "/")
  self.nomount = !!options.nomount

  // disable comments and negation in Minimatch.
  // Note that they are not supported in Glob itself anyway.
  options.nonegate = true
  options.nocomment = true

  self.minimatch = new Minimatch(pattern, options)
  self.options = self.minimatch.options
}

function finish (self) {
  var nou = self.nounique
  var all = nou ? [] : Object.create(null)

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i]
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i]
        if (nou)
          all.push(literal)
        else
          all[literal] = true
      }
    } else {
      // had matches
      var m = Object.keys(matches)
      if (nou)
        all.push.apply(all, m)
      else
        m.forEach(function (m) {
          all[m] = true
        })
    }
  }

  if (!nou)
    all = Object.keys(all)

  if (!self.nosort)
    all = all.sort(self.nocase ? alphasorti : alphasort)

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i])
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        var notDir = !(/\/$/.test(e))
        var c = self.cache[e] || self.cache[makeAbs(self, e)]
        if (notDir && c)
          notDir = c !== 'DIR' && !Array.isArray(c)
        return notDir
      })
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    })

  self.found = all
}

function mark (self, p) {
  var abs = makeAbs(self, p)
  var c = self.cache[abs]
  var m = p
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c)
    var slash = p.slice(-1) === '/'

    if (isDir && !slash)
      m += '/'
    else if (!isDir && slash)
      m = m.slice(0, -1)

    if (m !== p) {
      var mabs = makeAbs(self, m)
      self.statCache[mabs] = self.statCache[abs]
      self.cache[mabs] = self.cache[abs]
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f
  if (f.charAt(0) === '/') {
    abs = path.join(self.root, f)
  } else if (isAbsolute(f) || f === '') {
    abs = f
  } else if (self.changedCwd) {
    abs = path.resolve(self.cwd, f)
  } else {
    abs = path.resolve(f)
  }

  if (process.platform === 'win32')
    abs = abs.replace(/\\/g, '/')

  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}


/***/ }),
/* 31 */
/***/ (function(module, exports) {

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

var wrappy = __webpack_require__(31)
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const CDP = __webpack_require__(34);
const logger = __webpack_require__(22);
const Chrome = __webpack_require__(57);

/**
 * Orchestrate command line tools with ./index.js
 */

class Orchestrator {
  constructor({ parsers = {} }) {
    this.amazon = parsers.amazon;
    this.chrome = new Chrome({
      headless: true
    });
  }

  run() {
    return this.chrome.then((() => {
      var _ref = _asyncToGenerator(function* (chrome) {
        logger.log(`Chrome debuggable on port: ${chrome.port}`);
        const version = yield CDP.Version({ port: chrome.port });
        logger.log(version['User-Agent']);
        chrome.kill();
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    })());
  }
}

module.exports = Orchestrator;

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const EventEmitter = __webpack_require__(2);

const devtools = __webpack_require__(11);
const Chrome = __webpack_require__(37);

module.exports = function (options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }
    const notifier = new EventEmitter();
    if (typeof callback === 'function') {
        // allow to register the error callback later
        process.nextTick(function () {
            new Chrome(options, notifier);
        });
        return notifier.once('connect', callback);
    } else {
        return new Promise(function (fulfill, reject) {
            notifier.once('connect', fulfill);
            notifier.once('error', reject);
            new Chrome(options, notifier);
        });
    }
};

// for backward compatibility
module.exports.listTabs = devtools.List;
module.exports.spawnTab = devtools.New;
module.exports.closeTab = devtools.Close;

module.exports.Protocol = devtools.Protocol;
module.exports.List = devtools.List;
module.exports.New = devtools.New;
module.exports.Activate = devtools.Activate;
module.exports.Close = devtools.Close;
module.exports.Version = devtools.Version;


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const REQUEST_TIMEOUT = 10000;

// callback(err, data)
function externalRequest(transport, options, callback) {
    const request = transport.get(options, function (response) {
        let data = '';
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function () {
            if (response.statusCode === 200) {
                callback(null, data);
            } else {
                callback(new Error(data));
            }
        });
    });
    request.setTimeout(REQUEST_TIMEOUT, function () {
        this.abort();
    });
    request.on('error', function (err) {
        callback(err);
    });
}

module.exports = externalRequest;


/***/ }),
/* 36 */
/***/ (function(module, exports) {

module.exports = {"version":{"major":"1","minor":"2"},"domains":[{"domain":"Inspector","experimental":true,"types":[],"commands":[{"name":"enable","description":"Enables inspector domain notifications."},{"name":"disable","description":"Disables inspector domain notifications."}],"events":[{"name":"detached","description":"Fired when remote debugging connection is about to be terminated. Contains detach reason.","parameters":[{"name":"reason","type":"string","description":"The reason why connection has been terminated."}]},{"name":"targetCrashed","description":"Fired when debugging target has crashed"}]},{"domain":"Memory","experimental":true,"types":[{"id":"PressureLevel","type":"string","enum":["moderate","critical"],"description":"Memory pressure level."}],"commands":[{"name":"getDOMCounters","returns":[{"name":"documents","type":"integer"},{"name":"nodes","type":"integer"},{"name":"jsEventListeners","type":"integer"}]},{"name":"setPressureNotificationsSuppressed","description":"Enable/disable suppressing memory pressure notifications in all processes.","parameters":[{"name":"suppressed","type":"boolean","description":"If true, memory pressure notifications will be suppressed."}]},{"name":"simulatePressureNotification","description":"Simulate a memory pressure notification in all processes.","parameters":[{"name":"level","$ref":"PressureLevel","description":"Memory pressure level of the notification."}]}]},{"domain":"Page","description":"Actions and events related to the inspected page belong to the page domain.","dependencies":["Debugger","DOM","Network"],"types":[{"id":"ResourceType","type":"string","enum":["Document","Stylesheet","Image","Media","Font","Script","TextTrack","XHR","Fetch","EventSource","WebSocket","Manifest","Other"],"description":"Resource type as it was perceived by the rendering engine."},{"id":"FrameId","type":"string","description":"Unique frame identifier."},{"id":"Frame","type":"object","description":"Information about the Frame on the page.","properties":[{"name":"id","type":"string","description":"Frame unique identifier."},{"name":"parentId","type":"string","optional":true,"description":"Parent frame identifier."},{"name":"loaderId","$ref":"Network.LoaderId","description":"Identifier of the loader associated with this frame."},{"name":"name","type":"string","optional":true,"description":"Frame's name as specified in the tag."},{"name":"url","type":"string","description":"Frame document's URL."},{"name":"securityOrigin","type":"string","description":"Frame document's security origin."},{"name":"mimeType","type":"string","description":"Frame document's mimeType as determined by the browser."}]},{"id":"FrameResource","type":"object","description":"Information about the Resource on the page.","properties":[{"name":"url","type":"string","description":"Resource URL."},{"name":"type","$ref":"ResourceType","description":"Type of this resource."},{"name":"mimeType","type":"string","description":"Resource mimeType as determined by the browser."},{"name":"lastModified","$ref":"Network.TimeSinceEpoch","description":"last-modified timestamp as reported by server.","optional":true},{"name":"contentSize","type":"number","description":"Resource content size.","optional":true},{"name":"failed","type":"boolean","optional":true,"description":"True if the resource failed to load."},{"name":"canceled","type":"boolean","optional":true,"description":"True if the resource was canceled during loading."}],"experimental":true},{"id":"FrameResourceTree","type":"object","description":"Information about the Frame hierarchy along with their cached resources.","properties":[{"name":"frame","$ref":"Frame","description":"Frame information for this tree item."},{"name":"childFrames","type":"array","optional":true,"items":{"$ref":"FrameResourceTree"},"description":"Child frames."},{"name":"resources","type":"array","items":{"$ref":"FrameResource"},"description":"Information about frame resources."}],"experimental":true},{"id":"ScriptIdentifier","type":"string","description":"Unique script identifier.","experimental":true},{"id":"TransitionType","type":"string","description":"Transition type.","experimental":true,"enum":["link","typed","auto_bookmark","auto_subframe","manual_subframe","generated","auto_toplevel","form_submit","reload","keyword","keyword_generated","other"]},{"id":"NavigationEntry","type":"object","description":"Navigation history entry.","properties":[{"name":"id","type":"integer","description":"Unique id of the navigation history entry."},{"name":"url","type":"string","description":"URL of the navigation history entry."},{"name":"userTypedURL","type":"string","description":"URL that the user typed in the url bar."},{"name":"title","type":"string","description":"Title of the navigation history entry."},{"name":"transitionType","$ref":"TransitionType","description":"Transition type."}],"experimental":true},{"id":"ScreencastFrameMetadata","type":"object","description":"Screencast frame metadata.","properties":[{"name":"offsetTop","type":"number","experimental":true,"description":"Top offset in DIP."},{"name":"pageScaleFactor","type":"number","experimental":true,"description":"Page scale factor."},{"name":"deviceWidth","type":"number","experimental":true,"description":"Device screen width in DIP."},{"name":"deviceHeight","type":"number","experimental":true,"description":"Device screen height in DIP."},{"name":"scrollOffsetX","type":"number","experimental":true,"description":"Position of horizontal scroll in CSS pixels."},{"name":"scrollOffsetY","type":"number","experimental":true,"description":"Position of vertical scroll in CSS pixels."},{"name":"timestamp","$ref":"Network.TimeSinceEpoch","optional":true,"experimental":true,"description":"Frame swap timestamp."}],"experimental":true},{"id":"DialogType","description":"Javascript dialog type.","type":"string","enum":["alert","confirm","prompt","beforeunload"],"experimental":true},{"id":"AppManifestError","description":"Error while paring app manifest.","type":"object","properties":[{"name":"message","type":"string","description":"Error message."},{"name":"critical","type":"integer","description":"If criticial, this is a non-recoverable parse error."},{"name":"line","type":"integer","description":"Error line."},{"name":"column","type":"integer","description":"Error column."}],"experimental":true},{"id":"NavigationResponse","description":"Proceed: allow the navigation; Cancel: cancel the navigation; CancelAndIgnore: cancels the navigation and makes the requester of the navigation acts like the request was never made.","type":"string","enum":["Proceed","Cancel","CancelAndIgnore"],"experimental":true},{"id":"LayoutViewport","type":"object","description":"Layout viewport position and dimensions.","experimental":true,"properties":[{"name":"pageX","type":"integer","description":"Horizontal offset relative to the document (CSS pixels)."},{"name":"pageY","type":"integer","description":"Vertical offset relative to the document (CSS pixels)."},{"name":"clientWidth","type":"integer","description":"Width (CSS pixels), excludes scrollbar if present."},{"name":"clientHeight","type":"integer","description":"Height (CSS pixels), excludes scrollbar if present."}]},{"id":"VisualViewport","type":"object","description":"Visual viewport position, dimensions, and scale.","experimental":true,"properties":[{"name":"offsetX","type":"number","description":"Horizontal offset relative to the layout viewport (CSS pixels)."},{"name":"offsetY","type":"number","description":"Vertical offset relative to the layout viewport (CSS pixels)."},{"name":"pageX","type":"number","description":"Horizontal offset relative to the document (CSS pixels)."},{"name":"pageY","type":"number","description":"Vertical offset relative to the document (CSS pixels)."},{"name":"clientWidth","type":"number","description":"Width (CSS pixels), excludes scrollbar if present."},{"name":"clientHeight","type":"number","description":"Height (CSS pixels), excludes scrollbar if present."},{"name":"scale","type":"number","description":"Scale relative to the ideal viewport (size at width=device-width)."}]},{"id":"Viewport","type":"object","description":"Viewport for capturing screenshot.","experimental":true,"properties":[{"name":"x","type":"number","description":"X offset in CSS pixels."},{"name":"y","type":"number","description":"Y offset in CSS pixels"},{"name":"width","type":"number","description":"Rectangle width in CSS pixels"},{"name":"height","type":"number","description":"Rectangle height in CSS pixels"},{"name":"scale","type":"number","description":"Page scale factor."}]}],"commands":[{"name":"enable","description":"Enables page domain notifications."},{"name":"disable","description":"Disables page domain notifications."},{"name":"addScriptToEvaluateOnLoad","parameters":[{"name":"scriptSource","type":"string"}],"returns":[{"name":"identifier","$ref":"ScriptIdentifier","description":"Identifier of the added script."}],"deprecated":true,"description":"Deprecated, please use addScriptToEvaluateOnNewDocument instead.","experimental":true},{"name":"removeScriptToEvaluateOnLoad","parameters":[{"name":"identifier","$ref":"ScriptIdentifier"}],"deprecated":true,"description":"Deprecated, please use removeScriptToEvaluateOnNewDocument instead.","experimental":true},{"name":"addScriptToEvaluateOnNewDocument","parameters":[{"name":"source","type":"string"}],"returns":[{"name":"identifier","$ref":"ScriptIdentifier","description":"Identifier of the added script."}],"description":"Evaluates given script in every frame upon creation (before loading frame's scripts).","experimental":true},{"name":"removeScriptToEvaluateOnNewDocument","parameters":[{"name":"identifier","$ref":"ScriptIdentifier"}],"description":"Removes given script from the list.","experimental":true},{"name":"setAutoAttachToCreatedPages","parameters":[{"name":"autoAttach","type":"boolean","description":"If true, browser will open a new inspector window for every page created from this one."}],"description":"Controls whether browser will open a new inspector window for connected pages.","experimental":true},{"name":"reload","parameters":[{"name":"ignoreCache","type":"boolean","optional":true,"description":"If true, browser cache is ignored (as if the user pressed Shift+refresh)."},{"name":"scriptToEvaluateOnLoad","type":"string","optional":true,"description":"If set, the script will be injected into all frames of the inspected page after reload."}],"description":"Reloads given page optionally ignoring the cache."},{"name":"navigate","parameters":[{"name":"url","type":"string","description":"URL to navigate the page to."},{"name":"referrer","type":"string","optional":true,"experimental":true,"description":"Referrer URL."},{"name":"transitionType","$ref":"TransitionType","optional":true,"experimental":true,"description":"Intended transition type."}],"returns":[{"name":"frameId","$ref":"FrameId","experimental":true,"description":"Frame id that will be navigated."}],"description":"Navigates current page to the given URL."},{"name":"stopLoading","description":"Force the page stop all navigations and pending resource fetches.","experimental":true},{"name":"getNavigationHistory","returns":[{"name":"currentIndex","type":"integer","description":"Index of the current navigation history entry."},{"name":"entries","type":"array","items":{"$ref":"NavigationEntry"},"description":"Array of navigation history entries."}],"description":"Returns navigation history for the current page.","experimental":true},{"name":"navigateToHistoryEntry","parameters":[{"name":"entryId","type":"integer","description":"Unique id of the entry to navigate to."}],"description":"Navigates current page to the given history entry.","experimental":true},{"name":"getCookies","returns":[{"name":"cookies","type":"array","items":{"$ref":"Network.Cookie"},"description":"Array of cookie objects."}],"description":"Returns all browser cookies. Depending on the backend support, will return detailed cookie information in the <code>cookies</code> field.","experimental":true,"redirect":"Network"},{"name":"deleteCookie","parameters":[{"name":"cookieName","type":"string","description":"Name of the cookie to remove."},{"name":"url","type":"string","description":"URL to match cooke domain and path."}],"description":"Deletes browser cookie with given name, domain and path.","experimental":true,"redirect":"Network"},{"name":"getResourceTree","description":"Returns present frame / resource tree structure.","returns":[{"name":"frameTree","$ref":"FrameResourceTree","description":"Present frame / resource tree structure."}],"experimental":true},{"name":"getResourceContent","description":"Returns content of the given resource.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Frame id to get resource for."},{"name":"url","type":"string","description":"URL of the resource to get content for."}],"returns":[{"name":"content","type":"string","description":"Resource content."},{"name":"base64Encoded","type":"boolean","description":"True, if content was served as base64."}],"experimental":true},{"name":"searchInResource","description":"Searches for given string in resource content.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Frame id for resource to search in."},{"name":"url","type":"string","description":"URL of the resource to search in."},{"name":"query","type":"string","description":"String to search for."},{"name":"caseSensitive","type":"boolean","optional":true,"description":"If true, search is case sensitive."},{"name":"isRegex","type":"boolean","optional":true,"description":"If true, treats string parameter as regex."}],"returns":[{"name":"result","type":"array","items":{"$ref":"Debugger.SearchMatch"},"description":"List of search matches."}],"experimental":true},{"name":"setDocumentContent","description":"Sets given markup as the document's HTML.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Frame id to set HTML for."},{"name":"html","type":"string","description":"HTML content to set."}],"experimental":true},{"name":"setDeviceMetricsOverride","description":"Overrides the values of device screen dimensions (window.screen.width, window.screen.height, window.innerWidth, window.innerHeight, and \"device-width\"/\"device-height\"-related CSS media query results).","parameters":[{"name":"width","type":"integer","description":"Overriding width value in pixels (minimum 0, maximum 10000000). 0 disables the override."},{"name":"height","type":"integer","description":"Overriding height value in pixels (minimum 0, maximum 10000000). 0 disables the override."},{"name":"deviceScaleFactor","type":"number","description":"Overriding device scale factor value. 0 disables the override."},{"name":"mobile","type":"boolean","description":"Whether to emulate mobile device. This includes viewport meta tag, overlay scrollbars, text autosizing and more."},{"name":"fitWindow","type":"boolean","optional":true,"description":"Whether a view that exceeds the available browser window area should be scaled down to fit."},{"name":"scale","type":"number","optional":true,"description":"Scale to apply to resulting view image. Ignored in |fitWindow| mode."},{"name":"offsetX","type":"number","optional":true,"description":"X offset to shift resulting view image by. Ignored in |fitWindow| mode."},{"name":"offsetY","type":"number","optional":true,"description":"Y offset to shift resulting view image by. Ignored in |fitWindow| mode."},{"name":"screenWidth","type":"integer","optional":true,"description":"Overriding screen width value in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"screenHeight","type":"integer","optional":true,"description":"Overriding screen height value in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"positionX","type":"integer","optional":true,"description":"Overriding view X position on screen in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"positionY","type":"integer","optional":true,"description":"Overriding view Y position on screen in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"screenOrientation","$ref":"Emulation.ScreenOrientation","optional":true,"description":"Screen orientation override."}],"redirect":"Emulation","experimental":true},{"name":"clearDeviceMetricsOverride","description":"Clears the overriden device metrics.","redirect":"Emulation","experimental":true},{"name":"setGeolocationOverride","description":"Overrides the Geolocation Position or Error. Omitting any of the parameters emulates position unavailable.","parameters":[{"name":"latitude","type":"number","optional":true,"description":"Mock latitude"},{"name":"longitude","type":"number","optional":true,"description":"Mock longitude"},{"name":"accuracy","type":"number","optional":true,"description":"Mock accuracy"}],"redirect":"Emulation"},{"name":"clearGeolocationOverride","description":"Clears the overriden Geolocation Position and Error.","redirect":"Emulation"},{"name":"setDeviceOrientationOverride","description":"Overrides the Device Orientation.","parameters":[{"name":"alpha","type":"number","description":"Mock alpha"},{"name":"beta","type":"number","description":"Mock beta"},{"name":"gamma","type":"number","description":"Mock gamma"}],"redirect":"DeviceOrientation","experimental":true},{"name":"clearDeviceOrientationOverride","description":"Clears the overridden Device Orientation.","redirect":"DeviceOrientation","experimental":true},{"name":"setTouchEmulationEnabled","parameters":[{"name":"enabled","type":"boolean","description":"Whether the touch event emulation should be enabled."},{"name":"configuration","type":"string","enum":["mobile","desktop"],"optional":true,"description":"Touch/gesture events configuration. Default: current platform."}],"description":"Toggles mouse event-based touch event emulation.","experimental":true,"redirect":"Emulation"},{"name":"captureScreenshot","description":"Capture page screenshot.","parameters":[{"name":"format","type":"string","optional":true,"enum":["jpeg","png"],"description":"Image compression format (defaults to png)."},{"name":"quality","type":"integer","optional":true,"description":"Compression quality from range [0..100] (jpeg only)."},{"name":"clip","$ref":"Viewport","optional":true,"description":"Capture the screenshot of a given region only.","experimental":true},{"name":"fromSurface","type":"boolean","optional":true,"description":"Capture the screenshot from the surface, rather than the view. Defaults to true.","experimental":true}],"returns":[{"name":"data","type":"string","description":"Base64-encoded image data."}],"experimental":true},{"name":"printToPDF","description":"Print page as PDF.","parameters":[{"name":"landscape","type":"boolean","optional":true,"description":"Paper orientation. Defaults to false."},{"name":"displayHeaderFooter","type":"boolean","optional":true,"description":"Display header and footer. Defaults to false."},{"name":"printBackground","type":"boolean","optional":true,"description":"Print background graphics. Defaults to false."},{"name":"scale","type":"number","optional":true,"description":"Scale of the webpage rendering. Defaults to 1."},{"name":"paperWidth","type":"number","optional":true,"description":"Paper width in inches. Defaults to 8.5 inches."},{"name":"paperHeight","type":"number","optional":true,"description":"Paper height in inches. Defaults to 11 inches."},{"name":"marginTop","type":"number","optional":true,"description":"Top margin in inches. Defaults to 1cm (~0.4 inches)."},{"name":"marginBottom","type":"number","optional":true,"description":"Bottom margin in inches. Defaults to 1cm (~0.4 inches)."},{"name":"marginLeft","type":"number","optional":true,"description":"Left margin in inches. Defaults to 1cm (~0.4 inches)."},{"name":"marginRight","type":"number","optional":true,"description":"Right margin in inches. Defaults to 1cm (~0.4 inches)."},{"name":"pageRanges","type":"string","optional":true,"description":"Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means print all pages."}],"returns":[{"name":"data","type":"string","description":"Base64-encoded pdf data."}],"experimental":true},{"name":"startScreencast","description":"Starts sending each frame using the <code>screencastFrame</code> event.","parameters":[{"name":"format","type":"string","optional":true,"enum":["jpeg","png"],"description":"Image compression format."},{"name":"quality","type":"integer","optional":true,"description":"Compression quality from range [0..100]."},{"name":"maxWidth","type":"integer","optional":true,"description":"Maximum screenshot width."},{"name":"maxHeight","type":"integer","optional":true,"description":"Maximum screenshot height."},{"name":"everyNthFrame","type":"integer","optional":true,"description":"Send every n-th frame."}],"experimental":true},{"name":"stopScreencast","description":"Stops sending each frame in the <code>screencastFrame</code>.","experimental":true},{"name":"screencastFrameAck","description":"Acknowledges that a screencast frame has been received by the frontend.","parameters":[{"name":"sessionId","type":"integer","description":"Frame number."}],"experimental":true},{"name":"handleJavaScriptDialog","description":"Accepts or dismisses a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload).","parameters":[{"name":"accept","type":"boolean","description":"Whether to accept or dismiss the dialog."},{"name":"promptText","type":"string","optional":true,"description":"The text to enter into the dialog prompt before accepting. Used only if this is a prompt dialog."}]},{"name":"getAppManifest","experimental":true,"returns":[{"name":"url","type":"string","description":"Manifest location."},{"name":"errors","type":"array","items":{"$ref":"AppManifestError"}},{"name":"data","type":"string","optional":true,"description":"Manifest content."}]},{"name":"requestAppBanner","experimental":true},{"name":"setControlNavigations","parameters":[{"name":"enabled","type":"boolean"}],"description":"Toggles navigation throttling which allows programatic control over navigation and redirect response.","experimental":true},{"name":"processNavigation","parameters":[{"name":"response","$ref":"NavigationResponse"},{"name":"navigationId","type":"integer"}],"description":"Should be sent in response to a navigationRequested or a redirectRequested event, telling the browser how to handle the navigation.","experimental":true},{"name":"getLayoutMetrics","description":"Returns metrics relating to the layouting of the page, such as viewport bounds/scale.","experimental":true,"returns":[{"name":"layoutViewport","$ref":"LayoutViewport","description":"Metrics relating to the layout viewport."},{"name":"visualViewport","$ref":"VisualViewport","description":"Metrics relating to the visual viewport."},{"name":"contentSize","$ref":"DOM.Rect","description":"Size of scrollable area."}]},{"name":"createIsolatedWorld","description":"Creates an isolated world for the given frame.","experimental":true,"parameters":[{"name":"frameId","$ref":"FrameId","description":"Id of the frame in which the isolated world should be created."},{"name":"worldName","type":"string","optional":true,"description":"An optional name which is reported in the Execution Context."},{"name":"grantUniveralAccess","type":"boolean","optional":true,"description":"Whether or not universal access should be granted to the isolated world. This is a powerful option, use with caution."}],"returns":[{"name":"executionContextId","$ref":"Runtime.ExecutionContextId","description":"Execution context of the isolated world."}]}],"events":[{"name":"domContentEventFired","parameters":[{"name":"timestamp","$ref":"Network.MonotonicTime"}]},{"name":"loadEventFired","parameters":[{"name":"timestamp","$ref":"Network.MonotonicTime"}]},{"name":"frameAttached","description":"Fired when frame has been attached to its parent.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Id of the frame that has been attached."},{"name":"parentFrameId","$ref":"FrameId","description":"Parent frame identifier."},{"name":"stack","$ref":"Runtime.StackTrace","optional":true,"description":"JavaScript stack trace of when frame was attached, only set if frame initiated from script.","experimental":true}]},{"name":"frameNavigated","description":"Fired once navigation of the frame has completed. Frame is now associated with the new loader.","parameters":[{"name":"frame","$ref":"Frame","description":"Frame object."}]},{"name":"frameDetached","description":"Fired when frame has been detached from its parent.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Id of the frame that has been detached."}]},{"name":"frameStartedLoading","description":"Fired when frame has started loading.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Id of the frame that has started loading."}],"experimental":true},{"name":"frameStoppedLoading","description":"Fired when frame has stopped loading.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Id of the frame that has stopped loading."}],"experimental":true},{"name":"frameScheduledNavigation","description":"Fired when frame schedules a potential navigation.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Id of the frame that has scheduled a navigation."},{"name":"delay","type":"number","description":"Delay (in seconds) until the navigation is scheduled to begin. The navigation is not guaranteed to start."}],"experimental":true},{"name":"frameClearedScheduledNavigation","description":"Fired when frame no longer has a scheduled navigation.","parameters":[{"name":"frameId","$ref":"FrameId","description":"Id of the frame that has cleared its scheduled navigation."}],"experimental":true},{"name":"frameResized","experimental":true},{"name":"javascriptDialogOpening","description":"Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) is about to open.","parameters":[{"name":"message","type":"string","description":"Message that will be displayed by the dialog."},{"name":"type","$ref":"DialogType","description":"Dialog type."}]},{"name":"javascriptDialogClosed","description":"Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) has been closed.","parameters":[{"name":"result","type":"boolean","description":"Whether dialog was confirmed."}]},{"name":"screencastFrame","description":"Compressed image data requested by the <code>startScreencast</code>.","parameters":[{"name":"data","type":"string","description":"Base64-encoded compressed image."},{"name":"metadata","$ref":"ScreencastFrameMetadata","description":"Screencast frame metadata."},{"name":"sessionId","type":"integer","description":"Frame number."}],"experimental":true},{"name":"screencastVisibilityChanged","description":"Fired when the page with currently enabled screencast was shown or hidden </code>.","parameters":[{"name":"visible","type":"boolean","description":"True if the page is visible."}],"experimental":true},{"name":"interstitialShown","description":"Fired when interstitial page was shown"},{"name":"interstitialHidden","description":"Fired when interstitial page was hidden"},{"name":"navigationRequested","description":"Fired when a navigation is started if navigation throttles are enabled.  The navigation will be deferred until processNavigation is called.","parameters":[{"name":"isInMainFrame","type":"boolean","description":"Whether the navigation is taking place in the main frame or in a subframe."},{"name":"isRedirect","type":"boolean","description":"Whether the navigation has encountered a server redirect or not."},{"name":"navigationId","type":"integer"},{"name":"url","type":"string","description":"URL of requested navigation."}]}]},{"domain":"Overlay","description":"This domain provides various functionality related to drawing atop the inspected page.","dependencies":["DOM","Page","Runtime"],"experimental":true,"types":[{"id":"HighlightConfig","type":"object","properties":[{"name":"showInfo","type":"boolean","optional":true,"description":"Whether the node info tooltip should be shown (default: false)."},{"name":"showRulers","type":"boolean","optional":true,"description":"Whether the rulers should be shown (default: false)."},{"name":"showExtensionLines","type":"boolean","optional":true,"description":"Whether the extension lines from node to the rulers should be shown (default: false)."},{"name":"displayAsMaterial","type":"boolean","optional":true},{"name":"contentColor","$ref":"DOM.RGBA","optional":true,"description":"The content box highlight fill color (default: transparent)."},{"name":"paddingColor","$ref":"DOM.RGBA","optional":true,"description":"The padding highlight fill color (default: transparent)."},{"name":"borderColor","$ref":"DOM.RGBA","optional":true,"description":"The border highlight fill color (default: transparent)."},{"name":"marginColor","$ref":"DOM.RGBA","optional":true,"description":"The margin highlight fill color (default: transparent)."},{"name":"eventTargetColor","$ref":"DOM.RGBA","optional":true,"description":"The event target element highlight fill color (default: transparent)."},{"name":"shapeColor","$ref":"DOM.RGBA","optional":true,"description":"The shape outside fill color (default: transparent)."},{"name":"shapeMarginColor","$ref":"DOM.RGBA","optional":true,"description":"The shape margin fill color (default: transparent)."},{"name":"selectorList","type":"string","optional":true,"description":"Selectors to highlight relevant nodes."}],"description":"Configuration data for the highlighting of page elements."},{"id":"InspectMode","type":"string","enum":["searchForNode","searchForUAShadowDOM","none"]}],"commands":[{"name":"enable","description":"Enables domain notifications."},{"name":"disable","description":"Disables domain notifications."},{"name":"setShowPaintRects","description":"Requests that backend shows paint rectangles","parameters":[{"name":"result","type":"boolean","description":"True for showing paint rectangles"}]},{"name":"setShowDebugBorders","description":"Requests that backend shows debug borders on layers","parameters":[{"name":"show","type":"boolean","description":"True for showing debug borders"}]},{"name":"setShowFPSCounter","description":"Requests that backend shows the FPS counter","parameters":[{"name":"show","type":"boolean","description":"True for showing the FPS counter"}]},{"name":"setShowScrollBottleneckRects","description":"Requests that backend shows scroll bottleneck rects","parameters":[{"name":"show","type":"boolean","description":"True for showing scroll bottleneck rects"}]},{"name":"setShowViewportSizeOnResize","description":"Paints viewport size upon main frame resize.","parameters":[{"name":"show","type":"boolean","description":"Whether to paint size or not."}]},{"name":"setPausedInDebuggerMessage","parameters":[{"name":"message","type":"string","optional":true,"description":"The message to display, also triggers resume and step over controls."}]},{"name":"setSuspended","parameters":[{"name":"suspended","type":"boolean","description":"Whether overlay should be suspended and not consume any resources until resumed."}]},{"name":"setInspectMode","description":"Enters the 'inspect' mode. In this mode, elements that user is hovering over are highlighted. Backend then generates 'inspectNodeRequested' event upon element selection.","parameters":[{"name":"mode","$ref":"InspectMode","description":"Set an inspection mode."},{"name":"highlightConfig","$ref":"HighlightConfig","optional":true,"description":"A descriptor for the highlight appearance of hovered-over nodes. May be omitted if <code>enabled == false</code>."}]},{"name":"highlightRect","description":"Highlights given rectangle. Coordinates are absolute with respect to the main frame viewport.","parameters":[{"name":"x","type":"integer","description":"X coordinate"},{"name":"y","type":"integer","description":"Y coordinate"},{"name":"width","type":"integer","description":"Rectangle width"},{"name":"height","type":"integer","description":"Rectangle height"},{"name":"color","$ref":"DOM.RGBA","optional":true,"description":"The highlight fill color (default: transparent)."},{"name":"outlineColor","$ref":"DOM.RGBA","optional":true,"description":"The highlight outline color (default: transparent)."}]},{"name":"highlightQuad","description":"Highlights given quad. Coordinates are absolute with respect to the main frame viewport.","parameters":[{"name":"quad","$ref":"DOM.Quad","description":"Quad to highlight"},{"name":"color","$ref":"DOM.RGBA","optional":true,"description":"The highlight fill color (default: transparent)."},{"name":"outlineColor","$ref":"DOM.RGBA","optional":true,"description":"The highlight outline color (default: transparent)."}]},{"name":"highlightNode","description":"Highlights DOM node with given id or with the given JavaScript object wrapper. Either nodeId or objectId must be specified.","parameters":[{"name":"highlightConfig","$ref":"HighlightConfig","description":"A descriptor for the highlight appearance."},{"name":"nodeId","$ref":"DOM.NodeId","optional":true,"description":"Identifier of the node to highlight."},{"name":"backendNodeId","$ref":"DOM.BackendNodeId","optional":true,"description":"Identifier of the backend node to highlight."},{"name":"objectId","$ref":"Runtime.RemoteObjectId","optional":true,"description":"JavaScript object id of the node to be highlighted."}]},{"name":"highlightFrame","description":"Highlights owner element of the frame with given id.","parameters":[{"name":"frameId","$ref":"Page.FrameId","description":"Identifier of the frame to highlight."},{"name":"contentColor","$ref":"DOM.RGBA","optional":true,"description":"The content box highlight fill color (default: transparent)."},{"name":"contentOutlineColor","$ref":"DOM.RGBA","optional":true,"description":"The content box highlight outline color (default: transparent)."}]},{"name":"hideHighlight","description":"Hides any highlight."},{"name":"getHighlightObjectForTest","description":"For testing.","parameters":[{"name":"nodeId","$ref":"DOM.NodeId","description":"Id of the node to get highlight object for."}],"returns":[{"name":"highlight","type":"object","description":"Highlight data for the node."}]}],"events":[{"name":"nodeHighlightRequested","description":"Fired when the node should be highlighted. This happens after call to <code>setInspectMode</code>.","parameters":[{"name":"nodeId","$ref":"DOM.NodeId"}]},{"name":"inspectNodeRequested","description":"Fired when the node should be inspected. This happens after call to <code>setInspectMode</code> or when user manually inspects an element.","parameters":[{"name":"backendNodeId","$ref":"DOM.BackendNodeId","description":"Id of the node to inspect."}]}]},{"domain":"Emulation","description":"This domain emulates different environments for the page.","dependencies":["DOM"],"types":[{"id":"ScreenOrientation","type":"object","description":"Screen orientation.","properties":[{"name":"type","type":"string","enum":["portraitPrimary","portraitSecondary","landscapePrimary","landscapeSecondary"],"description":"Orientation type."},{"name":"angle","type":"integer","description":"Orientation angle."}]},{"id":"VirtualTimePolicy","type":"string","enum":["advance","pause","pauseIfNetworkFetchesPending"],"experimental":true,"description":"advance: If the scheduler runs out of immediate work, the virtual time base may fast forward to allow the next delayed task (if any) to run; pause: The virtual time base may not advance; pauseIfNetworkFetchesPending: The virtual time base may not advance if there are any pending resource fetches."}],"commands":[{"name":"setDeviceMetricsOverride","description":"Overrides the values of device screen dimensions (window.screen.width, window.screen.height, window.innerWidth, window.innerHeight, and \"device-width\"/\"device-height\"-related CSS media query results).","parameters":[{"name":"width","type":"integer","description":"Overriding width value in pixels (minimum 0, maximum 10000000). 0 disables the override."},{"name":"height","type":"integer","description":"Overriding height value in pixels (minimum 0, maximum 10000000). 0 disables the override."},{"name":"deviceScaleFactor","type":"number","description":"Overriding device scale factor value. 0 disables the override."},{"name":"mobile","type":"boolean","description":"Whether to emulate mobile device. This includes viewport meta tag, overlay scrollbars, text autosizing and more."},{"name":"fitWindow","type":"boolean","optional":true,"description":"Whether a view that exceeds the available browser window area should be scaled down to fit."},{"name":"scale","type":"number","optional":true,"experimental":true,"description":"Scale to apply to resulting view image. Ignored in |fitWindow| mode."},{"name":"offsetX","type":"number","optional":true,"deprecated":true,"experimental":true,"description":"Not used."},{"name":"offsetY","type":"number","optional":true,"deprecated":true,"experimental":true,"description":"Not used."},{"name":"screenWidth","type":"integer","optional":true,"experimental":true,"description":"Overriding screen width value in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"screenHeight","type":"integer","optional":true,"experimental":true,"description":"Overriding screen height value in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"positionX","type":"integer","optional":true,"experimental":true,"description":"Overriding view X position on screen in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"positionY","type":"integer","optional":true,"experimental":true,"description":"Overriding view Y position on screen in pixels (minimum 0, maximum 10000000). Only used for |mobile==true|."},{"name":"screenOrientation","$ref":"ScreenOrientation","optional":true,"description":"Screen orientation override."}]},{"name":"clearDeviceMetricsOverride","description":"Clears the overriden device metrics."},{"name":"resetPageScaleFactor","experimental":true,"description":"Requests that page scale factor is reset to initial values."},{"name":"setPageScaleFactor","description":"Sets a specified page scale factor.","experimental":true,"parameters":[{"name":"pageScaleFactor","type":"number","description":"Page scale factor."}]},{"name":"setVisibleSize","description":"Deprecated, does nothing. Please use setDeviceMetricsOverride instead.","experimental":true,"deprecated":true,"parameters":[{"name":"width","type":"integer","description":"Frame width (DIP)."},{"name":"height","type":"integer","description":"Frame height (DIP)."}]},{"name":"setScriptExecutionDisabled","description":"Switches script execution in the page.","experimental":true,"parameters":[{"name":"value","type":"boolean","description":"Whether script execution should be disabled in the page."}]},{"name":"setGeolocationOverride","description":"Overrides the Geolocation Position or Error. Omitting any of the parameters emulates position unavailable.","experimental":true,"parameters":[{"name":"latitude","type":"number","optional":true,"description":"Mock latitude"},{"name":"longitude","type":"number","optional":true,"description":"Mock longitude"},{"name":"accuracy","type":"number","optional":true,"description":"Mock accuracy"}]},{"name":"clearGeolocationOverride","description":"Clears the overriden Geolocation Position and Error.","experimental":true},{"name":"setTouchEmulationEnabled","parameters":[{"name":"enabled","type":"boolean","description":"Whether the touch event emulation should be enabled."},{"name":"configuration","type":"string","enum":["mobile","desktop"],"optional":true,"description":"Touch/gesture events configuration. Default: current platform."}],"description":"Toggles mouse event-based touch event emulation."},{"name":"setEmulatedMedia","parameters":[{"name":"media","type":"string","description":"Media type to emulate. Empty string disables the override."}],"description":"Emulates the given media for CSS media queries."},{"name":"setCPUThrottlingRate","parameters":[{"name":"rate","type":"number","description":"Throttling rate as a slowdown factor (1 is no throttle, 2 is 2x slowdown, etc)."}],"experimental":true,"description":"Enables CPU throttling to emulate slow CPUs."},{"name":"canEmulate","description":"Tells whether emulation is supported.","returns":[{"name":"result","type":"boolean","description":"True if emulation is supported."}],"experimental":true},{"name":"setVirtualTimePolicy","description":"Turns on virtual time for all frames (replacing real-time with a synthetic time source) and sets the current virtual time policy.  Note this supersedes any previous time budget.","parameters":[{"name":"policy","$ref":"VirtualTimePolicy"},{"name":"budget","type":"integer","optional":true,"description":"If set, after this many virtual milliseconds have elapsed virtual time will be paused and a virtualTimeBudgetExpired event is sent."}],"experimental":true},{"name":"setDefaultBackgroundColorOverride","description":"Sets or clears an override of the default background color of the frame. This override is used if the content does not specify one.","parameters":[{"name":"color","$ref":"DOM.RGBA","optional":true,"description":"RGBA of the default background color. If not specified, any existing override will be cleared."}],"experimental":true}],"events":[{"name":"virtualTimeBudgetExpired","experimental":true,"description":"Notification sent after the virual time budget for the current VirtualTimePolicy has run out."}]},{"domain":"Security","description":"Security","experimental":true,"types":[{"id":"CertificateId","type":"integer","description":"An internal certificate ID value."},{"id":"MixedContentType","type":"string","enum":["blockable","optionally-blockable","none"],"description":"A description of mixed content (HTTP resources on HTTPS pages), as defined by https://www.w3.org/TR/mixed-content/#categories"},{"id":"SecurityState","type":"string","enum":["unknown","neutral","insecure","warning","secure","info"],"description":"The security level of a page or resource."},{"id":"SecurityStateExplanation","type":"object","properties":[{"name":"securityState","$ref":"SecurityState","description":"Security state representing the severity of the factor being explained."},{"name":"summary","type":"string","description":"Short phrase describing the type of factor."},{"name":"description","type":"string","description":"Full text explanation of the factor."},{"name":"hasCertificate","type":"boolean","description":"True if the page has a certificate."},{"name":"mixedContentType","$ref":"MixedContentType","description":"The type of mixed content described by the explanation."}],"description":"An explanation of an factor contributing to the security state."},{"id":"InsecureContentStatus","type":"object","properties":[{"name":"ranMixedContent","type":"boolean","description":"True if the page was loaded over HTTPS and ran mixed (HTTP) content such as scripts."},{"name":"displayedMixedContent","type":"boolean","description":"True if the page was loaded over HTTPS and displayed mixed (HTTP) content such as images."},{"name":"containedMixedForm","type":"boolean","description":"True if the page was loaded over HTTPS and contained a form targeting an insecure url."},{"name":"ranContentWithCertErrors","type":"boolean","description":"True if the page was loaded over HTTPS without certificate errors, and ran content such as scripts that were loaded with certificate errors."},{"name":"displayedContentWithCertErrors","type":"boolean","description":"True if the page was loaded over HTTPS without certificate errors, and displayed content such as images that were loaded with certificate errors."},{"name":"ranInsecureContentStyle","$ref":"SecurityState","description":"Security state representing a page that ran insecure content."},{"name":"displayedInsecureContentStyle","$ref":"SecurityState","description":"Security state representing a page that displayed insecure content."}],"description":"Information about insecure content on the page."},{"id":"CertificateErrorAction","type":"string","enum":["continue","cancel"],"description":"The action to take when a certificate error occurs. continue will continue processing the request and cancel will cancel the request."}],"commands":[{"name":"enable","description":"Enables tracking security state changes."},{"name":"disable","description":"Disables tracking security state changes."},{"name":"showCertificateViewer","description":"Displays native dialog with the certificate details."},{"name":"handleCertificateError","description":"Handles a certificate error that fired a certificateError event.","parameters":[{"name":"eventId","type":"integer","description":"The ID of the event."},{"name":"action","$ref":"CertificateErrorAction","description":"The action to take on the certificate error."}]},{"name":"setOverrideCertificateErrors","description":"Enable/disable overriding certificate errors. If enabled, all certificate error events need to be handled by the DevTools client and should be answered with handleCertificateError commands.","parameters":[{"name":"override","type":"boolean","description":"If true, certificate errors will be overridden."}]}],"events":[{"name":"securityStateChanged","description":"The security state of the page changed.","parameters":[{"name":"securityState","$ref":"SecurityState","description":"Security state."},{"name":"schemeIsCryptographic","type":"boolean","description":"True if the page was loaded over cryptographic transport such as HTTPS."},{"name":"explanations","type":"array","items":{"$ref":"SecurityStateExplanation"},"description":"List of explanations for the security state. If the overall security state is `insecure` or `warning`, at least one corresponding explanation should be included."},{"name":"insecureContentStatus","$ref":"InsecureContentStatus","description":"Information about insecure content on the page."},{"name":"summary","type":"string","description":"Overrides user-visible description of the state.","optional":true}]},{"name":"certificateError","description":"There is a certificate error. If overriding certificate errors is enabled, then it should be handled with the handleCertificateError command. Note: this event does not fire if the certificate error has been allowed internally.","parameters":[{"name":"eventId","type":"integer","description":"The ID of the event."},{"name":"errorType","type":"string","description":"The type of the error."},{"name":"requestURL","type":"string","description":"The url that was requested."}]}]},{"domain":"Network","description":"Network domain allows tracking network activities of the page. It exposes information about http, file, data and other requests and responses, their headers, bodies, timing, etc.","dependencies":["Runtime","Security"],"types":[{"id":"LoaderId","type":"string","description":"Unique loader identifier."},{"id":"RequestId","type":"string","description":"Unique request identifier."},{"id":"InterceptionId","type":"string","description":"Unique intercepted request identifier."},{"id":"ErrorReason","type":"string","enum":["Failed","Aborted","TimedOut","AccessDenied","ConnectionClosed","ConnectionReset","ConnectionRefused","ConnectionAborted","ConnectionFailed","NameNotResolved","InternetDisconnected","AddressUnreachable"],"description":"Network level fetch failure reason."},{"id":"TimeSinceEpoch","type":"number","description":"UTC time in seconds, counted from January 1, 1970."},{"id":"MonotonicTime","type":"number","description":"Monotonically increasing time in seconds since an arbitrary point in the past."},{"id":"Headers","type":"object","description":"Request / response headers as keys / values of JSON object."},{"id":"ConnectionType","type":"string","enum":["none","cellular2g","cellular3g","cellular4g","bluetooth","ethernet","wifi","wimax","other"],"description":"Loading priority of a resource request."},{"id":"CookieSameSite","type":"string","enum":["Strict","Lax"],"description":"Represents the cookie's 'SameSite' status: https://tools.ietf.org/html/draft-west-first-party-cookies"},{"id":"ResourceTiming","type":"object","description":"Timing information for the request.","properties":[{"name":"requestTime","type":"number","description":"Timing's requestTime is a baseline in seconds, while the other numbers are ticks in milliseconds relatively to this requestTime."},{"name":"proxyStart","type":"number","description":"Started resolving proxy."},{"name":"proxyEnd","type":"number","description":"Finished resolving proxy."},{"name":"dnsStart","type":"number","description":"Started DNS address resolve."},{"name":"dnsEnd","type":"number","description":"Finished DNS address resolve."},{"name":"connectStart","type":"number","description":"Started connecting to the remote host."},{"name":"connectEnd","type":"number","description":"Connected to the remote host."},{"name":"sslStart","type":"number","description":"Started SSL handshake."},{"name":"sslEnd","type":"number","description":"Finished SSL handshake."},{"name":"workerStart","type":"number","description":"Started running ServiceWorker.","experimental":true},{"name":"workerReady","type":"number","description":"Finished Starting ServiceWorker.","experimental":true},{"name":"sendStart","type":"number","description":"Started sending request."},{"name":"sendEnd","type":"number","description":"Finished sending request."},{"name":"pushStart","type":"number","description":"Time the server started pushing request.","experimental":true},{"name":"pushEnd","type":"number","description":"Time the server finished pushing request.","experimental":true},{"name":"receiveHeadersEnd","type":"number","description":"Finished receiving response headers."}]},{"id":"ResourcePriority","type":"string","enum":["VeryLow","Low","Medium","High","VeryHigh"],"description":"Loading priority of a resource request."},{"id":"Request","type":"object","description":"HTTP request data.","properties":[{"name":"url","type":"string","description":"Request URL."},{"name":"method","type":"string","description":"HTTP request method."},{"name":"headers","$ref":"Headers","description":"HTTP request headers."},{"name":"postData","type":"string","optional":true,"description":"HTTP POST request data."},{"name":"mixedContentType","$ref":"Security.MixedContentType","optional":true,"description":"The mixed content type of the request."},{"name":"initialPriority","$ref":"ResourcePriority","description":"Priority of the resource request at the time request is sent."},{"name":"referrerPolicy","type":"string","enum":["unsafe-url","no-referrer-when-downgrade","no-referrer","origin","origin-when-cross-origin","same-origin","strict-origin","strict-origin-when-cross-origin"],"description":"The referrer policy of the request, as defined in https://www.w3.org/TR/referrer-policy/"},{"name":"isLinkPreload","type":"boolean","optional":true,"description":"Whether is loaded via link preload."}]},{"id":"SignedCertificateTimestamp","type":"object","description":"Details of a signed certificate timestamp (SCT).","properties":[{"name":"status","type":"string","description":"Validation status."},{"name":"origin","type":"string","description":"Origin."},{"name":"logDescription","type":"string","description":"Log name / description."},{"name":"logId","type":"string","description":"Log ID."},{"name":"timestamp","$ref":"TimeSinceEpoch","description":"Issuance date."},{"name":"hashAlgorithm","type":"string","description":"Hash algorithm."},{"name":"signatureAlgorithm","type":"string","description":"Signature algorithm."},{"name":"signatureData","type":"string","description":"Signature data."}]},{"id":"SecurityDetails","type":"object","description":"Security details about a request.","properties":[{"name":"protocol","type":"string","description":"Protocol name (e.g. \"TLS 1.2\" or \"QUIC\")."},{"name":"keyExchange","type":"string","description":"Key Exchange used by the connection, or the empty string if not applicable."},{"name":"keyExchangeGroup","type":"string","optional":true,"description":"(EC)DH group used by the connection, if applicable."},{"name":"cipher","type":"string","description":"Cipher name."},{"name":"mac","type":"string","optional":true,"description":"TLS MAC. Note that AEAD ciphers do not have separate MACs."},{"name":"certificateId","$ref":"Security.CertificateId","description":"Certificate ID value."},{"name":"subjectName","type":"string","description":"Certificate subject name."},{"name":"sanList","type":"array","items":{"type":"string"},"description":"Subject Alternative Name (SAN) DNS names and IP addresses."},{"name":"issuer","type":"string","description":"Name of the issuing CA."},{"name":"validFrom","$ref":"TimeSinceEpoch","description":"Certificate valid from date."},{"name":"validTo","$ref":"TimeSinceEpoch","description":"Certificate valid to (expiration) date"},{"name":"signedCertificateTimestampList","type":"array","items":{"$ref":"SignedCertificateTimestamp"},"description":"List of signed certificate timestamps (SCTs)."}]},{"id":"BlockedReason","type":"string","description":"The reason why request was blocked.","enum":["csp","mixed-content","origin","inspector","subresource-filter","other"],"experimental":true},{"id":"Response","type":"object","description":"HTTP response data.","properties":[{"name":"url","type":"string","description":"Response URL. This URL can be different from CachedResource.url in case of redirect."},{"name":"status","type":"number","description":"HTTP response status code."},{"name":"statusText","type":"string","description":"HTTP response status text."},{"name":"headers","$ref":"Headers","description":"HTTP response headers."},{"name":"headersText","type":"string","optional":true,"description":"HTTP response headers text."},{"name":"mimeType","type":"string","description":"Resource mimeType as determined by the browser."},{"name":"requestHeaders","$ref":"Headers","optional":true,"description":"Refined HTTP request headers that were actually transmitted over the network."},{"name":"requestHeadersText","type":"string","optional":true,"description":"HTTP request headers text."},{"name":"connectionReused","type":"boolean","description":"Specifies whether physical connection was actually reused for this request."},{"name":"connectionId","type":"number","description":"Physical connection id that was actually used for this request."},{"name":"remoteIPAddress","type":"string","optional":true,"experimental":true,"description":"Remote IP address."},{"name":"remotePort","type":"integer","optional":true,"experimental":true,"description":"Remote port."},{"name":"fromDiskCache","type":"boolean","optional":true,"description":"Specifies that the request was served from the disk cache."},{"name":"fromServiceWorker","type":"boolean","optional":true,"description":"Specifies that the request was served from the ServiceWorker."},{"name":"encodedDataLength","type":"number","optional":false,"description":"Total number of bytes received for this request so far."},{"name":"timing","$ref":"ResourceTiming","optional":true,"description":"Timing information for the given request."},{"name":"protocol","type":"string","optional":true,"description":"Protocol used to fetch this request."},{"name":"securityState","$ref":"Security.SecurityState","description":"Security state of the request resource."},{"name":"securityDetails","$ref":"SecurityDetails","optional":true,"description":"Security details for the request."}]},{"id":"WebSocketRequest","type":"object","description":"WebSocket request data.","experimental":true,"properties":[{"name":"headers","$ref":"Headers","description":"HTTP request headers."}]},{"id":"WebSocketResponse","type":"object","description":"WebSocket response data.","experimental":true,"properties":[{"name":"status","type":"number","description":"HTTP response status code."},{"name":"statusText","type":"string","description":"HTTP response status text."},{"name":"headers","$ref":"Headers","description":"HTTP response headers."},{"name":"headersText","type":"string","optional":true,"description":"HTTP response headers text."},{"name":"requestHeaders","$ref":"Headers","optional":true,"description":"HTTP request headers."},{"name":"requestHeadersText","type":"string","optional":true,"description":"HTTP request headers text."}]},{"id":"WebSocketFrame","type":"object","description":"WebSocket frame data.","experimental":true,"properties":[{"name":"opcode","type":"number","description":"WebSocket frame opcode."},{"name":"mask","type":"boolean","description":"WebSocke frame mask."},{"name":"payloadData","type":"string","description":"WebSocke frame payload data."}]},{"id":"CachedResource","type":"object","description":"Information about the cached resource.","properties":[{"name":"url","type":"string","description":"Resource URL. This is the url of the original network request."},{"name":"type","$ref":"Page.ResourceType","description":"Type of this resource."},{"name":"response","$ref":"Response","optional":true,"description":"Cached response data."},{"name":"bodySize","type":"number","description":"Cached response body size."}]},{"id":"Initiator","type":"object","description":"Information about the request initiator.","properties":[{"name":"type","type":"string","enum":["parser","script","preload","other"],"description":"Type of this initiator."},{"name":"stack","$ref":"Runtime.StackTrace","optional":true,"description":"Initiator JavaScript stack trace, set for Script only."},{"name":"url","type":"string","optional":true,"description":"Initiator URL, set for Parser type or for Script type (when script is importing module)."},{"name":"lineNumber","type":"number","optional":true,"description":"Initiator line number, set for Parser type or for Script type (when script is importing module) (0-based)."}]},{"id":"Cookie","type":"object","description":"Cookie object","properties":[{"name":"name","type":"string","description":"Cookie name."},{"name":"value","type":"string","description":"Cookie value."},{"name":"domain","type":"string","description":"Cookie domain."},{"name":"path","type":"string","description":"Cookie path."},{"name":"expires","type":"number","description":"Cookie expiration date as the number of seconds since the UNIX epoch."},{"name":"size","type":"integer","description":"Cookie size."},{"name":"httpOnly","type":"boolean","description":"True if cookie is http-only."},{"name":"secure","type":"boolean","description":"True if cookie is secure."},{"name":"session","type":"boolean","description":"True in case of session cookie."},{"name":"sameSite","$ref":"CookieSameSite","optional":true,"description":"Cookie SameSite type."}],"experimental":true},{"id":"AuthChallenge","type":"object","description":"Authorization challenge for HTTP status code 401 or 407.","properties":[{"name":"source","type":"string","optional":true,"enum":["Server","Proxy"],"description":"Source of the authentication challenge."},{"name":"origin","type":"string","description":"Origin of the challenger."},{"name":"scheme","type":"string","description":"The authentication scheme used, such as basic or digest"},{"name":"realm","type":"string","description":"The realm of the challenge. May be empty."}],"experimental":true},{"id":"AuthChallengeResponse","type":"object","description":"Response to an AuthChallenge.","properties":[{"name":"response","type":"string","enum":["Default","CancelAuth","ProvideCredentials"],"description":"The decision on what to do in response to the authorization challenge.  Default means deferring to the default behavior of the net stack, which will likely either the Cancel authentication or display a popup dialog box."},{"name":"username","type":"string","optional":true,"description":"The username to provide, possibly empty. Should only be set if response is ProvideCredentials."},{"name":"password","type":"string","optional":true,"description":"The password to provide, possibly empty. Should only be set if response is ProvideCredentials."}],"experimental":true}],"commands":[{"name":"enable","description":"Enables network tracking, network events will now be delivered to the client.","parameters":[{"name":"maxTotalBufferSize","type":"integer","optional":true,"experimental":true,"description":"Buffer size in bytes to use when preserving network payloads (XHRs, etc)."},{"name":"maxResourceBufferSize","type":"integer","optional":true,"experimental":true,"description":"Per-resource buffer size in bytes to use when preserving network payloads (XHRs, etc)."}]},{"name":"disable","description":"Disables network tracking, prevents network events from being sent to the client."},{"name":"setUserAgentOverride","description":"Allows overriding user agent with the given string.","parameters":[{"name":"userAgent","type":"string","description":"User agent to use."}]},{"name":"setExtraHTTPHeaders","description":"Specifies whether to always send extra HTTP headers with the requests from this page.","parameters":[{"name":"headers","$ref":"Headers","description":"Map with extra HTTP headers."}]},{"name":"getResponseBody","description":"Returns content served for the given request.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Identifier of the network request to get content for."}],"returns":[{"name":"body","type":"string","description":"Response body."},{"name":"base64Encoded","type":"boolean","description":"True, if content was sent as base64."}]},{"name":"setBlockedURLs","description":"Blocks URLs from loading.","parameters":[{"name":"urls","type":"array","items":{"type":"string"},"description":"URL patterns to block. Wildcards ('*') are allowed."}],"experimental":true},{"name":"replayXHR","description":"This method sends a new XMLHttpRequest which is identical to the original one. The following parameters should be identical: method, url, async, request body, extra headers, withCredentials attribute, user, password.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Identifier of XHR to replay."}],"experimental":true},{"name":"canClearBrowserCache","description":"Tells whether clearing browser cache is supported.","returns":[{"name":"result","type":"boolean","description":"True if browser cache can be cleared."}]},{"name":"clearBrowserCache","description":"Clears browser cache."},{"name":"canClearBrowserCookies","description":"Tells whether clearing browser cookies is supported.","returns":[{"name":"result","type":"boolean","description":"True if browser cookies can be cleared."}]},{"name":"clearBrowserCookies","description":"Clears browser cookies."},{"name":"getCookies","parameters":[{"name":"urls","type":"array","items":{"type":"string"},"optional":true,"description":"The list of URLs for which applicable cookies will be fetched"}],"returns":[{"name":"cookies","type":"array","items":{"$ref":"Cookie"},"description":"Array of cookie objects."}],"description":"Returns all browser cookies for the current URL. Depending on the backend support, will return detailed cookie information in the <code>cookies</code> field.","experimental":true},{"name":"getAllCookies","returns":[{"name":"cookies","type":"array","items":{"$ref":"Cookie"},"description":"Array of cookie objects."}],"description":"Returns all browser cookies. Depending on the backend support, will return detailed cookie information in the <code>cookies</code> field.","experimental":true},{"name":"deleteCookie","parameters":[{"name":"cookieName","type":"string","description":"Name of the cookie to remove."},{"name":"url","type":"string","description":"URL to match cooke domain and path."}],"description":"Deletes browser cookie with given name, domain and path.","experimental":true},{"name":"setCookie","parameters":[{"name":"url","type":"string","description":"The request-URI to associate with the setting of the cookie. This value can affect the default domain and path values of the created cookie."},{"name":"name","type":"string","description":"The name of the cookie."},{"name":"value","type":"string","description":"The value of the cookie."},{"name":"domain","type":"string","optional":true,"description":"If omitted, the cookie becomes a host-only cookie."},{"name":"path","type":"string","optional":true,"description":"Defaults to the path portion of the url parameter."},{"name":"secure","type":"boolean","optional":true,"description":"Defaults ot false."},{"name":"httpOnly","type":"boolean","optional":true,"description":"Defaults to false."},{"name":"sameSite","$ref":"CookieSameSite","optional":true,"description":"Defaults to browser default behavior."},{"name":"expirationDate","$ref":"TimeSinceEpoch","optional":true,"description":"If omitted, the cookie becomes a session cookie."}],"returns":[{"name":"success","type":"boolean","description":"True if successfully set cookie."}],"description":"Sets a cookie with the given cookie data; may overwrite equivalent cookies if they exist.","experimental":true},{"name":"canEmulateNetworkConditions","description":"Tells whether emulation of network conditions is supported.","returns":[{"name":"result","type":"boolean","description":"True if emulation of network conditions is supported."}],"experimental":true},{"name":"emulateNetworkConditions","description":"Activates emulation of network conditions.","parameters":[{"name":"offline","type":"boolean","description":"True to emulate internet disconnection."},{"name":"latency","type":"number","description":"Additional latency (ms)."},{"name":"downloadThroughput","type":"number","description":"Maximal aggregated download throughput."},{"name":"uploadThroughput","type":"number","description":"Maximal aggregated upload throughput."},{"name":"connectionType","$ref":"ConnectionType","optional":true,"description":"Connection type if known."}]},{"name":"setCacheDisabled","parameters":[{"name":"cacheDisabled","type":"boolean","description":"Cache disabled state."}],"description":"Toggles ignoring cache for each request. If <code>true</code>, cache will not be used."},{"name":"setBypassServiceWorker","parameters":[{"name":"bypass","type":"boolean","description":"Bypass service worker and load from network."}],"experimental":true,"description":"Toggles ignoring of service worker for each request."},{"name":"setDataSizeLimitsForTest","parameters":[{"name":"maxTotalSize","type":"integer","description":"Maximum total buffer size."},{"name":"maxResourceSize","type":"integer","description":"Maximum per-resource size."}],"description":"For testing.","experimental":true},{"name":"getCertificate","description":"Returns the DER-encoded certificate.","parameters":[{"name":"origin","type":"string","description":"Origin to get certificate for."}],"returns":[{"name":"tableNames","type":"array","items":{"type":"string"}}],"experimental":true},{"name":"setRequestInterceptionEnabled","parameters":[{"name":"enabled","type":"boolean","description":"Whether or not HTTP requests should be intercepted and Network.requestIntercepted events sent."}],"experimental":true},{"name":"continueInterceptedRequest","description":"Response to Network.requestIntercepted which either modifies the request to continue with any modifications, or blocks it, or completes it with the provided response bytes. If a network fetch occurs as a result which encounters a redirect an additional Network.requestIntercepted event will be sent with the same InterceptionId.","parameters":[{"name":"interceptionId","$ref":"InterceptionId"},{"name":"errorReason","$ref":"ErrorReason","optional":true,"description":"If set this causes the request to fail with the given reason. Must not be set in response to an authChallenge."},{"name":"rawResponse","type":"string","optional":true,"description":"If set the requests completes using with the provided base64 encoded raw response, including HTTP status line and headers etc... Must not be set in response to an authChallenge."},{"name":"url","type":"string","optional":true,"description":"If set the request url will be modified in a way that's not observable by page. Must not be set in response to an authChallenge."},{"name":"method","type":"string","optional":true,"description":"If set this allows the request method to be overridden. Must not be set in response to an authChallenge."},{"name":"postData","type":"string","optional":true,"description":"If set this allows postData to be set. Must not be set in response to an authChallenge."},{"name":"headers","$ref":"Headers","optional":true,"description":"If set this allows the request headers to be changed. Must not be set in response to an authChallenge."},{"name":"authChallengeResponse","$ref":"AuthChallengeResponse","optional":true,"description":"Response to a requestIntercepted with an authChallenge. Must not be set otherwise."}],"experimental":true}],"events":[{"name":"resourceChangedPriority","description":"Fired when resource loading priority is changed","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"newPriority","$ref":"ResourcePriority","description":"New priority"},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."}],"experimental":true},{"name":"requestWillBeSent","description":"Fired when page is about to send HTTP request.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"loaderId","$ref":"LoaderId","description":"Loader identifier. Empty string if the request is fetched form worker."},{"name":"documentURL","type":"string","description":"URL of the document this request is loaded for."},{"name":"request","$ref":"Request","description":"Request data."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"wallTime","$ref":"TimeSinceEpoch","experimental":true,"description":"Timestamp."},{"name":"initiator","$ref":"Initiator","description":"Request initiator."},{"name":"redirectResponse","optional":true,"$ref":"Response","description":"Redirect response data."},{"name":"type","$ref":"Page.ResourceType","optional":true,"experimental":true,"description":"Type of this resource."},{"name":"frameId","optional":true,"$ref":"Page.FrameId","description":"Frame identifier.","experimental":true}]},{"name":"requestServedFromCache","description":"Fired if request ended up loading from cache.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."}]},{"name":"responseReceived","description":"Fired when HTTP response is available.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"loaderId","$ref":"LoaderId","description":"Loader identifier. Empty string if the request is fetched form worker."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"type","$ref":"Page.ResourceType","description":"Resource type."},{"name":"response","$ref":"Response","description":"Response data."},{"name":"frameId","optional":true,"$ref":"Page.FrameId","description":"Frame identifier.","experimental":true}]},{"name":"dataReceived","description":"Fired when data chunk was received over the network.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"dataLength","type":"integer","description":"Data chunk length."},{"name":"encodedDataLength","type":"integer","description":"Actual bytes received (might be less than dataLength for compressed encodings)."}]},{"name":"loadingFinished","description":"Fired when HTTP request has finished loading.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"encodedDataLength","type":"number","description":"Total number of bytes received for this request."}]},{"name":"loadingFailed","description":"Fired when HTTP request has failed to load.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"type","$ref":"Page.ResourceType","description":"Resource type."},{"name":"errorText","type":"string","description":"User friendly error message."},{"name":"canceled","type":"boolean","optional":true,"description":"True if loading was canceled."},{"name":"blockedReason","$ref":"BlockedReason","optional":true,"description":"The reason why loading was blocked, if any.","experimental":true}]},{"name":"webSocketWillSendHandshakeRequest","description":"Fired when WebSocket is about to initiate handshake.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"wallTime","$ref":"TimeSinceEpoch","experimental":true,"description":"UTC Timestamp."},{"name":"request","$ref":"WebSocketRequest","description":"WebSocket request data."}],"experimental":true},{"name":"webSocketHandshakeResponseReceived","description":"Fired when WebSocket handshake response becomes available.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"response","$ref":"WebSocketResponse","description":"WebSocket response data."}],"experimental":true},{"name":"webSocketCreated","description":"Fired upon WebSocket creation.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"url","type":"string","description":"WebSocket request URL."},{"name":"initiator","$ref":"Initiator","optional":true,"description":"Request initiator."}],"experimental":true},{"name":"webSocketClosed","description":"Fired when WebSocket is closed.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."}],"experimental":true},{"name":"webSocketFrameReceived","description":"Fired when WebSocket frame is received.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"response","$ref":"WebSocketFrame","description":"WebSocket response data."}],"experimental":true},{"name":"webSocketFrameError","description":"Fired when WebSocket frame error occurs.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"errorMessage","type":"string","description":"WebSocket frame error message."}],"experimental":true},{"name":"webSocketFrameSent","description":"Fired when WebSocket frame is sent.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"response","$ref":"WebSocketFrame","description":"WebSocket response data."}],"experimental":true},{"name":"eventSourceMessageReceived","description":"Fired when EventSource message is received.","parameters":[{"name":"requestId","$ref":"RequestId","description":"Request identifier."},{"name":"timestamp","$ref":"MonotonicTime","description":"Timestamp."},{"name":"eventName","type":"string","description":"Message type."},{"name":"eventId","type":"string","description":"Message identifier."},{"name":"data","type":"string","description":"Message content."}],"experimental":true},{"name":"requestIntercepted","description":"Details of an intercepted HTTP request, which must be either allowed, blocked, modified or mocked.","parameters":[{"name":"interceptionId","$ref":"InterceptionId","description":"Each request the page makes will have a unique id, however if any redirects are encountered while processing that fetch, they will be reported with the same id as the original fetch. Likewise if HTTP authentication is needed then the same fetch id will be used."},{"name":"request","$ref":"Request"},{"name":"resourceType","$ref":"Page.ResourceType","description":"How the requested resource will be used."},{"name":"redirectHeaders","$ref":"Headers","optional":true,"description":"HTTP response headers, only sent if a redirect was intercepted."},{"name":"redirectStatusCode","type":"integer","optional":true,"description":"HTTP response code, only sent if a redirect was intercepted."},{"name":"redirectUrl","optional":true,"type":"string","description":"Redirect location, only sent if a redirect was intercepted."},{"name":"authChallenge","$ref":"AuthChallenge","optional":true,"description":"Details of the Authorization Challenge encountered. If this is set then continueInterceptedRequest must contain an authChallengeResponse."}],"experimental":true}]},{"domain":"Database","experimental":true,"types":[{"id":"DatabaseId","type":"string","description":"Unique identifier of Database object.","experimental":true},{"id":"Database","type":"object","description":"Database object.","experimental":true,"properties":[{"name":"id","$ref":"DatabaseId","description":"Database ID."},{"name":"domain","type":"string","description":"Database domain."},{"name":"name","type":"string","description":"Database name."},{"name":"version","type":"string","description":"Database version."}]},{"id":"Error","type":"object","description":"Database error.","properties":[{"name":"message","type":"string","description":"Error message."},{"name":"code","type":"integer","description":"Error code."}]}],"commands":[{"name":"enable","description":"Enables database tracking, database events will now be delivered to the client."},{"name":"disable","description":"Disables database tracking, prevents database events from being sent to the client."},{"name":"getDatabaseTableNames","parameters":[{"name":"databaseId","$ref":"DatabaseId"}],"returns":[{"name":"tableNames","type":"array","items":{"type":"string"}}]},{"name":"executeSQL","parameters":[{"name":"databaseId","$ref":"DatabaseId"},{"name":"query","type":"string"}],"returns":[{"name":"columnNames","type":"array","optional":true,"items":{"type":"string"}},{"name":"values","type":"array","optional":true,"items":{"type":"any"}},{"name":"sqlError","$ref":"Error","optional":true}]}],"events":[{"name":"addDatabase","parameters":[{"name":"database","$ref":"Database"}]}]},{"domain":"IndexedDB","dependencies":["Runtime"],"experimental":true,"types":[{"id":"DatabaseWithObjectStores","type":"object","description":"Database with an array of object stores.","properties":[{"name":"name","type":"string","description":"Database name."},{"name":"version","type":"integer","description":"Database version."},{"name":"objectStores","type":"array","items":{"$ref":"ObjectStore"},"description":"Object stores in this database."}]},{"id":"ObjectStore","type":"object","description":"Object store.","properties":[{"name":"name","type":"string","description":"Object store name."},{"name":"keyPath","$ref":"KeyPath","description":"Object store key path."},{"name":"autoIncrement","type":"boolean","description":"If true, object store has auto increment flag set."},{"name":"indexes","type":"array","items":{"$ref":"ObjectStoreIndex"},"description":"Indexes in this object store."}]},{"id":"ObjectStoreIndex","type":"object","description":"Object store index.","properties":[{"name":"name","type":"string","description":"Index name."},{"name":"keyPath","$ref":"KeyPath","description":"Index key path."},{"name":"unique","type":"boolean","description":"If true, index is unique."},{"name":"multiEntry","type":"boolean","description":"If true, index allows multiple entries for a key."}]},{"id":"Key","type":"object","description":"Key.","properties":[{"name":"type","type":"string","enum":["number","string","date","array"],"description":"Key type."},{"name":"number","type":"number","optional":true,"description":"Number value."},{"name":"string","type":"string","optional":true,"description":"String value."},{"name":"date","type":"number","optional":true,"description":"Date value."},{"name":"array","type":"array","optional":true,"items":{"$ref":"Key"},"description":"Array value."}]},{"id":"KeyRange","type":"object","description":"Key range.","properties":[{"name":"lower","$ref":"Key","optional":true,"description":"Lower bound."},{"name":"upper","$ref":"Key","optional":true,"description":"Upper bound."},{"name":"lowerOpen","type":"boolean","description":"If true lower bound is open."},{"name":"upperOpen","type":"boolean","description":"If true upper bound is open."}]},{"id":"DataEntry","type":"object","description":"Data entry.","properties":[{"name":"key","$ref":"Runtime.RemoteObject","description":"Key object."},{"name":"primaryKey","$ref":"Runtime.RemoteObject","description":"Primary key object."},{"name":"value","$ref":"Runtime.RemoteObject","description":"Value object."}]},{"id":"KeyPath","type":"object","description":"Key path.","properties":[{"name":"type","type":"string","enum":["null","string","array"],"description":"Key path type."},{"name":"string","type":"string","optional":true,"description":"String value."},{"name":"array","type":"array","optional":true,"items":{"type":"string"},"description":"Array value."}]}],"commands":[{"name":"enable","description":"Enables events from backend."},{"name":"disable","description":"Disables events from backend."},{"name":"requestDatabaseNames","parameters":[{"name":"securityOrigin","type":"string","description":"Security origin."}],"returns":[{"name":"databaseNames","type":"array","items":{"type":"string"},"description":"Database names for origin."}],"description":"Requests database names for given security origin."},{"name":"requestDatabase","parameters":[{"name":"securityOrigin","type":"string","description":"Security origin."},{"name":"databaseName","type":"string","description":"Database name."}],"returns":[{"name":"databaseWithObjectStores","$ref":"DatabaseWithObjectStores","description":"Database with an array of object stores."}],"description":"Requests database with given name in given frame."},{"name":"requestData","parameters":[{"name":"securityOrigin","type":"string","description":"Security origin."},{"name":"databaseName","type":"string","description":"Database name."},{"name":"objectStoreName","type":"string","description":"Object store name."},{"name":"indexName","type":"string","description":"Index name, empty string for object store data requests."},{"name":"skipCount","type":"integer","description":"Number of records to skip."},{"name":"pageSize","type":"integer","description":"Number of records to fetch."},{"name":"keyRange","$ref":"KeyRange","optional":true,"description":"Key range."}],"returns":[{"name":"objectStoreDataEntries","type":"array","items":{"$ref":"DataEntry"},"description":"Array of object store data entries."},{"name":"hasMore","type":"boolean","description":"If true, there are more entries to fetch in the given range."}],"description":"Requests data from object store or index."},{"name":"clearObjectStore","parameters":[{"name":"securityOrigin","type":"string","description":"Security origin."},{"name":"databaseName","type":"string","description":"Database name."},{"name":"objectStoreName","type":"string","description":"Object store name."}],"returns":[],"description":"Clears all entries from an object store."},{"name":"deleteDatabase","parameters":[{"name":"securityOrigin","type":"string","description":"Security origin."},{"name":"databaseName","type":"string","description":"Database name."}],"returns":[],"description":"Deletes a database."}]},{"domain":"CacheStorage","experimental":true,"types":[{"id":"CacheId","type":"string","description":"Unique identifier of the Cache object."},{"id":"DataEntry","type":"object","description":"Data entry.","properties":[{"name":"request","type":"string","description":"Request url spec."},{"name":"response","type":"string","description":"Response status text."},{"name":"responseTime","type":"number","description":"Number of seconds since epoch."}]},{"id":"Cache","type":"object","description":"Cache identifier.","properties":[{"name":"cacheId","$ref":"CacheId","description":"An opaque unique id of the cache."},{"name":"securityOrigin","type":"string","description":"Security origin of the cache."},{"name":"cacheName","type":"string","description":"The name of the cache."}]}],"commands":[{"name":"requestCacheNames","parameters":[{"name":"securityOrigin","type":"string","description":"Security origin."}],"returns":[{"name":"caches","type":"array","items":{"$ref":"Cache"},"description":"Caches for the security origin."}],"description":"Requests cache names."},{"name":"requestEntries","parameters":[{"name":"cacheId","$ref":"CacheId","description":"ID of cache to get entries from."},{"name":"skipCount","type":"integer","description":"Number of records to skip."},{"name":"pageSize","type":"integer","description":"Number of records to fetch."}],"returns":[{"name":"cacheDataEntries","type":"array","items":{"$ref":"DataEntry"},"description":"Array of object store data entries."},{"name":"hasMore","type":"boolean","description":"If true, there are more entries to fetch in the given range."}],"description":"Requests data from cache."},{"name":"deleteCache","parameters":[{"name":"cacheId","$ref":"CacheId","description":"Id of cache for deletion."}],"description":"Deletes a cache."},{"name":"deleteEntry","parameters":[{"name":"cacheId","$ref":"CacheId","description":"Id of cache where the entry will be deleted."},{"name":"request","type":"string","description":"URL spec of the request."}],"description":"Deletes a cache entry."}]},{"domain":"DOMStorage","experimental":true,"description":"Query and modify DOM storage.","types":[{"id":"StorageId","type":"object","description":"DOM Storage identifier.","experimental":true,"properties":[{"name":"securityOrigin","type":"string","description":"Security origin for the storage."},{"name":"isLocalStorage","type":"boolean","description":"Whether the storage is local storage (not session storage)."}]},{"id":"Item","type":"array","description":"DOM Storage item.","experimental":true,"items":{"type":"string"}}],"commands":[{"name":"enable","description":"Enables storage tracking, storage events will now be delivered to the client."},{"name":"disable","description":"Disables storage tracking, prevents storage events from being sent to the client."},{"name":"clear","parameters":[{"name":"storageId","$ref":"StorageId"}]},{"name":"getDOMStorageItems","parameters":[{"name":"storageId","$ref":"StorageId"}],"returns":[{"name":"entries","type":"array","items":{"$ref":"Item"}}]},{"name":"setDOMStorageItem","parameters":[{"name":"storageId","$ref":"StorageId"},{"name":"key","type":"string"},{"name":"value","type":"string"}]},{"name":"removeDOMStorageItem","parameters":[{"name":"storageId","$ref":"StorageId"},{"name":"key","type":"string"}]}],"events":[{"name":"domStorageItemsCleared","parameters":[{"name":"storageId","$ref":"StorageId"}]},{"name":"domStorageItemRemoved","parameters":[{"name":"storageId","$ref":"StorageId"},{"name":"key","type":"string"}]},{"name":"domStorageItemAdded","parameters":[{"name":"storageId","$ref":"StorageId"},{"name":"key","type":"string"},{"name":"newValue","type":"string"}]},{"name":"domStorageItemUpdated","parameters":[{"name":"storageId","$ref":"StorageId"},{"name":"key","type":"string"},{"name":"oldValue","type":"string"},{"name":"newValue","type":"string"}]}]},{"domain":"ApplicationCache","experimental":true,"types":[{"id":"ApplicationCacheResource","type":"object","description":"Detailed application cache resource information.","properties":[{"name":"url","type":"string","description":"Resource url."},{"name":"size","type":"integer","description":"Resource size."},{"name":"type","type":"string","description":"Resource type."}]},{"id":"ApplicationCache","type":"object","description":"Detailed application cache information.","properties":[{"name":"manifestURL","type":"string","description":"Manifest URL."},{"name":"size","type":"number","description":"Application cache size."},{"name":"creationTime","type":"number","description":"Application cache creation time."},{"name":"updateTime","type":"number","description":"Application cache update time."},{"name":"resources","type":"array","items":{"$ref":"ApplicationCacheResource"},"description":"Application cache resources."}]},{"id":"FrameWithManifest","type":"object","description":"Frame identifier - manifest URL pair.","properties":[{"name":"frameId","$ref":"Page.FrameId","description":"Frame identifier."},{"name":"manifestURL","type":"string","description":"Manifest URL."},{"name":"status","type":"integer","description":"Application cache status."}]}],"commands":[{"name":"getFramesWithManifests","returns":[{"name":"frameIds","type":"array","items":{"$ref":"FrameWithManifest"},"description":"Array of frame identifiers with manifest urls for each frame containing a document associated with some application cache."}],"description":"Returns array of frame identifiers with manifest urls for each frame containing a document associated with some application cache."},{"name":"enable","description":"Enables application cache domain notifications."},{"name":"getManifestForFrame","parameters":[{"name":"frameId","$ref":"Page.FrameId","description":"Identifier of the frame containing document whose manifest is retrieved."}],"returns":[{"name":"manifestURL","type":"string","description":"Manifest URL for document in the given frame."}],"description":"Returns manifest URL for document in the given frame."},{"name":"getApplicationCacheForFrame","parameters":[{"name":"frameId","$ref":"Page.FrameId","description":"Identifier of the frame containing document whose application cache is retrieved."}],"returns":[{"name":"applicationCache","$ref":"ApplicationCache","description":"Relevant application cache data for the document in given frame."}],"description":"Returns relevant application cache data for the document in given frame."}],"events":[{"name":"applicationCacheStatusUpdated","parameters":[{"name":"frameId","$ref":"Page.FrameId","description":"Identifier of the frame containing document whose application cache updated status."},{"name":"manifestURL","type":"string","description":"Manifest URL."},{"name":"status","type":"integer","description":"Updated application cache status."}]},{"name":"networkStateUpdated","parameters":[{"name":"isNowOnline","type":"boolean"}]}]},{"domain":"DOM","description":"This domain exposes DOM read/write operations. Each DOM Node is represented with its mirror object that has an <code>id</code>. This <code>id</code> can be used to get additional information on the Node, resolve it into the JavaScript object wrapper, etc. It is important that client receives DOM events only for the nodes that are known to the client. Backend keeps track of the nodes that were sent to the client and never sends the same node twice. It is client's responsibility to collect information about the nodes that were sent to the client.<p>Note that <code>iframe</code> owner elements will return corresponding document elements as their child nodes.</p>","dependencies":["Runtime"],"types":[{"id":"NodeId","type":"integer","description":"Unique DOM node identifier."},{"id":"BackendNodeId","type":"integer","description":"Unique DOM node identifier used to reference a node that may not have been pushed to the front-end.","experimental":true},{"id":"BackendNode","type":"object","properties":[{"name":"nodeType","type":"integer","description":"<code>Node</code>'s nodeType."},{"name":"nodeName","type":"string","description":"<code>Node</code>'s nodeName."},{"name":"backendNodeId","$ref":"BackendNodeId"}],"experimental":true,"description":"Backend node with a friendly name."},{"id":"PseudoType","type":"string","enum":["first-line","first-letter","before","after","backdrop","selection","first-line-inherited","scrollbar","scrollbar-thumb","scrollbar-button","scrollbar-track","scrollbar-track-piece","scrollbar-corner","resizer","input-list-button"],"description":"Pseudo element type."},{"id":"ShadowRootType","type":"string","enum":["user-agent","open","closed"],"description":"Shadow root type."},{"id":"Node","type":"object","properties":[{"name":"nodeId","$ref":"NodeId","description":"Node identifier that is passed into the rest of the DOM messages as the <code>nodeId</code>. Backend will only push node with given <code>id</code> once. It is aware of all requested nodes and will only fire DOM events for nodes known to the client."},{"name":"parentId","$ref":"NodeId","optional":true,"description":"The id of the parent node if any.","experimental":true},{"name":"backendNodeId","$ref":"BackendNodeId","description":"The BackendNodeId for this node.","experimental":true},{"name":"nodeType","type":"integer","description":"<code>Node</code>'s nodeType."},{"name":"nodeName","type":"string","description":"<code>Node</code>'s nodeName."},{"name":"localName","type":"string","description":"<code>Node</code>'s localName."},{"name":"nodeValue","type":"string","description":"<code>Node</code>'s nodeValue."},{"name":"childNodeCount","type":"integer","optional":true,"description":"Child count for <code>Container</code> nodes."},{"name":"children","type":"array","optional":true,"items":{"$ref":"Node"},"description":"Child nodes of this node when requested with children."},{"name":"attributes","type":"array","optional":true,"items":{"type":"string"},"description":"Attributes of the <code>Element</code> node in the form of flat array <code>[name1, value1, name2, value2]</code>."},{"name":"documentURL","type":"string","optional":true,"description":"Document URL that <code>Document</code> or <code>FrameOwner</code> node points to."},{"name":"baseURL","type":"string","optional":true,"description":"Base URL that <code>Document</code> or <code>FrameOwner</code> node uses for URL completion.","experimental":true},{"name":"publicId","type":"string","optional":true,"description":"<code>DocumentType</code>'s publicId."},{"name":"systemId","type":"string","optional":true,"description":"<code>DocumentType</code>'s systemId."},{"name":"internalSubset","type":"string","optional":true,"description":"<code>DocumentType</code>'s internalSubset."},{"name":"xmlVersion","type":"string","optional":true,"description":"<code>Document</code>'s XML version in case of XML documents."},{"name":"name","type":"string","optional":true,"description":"<code>Attr</code>'s name."},{"name":"value","type":"string","optional":true,"description":"<code>Attr</code>'s value."},{"name":"pseudoType","$ref":"PseudoType","optional":true,"description":"Pseudo element type for this node."},{"name":"shadowRootType","$ref":"ShadowRootType","optional":true,"description":"Shadow root type."},{"name":"frameId","$ref":"Page.FrameId","optional":true,"description":"Frame ID for frame owner elements.","experimental":true},{"name":"contentDocument","$ref":"Node","optional":true,"description":"Content document for frame owner elements."},{"name":"shadowRoots","type":"array","optional":true,"items":{"$ref":"Node"},"description":"Shadow root list for given element host.","experimental":true},{"name":"templateContent","$ref":"Node","optional":true,"description":"Content document fragment for template elements.","experimental":true},{"name":"pseudoElements","type":"array","items":{"$ref":"Node"},"optional":true,"description":"Pseudo elements associated with this node.","experimental":true},{"name":"importedDocument","$ref":"Node","optional":true,"description":"Import document for the HTMLImport links."},{"name":"distributedNodes","type":"array","items":{"$ref":"BackendNode"},"optional":true,"description":"Distributed nodes for given insertion point.","experimental":true},{"name":"isSVG","type":"boolean","optional":true,"description":"Whether the node is SVG.","experimental":true}],"description":"DOM interaction is implemented in terms of mirror objects that represent the actual DOM nodes. DOMNode is a base node mirror type."},{"id":"RGBA","type":"object","properties":[{"name":"r","type":"integer","description":"The red component, in the [0-255] range."},{"name":"g","type":"integer","description":"The green component, in the [0-255] range."},{"name":"b","type":"integer","description":"The blue component, in the [0-255] range."},{"name":"a","type":"number","optional":true,"description":"The alpha component, in the [0-1] range (default: 1)."}],"description":"A structure holding an RGBA color."},{"id":"Quad","type":"array","items":{"type":"number"},"minItems":8,"maxItems":8,"description":"An array of quad vertices, x immediately followed by y for each point, points clock-wise.","experimental":true},{"id":"BoxModel","type":"object","experimental":true,"properties":[{"name":"content","$ref":"Quad","description":"Content box"},{"name":"padding","$ref":"Quad","description":"Padding box"},{"name":"border","$ref":"Quad","description":"Border box"},{"name":"margin","$ref":"Quad","description":"Margin box"},{"name":"width","type":"integer","description":"Node width"},{"name":"height","type":"integer","description":"Node height"},{"name":"shapeOutside","$ref":"ShapeOutsideInfo","optional":true,"description":"Shape outside coordinates"}],"description":"Box model."},{"id":"ShapeOutsideInfo","type":"object","experimental":true,"properties":[{"name":"bounds","$ref":"Quad","description":"Shape bounds"},{"name":"shape","type":"array","items":{"type":"any"},"description":"Shape coordinate details"},{"name":"marginShape","type":"array","items":{"type":"any"},"description":"Margin shape bounds"}],"description":"CSS Shape Outside details."},{"id":"Rect","type":"object","experimental":true,"properties":[{"name":"x","type":"number","description":"X coordinate"},{"name":"y","type":"number","description":"Y coordinate"},{"name":"width","type":"number","description":"Rectangle width"},{"name":"height","type":"number","description":"Rectangle height"}],"description":"Rectangle."}],"commands":[{"name":"enable","description":"Enables DOM agent for the given page."},{"name":"disable","description":"Disables DOM agent for the given page."},{"name":"getDocument","parameters":[{"name":"depth","type":"integer","optional":true,"description":"The maximum depth at which children should be retrieved, defaults to 1. Use -1 for the entire subtree or provide an integer larger than 0.","experimental":true},{"name":"pierce","type":"boolean","optional":true,"description":"Whether or not iframes and shadow roots should be traversed when returning the subtree (default is false).","experimental":true}],"returns":[{"name":"root","$ref":"Node","description":"Resulting node."}],"description":"Returns the root DOM node (and optionally the subtree) to the caller."},{"name":"getFlattenedDocument","parameters":[{"name":"depth","type":"integer","optional":true,"description":"The maximum depth at which children should be retrieved, defaults to 1. Use -1 for the entire subtree or provide an integer larger than 0.","experimental":true},{"name":"pierce","type":"boolean","optional":true,"description":"Whether or not iframes and shadow roots should be traversed when returning the subtree (default is false).","experimental":true}],"returns":[{"name":"nodes","type":"array","items":{"$ref":"Node"},"description":"Resulting node."}],"description":"Returns the root DOM node (and optionally the subtree) to the caller."},{"name":"collectClassNamesFromSubtree","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to collect class names."}],"returns":[{"name":"classNames","type":"array","items":{"type":"string"},"description":"Class name list."}],"description":"Collects class names for the node with given id and all of it's child nodes.","experimental":true},{"name":"requestChildNodes","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to get children for."},{"name":"depth","type":"integer","optional":true,"description":"The maximum depth at which children should be retrieved, defaults to 1. Use -1 for the entire subtree or provide an integer larger than 0.","experimental":true},{"name":"pierce","type":"boolean","optional":true,"description":"Whether or not iframes and shadow roots should be traversed when returning the sub-tree (default is false).","experimental":true}],"description":"Requests that children of the node with given id are returned to the caller in form of <code>setChildNodes</code> events where not only immediate children are retrieved, but all children down to the specified depth."},{"name":"querySelector","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to query upon."},{"name":"selector","type":"string","description":"Selector string."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"Query selector result."}],"description":"Executes <code>querySelector</code> on a given node."},{"name":"querySelectorAll","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to query upon."},{"name":"selector","type":"string","description":"Selector string."}],"returns":[{"name":"nodeIds","type":"array","items":{"$ref":"NodeId"},"description":"Query selector result."}],"description":"Executes <code>querySelectorAll</code> on a given node."},{"name":"setNodeName","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to set name for."},{"name":"name","type":"string","description":"New node's name."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"New node's id."}],"description":"Sets node name for a node with given id."},{"name":"setNodeValue","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to set value for."},{"name":"value","type":"string","description":"New node's value."}],"description":"Sets node value for a node with given id."},{"name":"removeNode","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to remove."}],"description":"Removes node with given id."},{"name":"setAttributeValue","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the element to set attribute for."},{"name":"name","type":"string","description":"Attribute name."},{"name":"value","type":"string","description":"Attribute value."}],"description":"Sets attribute for an element with given id."},{"name":"setAttributesAsText","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the element to set attributes for."},{"name":"text","type":"string","description":"Text with a number of attributes. Will parse this text using HTML parser."},{"name":"name","type":"string","optional":true,"description":"Attribute name to replace with new attributes derived from text in case text parsed successfully."}],"description":"Sets attributes on element with given id. This method is useful when user edits some existing attribute value and types in several attribute name/value pairs."},{"name":"removeAttribute","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the element to remove attribute from."},{"name":"name","type":"string","description":"Name of the attribute to remove."}],"description":"Removes attribute with given name from an element with given id."},{"name":"getOuterHTML","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to get markup for."}],"returns":[{"name":"outerHTML","type":"string","description":"Outer HTML markup."}],"description":"Returns node's HTML markup."},{"name":"setOuterHTML","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to set markup for."},{"name":"outerHTML","type":"string","description":"Outer HTML markup to set."}],"description":"Sets node HTML markup, returns new node id."},{"name":"performSearch","parameters":[{"name":"query","type":"string","description":"Plain text or query selector or XPath search query."},{"name":"includeUserAgentShadowDOM","type":"boolean","optional":true,"description":"True to search in user agent shadow DOM.","experimental":true}],"returns":[{"name":"searchId","type":"string","description":"Unique search session identifier."},{"name":"resultCount","type":"integer","description":"Number of search results."}],"description":"Searches for a given string in the DOM tree. Use <code>getSearchResults</code> to access search results or <code>cancelSearch</code> to end this search session.","experimental":true},{"name":"getSearchResults","parameters":[{"name":"searchId","type":"string","description":"Unique search session identifier."},{"name":"fromIndex","type":"integer","description":"Start index of the search result to be returned."},{"name":"toIndex","type":"integer","description":"End index of the search result to be returned."}],"returns":[{"name":"nodeIds","type":"array","items":{"$ref":"NodeId"},"description":"Ids of the search result nodes."}],"description":"Returns search results from given <code>fromIndex</code> to given <code>toIndex</code> from the sarch with the given identifier.","experimental":true},{"name":"discardSearchResults","parameters":[{"name":"searchId","type":"string","description":"Unique search session identifier."}],"description":"Discards search results from the session with the given id. <code>getSearchResults</code> should no longer be called for that search.","experimental":true},{"name":"requestNode","parameters":[{"name":"objectId","$ref":"Runtime.RemoteObjectId","description":"JavaScript object id to convert into node."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"Node id for given object."}],"description":"Requests that the node is sent to the caller given the JavaScript node object reference. All nodes that form the path from the node to the root are also sent to the client as a series of <code>setChildNodes</code> notifications."},{"name":"highlightRect","description":"Highlights given rectangle.","redirect":"Overlay"},{"name":"highlightNode","description":"Highlights DOM node.","redirect":"Overlay"},{"name":"hideHighlight","description":"Hides any highlight.","redirect":"Overlay"},{"name":"pushNodeByPathToFrontend","parameters":[{"name":"path","type":"string","description":"Path to node in the proprietary format."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node for given path."}],"description":"Requests that the node is sent to the caller given its path. // FIXME, use XPath","experimental":true},{"name":"pushNodesByBackendIdsToFrontend","parameters":[{"name":"backendNodeIds","type":"array","items":{"$ref":"BackendNodeId"},"description":"The array of backend node ids."}],"returns":[{"name":"nodeIds","type":"array","items":{"$ref":"NodeId"},"description":"The array of ids of pushed nodes that correspond to the backend ids specified in backendNodeIds."}],"description":"Requests that a batch of nodes is sent to the caller given their backend node ids.","experimental":true},{"name":"setInspectedNode","parameters":[{"name":"nodeId","$ref":"NodeId","description":"DOM node id to be accessible by means of $x command line API."}],"description":"Enables console to refer to the node with given id via $x (see Command Line API for more details $x functions).","experimental":true},{"name":"resolveNode","parameters":[{"name":"nodeId","$ref":"NodeId","optional":true,"description":"Id of the node to resolve."},{"name":"backendNodeId","$ref":"DOM.BackendNodeId","optional":true,"description":"Backend identifier of the node to resolve."},{"name":"objectGroup","type":"string","optional":true,"description":"Symbolic group name that can be used to release multiple objects."}],"returns":[{"name":"object","$ref":"Runtime.RemoteObject","description":"JavaScript object wrapper for given node."}],"description":"Resolves the JavaScript node object for a given NodeId or BackendNodeId."},{"name":"getAttributes","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to retrieve attibutes for."}],"returns":[{"name":"attributes","type":"array","items":{"type":"string"},"description":"An interleaved array of node attribute names and values."}],"description":"Returns attributes for the specified node."},{"name":"copyTo","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to copy."},{"name":"targetNodeId","$ref":"NodeId","description":"Id of the element to drop the copy into."},{"name":"insertBeforeNodeId","$ref":"NodeId","optional":true,"description":"Drop the copy before this node (if absent, the copy becomes the last child of <code>targetNodeId</code>)."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node clone."}],"description":"Creates a deep copy of the specified node and places it into the target container before the given anchor.","experimental":true},{"name":"moveTo","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node to move."},{"name":"targetNodeId","$ref":"NodeId","description":"Id of the element to drop the moved node into."},{"name":"insertBeforeNodeId","$ref":"NodeId","optional":true,"description":"Drop node before this one (if absent, the moved node becomes the last child of <code>targetNodeId</code>)."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"New id of the moved node."}],"description":"Moves node into the new container, places it before the given anchor."},{"name":"undo","description":"Undoes the last performed action.","experimental":true},{"name":"redo","description":"Re-does the last undone action.","experimental":true},{"name":"markUndoableState","description":"Marks last undoable state.","experimental":true},{"name":"focus","parameters":[{"name":"nodeId","$ref":"NodeId","optional":true,"description":"Identifier of the node."},{"name":"backendNodeId","$ref":"BackendNodeId","optional":true,"description":"Identifier of the backend node."},{"name":"objectId","$ref":"Runtime.RemoteObjectId","optional":true,"description":"JavaScript object id of the node wrapper."}],"description":"Focuses the given element.","experimental":true},{"name":"setFileInputFiles","parameters":[{"name":"files","type":"array","items":{"type":"string"},"description":"Array of file paths to set."},{"name":"nodeId","$ref":"NodeId","optional":true,"description":"Identifier of the node."},{"name":"backendNodeId","$ref":"BackendNodeId","optional":true,"description":"Identifier of the backend node."},{"name":"objectId","$ref":"Runtime.RemoteObjectId","optional":true,"description":"JavaScript object id of the node wrapper."}],"description":"Sets files for the given file input element.","experimental":true},{"name":"getBoxModel","parameters":[{"name":"nodeId","$ref":"NodeId","optional":true,"description":"Identifier of the node."},{"name":"backendNodeId","$ref":"BackendNodeId","optional":true,"description":"Identifier of the backend node."},{"name":"objectId","$ref":"Runtime.RemoteObjectId","optional":true,"description":"JavaScript object id of the node wrapper."}],"returns":[{"name":"model","$ref":"BoxModel","description":"Box model for the node."}],"description":"Returns boxes for the currently selected nodes.","experimental":true},{"name":"getNodeForLocation","parameters":[{"name":"x","type":"integer","description":"X coordinate."},{"name":"y","type":"integer","description":"Y coordinate."},{"name":"includeUserAgentShadowDOM","type":"boolean","optional":true,"description":"False to skip to the nearest non-UA shadow root ancestor (default: false)."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node at given coordinates."}],"description":"Returns node id at given location.","experimental":true},{"name":"getRelayoutBoundary","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node."}],"returns":[{"name":"nodeId","$ref":"NodeId","description":"Relayout boundary node id for the given node."}],"description":"Returns the id of the nearest ancestor that is a relayout boundary.","experimental":true}],"events":[{"name":"documentUpdated","description":"Fired when <code>Document</code> has been totally updated. Node ids are no longer valid."},{"name":"setChildNodes","parameters":[{"name":"parentId","$ref":"NodeId","description":"Parent node id to populate with children."},{"name":"nodes","type":"array","items":{"$ref":"Node"},"description":"Child nodes array."}],"description":"Fired when backend wants to provide client with the missing DOM structure. This happens upon most of the calls requesting node ids."},{"name":"attributeModified","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node that has changed."},{"name":"name","type":"string","description":"Attribute name."},{"name":"value","type":"string","description":"Attribute value."}],"description":"Fired when <code>Element</code>'s attribute is modified."},{"name":"attributeRemoved","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node that has changed."},{"name":"name","type":"string","description":"A ttribute name."}],"description":"Fired when <code>Element</code>'s attribute is removed."},{"name":"inlineStyleInvalidated","parameters":[{"name":"nodeIds","type":"array","items":{"$ref":"NodeId"},"description":"Ids of the nodes for which the inline styles have been invalidated."}],"description":"Fired when <code>Element</code>'s inline style is modified via a CSS property modification.","experimental":true},{"name":"characterDataModified","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node that has changed."},{"name":"characterData","type":"string","description":"New text value."}],"description":"Mirrors <code>DOMCharacterDataModified</code> event."},{"name":"childNodeCountUpdated","parameters":[{"name":"nodeId","$ref":"NodeId","description":"Id of the node that has changed."},{"name":"childNodeCount","type":"integer","description":"New node count."}],"description":"Fired when <code>Container</code>'s child node count has changed."},{"name":"childNodeInserted","parameters":[{"name":"parentNodeId","$ref":"NodeId","description":"Id of the node that has changed."},{"name":"previousNodeId","$ref":"NodeId","description":"If of the previous siblint."},{"name":"node","$ref":"Node","description":"Inserted node data."}],"description":"Mirrors <code>DOMNodeInserted</code> event."},{"name":"childNodeRemoved","parameters":[{"name":"parentNodeId","$ref":"NodeId","description":"Parent id."},{"name":"nodeId","$ref":"NodeId","description":"Id of the node that has been removed."}],"description":"Mirrors <code>DOMNodeRemoved</code> event."},{"name":"shadowRootPushed","parameters":[{"name":"hostId","$ref":"NodeId","description":"Host element id."},{"name":"root","$ref":"Node","description":"Shadow root."}],"description":"Called when shadow root is pushed into the element.","experimental":true},{"name":"shadowRootPopped","parameters":[{"name":"hostId","$ref":"NodeId","description":"Host element id."},{"name":"rootId","$ref":"NodeId","description":"Shadow root id."}],"description":"Called when shadow root is popped from the element.","experimental":true},{"name":"pseudoElementAdded","parameters":[{"name":"parentId","$ref":"NodeId","description":"Pseudo element's parent element id."},{"name":"pseudoElement","$ref":"Node","description":"The added pseudo element."}],"description":"Called when a pseudo element is added to an element.","experimental":true},{"name":"pseudoElementRemoved","parameters":[{"name":"parentId","$ref":"NodeId","description":"Pseudo element's parent element id."},{"name":"pseudoElementId","$ref":"NodeId","description":"The removed pseudo element id."}],"description":"Called when a pseudo element is removed from an element.","experimental":true},{"name":"distributedNodesUpdated","parameters":[{"name":"insertionPointId","$ref":"NodeId","description":"Insertion point where distrubuted nodes were updated."},{"name":"distributedNodes","type":"array","items":{"$ref":"BackendNode"},"description":"Distributed nodes for given insertion point."}],"description":"Called when distrubution is changed.","experimental":true}]},{"domain":"CSS","experimental":true,"description":"This domain exposes CSS read/write operations. All CSS objects (stylesheets, rules, and styles) have an associated <code>id</code> used in subsequent operations on the related object. Each object type has a specific <code>id</code> structure, and those are not interchangeable between objects of different kinds. CSS objects can be loaded using the <code>get*ForNode()</code> calls (which accept a DOM node id). A client can also keep track of stylesheets via the <code>styleSheetAdded</code>/<code>styleSheetRemoved</code> events and subsequently load the required stylesheet contents using the <code>getStyleSheet[Text]()</code> methods.","dependencies":["DOM"],"types":[{"id":"StyleSheetId","type":"string"},{"id":"StyleSheetOrigin","type":"string","enum":["injected","user-agent","inspector","regular"],"description":"Stylesheet type: \"injected\" for stylesheets injected via extension, \"user-agent\" for user-agent stylesheets, \"inspector\" for stylesheets created by the inspector (i.e. those holding the \"via inspector\" rules), \"regular\" for regular stylesheets."},{"id":"PseudoElementMatches","type":"object","properties":[{"name":"pseudoType","$ref":"DOM.PseudoType","description":"Pseudo element type."},{"name":"matches","type":"array","items":{"$ref":"RuleMatch"},"description":"Matches of CSS rules applicable to the pseudo style."}],"description":"CSS rule collection for a single pseudo style."},{"id":"InheritedStyleEntry","type":"object","properties":[{"name":"inlineStyle","$ref":"CSSStyle","optional":true,"description":"The ancestor node's inline style, if any, in the style inheritance chain."},{"name":"matchedCSSRules","type":"array","items":{"$ref":"RuleMatch"},"description":"Matches of CSS rules matching the ancestor node in the style inheritance chain."}],"description":"Inherited CSS rule collection from ancestor node."},{"id":"RuleMatch","type":"object","properties":[{"name":"rule","$ref":"CSSRule","description":"CSS rule in the match."},{"name":"matchingSelectors","type":"array","items":{"type":"integer"},"description":"Matching selector indices in the rule's selectorList selectors (0-based)."}],"description":"Match data for a CSS rule."},{"id":"Value","type":"object","properties":[{"name":"text","type":"string","description":"Value text."},{"name":"range","$ref":"SourceRange","optional":true,"description":"Value range in the underlying resource (if available)."}],"description":"Data for a simple selector (these are delimited by commas in a selector list)."},{"id":"SelectorList","type":"object","properties":[{"name":"selectors","type":"array","items":{"$ref":"Value"},"description":"Selectors in the list."},{"name":"text","type":"string","description":"Rule selector text."}],"description":"Selector list data."},{"id":"CSSStyleSheetHeader","type":"object","properties":[{"name":"styleSheetId","$ref":"StyleSheetId","description":"The stylesheet identifier."},{"name":"frameId","$ref":"Page.FrameId","description":"Owner frame identifier."},{"name":"sourceURL","type":"string","description":"Stylesheet resource URL."},{"name":"sourceMapURL","type":"string","optional":true,"description":"URL of source map associated with the stylesheet (if any)."},{"name":"origin","$ref":"StyleSheetOrigin","description":"Stylesheet origin."},{"name":"title","type":"string","description":"Stylesheet title."},{"name":"ownerNode","$ref":"DOM.BackendNodeId","optional":true,"description":"The backend id for the owner node of the stylesheet."},{"name":"disabled","type":"boolean","description":"Denotes whether the stylesheet is disabled."},{"name":"hasSourceURL","type":"boolean","optional":true,"description":"Whether the sourceURL field value comes from the sourceURL comment."},{"name":"isInline","type":"boolean","description":"Whether this stylesheet is created for STYLE tag by parser. This flag is not set for document.written STYLE tags."},{"name":"startLine","type":"number","description":"Line offset of the stylesheet within the resource (zero based)."},{"name":"startColumn","type":"number","description":"Column offset of the stylesheet within the resource (zero based)."},{"name":"length","type":"number","description":"Size of the content (in characters).","experimental":true}],"description":"CSS stylesheet metainformation."},{"id":"CSSRule","type":"object","properties":[{"name":"styleSheetId","$ref":"StyleSheetId","optional":true,"description":"The css style sheet identifier (absent for user agent stylesheet and user-specified stylesheet rules) this rule came from."},{"name":"selectorList","$ref":"SelectorList","description":"Rule selector data."},{"name":"origin","$ref":"StyleSheetOrigin","description":"Parent stylesheet's origin."},{"name":"style","$ref":"CSSStyle","description":"Associated style declaration."},{"name":"media","type":"array","items":{"$ref":"CSSMedia"},"optional":true,"description":"Media list array (for rules involving media queries). The array enumerates media queries starting with the innermost one, going outwards."}],"description":"CSS rule representation."},{"id":"RuleUsage","type":"object","properties":[{"name":"styleSheetId","$ref":"StyleSheetId","description":"The css style sheet identifier (absent for user agent stylesheet and user-specified stylesheet rules) this rule came from."},{"name":"startOffset","type":"number","description":"Offset of the start of the rule (including selector) from the beginning of the stylesheet."},{"name":"endOffset","type":"number","description":"Offset of the end of the rule body from the beginning of the stylesheet."},{"name":"used","type":"boolean","description":"Indicates whether the rule was actually used by some element in the page."}],"description":"CSS coverage information.","experimental":true},{"id":"SourceRange","type":"object","properties":[{"name":"startLine","type":"integer","description":"Start line of range."},{"name":"startColumn","type":"integer","description":"Start column of range (inclusive)."},{"name":"endLine","type":"integer","description":"End line of range"},{"name":"endColumn","type":"integer","description":"End column of range (exclusive)."}],"description":"Text range within a resource. All numbers are zero-based."},{"id":"ShorthandEntry","type":"object","properties":[{"name":"name","type":"string","description":"Shorthand name."},{"name":"value","type":"string","description":"Shorthand value."},{"name":"important","type":"boolean","optional":true,"description":"Whether the property has \"!important\" annotation (implies <code>false</code> if absent)."}]},{"id":"CSSComputedStyleProperty","type":"object","properties":[{"name":"name","type":"string","description":"Computed style property name."},{"name":"value","type":"string","description":"Computed style property value."}]},{"id":"CSSStyle","type":"object","properties":[{"name":"styleSheetId","$ref":"StyleSheetId","optional":true,"description":"The css style sheet identifier (absent for user agent stylesheet and user-specified stylesheet rules) this rule came from."},{"name":"cssProperties","type":"array","items":{"$ref":"CSSProperty"},"description":"CSS properties in the style."},{"name":"shorthandEntries","type":"array","items":{"$ref":"ShorthandEntry"},"description":"Computed values for all shorthands found in the style."},{"name":"cssText","type":"string","optional":true,"description":"Style declaration text (if available)."},{"name":"range","$ref":"SourceRange","optional":true,"description":"Style declaration range in the enclosing stylesheet (if available)."}],"description":"CSS style representation."},{"id":"CSSProperty","type":"object","properties":[{"name":"name","type":"string","description":"The property name."},{"name":"value","type":"string","description":"The property value."},{"name":"important","type":"boolean","optional":true,"description":"Whether the property has \"!important\" annotation (implies <code>false</code> if absent)."},{"name":"implicit","type":"boolean","optional":true,"description":"Whether the property is implicit (implies <code>false</code> if absent)."},{"name":"text","type":"string","optional":true,"description":"The full property text as specified in the style."},{"name":"parsedOk","type":"boolean","optional":true,"description":"Whether the property is understood by the browser (implies <code>true</code> if absent)."},{"name":"disabled","type":"boolean","optional":true,"description":"Whether the property is disabled by the user (present for source-based properties only)."},{"name":"range","$ref":"SourceRange","optional":true,"description":"The entire property range in the enclosing style declaration (if available)."}],"description":"CSS property declaration data."},{"id":"CSSMedia","type":"object","properties":[{"name":"text","type":"string","description":"Media query text."},{"name":"source","type":"string","enum":["mediaRule","importRule","linkedSheet","inlineSheet"],"description":"Source of the media query: \"mediaRule\" if specified by a @media rule, \"importRule\" if specified by an @import rule, \"linkedSheet\" if specified by a \"media\" attribute in a linked stylesheet's LINK tag, \"inlineSheet\" if specified by a \"media\" attribute in an inline stylesheet's STYLE tag."},{"name":"sourceURL","type":"string","optional":true,"description":"URL of the document containing the media query description."},{"name":"range","$ref":"SourceRange","optional":true,"description":"The associated rule (@media or @import) header range in the enclosing stylesheet (if available)."},{"name":"styleSheetId","$ref":"StyleSheetId","optional":true,"description":"Identifier of the stylesheet containing this object (if exists)."},{"name":"mediaList","type":"array","items":{"$ref":"MediaQuery"},"optional":true,"experimental":true,"description":"Array of media queries."}],"description":"CSS media rule descriptor."},{"id":"MediaQuery","type":"object","properties":[{"name":"expressions","type":"array","items":{"$ref":"MediaQueryExpression"},"description":"Array of media query expressions."},{"name":"active","type":"boolean","description":"Whether the media query condition is satisfied."}],"description":"Media query descriptor.","experimental":true},{"id":"MediaQueryExpression","type":"object","properties":[{"name":"value","type":"number","description":"Media query expression value."},{"name":"unit","type":"string","description":"Media query expression units."},{"name":"feature","type":"string","description":"Media query expression feature."},{"name":"valueRange","$ref":"SourceRange","optional":true,"description":"The associated range of the value text in the enclosing stylesheet (if available)."},{"name":"computedLength","type":"number","optional":true,"description":"Computed length of media query expression (if applicable)."}],"description":"Media query expression descriptor.","experimental":true},{"id":"PlatformFontUsage","type":"object","properties":[{"name":"familyName","type":"string","description":"Font's family name reported by platform."},{"name":"isCustomFont","type":"boolean","description":"Indicates if the font was downloaded or resolved locally."},{"name":"glyphCount","type":"number","description":"Amount of glyphs that were rendered with this font."}],"description":"Information about amount of glyphs that were rendered with given font.","experimental":true},{"id":"CSSKeyframesRule","type":"object","properties":[{"name":"animationName","$ref":"Value","description":"Animation name."},{"name":"keyframes","type":"array","items":{"$ref":"CSSKeyframeRule"},"description":"List of keyframes."}],"description":"CSS keyframes rule representation."},{"id":"CSSKeyframeRule","type":"object","properties":[{"name":"styleSheetId","$ref":"StyleSheetId","optional":true,"description":"The css style sheet identifier (absent for user agent stylesheet and user-specified stylesheet rules) this rule came from."},{"name":"origin","$ref":"StyleSheetOrigin","description":"Parent stylesheet's origin."},{"name":"keyText","$ref":"Value","description":"Associated key text."},{"name":"style","$ref":"CSSStyle","description":"Associated style declaration."}],"description":"CSS keyframe rule representation."},{"id":"StyleDeclarationEdit","type":"object","properties":[{"name":"styleSheetId","$ref":"StyleSheetId","description":"The css style sheet identifier."},{"name":"range","$ref":"SourceRange","description":"The range of the style text in the enclosing stylesheet."},{"name":"text","type":"string","description":"New style text."}],"description":"A descriptor of operation to mutate style declaration text."},{"id":"InlineTextBox","type":"object","properties":[{"name":"boundingBox","$ref":"DOM.Rect","description":"The absolute position bounding box."},{"name":"startCharacterIndex","type":"integer","description":"The starting index in characters, for this post layout textbox substring."},{"name":"numCharacters","type":"integer","description":"The number of characters in this post layout textbox substring."}],"description":"Details of post layout rendered text positions. The exact layout should not be regarded as stable and may change between versions.","experimental":true}],"commands":[{"name":"enable","description":"Enables the CSS agent for the given page. Clients should not assume that the CSS agent has been enabled until the result of this command is received."},{"name":"disable","description":"Disables the CSS agent for the given page."},{"name":"getMatchedStylesForNode","parameters":[{"name":"nodeId","$ref":"DOM.NodeId"}],"returns":[{"name":"inlineStyle","$ref":"CSSStyle","optional":true,"description":"Inline style for the specified DOM node."},{"name":"attributesStyle","$ref":"CSSStyle","optional":true,"description":"Attribute-defined element style (e.g. resulting from \"width=20 height=100%\")."},{"name":"matchedCSSRules","type":"array","items":{"$ref":"RuleMatch"},"optional":true,"description":"CSS rules matching this node, from all applicable stylesheets."},{"name":"pseudoElements","type":"array","items":{"$ref":"PseudoElementMatches"},"optional":true,"description":"Pseudo style matches for this node."},{"name":"inherited","type":"array","items":{"$ref":"InheritedStyleEntry"},"optional":true,"description":"A chain of inherited styles (from the immediate node parent up to the DOM tree root)."},{"name":"cssKeyframesRules","type":"array","items":{"$ref":"CSSKeyframesRule"},"optional":true,"description":"A list of CSS keyframed animations matching this node."}],"description":"Returns requested styles for a DOM node identified by <code>nodeId</code>."},{"name":"getInlineStylesForNode","parameters":[{"name":"nodeId","$ref":"DOM.NodeId"}],"returns":[{"name":"inlineStyle","$ref":"CSSStyle","optional":true,"description":"Inline style for the specified DOM node."},{"name":"attributesStyle","$ref":"CSSStyle","optional":true,"description":"Attribute-defined element style (e.g. resulting from \"width=20 height=100%\")."}],"description":"Returns the styles defined inline (explicitly in the \"style\" attribute and implicitly, using DOM attributes) for a DOM node identified by <code>nodeId</code>."},{"name":"getComputedStyleForNode","parameters":[{"name":"nodeId","$ref":"DOM.NodeId"}],"returns":[{"name":"computedStyle","type":"array","items":{"$ref":"CSSComputedStyleProperty"},"description":"Computed style for the specified DOM node."}],"description":"Returns the computed style for a DOM node identified by <code>nodeId</code>."},{"name":"getPlatformFontsForNode","parameters":[{"name":"nodeId","$ref":"DOM.NodeId"}],"returns":[{"name":"fonts","type":"array","items":{"$ref":"PlatformFontUsage"},"description":"Usage statistics for every employed platform font."}],"description":"Requests information about platform fonts which we used to render child TextNodes in the given node.","experimental":true},{"name":"getStyleSheetText","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId"}],"returns":[{"name":"text","type":"string","description":"The stylesheet text."}],"description":"Returns the current textual content and the URL for a stylesheet."},{"name":"collectClassNames","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId"}],"returns":[{"name":"classNames","type":"array","items":{"type":"string"},"description":"Class name list."}],"description":"Returns all class names from specified stylesheet.","experimental":true},{"name":"setStyleSheetText","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId"},{"name":"text","type":"string"}],"returns":[{"name":"sourceMapURL","type":"string","optional":true,"description":"URL of source map associated with script (if any)."}],"description":"Sets the new stylesheet text."},{"name":"setRuleSelector","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId"},{"name":"range","$ref":"SourceRange"},{"name":"selector","type":"string"}],"returns":[{"name":"selectorList","$ref":"SelectorList","description":"The resulting selector list after modification."}],"description":"Modifies the rule selector."},{"name":"setKeyframeKey","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId"},{"name":"range","$ref":"SourceRange"},{"name":"keyText","type":"string"}],"returns":[{"name":"keyText","$ref":"Value","description":"The resulting key text after modification."}],"description":"Modifies the keyframe rule key text."},{"name":"setStyleTexts","parameters":[{"name":"edits","type":"array","items":{"$ref":"StyleDeclarationEdit"}}],"returns":[{"name":"styles","type":"array","items":{"$ref":"CSSStyle"},"description":"The resulting styles after modification."}],"description":"Applies specified style edits one after another in the given order."},{"name":"setMediaText","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId"},{"name":"range","$ref":"SourceRange"},{"name":"text","type":"string"}],"returns":[{"name":"media","$ref":"CSSMedia","description":"The resulting CSS media rule after modification."}],"description":"Modifies the rule selector."},{"name":"createStyleSheet","parameters":[{"name":"frameId","$ref":"Page.FrameId","description":"Identifier of the frame where \"via-inspector\" stylesheet should be created."}],"returns":[{"name":"styleSheetId","$ref":"StyleSheetId","description":"Identifier of the created \"via-inspector\" stylesheet."}],"description":"Creates a new special \"via-inspector\" stylesheet in the frame with given <code>frameId</code>."},{"name":"addRule","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId","description":"The css style sheet identifier where a new rule should be inserted."},{"name":"ruleText","type":"string","description":"The text of a new rule."},{"name":"location","$ref":"SourceRange","description":"Text position of a new rule in the target style sheet."}],"returns":[{"name":"rule","$ref":"CSSRule","description":"The newly created rule."}],"description":"Inserts a new rule with the given <code>ruleText</code> in a stylesheet with given <code>styleSheetId</code>, at the position specified by <code>location</code>."},{"name":"forcePseudoState","parameters":[{"name":"nodeId","$ref":"DOM.NodeId","description":"The element id for which to force the pseudo state."},{"name":"forcedPseudoClasses","type":"array","items":{"type":"string","enum":["active","focus","hover","visited"]},"description":"Element pseudo classes to force when computing the element's style."}],"description":"Ensures that the given node will have specified pseudo-classes whenever its style is computed by the browser."},{"name":"getMediaQueries","returns":[{"name":"medias","type":"array","items":{"$ref":"CSSMedia"}}],"description":"Returns all media queries parsed by the rendering engine.","experimental":true},{"name":"setEffectivePropertyValueForNode","parameters":[{"name":"nodeId","$ref":"DOM.NodeId","description":"The element id for which to set property."},{"name":"propertyName","type":"string"},{"name":"value","type":"string"}],"description":"Find a rule with the given active property for the given node and set the new value for this property","experimental":true},{"name":"getBackgroundColors","parameters":[{"name":"nodeId","$ref":"DOM.NodeId","description":"Id of the node to get background colors for."}],"returns":[{"name":"backgroundColors","type":"array","items":{"type":"string"},"description":"The range of background colors behind this element, if it contains any visible text. If no visible text is present, this will be undefined. In the case of a flat background color, this will consist of simply that color. In the case of a gradient, this will consist of each of the color stops. For anything more complicated, this will be an empty array. Images will be ignored (as if the image had failed to load).","optional":true}],"experimental":true},{"name":"startRuleUsageTracking","description":"Enables the selector recording.","experimental":true},{"name":"takeCoverageDelta","description":"Obtain list of rules that became used since last call to this method (or since start of coverage instrumentation)","returns":[{"name":"coverage","type":"array","items":{"$ref":"RuleUsage"}}],"experimental":true},{"name":"stopRuleUsageTracking","returns":[{"name":"ruleUsage","type":"array","items":{"$ref":"RuleUsage"}}],"description":"The list of rules with an indication of whether these were used","experimental":true}],"events":[{"name":"mediaQueryResultChanged","description":"Fires whenever a MediaQuery result changes (for example, after a browser window has been resized.) The current implementation considers only viewport-dependent media features."},{"name":"fontsUpdated","description":"Fires whenever a web font gets loaded."},{"name":"styleSheetChanged","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId"}],"description":"Fired whenever a stylesheet is changed as a result of the client operation."},{"name":"styleSheetAdded","parameters":[{"name":"header","$ref":"CSSStyleSheetHeader","description":"Added stylesheet metainfo."}],"description":"Fired whenever an active document stylesheet is added."},{"name":"styleSheetRemoved","parameters":[{"name":"styleSheetId","$ref":"StyleSheetId","description":"Identifier of the removed stylesheet."}],"description":"Fired whenever an active document stylesheet is removed."}]},{"domain":"DOMSnapshot","experimental":true,"description":"This domain facilitates obtaining document snapshots with DOM, layout, and style information.","dependencies":["CSS","DOM","Page"],"types":[{"id":"DOMNode","type":"object","properties":[{"name":"nodeType","type":"integer","description":"<code>Node</code>'s nodeType."},{"name":"nodeName","type":"string","description":"<code>Node</code>'s nodeName."},{"name":"nodeValue","type":"string","description":"<code>Node</code>'s nodeValue."},{"name":"textValue","type":"string","optional":true,"description":"Only set for textarea elements, contains the text value."},{"name":"inputValue","type":"string","optional":true,"description":"Only set for input elements, contains the input's associated text value."},{"name":"inputChecked","type":"boolean","optional":true,"description":"Only set for radio and checkbox input elements, indicates if the element has been checked"},{"name":"optionSelected","type":"boolean","optional":true,"description":"Only set for option elements, indicates if the element has been selected"},{"name":"backendNodeId","$ref":"DOM.BackendNodeId","description":"<code>Node</code>'s id, corresponds to DOM.Node.backendNodeId."},{"name":"childNodeIndexes","type":"array","items":{"type":"integer"},"optional":true,"description":"The indexes of the node's child nodes in the <code>domNodes</code> array returned by <code>getSnapshot</code>, if any."},{"name":"attributes","type":"array","items":{"$ref":"NameValue"},"optional":true,"description":"Attributes of an <code>Element</code> node."},{"name":"pseudoElementIndexes","type":"array","items":{"type":"integer"},"optional":true,"description":"Indexes of pseudo elements associated with this node in the <code>domNodes</code> array returned by <code>getSnapshot</code>, if any."},{"name":"layoutNodeIndex","type":"integer","optional":true,"description":"The index of the node's related layout tree node in the <code>layoutTreeNodes</code> array returned by <code>getSnapshot</code>, if any."},{"name":"documentURL","type":"string","optional":true,"description":"Document URL that <code>Document</code> or <code>FrameOwner</code> node points to."},{"name":"baseURL","type":"string","optional":true,"description":"Base URL that <code>Document</code> or <code>FrameOwner</code> node uses for URL completion."},{"name":"contentLanguage","type":"string","optional":true,"description":"Only set for documents, contains the document's content language."},{"name":"publicId","type":"string","optional":true,"description":"<code>DocumentType</code> node's publicId."},{"name":"systemId","type":"string","optional":true,"description":"<code>DocumentType</code> node's systemId."},{"name":"frameId","$ref":"Page.FrameId","optional":true,"description":"Frame ID for frame owner elements."},{"name":"contentDocumentIndex","type":"integer","optional":true,"description":"The index of a frame owner element's content document in the <code>domNodes</code> array returned by <code>getSnapshot</code>, if any."},{"name":"importedDocumentIndex","type":"integer","optional":true,"description":"Index of the imported document's node of a link element in the <code>domNodes</code> array returned by <code>getSnapshot</code>, if any."},{"name":"templateContentIndex","type":"integer","optional":true,"description":"Index of the content node of a template element in the <code>domNodes</code> array returned by <code>getSnapshot</code>."},{"name":"pseudoType","$ref":"DOM.PseudoType","optional":true,"description":"Type of a pseudo element node."},{"name":"isClickable","type":"boolean","optional":true,"description":"Whether this DOM node responds to mouse clicks. This includes nodes that have had click event listeners attached via JavaScript as well as anchor tags that naturally navigate when clicked."}],"description":"A Node in the DOM tree."},{"id":"LayoutTreeNode","type":"object","properties":[{"name":"domNodeIndex","type":"integer","description":"The index of the related DOM node in the <code>domNodes</code> array returned by <code>getSnapshot</code>."},{"name":"boundingBox","$ref":"DOM.Rect","description":"The absolute position bounding box."},{"name":"layoutText","type":"string","optional":true,"description":"Contents of the LayoutText, if any."},{"name":"inlineTextNodes","type":"array","optional":true,"items":{"$ref":"CSS.InlineTextBox"},"description":"The post-layout inline text nodes, if any."},{"name":"styleIndex","type":"integer","optional":true,"description":"Index into the <code>computedStyles</code> array returned by <code>getSnapshot</code>."}],"description":"Details of an element in the DOM tree with a LayoutObject."},{"id":"ComputedStyle","type":"object","properties":[{"name":"properties","type":"array","items":{"$ref":"NameValue"},"description":"Name/value pairs of computed style properties."}],"description":"A subset of the full ComputedStyle as defined by the request whitelist."},{"id":"NameValue","type":"object","properties":[{"name":"name","type":"string","description":"Attribute/property name."},{"name":"value","type":"string","description":"Attribute/property value."}],"description":"A name/value pair."}],"commands":[{"name":"getSnapshot","parameters":[{"name":"computedStyleWhitelist","type":"array","items":{"type":"string"},"description":"Whitelist of computed styles to return."}],"returns":[{"name":"domNodes","type":"array","items":{"$ref":"DOMNode"},"description":"The nodes in the DOM tree. The DOMNode at index 0 corresponds to the root document."},{"name":"layoutTreeNodes","type":"array","items":{"$ref":"LayoutTreeNode"},"description":"The nodes in the layout tree."},{"name":"computedStyles","type":"array","items":{"$ref":"ComputedStyle"},"description":"Whitelisted ComputedStyle properties for each node in the layout tree."}],"description":"Returns a document snapshot, including the full DOM tree of the root node (including iframes, template contents, and imported documents) in a flattened array, as well as layout and white-listed computed style information for the nodes. Shadow DOM in the returned DOM tree is flattened. "}]},{"domain":"IO","description":"Input/Output operations for streams produced by DevTools.","experimental":true,"types":[{"id":"StreamHandle","type":"string"}],"commands":[{"name":"read","description":"Read a chunk of the stream","parameters":[{"name":"handle","$ref":"StreamHandle","description":"Handle of the stream to read."},{"name":"offset","type":"integer","optional":true,"description":"Seek to the specified offset before reading (if not specificed, proceed with offset following the last read)."},{"name":"size","type":"integer","optional":true,"description":"Maximum number of bytes to read (left upon the agent discretion if not specified)."}],"returns":[{"name":"data","type":"string","description":"Data that were read."},{"name":"eof","type":"boolean","description":"Set if the end-of-file condition occured while reading."}]},{"name":"close","description":"Close the stream, discard any temporary backing storage.","parameters":[{"name":"handle","$ref":"StreamHandle","description":"Handle of the stream to close."}]}]},{"domain":"DOMDebugger","description":"DOM debugging allows setting breakpoints on particular DOM operations and events. JavaScript execution will stop on these operations as if there was a regular breakpoint set.","dependencies":["DOM","Debugger"],"types":[{"id":"DOMBreakpointType","type":"string","enum":["subtree-modified","attribute-modified","node-removed"],"description":"DOM breakpoint type."},{"id":"EventListener","type":"object","description":"Object event listener.","properties":[{"name":"type","type":"string","description":"<code>EventListener</code>'s type."},{"name":"useCapture","type":"boolean","description":"<code>EventListener</code>'s useCapture."},{"name":"passive","type":"boolean","description":"<code>EventListener</code>'s passive flag."},{"name":"once","type":"boolean","description":"<code>EventListener</code>'s once flag."},{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Script id of the handler code."},{"name":"lineNumber","type":"integer","description":"Line number in the script (0-based)."},{"name":"columnNumber","type":"integer","description":"Column number in the script (0-based)."},{"name":"handler","$ref":"Runtime.RemoteObject","optional":true,"description":"Event handler function value."},{"name":"originalHandler","$ref":"Runtime.RemoteObject","optional":true,"description":"Event original handler function value."},{"name":"backendNodeId","$ref":"DOM.BackendNodeId","optional":true,"description":"Node the listener is added to (if any)."}],"experimental":true}],"commands":[{"name":"setDOMBreakpoint","parameters":[{"name":"nodeId","$ref":"DOM.NodeId","description":"Identifier of the node to set breakpoint on."},{"name":"type","$ref":"DOMBreakpointType","description":"Type of the operation to stop upon."}],"description":"Sets breakpoint on particular operation with DOM."},{"name":"removeDOMBreakpoint","parameters":[{"name":"nodeId","$ref":"DOM.NodeId","description":"Identifier of the node to remove breakpoint from."},{"name":"type","$ref":"DOMBreakpointType","description":"Type of the breakpoint to remove."}],"description":"Removes DOM breakpoint that was set using <code>setDOMBreakpoint</code>."},{"name":"setEventListenerBreakpoint","parameters":[{"name":"eventName","type":"string","description":"DOM Event name to stop on (any DOM event will do)."},{"name":"targetName","type":"string","optional":true,"description":"EventTarget interface name to stop on. If equal to <code>\"*\"</code> or not provided, will stop on any EventTarget.","experimental":true}],"description":"Sets breakpoint on particular DOM event."},{"name":"removeEventListenerBreakpoint","parameters":[{"name":"eventName","type":"string","description":"Event name."},{"name":"targetName","type":"string","optional":true,"description":"EventTarget interface name.","experimental":true}],"description":"Removes breakpoint on particular DOM event."},{"name":"setInstrumentationBreakpoint","parameters":[{"name":"eventName","type":"string","description":"Instrumentation name to stop on."}],"description":"Sets breakpoint on particular native event.","experimental":true},{"name":"removeInstrumentationBreakpoint","parameters":[{"name":"eventName","type":"string","description":"Instrumentation name to stop on."}],"description":"Removes breakpoint on particular native event.","experimental":true},{"name":"setXHRBreakpoint","parameters":[{"name":"url","type":"string","description":"Resource URL substring. All XHRs having this substring in the URL will get stopped upon."}],"description":"Sets breakpoint on XMLHttpRequest."},{"name":"removeXHRBreakpoint","parameters":[{"name":"url","type":"string","description":"Resource URL substring."}],"description":"Removes breakpoint from XMLHttpRequest."},{"name":"getEventListeners","experimental":true,"parameters":[{"name":"objectId","$ref":"Runtime.RemoteObjectId","description":"Identifier of the object to return listeners for."},{"name":"depth","type":"integer","optional":true,"description":"The maximum depth at which Node children should be retrieved, defaults to 1. Use -1 for the entire subtree or provide an integer larger than 0.","experimental":true},{"name":"pierce","type":"boolean","optional":true,"description":"Whether or not iframes and shadow roots should be traversed when returning the subtree (default is false). Reports listeners for all contexts if pierce is enabled.","experimental":true}],"returns":[{"name":"listeners","type":"array","items":{"$ref":"EventListener"},"description":"Array of relevant listeners."}],"description":"Returns event listeners of the given object."}]},{"domain":"Target","description":"Supports additional targets discovery and allows to attach to them.","experimental":true,"types":[{"id":"TargetID","type":"string"},{"id":"BrowserContextID","type":"string"},{"id":"TargetInfo","type":"object","properties":[{"name":"targetId","$ref":"TargetID"},{"name":"type","type":"string"},{"name":"title","type":"string"},{"name":"url","type":"string"},{"name":"attached","type":"boolean","description":"Whether the target has an attached client."}]},{"id":"RemoteLocation","type":"object","properties":[{"name":"host","type":"string"},{"name":"port","type":"integer"}]}],"commands":[{"name":"setDiscoverTargets","description":"Controls whether to discover available targets and notify via <code>targetCreated/targetInfoChanged/targetDestroyed</code> events.","parameters":[{"name":"discover","type":"boolean","description":"Whether to discover available targets."}]},{"name":"setAutoAttach","description":"Controls whether to automatically attach to new targets which are considered to be related to this one. When turned on, attaches to all existing related targets as well. When turned off, automatically detaches from all currently attached targets.","parameters":[{"name":"autoAttach","type":"boolean","description":"Whether to auto-attach to related targets."},{"name":"waitForDebuggerOnStart","type":"boolean","description":"Whether to pause new targets when attaching to them. Use <code>Runtime.runIfWaitingForDebugger</code> to run paused targets."}]},{"name":"setAttachToFrames","parameters":[{"name":"value","type":"boolean","description":"Whether to attach to frames."}]},{"name":"setRemoteLocations","description":"Enables target discovery for the specified locations, when <code>setDiscoverTargets</code> was set to <code>true</code>.","parameters":[{"name":"locations","type":"array","items":{"$ref":"RemoteLocation"},"description":"List of remote locations."}]},{"name":"sendMessageToTarget","description":"Sends protocol message to the target with given id.","parameters":[{"name":"targetId","$ref":"TargetID"},{"name":"message","type":"string"}]},{"name":"getTargetInfo","description":"Returns information about a target.","parameters":[{"name":"targetId","$ref":"TargetID"}],"returns":[{"name":"targetInfo","$ref":"TargetInfo"}]},{"name":"activateTarget","description":"Activates (focuses) the target.","parameters":[{"name":"targetId","$ref":"TargetID"}]},{"name":"closeTarget","description":"Closes the target. If the target is a page that gets closed too.","parameters":[{"name":"targetId","$ref":"TargetID"}],"returns":[{"name":"success","type":"boolean"}]},{"name":"attachToTarget","description":"Attaches to the target with given id.","parameters":[{"name":"targetId","$ref":"TargetID"}],"returns":[{"name":"success","type":"boolean","description":"Whether attach succeeded."}]},{"name":"detachFromTarget","description":"Detaches from the target with given id.","parameters":[{"name":"targetId","$ref":"TargetID"}]},{"name":"createBrowserContext","description":"Creates a new empty BrowserContext. Similar to an incognito profile but you can have more than one.","returns":[{"name":"browserContextId","$ref":"BrowserContextID","description":"The id of the context created."}]},{"name":"disposeBrowserContext","description":"Deletes a BrowserContext, will fail of any open page uses it.","parameters":[{"name":"browserContextId","$ref":"BrowserContextID"}],"returns":[{"name":"success","type":"boolean"}]},{"name":"createTarget","description":"Creates a new page.","parameters":[{"name":"url","type":"string","description":"The initial URL the page will be navigated to."},{"name":"width","type":"integer","description":"Frame width in DIP (headless chrome only).","optional":true},{"name":"height","type":"integer","description":"Frame height in DIP (headless chrome only).","optional":true},{"name":"browserContextId","$ref":"BrowserContextID","description":"The browser context to create the page in (headless chrome only).","optional":true}],"returns":[{"name":"targetId","$ref":"TargetID","description":"The id of the page opened."}]},{"name":"getTargets","description":"Retrieves a list of available targets.","returns":[{"name":"targetInfos","type":"array","items":{"$ref":"TargetInfo"},"description":"The list of targets."}]}],"events":[{"name":"targetCreated","description":"Issued when a possible inspection target is created.","parameters":[{"name":"targetInfo","$ref":"TargetInfo"}]},{"name":"targetInfoChanged","description":"Issued when some information about a target has changed. This only happens between <code>targetCreated</code> and <code>targetDestroyed</code>.","parameters":[{"name":"targetInfo","$ref":"TargetInfo"}]},{"name":"targetDestroyed","description":"Issued when a target is destroyed.","parameters":[{"name":"targetId","$ref":"TargetID"}]},{"name":"attachedToTarget","description":"Issued when attached to target because of auto-attach or <code>attachToTarget</code> command.","parameters":[{"name":"targetInfo","$ref":"TargetInfo"},{"name":"waitingForDebugger","type":"boolean"}]},{"name":"detachedFromTarget","description":"Issued when detached from target for any reason (including <code>detachFromTarget</code> command).","parameters":[{"name":"targetId","$ref":"TargetID"}]},{"name":"receivedMessageFromTarget","description":"Notifies about new protocol message from attached target.","parameters":[{"name":"targetId","$ref":"TargetID"},{"name":"message","type":"string"}]}]},{"domain":"ServiceWorker","experimental":true,"types":[{"id":"ServiceWorkerRegistration","type":"object","description":"ServiceWorker registration.","properties":[{"name":"registrationId","type":"string"},{"name":"scopeURL","type":"string"},{"name":"isDeleted","type":"boolean"}]},{"id":"ServiceWorkerVersionRunningStatus","type":"string","enum":["stopped","starting","running","stopping"]},{"id":"ServiceWorkerVersionStatus","type":"string","enum":["new","installing","installed","activating","activated","redundant"]},{"id":"ServiceWorkerVersion","type":"object","description":"ServiceWorker version.","properties":[{"name":"versionId","type":"string"},{"name":"registrationId","type":"string"},{"name":"scriptURL","type":"string"},{"name":"runningStatus","$ref":"ServiceWorkerVersionRunningStatus"},{"name":"status","$ref":"ServiceWorkerVersionStatus"},{"name":"scriptLastModified","type":"number","optional":true,"description":"The Last-Modified header value of the main script."},{"name":"scriptResponseTime","type":"number","optional":true,"description":"The time at which the response headers of the main script were received from the server.  For cached script it is the last time the cache entry was validated."},{"name":"controlledClients","type":"array","optional":true,"items":{"$ref":"Target.TargetID"}},{"name":"targetId","$ref":"Target.TargetID","optional":true}]},{"id":"ServiceWorkerErrorMessage","type":"object","description":"ServiceWorker error message.","properties":[{"name":"errorMessage","type":"string"},{"name":"registrationId","type":"string"},{"name":"versionId","type":"string"},{"name":"sourceURL","type":"string"},{"name":"lineNumber","type":"integer"},{"name":"columnNumber","type":"integer"}]}],"commands":[{"name":"enable"},{"name":"disable"},{"name":"unregister","parameters":[{"name":"scopeURL","type":"string"}]},{"name":"updateRegistration","parameters":[{"name":"scopeURL","type":"string"}]},{"name":"startWorker","parameters":[{"name":"scopeURL","type":"string"}]},{"name":"skipWaiting","parameters":[{"name":"scopeURL","type":"string"}]},{"name":"stopWorker","parameters":[{"name":"versionId","type":"string"}]},{"name":"inspectWorker","parameters":[{"name":"versionId","type":"string"}]},{"name":"setForceUpdateOnPageLoad","parameters":[{"name":"forceUpdateOnPageLoad","type":"boolean"}]},{"name":"deliverPushMessage","parameters":[{"name":"origin","type":"string"},{"name":"registrationId","type":"string"},{"name":"data","type":"string"}]},{"name":"dispatchSyncEvent","parameters":[{"name":"origin","type":"string"},{"name":"registrationId","type":"string"},{"name":"tag","type":"string"},{"name":"lastChance","type":"boolean"}]}],"events":[{"name":"workerRegistrationUpdated","parameters":[{"name":"registrations","type":"array","items":{"$ref":"ServiceWorkerRegistration"}}]},{"name":"workerVersionUpdated","parameters":[{"name":"versions","type":"array","items":{"$ref":"ServiceWorkerVersion"}}]},{"name":"workerErrorReported","parameters":[{"name":"errorMessage","$ref":"ServiceWorkerErrorMessage"}]}]},{"domain":"Input","types":[{"id":"TouchPoint","type":"object","experimental":true,"properties":[{"name":"state","type":"string","enum":["touchPressed","touchReleased","touchMoved","touchStationary","touchCancelled"],"description":"State of the touch point."},{"name":"x","type":"integer","description":"X coordinate of the event relative to the main frame's viewport."},{"name":"y","type":"integer","description":"Y coordinate of the event relative to the main frame's viewport. 0 refers to the top of the viewport and Y increases as it proceeds towards the bottom of the viewport."},{"name":"radiusX","type":"integer","optional":true,"description":"X radius of the touch area (default: 1)."},{"name":"radiusY","type":"integer","optional":true,"description":"Y radius of the touch area (default: 1)."},{"name":"rotationAngle","type":"number","optional":true,"description":"Rotation angle (default: 0.0)."},{"name":"force","type":"number","optional":true,"description":"Force (default: 1.0)."},{"name":"id","type":"number","optional":true,"description":"Identifier used to track touch sources between events, must be unique within an event."}]},{"id":"GestureSourceType","type":"string","experimental":true,"enum":["default","touch","mouse"]},{"id":"TimeSinceEpoch","type":"number","description":"UTC time in seconds, counted from January 1, 1970."}],"commands":[{"name":"setIgnoreInputEvents","parameters":[{"name":"ignore","type":"boolean","description":"Ignores input events processing when set to true."}],"description":"Ignores input events (useful while auditing page)."},{"name":"dispatchKeyEvent","parameters":[{"name":"type","type":"string","enum":["keyDown","keyUp","rawKeyDown","char"],"description":"Type of the key event."},{"name":"modifiers","type":"integer","optional":true,"description":"Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0)."},{"name":"timestamp","$ref":"TimeSinceEpoch","optional":true,"description":"Time at which the event occurred."},{"name":"text","type":"string","optional":true,"description":"Text as generated by processing a virtual key code with a keyboard layout. Not needed for for <code>keyUp</code> and <code>rawKeyDown</code> events (default: \"\")"},{"name":"unmodifiedText","type":"string","optional":true,"description":"Text that would have been generated by the keyboard if no modifiers were pressed (except for shift). Useful for shortcut (accelerator) key handling (default: \"\")."},{"name":"keyIdentifier","type":"string","optional":true,"description":"Unique key identifier (e.g., 'U+0041') (default: \"\")."},{"name":"code","type":"string","optional":true,"description":"Unique DOM defined string value for each physical key (e.g., 'KeyA') (default: \"\")."},{"name":"key","type":"string","optional":true,"description":"Unique DOM defined string value describing the meaning of the key in the context of active modifiers, keyboard layout, etc (e.g., 'AltGr') (default: \"\")."},{"name":"windowsVirtualKeyCode","type":"integer","optional":true,"description":"Windows virtual key code (default: 0)."},{"name":"nativeVirtualKeyCode","type":"integer","optional":true,"description":"Native virtual key code (default: 0)."},{"name":"autoRepeat","type":"boolean","optional":true,"description":"Whether the event was generated from auto repeat (default: false)."},{"name":"isKeypad","type":"boolean","optional":true,"description":"Whether the event was generated from the keypad (default: false)."},{"name":"isSystemKey","type":"boolean","optional":true,"description":"Whether the event was a system key event (default: false)."}],"description":"Dispatches a key event to the page."},{"name":"dispatchMouseEvent","parameters":[{"name":"type","type":"string","enum":["mousePressed","mouseReleased","mouseMoved"],"description":"Type of the mouse event."},{"name":"x","type":"number","description":"X coordinate of the event relative to the main frame's viewport in CSS pixels."},{"name":"y","type":"number","description":"Y coordinate of the event relative to the main frame's viewport in CSS pixels. 0 refers to the top of the viewport and Y increases as it proceeds towards the bottom of the viewport."},{"name":"modifiers","type":"integer","optional":true,"description":"Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0)."},{"name":"timestamp","$ref":"TimeSinceEpoch","optional":true,"description":"Time at which the event occurred."},{"name":"button","type":"string","enum":["none","left","middle","right"],"optional":true,"description":"Mouse button (default: \"none\")."},{"name":"clickCount","type":"integer","optional":true,"description":"Number of times the mouse button was clicked (default: 0)."}],"description":"Dispatches a mouse event to the page."},{"name":"dispatchTouchEvent","experimental":true,"parameters":[{"name":"type","type":"string","enum":["touchStart","touchEnd","touchMove"],"description":"Type of the touch event."},{"name":"touchPoints","type":"array","items":{"$ref":"TouchPoint"},"description":"Touch points."},{"name":"modifiers","type":"integer","optional":true,"description":"Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0)."},{"name":"timestamp","$ref":"TimeSinceEpoch","optional":true,"description":"Time at which the event occurred."}],"description":"Dispatches a touch event to the page."},{"name":"emulateTouchFromMouseEvent","experimental":true,"parameters":[{"name":"type","type":"string","enum":["mousePressed","mouseReleased","mouseMoved","mouseWheel"],"description":"Type of the mouse event."},{"name":"x","type":"integer","description":"X coordinate of the mouse pointer in DIP."},{"name":"y","type":"integer","description":"Y coordinate of the mouse pointer in DIP."},{"name":"timestamp","$ref":"TimeSinceEpoch","description":"Time at which the event occurred."},{"name":"button","type":"string","enum":["none","left","middle","right"],"description":"Mouse button."},{"name":"deltaX","type":"number","optional":true,"description":"X delta in DIP for mouse wheel event (default: 0)."},{"name":"deltaY","type":"number","optional":true,"description":"Y delta in DIP for mouse wheel event (default: 0)."},{"name":"modifiers","type":"integer","optional":true,"description":"Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0)."},{"name":"clickCount","type":"integer","optional":true,"description":"Number of times the mouse button was clicked (default: 0)."}],"description":"Emulates touch event from the mouse event parameters."},{"name":"synthesizePinchGesture","parameters":[{"name":"x","type":"number","description":"X coordinate of the start of the gesture in CSS pixels."},{"name":"y","type":"number","description":"Y coordinate of the start of the gesture in CSS pixels."},{"name":"scaleFactor","type":"number","description":"Relative scale factor after zooming (>1.0 zooms in, <1.0 zooms out)."},{"name":"relativeSpeed","type":"integer","optional":true,"description":"Relative pointer speed in pixels per second (default: 800)."},{"name":"gestureSourceType","$ref":"GestureSourceType","optional":true,"description":"Which type of input events to be generated (default: 'default', which queries the platform for the preferred input type)."}],"description":"Synthesizes a pinch gesture over a time period by issuing appropriate touch events.","experimental":true},{"name":"synthesizeScrollGesture","parameters":[{"name":"x","type":"number","description":"X coordinate of the start of the gesture in CSS pixels."},{"name":"y","type":"number","description":"Y coordinate of the start of the gesture in CSS pixels."},{"name":"xDistance","type":"number","optional":true,"description":"The distance to scroll along the X axis (positive to scroll left)."},{"name":"yDistance","type":"number","optional":true,"description":"The distance to scroll along the Y axis (positive to scroll up)."},{"name":"xOverscroll","type":"number","optional":true,"description":"The number of additional pixels to scroll back along the X axis, in addition to the given distance."},{"name":"yOverscroll","type":"number","optional":true,"description":"The number of additional pixels to scroll back along the Y axis, in addition to the given distance."},{"name":"preventFling","type":"boolean","optional":true,"description":"Prevent fling (default: true)."},{"name":"speed","type":"integer","optional":true,"description":"Swipe speed in pixels per second (default: 800)."},{"name":"gestureSourceType","$ref":"GestureSourceType","optional":true,"description":"Which type of input events to be generated (default: 'default', which queries the platform for the preferred input type)."},{"name":"repeatCount","type":"integer","optional":true,"description":"The number of times to repeat the gesture (default: 0)."},{"name":"repeatDelayMs","type":"integer","optional":true,"description":"The number of milliseconds delay between each repeat. (default: 250)."},{"name":"interactionMarkerName","type":"string","optional":true,"description":"The name of the interaction markers to generate, if not empty (default: \"\")."}],"description":"Synthesizes a scroll gesture over a time period by issuing appropriate touch events.","experimental":true},{"name":"synthesizeTapGesture","parameters":[{"name":"x","type":"number","description":"X coordinate of the start of the gesture in CSS pixels."},{"name":"y","type":"number","description":"Y coordinate of the start of the gesture in CSS pixels."},{"name":"duration","type":"integer","optional":true,"description":"Duration between touchdown and touchup events in ms (default: 50)."},{"name":"tapCount","type":"integer","optional":true,"description":"Number of times to perform the tap (e.g. 2 for double tap, default: 1)."},{"name":"gestureSourceType","$ref":"GestureSourceType","optional":true,"description":"Which type of input events to be generated (default: 'default', which queries the platform for the preferred input type)."}],"description":"Synthesizes a tap gesture over a time period by issuing appropriate touch events.","experimental":true}],"events":[]},{"domain":"LayerTree","experimental":true,"dependencies":["DOM"],"types":[{"id":"LayerId","type":"string","description":"Unique Layer identifier."},{"id":"SnapshotId","type":"string","description":"Unique snapshot identifier."},{"id":"ScrollRect","type":"object","description":"Rectangle where scrolling happens on the main thread.","properties":[{"name":"rect","$ref":"DOM.Rect","description":"Rectangle itself."},{"name":"type","type":"string","enum":["RepaintsOnScroll","TouchEventHandler","WheelEventHandler"],"description":"Reason for rectangle to force scrolling on the main thread"}]},{"id":"PictureTile","type":"object","description":"Serialized fragment of layer picture along with its offset within the layer.","properties":[{"name":"x","type":"number","description":"Offset from owning layer left boundary"},{"name":"y","type":"number","description":"Offset from owning layer top boundary"},{"name":"picture","type":"string","description":"Base64-encoded snapshot data."}]},{"id":"Layer","type":"object","description":"Information about a compositing layer.","properties":[{"name":"layerId","$ref":"LayerId","description":"The unique id for this layer."},{"name":"parentLayerId","$ref":"LayerId","optional":true,"description":"The id of parent (not present for root)."},{"name":"backendNodeId","$ref":"DOM.BackendNodeId","optional":true,"description":"The backend id for the node associated with this layer."},{"name":"offsetX","type":"number","description":"Offset from parent layer, X coordinate."},{"name":"offsetY","type":"number","description":"Offset from parent layer, Y coordinate."},{"name":"width","type":"number","description":"Layer width."},{"name":"height","type":"number","description":"Layer height."},{"name":"transform","type":"array","items":{"type":"number"},"minItems":16,"maxItems":16,"optional":true,"description":"Transformation matrix for layer, default is identity matrix"},{"name":"anchorX","type":"number","optional":true,"description":"Transform anchor point X, absent if no transform specified"},{"name":"anchorY","type":"number","optional":true,"description":"Transform anchor point Y, absent if no transform specified"},{"name":"anchorZ","type":"number","optional":true,"description":"Transform anchor point Z, absent if no transform specified"},{"name":"paintCount","type":"integer","description":"Indicates how many time this layer has painted."},{"name":"drawsContent","type":"boolean","description":"Indicates whether this layer hosts any content, rather than being used for transform/scrolling purposes only."},{"name":"invisible","type":"boolean","optional":true,"description":"Set if layer is not visible."},{"name":"scrollRects","type":"array","items":{"$ref":"ScrollRect"},"optional":true,"description":"Rectangles scrolling on main thread only."}]},{"id":"PaintProfile","type":"array","description":"Array of timings, one per paint step.","items":{"type":"number","description":"A time in seconds since the end of previous step (for the first step, time since painting started)"}}],"commands":[{"name":"enable","description":"Enables compositing tree inspection."},{"name":"disable","description":"Disables compositing tree inspection."},{"name":"compositingReasons","parameters":[{"name":"layerId","$ref":"LayerId","description":"The id of the layer for which we want to get the reasons it was composited."}],"description":"Provides the reasons why the given layer was composited.","returns":[{"name":"compositingReasons","type":"array","items":{"type":"string"},"description":"A list of strings specifying reasons for the given layer to become composited."}]},{"name":"makeSnapshot","parameters":[{"name":"layerId","$ref":"LayerId","description":"The id of the layer."}],"description":"Returns the layer snapshot identifier.","returns":[{"name":"snapshotId","$ref":"SnapshotId","description":"The id of the layer snapshot."}]},{"name":"loadSnapshot","parameters":[{"name":"tiles","type":"array","items":{"$ref":"PictureTile"},"minItems":1,"description":"An array of tiles composing the snapshot."}],"description":"Returns the snapshot identifier.","returns":[{"name":"snapshotId","$ref":"SnapshotId","description":"The id of the snapshot."}]},{"name":"releaseSnapshot","parameters":[{"name":"snapshotId","$ref":"SnapshotId","description":"The id of the layer snapshot."}],"description":"Releases layer snapshot captured by the back-end."},{"name":"profileSnapshot","parameters":[{"name":"snapshotId","$ref":"SnapshotId","description":"The id of the layer snapshot."},{"name":"minRepeatCount","type":"integer","optional":true,"description":"The maximum number of times to replay the snapshot (1, if not specified)."},{"name":"minDuration","type":"number","optional":true,"description":"The minimum duration (in seconds) to replay the snapshot."},{"name":"clipRect","$ref":"DOM.Rect","optional":true,"description":"The clip rectangle to apply when replaying the snapshot."}],"returns":[{"name":"timings","type":"array","items":{"$ref":"PaintProfile"},"description":"The array of paint profiles, one per run."}]},{"name":"replaySnapshot","parameters":[{"name":"snapshotId","$ref":"SnapshotId","description":"The id of the layer snapshot."},{"name":"fromStep","type":"integer","optional":true,"description":"The first step to replay from (replay from the very start if not specified)."},{"name":"toStep","type":"integer","optional":true,"description":"The last step to replay to (replay till the end if not specified)."},{"name":"scale","type":"number","optional":true,"description":"The scale to apply while replaying (defaults to 1)."}],"description":"Replays the layer snapshot and returns the resulting bitmap.","returns":[{"name":"dataURL","type":"string","description":"A data: URL for resulting image."}]},{"name":"snapshotCommandLog","parameters":[{"name":"snapshotId","$ref":"SnapshotId","description":"The id of the layer snapshot."}],"description":"Replays the layer snapshot and returns canvas log.","returns":[{"name":"commandLog","type":"array","items":{"type":"object"},"description":"The array of canvas function calls."}]}],"events":[{"name":"layerTreeDidChange","parameters":[{"name":"layers","type":"array","items":{"$ref":"Layer"},"optional":true,"description":"Layer tree, absent if not in the comspositing mode."}]},{"name":"layerPainted","parameters":[{"name":"layerId","$ref":"LayerId","description":"The id of the painted layer."},{"name":"clip","$ref":"DOM.Rect","description":"Clip rectangle."}]}]},{"domain":"DeviceOrientation","experimental":true,"commands":[{"name":"setDeviceOrientationOverride","description":"Overrides the Device Orientation.","parameters":[{"name":"alpha","type":"number","description":"Mock alpha"},{"name":"beta","type":"number","description":"Mock beta"},{"name":"gamma","type":"number","description":"Mock gamma"}]},{"name":"clearDeviceOrientationOverride","description":"Clears the overridden Device Orientation."}]},{"domain":"Tracing","dependencies":["IO"],"experimental":true,"types":[{"id":"MemoryDumpConfig","type":"object","description":"Configuration for memory dump. Used only when \"memory-infra\" category is enabled."},{"id":"TraceConfig","type":"object","properties":[{"name":"recordMode","type":"string","optional":true,"enum":["recordUntilFull","recordContinuously","recordAsMuchAsPossible","echoToConsole"],"description":"Controls how the trace buffer stores data."},{"name":"enableSampling","type":"boolean","optional":true,"description":"Turns on JavaScript stack sampling."},{"name":"enableSystrace","type":"boolean","optional":true,"description":"Turns on system tracing."},{"name":"enableArgumentFilter","type":"boolean","optional":true,"description":"Turns on argument filter."},{"name":"includedCategories","type":"array","items":{"type":"string"},"optional":true,"description":"Included category filters."},{"name":"excludedCategories","type":"array","items":{"type":"string"},"optional":true,"description":"Excluded category filters."},{"name":"syntheticDelays","type":"array","items":{"type":"string"},"optional":true,"description":"Configuration to synthesize the delays in tracing."},{"name":"memoryDumpConfig","$ref":"MemoryDumpConfig","optional":true,"description":"Configuration for memory dump triggers. Used only when \"memory-infra\" category is enabled."}]}],"commands":[{"name":"start","description":"Start trace events collection.","parameters":[{"name":"categories","type":"string","optional":true,"deprecated":true,"description":"Category/tag filter"},{"name":"options","type":"string","optional":true,"deprecated":true,"description":"Tracing options"},{"name":"bufferUsageReportingInterval","type":"number","optional":true,"description":"If set, the agent will issue bufferUsage events at this interval, specified in milliseconds"},{"name":"transferMode","type":"string","enum":["ReportEvents","ReturnAsStream"],"optional":true,"description":"Whether to report trace events as series of dataCollected events or to save trace to a stream (defaults to <code>ReportEvents</code>)."},{"name":"traceConfig","$ref":"TraceConfig","optional":true,"description":""}]},{"name":"end","description":"Stop trace events collection."},{"name":"getCategories","description":"Gets supported tracing categories.","returns":[{"name":"categories","type":"array","items":{"type":"string"},"description":"A list of supported tracing categories."}]},{"name":"requestMemoryDump","description":"Request a global memory dump.","returns":[{"name":"dumpGuid","type":"string","description":"GUID of the resulting global memory dump."},{"name":"success","type":"boolean","description":"True iff the global memory dump succeeded."}]},{"name":"recordClockSyncMarker","description":"Record a clock sync marker in the trace.","parameters":[{"name":"syncId","type":"string","description":"The ID of this clock sync marker"}]}],"events":[{"name":"dataCollected","parameters":[{"name":"value","type":"array","items":{"type":"object"}}],"description":"Contains an bucket of collected trace events. When tracing is stopped collected events will be send as a sequence of dataCollected events followed by tracingComplete event."},{"name":"tracingComplete","description":"Signals that tracing is stopped and there is no trace buffers pending flush, all data were delivered via dataCollected events.","parameters":[{"name":"stream","$ref":"IO.StreamHandle","optional":true,"description":"A handle of the stream that holds resulting trace data."}]},{"name":"bufferUsage","parameters":[{"name":"percentFull","type":"number","optional":true,"description":"A number in range [0..1] that indicates the used size of event buffer as a fraction of its total size."},{"name":"eventCount","type":"number","optional":true,"description":"An approximate number of events in the trace log."},{"name":"value","type":"number","optional":true,"description":"A number in range [0..1] that indicates the used size of event buffer as a fraction of its total size."}]}]},{"domain":"Animation","experimental":true,"dependencies":["Runtime","DOM"],"types":[{"id":"Animation","type":"object","experimental":true,"properties":[{"name":"id","type":"string","description":"<code>Animation</code>'s id."},{"name":"name","type":"string","description":"<code>Animation</code>'s name."},{"name":"pausedState","type":"boolean","experimental":true,"description":"<code>Animation</code>'s internal paused state."},{"name":"playState","type":"string","description":"<code>Animation</code>'s play state."},{"name":"playbackRate","type":"number","description":"<code>Animation</code>'s playback rate."},{"name":"startTime","type":"number","description":"<code>Animation</code>'s start time."},{"name":"currentTime","type":"number","description":"<code>Animation</code>'s current time."},{"name":"source","$ref":"AnimationEffect","description":"<code>Animation</code>'s source animation node."},{"name":"type","type":"string","enum":["CSSTransition","CSSAnimation","WebAnimation"],"description":"Animation type of <code>Animation</code>."},{"name":"cssId","type":"string","optional":true,"description":"A unique ID for <code>Animation</code> representing the sources that triggered this CSS animation/transition."}],"description":"Animation instance."},{"id":"AnimationEffect","type":"object","experimental":true,"properties":[{"name":"delay","type":"number","description":"<code>AnimationEffect</code>'s delay."},{"name":"endDelay","type":"number","description":"<code>AnimationEffect</code>'s end delay."},{"name":"iterationStart","type":"number","description":"<code>AnimationEffect</code>'s iteration start."},{"name":"iterations","type":"number","description":"<code>AnimationEffect</code>'s iterations."},{"name":"duration","type":"number","description":"<code>AnimationEffect</code>'s iteration duration."},{"name":"direction","type":"string","description":"<code>AnimationEffect</code>'s playback direction."},{"name":"fill","type":"string","description":"<code>AnimationEffect</code>'s fill mode."},{"name":"backendNodeId","$ref":"DOM.BackendNodeId","description":"<code>AnimationEffect</code>'s target node."},{"name":"keyframesRule","$ref":"KeyframesRule","optional":true,"description":"<code>AnimationEffect</code>'s keyframes."},{"name":"easing","type":"string","description":"<code>AnimationEffect</code>'s timing function."}],"description":"AnimationEffect instance"},{"id":"KeyframesRule","type":"object","properties":[{"name":"name","type":"string","optional":true,"description":"CSS keyframed animation's name."},{"name":"keyframes","type":"array","items":{"$ref":"KeyframeStyle"},"description":"List of animation keyframes."}],"description":"Keyframes Rule"},{"id":"KeyframeStyle","type":"object","properties":[{"name":"offset","type":"string","description":"Keyframe's time offset."},{"name":"easing","type":"string","description":"<code>AnimationEffect</code>'s timing function."}],"description":"Keyframe Style"}],"commands":[{"name":"enable","description":"Enables animation domain notifications."},{"name":"disable","description":"Disables animation domain notifications."},{"name":"getPlaybackRate","returns":[{"name":"playbackRate","type":"number","description":"Playback rate for animations on page."}],"description":"Gets the playback rate of the document timeline."},{"name":"setPlaybackRate","parameters":[{"name":"playbackRate","type":"number","description":"Playback rate for animations on page"}],"description":"Sets the playback rate of the document timeline."},{"name":"getCurrentTime","parameters":[{"name":"id","type":"string","description":"Id of animation."}],"returns":[{"name":"currentTime","type":"number","description":"Current time of the page."}],"description":"Returns the current time of the an animation."},{"name":"setPaused","parameters":[{"name":"animations","type":"array","items":{"type":"string"},"description":"Animations to set the pause state of."},{"name":"paused","type":"boolean","description":"Paused state to set to."}],"description":"Sets the paused state of a set of animations."},{"name":"setTiming","parameters":[{"name":"animationId","type":"string","description":"Animation id."},{"name":"duration","type":"number","description":"Duration of the animation."},{"name":"delay","type":"number","description":"Delay of the animation."}],"description":"Sets the timing of an animation node."},{"name":"seekAnimations","parameters":[{"name":"animations","type":"array","items":{"type":"string"},"description":"List of animation ids to seek."},{"name":"currentTime","type":"number","description":"Set the current time of each animation."}],"description":"Seek a set of animations to a particular time within each animation."},{"name":"releaseAnimations","parameters":[{"name":"animations","type":"array","items":{"type":"string"},"description":"List of animation ids to seek."}],"description":"Releases a set of animations to no longer be manipulated."},{"name":"resolveAnimation","parameters":[{"name":"animationId","type":"string","description":"Animation id."}],"returns":[{"name":"remoteObject","$ref":"Runtime.RemoteObject","description":"Corresponding remote object."}],"description":"Gets the remote object of the Animation."}],"events":[{"name":"animationCreated","parameters":[{"name":"id","type":"string","description":"Id of the animation that was created."}],"description":"Event for each animation that has been created."},{"name":"animationStarted","parameters":[{"name":"animation","$ref":"Animation","description":"Animation that was started."}],"description":"Event for animation that has been started."},{"name":"animationCanceled","parameters":[{"name":"id","type":"string","description":"Id of the animation that was cancelled."}],"description":"Event for when an animation has been cancelled."}]},{"domain":"Accessibility","experimental":true,"dependencies":["DOM"],"types":[{"id":"AXNodeId","type":"string","description":"Unique accessibility node identifier."},{"id":"AXValueType","type":"string","enum":["boolean","tristate","booleanOrUndefined","idref","idrefList","integer","node","nodeList","number","string","computedString","token","tokenList","domRelation","role","internalRole","valueUndefined"],"description":"Enum of possible property types."},{"id":"AXValueSourceType","type":"string","enum":["attribute","implicit","style","contents","placeholder","relatedElement"],"description":"Enum of possible property sources."},{"id":"AXValueNativeSourceType","type":"string","enum":["figcaption","label","labelfor","labelwrapped","legend","tablecaption","title","other"],"description":"Enum of possible native property sources (as a subtype of a particular AXValueSourceType)."},{"id":"AXValueSource","type":"object","properties":[{"name":"type","$ref":"AXValueSourceType","description":"What type of source this is."},{"name":"value","$ref":"AXValue","description":"The value of this property source.","optional":true},{"name":"attribute","type":"string","description":"The name of the relevant attribute, if any.","optional":true},{"name":"attributeValue","$ref":"AXValue","description":"The value of the relevant attribute, if any.","optional":true},{"name":"superseded","type":"boolean","description":"Whether this source is superseded by a higher priority source.","optional":true},{"name":"nativeSource","$ref":"AXValueNativeSourceType","description":"The native markup source for this value, e.g. a <label> element.","optional":true},{"name":"nativeSourceValue","$ref":"AXValue","description":"The value, such as a node or node list, of the native source.","optional":true},{"name":"invalid","type":"boolean","description":"Whether the value for this property is invalid.","optional":true},{"name":"invalidReason","type":"string","description":"Reason for the value being invalid, if it is.","optional":true}],"description":"A single source for a computed AX property."},{"id":"AXRelatedNode","type":"object","properties":[{"name":"backendDOMNodeId","$ref":"DOM.BackendNodeId","description":"The BackendNodeId of the related DOM node."},{"name":"idref","type":"string","description":"The IDRef value provided, if any.","optional":true},{"name":"text","type":"string","description":"The text alternative of this node in the current context.","optional":true}]},{"id":"AXProperty","type":"object","properties":[{"name":"name","type":"string","description":"The name of this property."},{"name":"value","$ref":"AXValue","description":"The value of this property."}]},{"id":"AXValue","type":"object","properties":[{"name":"type","$ref":"AXValueType","description":"The type of this value."},{"name":"value","type":"any","description":"The computed value of this property.","optional":true},{"name":"relatedNodes","type":"array","items":{"$ref":"AXRelatedNode"},"description":"One or more related nodes, if applicable.","optional":true},{"name":"sources","type":"array","items":{"$ref":"AXValueSource"},"description":"The sources which contributed to the computation of this property.","optional":true}],"description":"A single computed AX property."},{"id":"AXGlobalStates","type":"string","enum":["disabled","hidden","hiddenRoot","invalid","keyshortcuts","roledescription"],"description":"States which apply to every AX node."},{"id":"AXLiveRegionAttributes","type":"string","enum":["live","atomic","relevant","busy","root"],"description":"Attributes which apply to nodes in live regions."},{"id":"AXWidgetAttributes","type":"string","enum":["autocomplete","haspopup","level","multiselectable","orientation","multiline","readonly","required","valuemin","valuemax","valuetext"],"description":"Attributes which apply to widgets."},{"id":"AXWidgetStates","type":"string","enum":["checked","expanded","modal","pressed","selected"],"description":"States which apply to widgets."},{"id":"AXRelationshipAttributes","type":"string","enum":["activedescendant","controls","describedby","details","errormessage","flowto","labelledby","owns"],"description":"Relationships between elements other than parent/child/sibling."},{"id":"AXNode","type":"object","properties":[{"name":"nodeId","$ref":"AXNodeId","description":"Unique identifier for this node."},{"name":"ignored","type":"boolean","description":"Whether this node is ignored for accessibility"},{"name":"ignoredReasons","type":"array","items":{"$ref":"AXProperty"},"description":"Collection of reasons why this node is hidden.","optional":true},{"name":"role","$ref":"AXValue","description":"This <code>Node</code>'s role, whether explicit or implicit.","optional":true},{"name":"name","$ref":"AXValue","description":"The accessible name for this <code>Node</code>.","optional":true},{"name":"description","$ref":"AXValue","description":"The accessible description for this <code>Node</code>.","optional":true},{"name":"value","$ref":"AXValue","description":"The value for this <code>Node</code>.","optional":true},{"name":"properties","type":"array","items":{"$ref":"AXProperty"},"description":"All other properties","optional":true},{"name":"childIds","type":"array","items":{"$ref":"AXNodeId"},"description":"IDs for each of this node's child nodes.","optional":true},{"name":"backendDOMNodeId","$ref":"DOM.BackendNodeId","description":"The backend ID for the associated DOM node, if any.","optional":true}],"description":"A node in the accessibility tree."}],"commands":[{"name":"getPartialAXTree","parameters":[{"name":"nodeId","$ref":"DOM.NodeId","description":"ID of node to get the partial accessibility tree for."},{"name":"fetchRelatives","type":"boolean","description":"Whether to fetch this nodes ancestors, siblings and children. Defaults to true.","optional":true}],"returns":[{"name":"nodes","type":"array","items":{"$ref":"AXNode"},"description":"The <code>Accessibility.AXNode</code> for this DOM node, if it exists, plus its ancestors, siblings and children, if requested."}],"description":"Fetches the accessibility node and partial accessibility tree for this DOM node, if it exists.","experimental":true}]},{"domain":"Storage","experimental":true,"types":[{"id":"StorageType","type":"string","enum":["appcache","cookies","file_systems","indexeddb","local_storage","shader_cache","websql","service_workers","cache_storage","all","other"],"description":"Enum of possible storage types."},{"id":"UsageForType","type":"object","description":"Usage for a storage type.","properties":[{"name":"storageType","$ref":"StorageType","description":"Name of storage type."},{"name":"usage","type":"number","description":"Storage usage (bytes)."}]}],"commands":[{"name":"clearDataForOrigin","parameters":[{"name":"origin","type":"string","description":"Security origin."},{"name":"storageTypes","type":"string","description":"Comma separated origin names."}],"description":"Clears storage for origin."},{"name":"getUsageAndQuota","parameters":[{"name":"origin","type":"string","description":"Security origin."}],"returns":[{"name":"usage","type":"number","description":"Storage usage (bytes)."},{"name":"quota","type":"number","description":"Storage quota (bytes)."},{"name":"usageBreakdown","type":"array","items":{"$ref":"UsageForType"},"description":"Storage usage per type (bytes)."}],"description":"Returns usage and quota in bytes."}]},{"domain":"Log","description":"Provides access to log entries.","dependencies":["Runtime","Network"],"experimental":true,"types":[{"id":"LogEntry","type":"object","description":"Log entry.","properties":[{"name":"source","type":"string","enum":["xml","javascript","network","storage","appcache","rendering","security","deprecation","worker","violation","intervention","other"],"description":"Log entry source."},{"name":"level","type":"string","enum":["verbose","info","warning","error"],"description":"Log entry severity."},{"name":"text","type":"string","description":"Logged text."},{"name":"timestamp","$ref":"Runtime.Timestamp","description":"Timestamp when this entry was added."},{"name":"url","type":"string","optional":true,"description":"URL of the resource if known."},{"name":"lineNumber","type":"integer","optional":true,"description":"Line number in the resource."},{"name":"stackTrace","$ref":"Runtime.StackTrace","optional":true,"description":"JavaScript stack trace."},{"name":"networkRequestId","$ref":"Network.RequestId","optional":true,"description":"Identifier of the network request associated with this entry."},{"name":"workerId","type":"string","optional":true,"description":"Identifier of the worker associated with this entry."}]},{"id":"ViolationSetting","type":"object","description":"Violation configuration setting.","properties":[{"name":"name","type":"string","enum":["longTask","longLayout","blockedEvent","blockedParser","discouragedAPIUse","handler","recurringHandler"],"description":"Violation type."},{"name":"threshold","type":"number","description":"Time threshold to trigger upon."}]}],"commands":[{"name":"enable","description":"Enables log domain, sends the entries collected so far to the client by means of the <code>entryAdded</code> notification."},{"name":"disable","description":"Disables log domain, prevents further log entries from being reported to the client."},{"name":"clear","description":"Clears the log."},{"name":"startViolationsReport","parameters":[{"name":"config","type":"array","items":{"$ref":"ViolationSetting"},"description":"Configuration for violations."}],"description":"start violation reporting."},{"name":"stopViolationsReport","description":"Stop violation reporting."}],"events":[{"name":"entryAdded","parameters":[{"name":"entry","$ref":"LogEntry","description":"The entry."}],"description":"Issued when new message was logged."}]},{"domain":"SystemInfo","description":"The SystemInfo domain defines methods and events for querying low-level system information.","experimental":true,"types":[{"id":"GPUDevice","type":"object","properties":[{"name":"vendorId","type":"number","description":"PCI ID of the GPU vendor, if available; 0 otherwise."},{"name":"deviceId","type":"number","description":"PCI ID of the GPU device, if available; 0 otherwise."},{"name":"vendorString","type":"string","description":"String description of the GPU vendor, if the PCI ID is not available."},{"name":"deviceString","type":"string","description":"String description of the GPU device, if the PCI ID is not available."}],"description":"Describes a single graphics processor (GPU)."},{"id":"GPUInfo","type":"object","properties":[{"name":"devices","type":"array","items":{"$ref":"GPUDevice"},"description":"The graphics devices on the system. Element 0 is the primary GPU."},{"name":"auxAttributes","type":"object","optional":true,"description":"An optional dictionary of additional GPU related attributes."},{"name":"featureStatus","type":"object","optional":true,"description":"An optional dictionary of graphics features and their status."},{"name":"driverBugWorkarounds","type":"array","items":{"type":"string"},"description":"An optional array of GPU driver bug workarounds."}],"description":"Provides information about the GPU(s) on the system."}],"commands":[{"name":"getInfo","description":"Returns information about the system.","returns":[{"name":"gpu","$ref":"GPUInfo","description":"Information about the GPUs on the system."},{"name":"modelName","type":"string","description":"A platform-dependent description of the model of the machine. On Mac OS, this is, for example, 'MacBookPro'. Will be the empty string if not supported."},{"name":"modelVersion","type":"string","description":"A platform-dependent description of the version of the machine. On Mac OS, this is, for example, '10.1'. Will be the empty string if not supported."},{"name":"commandLine","type":"string","description":"The command line string used to launch the browser. Will be the empty string if not supported."}]}]},{"domain":"Tethering","description":"The Tethering domain defines methods and events for browser port binding.","experimental":true,"commands":[{"name":"bind","description":"Request browser port binding.","parameters":[{"name":"port","type":"integer","description":"Port number to bind."}]},{"name":"unbind","description":"Request browser port unbinding.","parameters":[{"name":"port","type":"integer","description":"Port number to unbind."}]}],"events":[{"name":"accepted","description":"Informs that port was successfully bound and got a specified connection id.","parameters":[{"name":"port","type":"integer","description":"Port number that was successfully bound."},{"name":"connectionId","type":"string","description":"Connection id to be used."}]}]},{"domain":"Browser","description":"The Browser domain defines methods and events for browser managing.","experimental":true,"types":[{"id":"WindowID","type":"integer"},{"id":"WindowState","type":"string","enum":["normal","minimized","maximized","fullscreen"],"description":"The state of the browser window."},{"id":"Bounds","type":"object","description":"Browser window bounds information","properties":[{"name":"left","type":"integer","optional":true,"description":"The offset from the left edge of the screen to the window in pixels."},{"name":"top","type":"integer","optional":true,"description":"The offset from the top edge of the screen to the window in pixels."},{"name":"width","type":"integer","optional":true,"description":"The window width in pixels."},{"name":"height","type":"integer","optional":true,"description":"The window height in pixels."},{"name":"windowState","$ref":"WindowState","optional":true,"description":"The window state. Default to normal."}]}],"commands":[{"name":"getWindowForTarget","description":"Get the browser window that contains the devtools target.","parameters":[{"name":"targetId","$ref":"Target.TargetID","description":"Devtools agent host id."}],"returns":[{"name":"windowId","$ref":"WindowID","description":"Browser window id."},{"name":"bounds","$ref":"Bounds","description":"Bounds information of the window. When window state is 'minimized', the restored window position and size are returned."}]},{"name":"setWindowBounds","description":"Set position and/or size of the browser window.","parameters":[{"name":"windowId","$ref":"WindowID","description":"Browser window id."},{"name":"bounds","$ref":"Bounds","description":"New window bounds. The 'minimized', 'maximized' and 'fullscreen' states cannot be combined with 'left', 'top', 'width' or 'height'. Leaves unspecified fields unchanged."}]},{"name":"getWindowBounds","description":"Get position and size of the browser window.","parameters":[{"name":"windowId","$ref":"WindowID","description":"Browser window id."}],"returns":[{"name":"bounds","$ref":"Bounds","description":"Bounds information of the window. When window state is 'minimized', the restored window position and size are returned."}]}]},{"domain":"Schema","description":"Provides information about the protocol schema.","types":[{"id":"Domain","type":"object","description":"Description of the protocol domain.","properties":[{"name":"name","type":"string","description":"Domain name."},{"name":"version","type":"string","description":"Domain version."}]}],"commands":[{"name":"getDomains","description":"Returns supported domains.","handlers":["browser","renderer"],"returns":[{"name":"domains","type":"array","items":{"$ref":"Domain"},"description":"List of supported domains."}]}]},{"domain":"Runtime","description":"Runtime domain exposes JavaScript runtime by means of remote evaluation and mirror objects. Evaluation results are returned as mirror object that expose object type, string representation and unique identifier that can be used for further object reference. Original objects are maintained in memory unless they are either explicitly released or are released along with the other objects in their object group.","types":[{"id":"ScriptId","type":"string","description":"Unique script identifier."},{"id":"RemoteObjectId","type":"string","description":"Unique object identifier."},{"id":"UnserializableValue","type":"string","enum":["Infinity","NaN","-Infinity","-0"],"description":"Primitive value which cannot be JSON-stringified."},{"id":"RemoteObject","type":"object","description":"Mirror object referencing original JavaScript object.","properties":[{"name":"type","type":"string","enum":["object","function","undefined","string","number","boolean","symbol"],"description":"Object type."},{"name":"subtype","type":"string","optional":true,"enum":["array","null","node","regexp","date","map","set","weakmap","weakset","iterator","generator","error","proxy","promise","typedarray"],"description":"Object subtype hint. Specified for <code>object</code> type values only."},{"name":"className","type":"string","optional":true,"description":"Object class (constructor) name. Specified for <code>object</code> type values only."},{"name":"value","type":"any","optional":true,"description":"Remote object value in case of primitive values or JSON values (if it was requested)."},{"name":"unserializableValue","$ref":"UnserializableValue","optional":true,"description":"Primitive value which can not be JSON-stringified does not have <code>value</code>, but gets this property."},{"name":"description","type":"string","optional":true,"description":"String representation of the object."},{"name":"objectId","$ref":"RemoteObjectId","optional":true,"description":"Unique object identifier (for non-primitive values)."},{"name":"preview","$ref":"ObjectPreview","optional":true,"description":"Preview containing abbreviated property values. Specified for <code>object</code> type values only.","experimental":true},{"name":"customPreview","$ref":"CustomPreview","optional":true,"experimental":true}]},{"id":"CustomPreview","type":"object","experimental":true,"properties":[{"name":"header","type":"string"},{"name":"hasBody","type":"boolean"},{"name":"formatterObjectId","$ref":"RemoteObjectId"},{"name":"bindRemoteObjectFunctionId","$ref":"RemoteObjectId"},{"name":"configObjectId","$ref":"RemoteObjectId","optional":true}]},{"id":"ObjectPreview","type":"object","experimental":true,"description":"Object containing abbreviated remote object value.","properties":[{"name":"type","type":"string","enum":["object","function","undefined","string","number","boolean","symbol"],"description":"Object type."},{"name":"subtype","type":"string","optional":true,"enum":["array","null","node","regexp","date","map","set","weakmap","weakset","iterator","generator","error"],"description":"Object subtype hint. Specified for <code>object</code> type values only."},{"name":"description","type":"string","optional":true,"description":"String representation of the object."},{"name":"overflow","type":"boolean","description":"True iff some of the properties or entries of the original object did not fit."},{"name":"properties","type":"array","items":{"$ref":"PropertyPreview"},"description":"List of the properties."},{"name":"entries","type":"array","items":{"$ref":"EntryPreview"},"optional":true,"description":"List of the entries. Specified for <code>map</code> and <code>set</code> subtype values only."}]},{"id":"PropertyPreview","type":"object","experimental":true,"properties":[{"name":"name","type":"string","description":"Property name."},{"name":"type","type":"string","enum":["object","function","undefined","string","number","boolean","symbol","accessor"],"description":"Object type. Accessor means that the property itself is an accessor property."},{"name":"value","type":"string","optional":true,"description":"User-friendly property value string."},{"name":"valuePreview","$ref":"ObjectPreview","optional":true,"description":"Nested value preview."},{"name":"subtype","type":"string","optional":true,"enum":["array","null","node","regexp","date","map","set","weakmap","weakset","iterator","generator","error"],"description":"Object subtype hint. Specified for <code>object</code> type values only."}]},{"id":"EntryPreview","type":"object","experimental":true,"properties":[{"name":"key","$ref":"ObjectPreview","optional":true,"description":"Preview of the key. Specified for map-like collection entries."},{"name":"value","$ref":"ObjectPreview","description":"Preview of the value."}]},{"id":"PropertyDescriptor","type":"object","description":"Object property descriptor.","properties":[{"name":"name","type":"string","description":"Property name or symbol description."},{"name":"value","$ref":"RemoteObject","optional":true,"description":"The value associated with the property."},{"name":"writable","type":"boolean","optional":true,"description":"True if the value associated with the property may be changed (data descriptors only)."},{"name":"get","$ref":"RemoteObject","optional":true,"description":"A function which serves as a getter for the property, or <code>undefined</code> if there is no getter (accessor descriptors only)."},{"name":"set","$ref":"RemoteObject","optional":true,"description":"A function which serves as a setter for the property, or <code>undefined</code> if there is no setter (accessor descriptors only)."},{"name":"configurable","type":"boolean","description":"True if the type of this property descriptor may be changed and if the property may be deleted from the corresponding object."},{"name":"enumerable","type":"boolean","description":"True if this property shows up during enumeration of the properties on the corresponding object."},{"name":"wasThrown","type":"boolean","optional":true,"description":"True if the result was thrown during the evaluation."},{"name":"isOwn","optional":true,"type":"boolean","description":"True if the property is owned for the object."},{"name":"symbol","$ref":"RemoteObject","optional":true,"description":"Property symbol object, if the property is of the <code>symbol</code> type."}]},{"id":"InternalPropertyDescriptor","type":"object","description":"Object internal property descriptor. This property isn't normally visible in JavaScript code.","properties":[{"name":"name","type":"string","description":"Conventional property name."},{"name":"value","$ref":"RemoteObject","optional":true,"description":"The value associated with the property."}]},{"id":"CallArgument","type":"object","description":"Represents function call argument. Either remote object id <code>objectId</code>, primitive <code>value</code>, unserializable primitive value or neither of (for undefined) them should be specified.","properties":[{"name":"value","type":"any","optional":true,"description":"Primitive value."},{"name":"unserializableValue","$ref":"UnserializableValue","optional":true,"description":"Primitive value which can not be JSON-stringified."},{"name":"objectId","$ref":"RemoteObjectId","optional":true,"description":"Remote object handle."}]},{"id":"ExecutionContextId","type":"integer","description":"Id of an execution context."},{"id":"ExecutionContextDescription","type":"object","description":"Description of an isolated world.","properties":[{"name":"id","$ref":"ExecutionContextId","description":"Unique id of the execution context. It can be used to specify in which execution context script evaluation should be performed."},{"name":"origin","type":"string","description":"Execution context origin."},{"name":"name","type":"string","description":"Human readable name describing given context."},{"name":"auxData","type":"object","optional":true,"description":"Embedder-specific auxiliary data."}]},{"id":"ExceptionDetails","type":"object","description":"Detailed information about exception (or error) that was thrown during script compilation or execution.","properties":[{"name":"exceptionId","type":"integer","description":"Exception id."},{"name":"text","type":"string","description":"Exception text, which should be used together with exception object when available."},{"name":"lineNumber","type":"integer","description":"Line number of the exception location (0-based)."},{"name":"columnNumber","type":"integer","description":"Column number of the exception location (0-based)."},{"name":"scriptId","$ref":"ScriptId","optional":true,"description":"Script ID of the exception location."},{"name":"url","type":"string","optional":true,"description":"URL of the exception location, to be used when the script was not reported."},{"name":"stackTrace","$ref":"StackTrace","optional":true,"description":"JavaScript stack trace if available."},{"name":"exception","$ref":"RemoteObject","optional":true,"description":"Exception object if available."},{"name":"executionContextId","$ref":"ExecutionContextId","optional":true,"description":"Identifier of the context where exception happened."}]},{"id":"Timestamp","type":"number","description":"Number of milliseconds since epoch."},{"id":"CallFrame","type":"object","description":"Stack entry for runtime errors and assertions.","properties":[{"name":"functionName","type":"string","description":"JavaScript function name."},{"name":"scriptId","$ref":"ScriptId","description":"JavaScript script id."},{"name":"url","type":"string","description":"JavaScript script name or url."},{"name":"lineNumber","type":"integer","description":"JavaScript script line number (0-based)."},{"name":"columnNumber","type":"integer","description":"JavaScript script column number (0-based)."}]},{"id":"StackTrace","type":"object","description":"Call frames for assertions or error messages.","properties":[{"name":"description","type":"string","optional":true,"description":"String label of this stack trace. For async traces this may be a name of the function that initiated the async call."},{"name":"callFrames","type":"array","items":{"$ref":"CallFrame"},"description":"JavaScript function name."},{"name":"parent","$ref":"StackTrace","optional":true,"description":"Asynchronous JavaScript stack trace that preceded this stack, if available."},{"name":"promiseCreationFrame","$ref":"CallFrame","optional":true,"experimental":true,"description":"Creation frame of the Promise which produced the next synchronous trace when resolved, if available."}]}],"commands":[{"name":"evaluate","parameters":[{"name":"expression","type":"string","description":"Expression to evaluate."},{"name":"objectGroup","type":"string","optional":true,"description":"Symbolic group name that can be used to release multiple objects."},{"name":"includeCommandLineAPI","type":"boolean","optional":true,"description":"Determines whether Command Line API should be available during the evaluation."},{"name":"silent","type":"boolean","optional":true,"description":"In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state."},{"name":"contextId","$ref":"ExecutionContextId","optional":true,"description":"Specifies in which execution context to perform evaluation. If the parameter is omitted the evaluation will be performed in the context of the inspected page."},{"name":"returnByValue","type":"boolean","optional":true,"description":"Whether the result is expected to be a JSON object that should be sent by value."},{"name":"generatePreview","type":"boolean","optional":true,"experimental":true,"description":"Whether preview should be generated for the result."},{"name":"userGesture","type":"boolean","optional":true,"experimental":true,"description":"Whether execution should be treated as initiated by user in the UI."},{"name":"awaitPromise","type":"boolean","optional":true,"description":"Whether execution should wait for promise to be resolved. If the result of evaluation is not a Promise, it's considered to be an error."}],"returns":[{"name":"result","$ref":"RemoteObject","description":"Evaluation result."},{"name":"exceptionDetails","$ref":"ExceptionDetails","optional":true,"description":"Exception details."}],"description":"Evaluates expression on global object."},{"name":"awaitPromise","parameters":[{"name":"promiseObjectId","$ref":"RemoteObjectId","description":"Identifier of the promise."},{"name":"returnByValue","type":"boolean","optional":true,"description":"Whether the result is expected to be a JSON object that should be sent by value."},{"name":"generatePreview","type":"boolean","optional":true,"description":"Whether preview should be generated for the result."}],"returns":[{"name":"result","$ref":"RemoteObject","description":"Promise result. Will contain rejected value if promise was rejected."},{"name":"exceptionDetails","$ref":"ExceptionDetails","optional":true,"description":"Exception details if stack strace is available."}],"description":"Add handler to promise with given promise object id."},{"name":"callFunctionOn","parameters":[{"name":"objectId","$ref":"RemoteObjectId","description":"Identifier of the object to call function on."},{"name":"functionDeclaration","type":"string","description":"Declaration of the function to call."},{"name":"arguments","type":"array","items":{"$ref":"CallArgument","description":"Call argument."},"optional":true,"description":"Call arguments. All call arguments must belong to the same JavaScript world as the target object."},{"name":"silent","type":"boolean","optional":true,"description":"In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state."},{"name":"returnByValue","type":"boolean","optional":true,"description":"Whether the result is expected to be a JSON object which should be sent by value."},{"name":"generatePreview","type":"boolean","optional":true,"experimental":true,"description":"Whether preview should be generated for the result."},{"name":"userGesture","type":"boolean","optional":true,"experimental":true,"description":"Whether execution should be treated as initiated by user in the UI."},{"name":"awaitPromise","type":"boolean","optional":true,"description":"Whether execution should wait for promise to be resolved. If the result of evaluation is not a Promise, it's considered to be an error."}],"returns":[{"name":"result","$ref":"RemoteObject","description":"Call result."},{"name":"exceptionDetails","$ref":"ExceptionDetails","optional":true,"description":"Exception details."}],"description":"Calls function with given declaration on the given object. Object group of the result is inherited from the target object."},{"name":"getProperties","parameters":[{"name":"objectId","$ref":"RemoteObjectId","description":"Identifier of the object to return properties for."},{"name":"ownProperties","optional":true,"type":"boolean","description":"If true, returns properties belonging only to the element itself, not to its prototype chain."},{"name":"accessorPropertiesOnly","optional":true,"type":"boolean","description":"If true, returns accessor properties (with getter/setter) only; internal properties are not returned either.","experimental":true},{"name":"generatePreview","type":"boolean","optional":true,"experimental":true,"description":"Whether preview should be generated for the results."}],"returns":[{"name":"result","type":"array","items":{"$ref":"PropertyDescriptor"},"description":"Object properties."},{"name":"internalProperties","optional":true,"type":"array","items":{"$ref":"InternalPropertyDescriptor"},"description":"Internal object properties (only of the element itself)."},{"name":"exceptionDetails","$ref":"ExceptionDetails","optional":true,"description":"Exception details."}],"description":"Returns properties of a given object. Object group of the result is inherited from the target object."},{"name":"releaseObject","parameters":[{"name":"objectId","$ref":"RemoteObjectId","description":"Identifier of the object to release."}],"description":"Releases remote object with given id."},{"name":"releaseObjectGroup","parameters":[{"name":"objectGroup","type":"string","description":"Symbolic object group name."}],"description":"Releases all remote objects that belong to a given group."},{"name":"runIfWaitingForDebugger","description":"Tells inspected instance to run if it was waiting for debugger to attach."},{"name":"enable","description":"Enables reporting of execution contexts creation by means of <code>executionContextCreated</code> event. When the reporting gets enabled the event will be sent immediately for each existing execution context."},{"name":"disable","description":"Disables reporting of execution contexts creation."},{"name":"discardConsoleEntries","description":"Discards collected exceptions and console API calls."},{"name":"setCustomObjectFormatterEnabled","parameters":[{"name":"enabled","type":"boolean"}],"experimental":true},{"name":"compileScript","parameters":[{"name":"expression","type":"string","description":"Expression to compile."},{"name":"sourceURL","type":"string","description":"Source url to be set for the script."},{"name":"persistScript","type":"boolean","description":"Specifies whether the compiled script should be persisted."},{"name":"executionContextId","$ref":"ExecutionContextId","optional":true,"description":"Specifies in which execution context to perform script run. If the parameter is omitted the evaluation will be performed in the context of the inspected page."}],"returns":[{"name":"scriptId","$ref":"ScriptId","optional":true,"description":"Id of the script."},{"name":"exceptionDetails","$ref":"ExceptionDetails","optional":true,"description":"Exception details."}],"description":"Compiles expression."},{"name":"runScript","parameters":[{"name":"scriptId","$ref":"ScriptId","description":"Id of the script to run."},{"name":"executionContextId","$ref":"ExecutionContextId","optional":true,"description":"Specifies in which execution context to perform script run. If the parameter is omitted the evaluation will be performed in the context of the inspected page."},{"name":"objectGroup","type":"string","optional":true,"description":"Symbolic group name that can be used to release multiple objects."},{"name":"silent","type":"boolean","optional":true,"description":"In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state."},{"name":"includeCommandLineAPI","type":"boolean","optional":true,"description":"Determines whether Command Line API should be available during the evaluation."},{"name":"returnByValue","type":"boolean","optional":true,"description":"Whether the result is expected to be a JSON object which should be sent by value."},{"name":"generatePreview","type":"boolean","optional":true,"description":"Whether preview should be generated for the result."},{"name":"awaitPromise","type":"boolean","optional":true,"description":"Whether execution should wait for promise to be resolved. If the result of evaluation is not a Promise, it's considered to be an error."}],"returns":[{"name":"result","$ref":"RemoteObject","description":"Run result."},{"name":"exceptionDetails","$ref":"ExceptionDetails","optional":true,"description":"Exception details."}],"description":"Runs script with given id in a given context."}],"events":[{"name":"executionContextCreated","parameters":[{"name":"context","$ref":"ExecutionContextDescription","description":"A newly created execution context."}],"description":"Issued when new execution context is created."},{"name":"executionContextDestroyed","parameters":[{"name":"executionContextId","$ref":"ExecutionContextId","description":"Id of the destroyed context"}],"description":"Issued when execution context is destroyed."},{"name":"executionContextsCleared","description":"Issued when all executionContexts were cleared in browser"},{"name":"exceptionThrown","description":"Issued when exception was thrown and unhandled.","parameters":[{"name":"timestamp","$ref":"Timestamp","description":"Timestamp of the exception."},{"name":"exceptionDetails","$ref":"ExceptionDetails"}]},{"name":"exceptionRevoked","description":"Issued when unhandled exception was revoked.","parameters":[{"name":"reason","type":"string","description":"Reason describing why exception was revoked."},{"name":"exceptionId","type":"integer","description":"The id of revoked exception, as reported in <code>exceptionUnhandled</code>."}]},{"name":"consoleAPICalled","description":"Issued when console API was called.","parameters":[{"name":"type","type":"string","enum":["log","debug","info","error","warning","dir","dirxml","table","trace","clear","startGroup","startGroupCollapsed","endGroup","assert","profile","profileEnd","count","timeEnd"],"description":"Type of the call."},{"name":"args","type":"array","items":{"$ref":"RemoteObject"},"description":"Call arguments."},{"name":"executionContextId","$ref":"ExecutionContextId","description":"Identifier of the context where the call was made."},{"name":"timestamp","$ref":"Timestamp","description":"Call timestamp."},{"name":"stackTrace","$ref":"StackTrace","optional":true,"description":"Stack trace captured when the call was made."},{"name":"context","type":"string","optional":true,"experimental":true,"description":"Console context descriptor for calls on non-default console context (not console.*): 'anonymous#unique-logger-id' for call on unnamed context, 'name#unique-logger-id' for call on named context."}]},{"name":"inspectRequested","description":"Issued when object should be inspected (for example, as a result of inspect() command line API call).","parameters":[{"name":"object","$ref":"RemoteObject"},{"name":"hints","type":"object"}]}]},{"domain":"Debugger","description":"Debugger domain exposes JavaScript debugging capabilities. It allows setting and removing breakpoints, stepping through execution, exploring stack traces, etc.","dependencies":["Runtime"],"types":[{"id":"BreakpointId","type":"string","description":"Breakpoint identifier."},{"id":"CallFrameId","type":"string","description":"Call frame identifier."},{"id":"Location","type":"object","properties":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Script identifier as reported in the <code>Debugger.scriptParsed</code>."},{"name":"lineNumber","type":"integer","description":"Line number in the script (0-based)."},{"name":"columnNumber","type":"integer","optional":true,"description":"Column number in the script (0-based)."}],"description":"Location in the source code."},{"id":"ScriptPosition","experimental":true,"type":"object","properties":[{"name":"lineNumber","type":"integer"},{"name":"columnNumber","type":"integer"}],"description":"Location in the source code."},{"id":"CallFrame","type":"object","properties":[{"name":"callFrameId","$ref":"CallFrameId","description":"Call frame identifier. This identifier is only valid while the virtual machine is paused."},{"name":"functionName","type":"string","description":"Name of the JavaScript function called on this call frame."},{"name":"functionLocation","$ref":"Location","optional":true,"experimental":true,"description":"Location in the source code."},{"name":"location","$ref":"Location","description":"Location in the source code."},{"name":"scopeChain","type":"array","items":{"$ref":"Scope"},"description":"Scope chain for this call frame."},{"name":"this","$ref":"Runtime.RemoteObject","description":"<code>this</code> object for this call frame."},{"name":"returnValue","$ref":"Runtime.RemoteObject","optional":true,"description":"The value being returned, if the function is at return point."}],"description":"JavaScript call frame. Array of call frames form the call stack."},{"id":"Scope","type":"object","properties":[{"name":"type","type":"string","enum":["global","local","with","closure","catch","block","script","eval","module"],"description":"Scope type."},{"name":"object","$ref":"Runtime.RemoteObject","description":"Object representing the scope. For <code>global</code> and <code>with</code> scopes it represents the actual object; for the rest of the scopes, it is artificial transient object enumerating scope variables as its properties."},{"name":"name","type":"string","optional":true},{"name":"startLocation","$ref":"Location","optional":true,"description":"Location in the source code where scope starts"},{"name":"endLocation","$ref":"Location","optional":true,"description":"Location in the source code where scope ends"}],"description":"Scope description."},{"id":"SearchMatch","type":"object","description":"Search match for resource.","properties":[{"name":"lineNumber","type":"number","description":"Line number in resource content."},{"name":"lineContent","type":"string","description":"Line with match content."}],"experimental":true},{"id":"BreakLocation","type":"object","properties":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Script identifier as reported in the <code>Debugger.scriptParsed</code>."},{"name":"lineNumber","type":"integer","description":"Line number in the script (0-based)."},{"name":"columnNumber","type":"integer","optional":true,"description":"Column number in the script (0-based)."},{"name":"type","type":"string","enum":["debuggerStatement","call","return"],"optional":true}],"experimental":true}],"commands":[{"name":"enable","description":"Enables debugger for the given page. Clients should not assume that the debugging has been enabled until the result for this command is received."},{"name":"disable","description":"Disables debugger for given page."},{"name":"setBreakpointsActive","parameters":[{"name":"active","type":"boolean","description":"New value for breakpoints active state."}],"description":"Activates / deactivates all breakpoints on the page."},{"name":"setSkipAllPauses","parameters":[{"name":"skip","type":"boolean","description":"New value for skip pauses state."}],"description":"Makes page not interrupt on any pauses (breakpoint, exception, dom exception etc)."},{"name":"setBreakpointByUrl","parameters":[{"name":"lineNumber","type":"integer","description":"Line number to set breakpoint at."},{"name":"url","type":"string","optional":true,"description":"URL of the resources to set breakpoint on."},{"name":"urlRegex","type":"string","optional":true,"description":"Regex pattern for the URLs of the resources to set breakpoints on. Either <code>url</code> or <code>urlRegex</code> must be specified."},{"name":"columnNumber","type":"integer","optional":true,"description":"Offset in the line to set breakpoint at."},{"name":"condition","type":"string","optional":true,"description":"Expression to use as a breakpoint condition. When specified, debugger will only stop on the breakpoint if this expression evaluates to true."}],"returns":[{"name":"breakpointId","$ref":"BreakpointId","description":"Id of the created breakpoint for further reference."},{"name":"locations","type":"array","items":{"$ref":"Location"},"description":"List of the locations this breakpoint resolved into upon addition."}],"description":"Sets JavaScript breakpoint at given location specified either by URL or URL regex. Once this command is issued, all existing parsed scripts will have breakpoints resolved and returned in <code>locations</code> property. Further matching script parsing will result in subsequent <code>breakpointResolved</code> events issued. This logical breakpoint will survive page reloads."},{"name":"setBreakpoint","parameters":[{"name":"location","$ref":"Location","description":"Location to set breakpoint in."},{"name":"condition","type":"string","optional":true,"description":"Expression to use as a breakpoint condition. When specified, debugger will only stop on the breakpoint if this expression evaluates to true."}],"returns":[{"name":"breakpointId","$ref":"BreakpointId","description":"Id of the created breakpoint for further reference."},{"name":"actualLocation","$ref":"Location","description":"Location this breakpoint resolved into."}],"description":"Sets JavaScript breakpoint at a given location."},{"name":"removeBreakpoint","parameters":[{"name":"breakpointId","$ref":"BreakpointId"}],"description":"Removes JavaScript breakpoint."},{"name":"getPossibleBreakpoints","parameters":[{"name":"start","$ref":"Location","description":"Start of range to search possible breakpoint locations in."},{"name":"end","$ref":"Location","optional":true,"description":"End of range to search possible breakpoint locations in (excluding). When not specified, end of scripts is used as end of range."},{"name":"restrictToFunction","type":"boolean","optional":true,"description":"Only consider locations which are in the same (non-nested) function as start."}],"returns":[{"name":"locations","type":"array","items":{"$ref":"BreakLocation"},"description":"List of the possible breakpoint locations."}],"description":"Returns possible locations for breakpoint. scriptId in start and end range locations should be the same.","experimental":true},{"name":"continueToLocation","parameters":[{"name":"location","$ref":"Location","description":"Location to continue to."},{"name":"targetCallFrames","type":"string","enum":["any","current"],"optional":true,"experimental":true}],"description":"Continues execution until specific location is reached."},{"name":"stepOver","description":"Steps over the statement."},{"name":"stepInto","description":"Steps into the function call."},{"name":"stepOut","description":"Steps out of the function call."},{"name":"pause","description":"Stops on the next JavaScript statement."},{"name":"scheduleStepIntoAsync","description":"Steps into next scheduled async task if any is scheduled before next pause. Returns success when async task is actually scheduled, returns error if no task were scheduled or another scheduleStepIntoAsync was called.","experimental":true},{"name":"resume","description":"Resumes JavaScript execution."},{"name":"searchInContent","parameters":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Id of the script to search in."},{"name":"query","type":"string","description":"String to search for."},{"name":"caseSensitive","type":"boolean","optional":true,"description":"If true, search is case sensitive."},{"name":"isRegex","type":"boolean","optional":true,"description":"If true, treats string parameter as regex."}],"returns":[{"name":"result","type":"array","items":{"$ref":"SearchMatch"},"description":"List of search matches."}],"experimental":true,"description":"Searches for given string in script content."},{"name":"setScriptSource","parameters":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Id of the script to edit."},{"name":"scriptSource","type":"string","description":"New content of the script."},{"name":"dryRun","type":"boolean","optional":true,"description":" If true the change will not actually be applied. Dry run may be used to get result description without actually modifying the code."}],"returns":[{"name":"callFrames","type":"array","optional":true,"items":{"$ref":"CallFrame"},"description":"New stack trace in case editing has happened while VM was stopped."},{"name":"stackChanged","type":"boolean","optional":true,"description":"Whether current call stack  was modified after applying the changes."},{"name":"asyncStackTrace","$ref":"Runtime.StackTrace","optional":true,"description":"Async stack trace, if any."},{"name":"exceptionDetails","optional":true,"$ref":"Runtime.ExceptionDetails","description":"Exception details if any."}],"description":"Edits JavaScript source live."},{"name":"restartFrame","parameters":[{"name":"callFrameId","$ref":"CallFrameId","description":"Call frame identifier to evaluate on."}],"returns":[{"name":"callFrames","type":"array","items":{"$ref":"CallFrame"},"description":"New stack trace."},{"name":"asyncStackTrace","$ref":"Runtime.StackTrace","optional":true,"description":"Async stack trace, if any."}],"description":"Restarts particular call frame from the beginning."},{"name":"getScriptSource","parameters":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Id of the script to get source for."}],"returns":[{"name":"scriptSource","type":"string","description":"Script source."}],"description":"Returns source for the script with given id."},{"name":"setPauseOnExceptions","parameters":[{"name":"state","type":"string","enum":["none","uncaught","all"],"description":"Pause on exceptions mode."}],"description":"Defines pause on exceptions state. Can be set to stop on all exceptions, uncaught exceptions or no exceptions. Initial pause on exceptions state is <code>none</code>."},{"name":"evaluateOnCallFrame","parameters":[{"name":"callFrameId","$ref":"CallFrameId","description":"Call frame identifier to evaluate on."},{"name":"expression","type":"string","description":"Expression to evaluate."},{"name":"objectGroup","type":"string","optional":true,"description":"String object group name to put result into (allows rapid releasing resulting object handles using <code>releaseObjectGroup</code>)."},{"name":"includeCommandLineAPI","type":"boolean","optional":true,"description":"Specifies whether command line API should be available to the evaluated expression, defaults to false."},{"name":"silent","type":"boolean","optional":true,"description":"In silent mode exceptions thrown during evaluation are not reported and do not pause execution. Overrides <code>setPauseOnException</code> state."},{"name":"returnByValue","type":"boolean","optional":true,"description":"Whether the result is expected to be a JSON object that should be sent by value."},{"name":"generatePreview","type":"boolean","optional":true,"experimental":true,"description":"Whether preview should be generated for the result."},{"name":"throwOnSideEffect","type":"boolean","optional":true,"experimental":true,"description":"Whether to throw an exception if side effect cannot be ruled out during evaluation."}],"returns":[{"name":"result","$ref":"Runtime.RemoteObject","description":"Object wrapper for the evaluation result."},{"name":"exceptionDetails","$ref":"Runtime.ExceptionDetails","optional":true,"description":"Exception details."}],"description":"Evaluates expression on a given call frame."},{"name":"setVariableValue","parameters":[{"name":"scopeNumber","type":"integer","description":"0-based number of scope as was listed in scope chain. Only 'local', 'closure' and 'catch' scope types are allowed. Other scopes could be manipulated manually."},{"name":"variableName","type":"string","description":"Variable name."},{"name":"newValue","$ref":"Runtime.CallArgument","description":"New variable value."},{"name":"callFrameId","$ref":"CallFrameId","description":"Id of callframe that holds variable."}],"description":"Changes value of variable in a callframe. Object-based scopes are not supported and must be mutated manually."},{"name":"setAsyncCallStackDepth","parameters":[{"name":"maxDepth","type":"integer","description":"Maximum depth of async call stacks. Setting to <code>0</code> will effectively disable collecting async call stacks (default)."}],"description":"Enables or disables async call stacks tracking."},{"name":"setBlackboxPatterns","parameters":[{"name":"patterns","type":"array","items":{"type":"string"},"description":"Array of regexps that will be used to check script url for blackbox state."}],"experimental":true,"description":"Replace previous blackbox patterns with passed ones. Forces backend to skip stepping/pausing in scripts with url matching one of the patterns. VM will try to leave blackboxed script by performing 'step in' several times, finally resorting to 'step out' if unsuccessful."},{"name":"setBlackboxedRanges","parameters":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Id of the script."},{"name":"positions","type":"array","items":{"$ref":"ScriptPosition"}}],"experimental":true,"description":"Makes backend skip steps in the script in blackboxed ranges. VM will try leave blacklisted scripts by performing 'step in' several times, finally resorting to 'step out' if unsuccessful. Positions array contains positions where blackbox state is changed. First interval isn't blackboxed. Array should be sorted."}],"events":[{"name":"scriptParsed","parameters":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Identifier of the script parsed."},{"name":"url","type":"string","description":"URL or name of the script parsed (if any)."},{"name":"startLine","type":"integer","description":"Line offset of the script within the resource with given URL (for script tags)."},{"name":"startColumn","type":"integer","description":"Column offset of the script within the resource with given URL."},{"name":"endLine","type":"integer","description":"Last line of the script."},{"name":"endColumn","type":"integer","description":"Length of the last line of the script."},{"name":"executionContextId","$ref":"Runtime.ExecutionContextId","description":"Specifies script creation context."},{"name":"hash","type":"string","description":"Content hash of the script."},{"name":"executionContextAuxData","type":"object","optional":true,"description":"Embedder-specific auxiliary data."},{"name":"isLiveEdit","type":"boolean","optional":true,"description":"True, if this script is generated as a result of the live edit operation.","experimental":true},{"name":"sourceMapURL","type":"string","optional":true,"description":"URL of source map associated with script (if any)."},{"name":"hasSourceURL","type":"boolean","optional":true,"description":"True, if this script has sourceURL.","experimental":true},{"name":"isModule","type":"boolean","optional":true,"description":"True, if this script is ES6 module.","experimental":true},{"name":"length","type":"integer","optional":true,"description":"This script length.","experimental":true},{"name":"stackTrace","$ref":"Runtime.StackTrace","optional":true,"description":"JavaScript top stack frame of where the script parsed event was triggered if available.","experimental":true}],"description":"Fired when virtual machine parses script. This event is also fired for all known and uncollected scripts upon enabling debugger."},{"name":"scriptFailedToParse","parameters":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"Identifier of the script parsed."},{"name":"url","type":"string","description":"URL or name of the script parsed (if any)."},{"name":"startLine","type":"integer","description":"Line offset of the script within the resource with given URL (for script tags)."},{"name":"startColumn","type":"integer","description":"Column offset of the script within the resource with given URL."},{"name":"endLine","type":"integer","description":"Last line of the script."},{"name":"endColumn","type":"integer","description":"Length of the last line of the script."},{"name":"executionContextId","$ref":"Runtime.ExecutionContextId","description":"Specifies script creation context."},{"name":"hash","type":"string","description":"Content hash of the script."},{"name":"executionContextAuxData","type":"object","optional":true,"description":"Embedder-specific auxiliary data."},{"name":"sourceMapURL","type":"string","optional":true,"description":"URL of source map associated with script (if any)."},{"name":"hasSourceURL","type":"boolean","optional":true,"description":"True, if this script has sourceURL.","experimental":true},{"name":"isModule","type":"boolean","optional":true,"description":"True, if this script is ES6 module.","experimental":true},{"name":"length","type":"integer","optional":true,"description":"This script length.","experimental":true},{"name":"stackTrace","$ref":"Runtime.StackTrace","optional":true,"description":"JavaScript top stack frame of where the script parsed event was triggered if available.","experimental":true}],"description":"Fired when virtual machine fails to parse the script."},{"name":"breakpointResolved","parameters":[{"name":"breakpointId","$ref":"BreakpointId","description":"Breakpoint unique identifier."},{"name":"location","$ref":"Location","description":"Actual breakpoint location."}],"description":"Fired when breakpoint is resolved to an actual script and location."},{"name":"paused","parameters":[{"name":"callFrames","type":"array","items":{"$ref":"CallFrame"},"description":"Call stack the virtual machine stopped on."},{"name":"reason","type":"string","enum":["XHR","DOM","EventListener","exception","assert","debugCommand","promiseRejection","OOM","other","ambiguous"],"description":"Pause reason."},{"name":"data","type":"object","optional":true,"description":"Object containing break-specific auxiliary properties."},{"name":"hitBreakpoints","type":"array","optional":true,"items":{"type":"string"},"description":"Hit breakpoints IDs"},{"name":"asyncStackTrace","$ref":"Runtime.StackTrace","optional":true,"description":"Async stack trace, if any."}],"description":"Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria."},{"name":"resumed","description":"Fired when the virtual machine resumed execution."}]},{"domain":"Console","description":"This domain is deprecated - use Runtime or Log instead.","dependencies":["Runtime"],"deprecated":true,"types":[{"id":"ConsoleMessage","type":"object","description":"Console message.","properties":[{"name":"source","type":"string","enum":["xml","javascript","network","console-api","storage","appcache","rendering","security","other","deprecation","worker"],"description":"Message source."},{"name":"level","type":"string","enum":["log","warning","error","debug","info"],"description":"Message severity."},{"name":"text","type":"string","description":"Message text."},{"name":"url","type":"string","optional":true,"description":"URL of the message origin."},{"name":"line","type":"integer","optional":true,"description":"Line number in the resource that generated this message (1-based)."},{"name":"column","type":"integer","optional":true,"description":"Column number in the resource that generated this message (1-based)."}]}],"commands":[{"name":"enable","description":"Enables console domain, sends the messages collected so far to the client by means of the <code>messageAdded</code> notification."},{"name":"disable","description":"Disables console domain, prevents further console messages from being reported to the client."},{"name":"clearMessages","description":"Does nothing."}],"events":[{"name":"messageAdded","parameters":[{"name":"message","$ref":"ConsoleMessage","description":"Console message that has been added."}],"description":"Issued when new console message is added."}]},{"domain":"Profiler","dependencies":["Runtime","Debugger"],"types":[{"id":"ProfileNode","type":"object","description":"Profile node. Holds callsite information, execution statistics and child nodes.","properties":[{"name":"id","type":"integer","description":"Unique id of the node."},{"name":"callFrame","$ref":"Runtime.CallFrame","description":"Function location."},{"name":"hitCount","type":"integer","optional":true,"experimental":true,"description":"Number of samples where this node was on top of the call stack."},{"name":"children","type":"array","items":{"type":"integer"},"optional":true,"description":"Child node ids."},{"name":"deoptReason","type":"string","optional":true,"description":"The reason of being not optimized. The function may be deoptimized or marked as don't optimize."},{"name":"positionTicks","type":"array","items":{"$ref":"PositionTickInfo"},"optional":true,"experimental":true,"description":"An array of source position ticks."}]},{"id":"Profile","type":"object","description":"Profile.","properties":[{"name":"nodes","type":"array","items":{"$ref":"ProfileNode"},"description":"The list of profile nodes. First item is the root node."},{"name":"startTime","type":"number","description":"Profiling start timestamp in microseconds."},{"name":"endTime","type":"number","description":"Profiling end timestamp in microseconds."},{"name":"samples","optional":true,"type":"array","items":{"type":"integer"},"description":"Ids of samples top nodes."},{"name":"timeDeltas","optional":true,"type":"array","items":{"type":"integer"},"description":"Time intervals between adjacent samples in microseconds. The first delta is relative to the profile startTime."}]},{"id":"PositionTickInfo","type":"object","experimental":true,"description":"Specifies a number of samples attributed to a certain source position.","properties":[{"name":"line","type":"integer","description":"Source line number (1-based)."},{"name":"ticks","type":"integer","description":"Number of samples attributed to the source line."}]},{"id":"CoverageRange","type":"object","description":"Coverage data for a source range.","properties":[{"name":"startOffset","type":"integer","description":"JavaScript script source offset for the range start."},{"name":"endOffset","type":"integer","description":"JavaScript script source offset for the range end."},{"name":"count","type":"integer","description":"Collected execution count of the source range."}],"experimental":true},{"id":"FunctionCoverage","type":"object","description":"Coverage data for a JavaScript function.","properties":[{"name":"functionName","type":"string","description":"JavaScript function name."},{"name":"ranges","type":"array","items":{"$ref":"CoverageRange"},"description":"Source ranges inside the function with coverage data."},{"name":"isBlockCoverage","type":"boolean","description":"Whether coverage data for this function has block granularity."}],"experimental":true},{"id":"ScriptCoverage","type":"object","description":"Coverage data for a JavaScript script.","properties":[{"name":"scriptId","$ref":"Runtime.ScriptId","description":"JavaScript script id."},{"name":"url","type":"string","description":"JavaScript script name or url."},{"name":"functions","type":"array","items":{"$ref":"FunctionCoverage"},"description":"Functions contained in the script that has coverage data."}],"experimental":true}],"commands":[{"name":"enable"},{"name":"disable"},{"name":"setSamplingInterval","parameters":[{"name":"interval","type":"integer","description":"New sampling interval in microseconds."}],"description":"Changes CPU profiler sampling interval. Must be called before CPU profiles recording started."},{"name":"start"},{"name":"stop","returns":[{"name":"profile","$ref":"Profile","description":"Recorded profile."}]},{"name":"startPreciseCoverage","parameters":[{"name":"callCount","type":"boolean","optional":true,"description":"Collect accurate call counts beyond simple 'covered' or 'not covered'."}],"description":"Enable precise code coverage. Coverage data for JavaScript executed before enabling precise code coverage may be incomplete. Enabling prevents running optimized code and resets execution counters.","experimental":true},{"name":"stopPreciseCoverage","description":"Disable precise code coverage. Disabling releases unnecessary execution count records and allows executing optimized code.","experimental":true},{"name":"takePreciseCoverage","returns":[{"name":"result","type":"array","items":{"$ref":"ScriptCoverage"},"description":"Coverage data for the current isolate."}],"description":"Collect coverage data for the current isolate, and resets execution counters. Precise code coverage needs to have started.","experimental":true},{"name":"getBestEffortCoverage","returns":[{"name":"result","type":"array","items":{"$ref":"ScriptCoverage"},"description":"Coverage data for the current isolate."}],"description":"Collect coverage data for the current isolate. The coverage data may be incomplete due to garbage collection.","experimental":true}],"events":[{"name":"consoleProfileStarted","parameters":[{"name":"id","type":"string"},{"name":"location","$ref":"Debugger.Location","description":"Location of console.profile()."},{"name":"title","type":"string","optional":true,"description":"Profile title passed as an argument to console.profile()."}],"description":"Sent when new profile recording is started using console.profile() call."},{"name":"consoleProfileFinished","parameters":[{"name":"id","type":"string"},{"name":"location","$ref":"Debugger.Location","description":"Location of console.profileEnd()."},{"name":"profile","$ref":"Profile"},{"name":"title","type":"string","optional":true,"description":"Profile title passed as an argument to console.profile()."}]}]},{"domain":"HeapProfiler","dependencies":["Runtime"],"experimental":true,"types":[{"id":"HeapSnapshotObjectId","type":"string","description":"Heap snapshot object id."},{"id":"SamplingHeapProfileNode","type":"object","description":"Sampling Heap Profile node. Holds callsite information, allocation statistics and child nodes.","properties":[{"name":"callFrame","$ref":"Runtime.CallFrame","description":"Function location."},{"name":"selfSize","type":"number","description":"Allocations size in bytes for the node excluding children."},{"name":"children","type":"array","items":{"$ref":"SamplingHeapProfileNode"},"description":"Child nodes."}]},{"id":"SamplingHeapProfile","type":"object","description":"Profile.","properties":[{"name":"head","$ref":"SamplingHeapProfileNode"}]}],"commands":[{"name":"enable"},{"name":"disable"},{"name":"startTrackingHeapObjects","parameters":[{"name":"trackAllocations","type":"boolean","optional":true}]},{"name":"stopTrackingHeapObjects","parameters":[{"name":"reportProgress","type":"boolean","optional":true,"description":"If true 'reportHeapSnapshotProgress' events will be generated while snapshot is being taken when the tracking is stopped."}]},{"name":"takeHeapSnapshot","parameters":[{"name":"reportProgress","type":"boolean","optional":true,"description":"If true 'reportHeapSnapshotProgress' events will be generated while snapshot is being taken."}]},{"name":"collectGarbage"},{"name":"getObjectByHeapObjectId","parameters":[{"name":"objectId","$ref":"HeapSnapshotObjectId"},{"name":"objectGroup","type":"string","optional":true,"description":"Symbolic group name that can be used to release multiple objects."}],"returns":[{"name":"result","$ref":"Runtime.RemoteObject","description":"Evaluation result."}]},{"name":"addInspectedHeapObject","parameters":[{"name":"heapObjectId","$ref":"HeapSnapshotObjectId","description":"Heap snapshot object id to be accessible by means of $x command line API."}],"description":"Enables console to refer to the node with given id via $x (see Command Line API for more details $x functions)."},{"name":"getHeapObjectId","parameters":[{"name":"objectId","$ref":"Runtime.RemoteObjectId","description":"Identifier of the object to get heap object id for."}],"returns":[{"name":"heapSnapshotObjectId","$ref":"HeapSnapshotObjectId","description":"Id of the heap snapshot object corresponding to the passed remote object id."}]},{"name":"startSampling","parameters":[{"name":"samplingInterval","type":"number","optional":true,"description":"Average sample interval in bytes. Poisson distribution is used for the intervals. The default value is 32768 bytes."}]},{"name":"stopSampling","returns":[{"name":"profile","$ref":"SamplingHeapProfile","description":"Recorded sampling heap profile."}]}],"events":[{"name":"addHeapSnapshotChunk","parameters":[{"name":"chunk","type":"string"}]},{"name":"resetProfiles"},{"name":"reportHeapSnapshotProgress","parameters":[{"name":"done","type":"integer"},{"name":"total","type":"integer"},{"name":"finished","type":"boolean","optional":true}]},{"name":"lastSeenObjectId","description":"If heap objects tracking has been started then backend regularly sends a current value for last seen object id and corresponding timestamp. If the were changes in the heap since last event then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.","parameters":[{"name":"lastSeenObjectId","type":"integer"},{"name":"timestamp","type":"number"}]},{"name":"heapStatsUpdate","description":"If heap objects tracking has been started then backend may send update for one or more fragments","parameters":[{"name":"statsUpdate","type":"array","items":{"type":"integer"},"description":"An array of triplets. Each triplet describes a fragment. The first integer is the fragment index, the second integer is a total count of objects for the fragment, the third integer is a total size of the objects for the fragment."}]}]}]}

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const EventEmitter = __webpack_require__(2);
const util = __webpack_require__(3);

const WebSocket = __webpack_require__(38);

const api = __webpack_require__(45);
const defaults = __webpack_require__(13);
const devtools = __webpack_require__(11);

class ProtocolError extends Error {
    constructor(response) {
        let message = response.message;
        if (response.data) {
            message += ` (${response.data})`;
        }
        super(message);
        // attach the original response as well
        this.response = response;
    }
}

class Chrome extends EventEmitter {
    constructor(options, notifier) {
        super();
        // options
        const defaultTarget = function (targets) {
            // prefer type = 'page' inspectabe targets as they represents
            // browser tabs (fall back to the first instectable target
            // otherwise)
            let backup;
            let target = targets.find((target) => {
                if (target.webSocketDebuggerUrl) {
                    backup = backup || target;
                    return target.type === 'page';
                } else {
                    return false;
                }
            });
            target = target || backup;
            if (target) {
                return target;
            } else {
                throw new Error('No inspectable targets');
            }
        };
        options = options || {};
        this.host = options.host || defaults.HOST;
        this.port = options.port || defaults.PORT;
        this.secure = !!(options.secure);
        this.protocol = options.protocol;
        this.remote = !!(options.remote);
        this.target = options.target ||
            /* backward compatibility */ options.tab || options.chooseTab
            || defaultTarget;
        // locals
        EventEmitter.call(this);
        this._notifier = notifier;
        this._callbacks = {};
        this._nextCommandId = 1;
        // properties
        this.webSocketUrl = undefined;
        // operations
        start.call(this);
    }
}

// avoid misinterpreting protocol's members as custom util.inspect functions
Chrome.prototype.inspect = function (depth, options) {
    options.customInspect = false;
    return util.inspect(this, options);
};

Chrome.prototype.send = function (method, params, callback) {
    const chrome = this;
    if (typeof params === 'function') {
        callback = params;
        params = undefined;
    }
    // return a promise when a callback is not provided
    if (typeof callback === 'function') {
        enqueueCommand.call(chrome, method, params, callback);
    } else {
        return new Promise(function (fulfill, reject) {
            enqueueCommand.call(chrome, method, params, function (error, response) {
                if (error) {
                    reject(error instanceof Error
                           ? error // low-level WebSocket error
                           : new ProtocolError(response));
                } else {
                    fulfill(response);
                }
            });
        });
    }
};

Chrome.prototype.close = function (callback) {
    const chrome = this;
    function closeWebSocket(callback) {
        // don't notify on user-initiated shutdown ('disconnect' event)
        chrome._ws.removeAllListeners('close');
        chrome._ws.close();
        chrome._ws.once('close', function () {
            chrome._ws.removeAllListeners();
            callback();
        });
    }
    if (typeof callback === 'function') {
        closeWebSocket(callback);
    } else {
        return new Promise(function (fulfill, reject) {
            closeWebSocket(fulfill);
        });
    }
};

// send a command to the remote endpoint and register a callback for the reply
function enqueueCommand(method, params, callback) {
    const chrome = this;
    const id = chrome._nextCommandId++;
    const message = {'id': id, 'method': method, 'params': params || {}};
    chrome._ws.send(JSON.stringify(message), function (err) {
        if (err) {
            // handle low-level WebSocket errors
            if (typeof callback === 'function') {
                callback(err);
            }
        } else {
            chrome._callbacks[id] = callback;
        }
    });
}

// initiate the connection process
function start() {
    const chrome = this;
    const options = {'host': chrome.host, 'port': chrome.port, 'secure': chrome.secure};
    Promise.all([
        // fetch the protocol and prepare the API
        fetchProtocol.call(chrome, options).then(api.prepare.bind(chrome)),
        // in the meanwhile fetch the WebSocket debugger URL
        fetchDebuggerURL.call(chrome, options)
    ]).then(function (values) {
        // finally connect to the WebSocket
        const url = values[1];
        return connectToWebSocket.call(chrome, url);
    }).then(function () {
        // since the handler is executed synchronously, the emit() must be
        // performed in the next tick so that uncaught errors in the client code
        // are not intercepted by the Promise mechanism and therefore reported
        // via the 'error' event
        process.nextTick(function () {
            chrome._notifier.emit('connect', chrome);
        });
    }).catch(function (err) {
        chrome._notifier.emit('error', err);
    });
}

// fetch the protocol according to 'protocol' and 'remote'
function fetchProtocol(options) {
    const chrome = this;
    return new Promise(function (fulfill, reject) {
        // if a protocol has been provided then use it
        if (chrome.protocol) {
            fulfill(chrome.protocol);
        }
        // otherwise user either the local or the remote version
        else {
            options.remote = chrome.remote;
            devtools.Protocol(options).then(function (protocol) {
                fulfill(protocol.descriptor);
            }).catch(reject);
        }
    });
}

// extract the debugger URL from a target-like object
function fetchFromObject(fulfill, reject, target) {
    const url = (target || {}).webSocketDebuggerUrl;
    if (url) {
        fulfill(url);
    } else {
        const targetStr = JSON.stringify(target, null, 4);
        const err = new Error('Invalid target ' + targetStr);
        reject(err);
    }
}

// fetch the WebSocket URL according to 'target'
function fetchDebuggerURL(options) {
    const chrome = this;
    return new Promise(function (fulfill, reject) {
        // note: when DevTools are open or another WebSocket is connected to a
        // given target the 'webSocketDebuggerUrl' field is not available
        let userTarget = chrome.target;
        switch (typeof userTarget) {
        case 'string':
            // use default host and port if omitted (and a relative URL is specified)
            if (userTarget.startsWith('/')) {
                const prefix = 'ws://' + chrome.host + ':' + chrome.port;
                userTarget = prefix + userTarget;
            }
            // a WebSocket URL is specified by the user (e.g., node-inspector)
            if (userTarget.match(/^wss?:/i)) {
                fulfill(userTarget);
            }
            // a target id is specified by the user
            else {
                devtools.List(options).then(function (targets) {
                    return targets.find(function (target) {
                        return target.id === userTarget;
                    });
                }).then(function (target) {
                    fetchFromObject(fulfill, reject, target);
                }).catch(reject);
            }
            break;
        case 'object':
            // a target object is specified by the user
            fetchFromObject(fulfill, reject, userTarget);
            break;
        case 'function':
            // a function is specified by the user
            devtools.List(options).then(function (targets) {
                const result = userTarget(targets);
                if (typeof result === 'number') {
                    return targets[result];
                } else {
                    return result;
                }
            }).then(function (target) {
                fetchFromObject(fulfill, reject, target);
            }).catch(reject);
            break;
        default:
            reject(new Error('Invalid target argument "' + chrome.target + '"'));
        }
    });
}

// establish the WebSocket connection and start processing user commands
function connectToWebSocket(url) {
    const chrome = this;
    return new Promise(function (fulfill, reject) {
        // create the WebSocket
        try {
            if (chrome.secure) {
                url = url.replace(/^ws:/i, 'wss:');
            }
            chrome.webSocketUrl = url;
            chrome._ws = new WebSocket(url);
        } catch (err) {
            // handles bad URLs
            reject(err);
            return;
        }
        // set up event handlers
        chrome._ws.on('open', function () {
            fulfill();
        });
        chrome._ws.on('message', function (data) {
            const message = JSON.parse(data);
            handleMessage.call(chrome, message);
        });
        chrome._ws.on('close', function (code) {
            chrome.emit('disconnect');
        });
        chrome._ws.on('error', function (err) {
            reject(err);
        });
    });
}

// handle the messages read from the WebSocket
function handleMessage(message) {
    const chrome = this;
    // command response
    if (message.id) {
        const callback = chrome._callbacks[message.id];
        if (!callback) {
            return;
        }
        // interpret the lack of both 'error' and 'result' as success
        // (this may happen with node-inspector)
        if (message.error) {
            callback(true, message.error);
        } else {
            callback(false, message.result || {});
        }
        // unregister command response callback
        delete chrome._callbacks[message.id];
        // notify when there are no more pending commands
        if (Object.keys(chrome._callbacks).length === 0) {
            chrome.emit('ready');
        }
    }
    // event
    else if (message.method) {
        chrome.emit('event', message);
        chrome.emit(message.method, message.params);
    }
}

module.exports = Chrome;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



const WebSocket = __webpack_require__(14);

WebSocket.Server = __webpack_require__(44);
WebSocket.Receiver = __webpack_require__(18);
WebSocket.Sender = __webpack_require__(21);

module.exports = WebSocket;


/***/ }),
/* 39 */
/***/ (function(module, exports) {

module.exports = require("zlib");

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Class representing an event.
 *
 * @private
 */
class Event {
  /**
   * Create a new `Event`.
   *
   * @param {String} type The name of the event
   * @param {Object} target A reference to the target to which the event was dispatched
   */
  constructor (type, target) {
    this.target = target;
    this.type = type;
  }
}

/**
 * Class representing a message event.
 *
 * @extends Event
 * @private
 */
class MessageEvent extends Event {
  /**
   * Create a new `MessageEvent`.
   *
   * @param {(String|Buffer|ArrayBuffer)} data The received data
   * @param {Boolean} isBinary Specifies if `data` is binary
   * @param {WebSocket} target A reference to the target to which the event was dispatched
   */
  constructor (data, isBinary, target) {
    super('message', target);

    this.binary = isBinary; // non-standard.
    this.data = data;
  }
}

/**
 * Class representing a close event.
 *
 * @extends Event
 * @private
 */
class CloseEvent extends Event {
  /**
   * Create a new `CloseEvent`.
   *
   * @param {Number} code The status code explaining why the connection is being closed
   * @param {String} reason A human-readable string explaining why the connection is closing
   * @param {WebSocket} target A reference to the target to which the event was dispatched
   */
  constructor (code, reason, target) {
    super('close', target);

    this.wasClean = code === undefined || code === 1000;
    this.reason = reason;
    this.target = target;
    this.type = 'close';
    this.code = code;
  }
}

/**
 * Class representing an open event.
 *
 * @extends Event
 * @private
 */
class OpenEvent extends Event {
  /**
   * Create a new `OpenEvent`.
   *
   * @param {WebSocket} target A reference to the target to which the event was dispatched
   */
  constructor (target) {
    super('open', target);
  }
}

/**
 * This provides methods for emulating the `EventTarget` interface. It's not
 * meant to be used directly.
 *
 * @mixin
 */
const EventTarget = {
  /**
   * Register an event listener.
   *
   * @param {String} method A string representing the event type to listen for
   * @param {Function} listener The listener to add
   * @public
   */
  addEventListener (method, listener) {
    if (typeof listener !== 'function') return;

    function onMessage (data, flags) {
      if (flags.binary && this.binaryType === 'arraybuffer') {
        data = new Uint8Array(data).buffer;
      }
      listener.call(this, new MessageEvent(data, !!flags.binary, this));
    }

    function onClose (code, message) {
      listener.call(this, new CloseEvent(code, message, this));
    }

    function onError (event) {
      event.type = 'error';
      event.target = this;
      listener.call(this, event);
    }

    function onOpen () {
      listener.call(this, new OpenEvent(this));
    }

    if (method === 'message') {
      onMessage._listener = listener;
      this.on(method, onMessage);
    } else if (method === 'close') {
      onClose._listener = listener;
      this.on(method, onClose);
    } else if (method === 'error') {
      onError._listener = listener;
      this.on(method, onError);
    } else if (method === 'open') {
      onOpen._listener = listener;
      this.on(method, onOpen);
    } else {
      this.on(method, listener);
    }
  },

  /**
   * Remove an event listener.
   *
   * @param {String} method A string representing the event type to remove
   * @param {Function} listener The listener to remove
   * @public
   */
  removeEventListener (method, listener) {
    const listeners = this.listeners(method);

    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i] === listener || listeners[i]._listener === listener) {
        this.removeListener(method, listeners[i]);
      }
    }
  }
};

module.exports = EventTarget;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



try {
  const isValidUTF8 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"utf-8-validate\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

  module.exports = typeof isValidUTF8 === 'object'
    ? isValidUTF8.Validation.isValidUTF8  // utf-8-validate@<3.0.0
    : isValidUTF8;
} catch (e) {
  module.exports = __webpack_require__(42);
}


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



module.exports = () => true;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



/**
 * Merges an array of buffers into a target buffer.
 *
 * @param {Buffer} target The target buffer
 * @param {Buffer[]} buffers The array of buffers to merge
 * @public
 */
const merge = (target, buffers) => {
  var offset = 0;
  for (var i = 0; i < buffers.length; i++) {
    const buf = buffers[i];
    buf.copy(target, offset);
    offset += buf.length;
  }
};

/**
 * Masks a buffer using the given mask.
 *
 * @param {Buffer} source The buffer to mask
 * @param {Buffer} mask The mask to use
 * @param {Buffer} output The buffer where to store the result
 * @param {Number} offset The offset at which to start writing
 * @param {Number} length The number of bytes to mask.
 * @public
 */
const mask = (source, mask, output, offset, length) => {
  for (var i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask[i & 3];
  }
};

/**
 * Unmasks a buffer using the given mask.
 *
 * @param {Buffer} buffer The buffer to unmask
 * @param {Buffer} mask The mask to use
 * @public
 */
const unmask = (buffer, mask) => {
  // Required until https://github.com/nodejs/node/issues/9006 is resolved.
  const length = buffer.length;
  for (var i = 0; i < length; i++) {
    buffer[i] ^= mask[i & 3];
  }
};

module.exports = { merge, mask, unmask };


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */



const EventEmitter = __webpack_require__(2);
const crypto = __webpack_require__(7);
const Ultron = __webpack_require__(15);
const http = __webpack_require__(4);
const url = __webpack_require__(16);

const PerMessageDeflate = __webpack_require__(5);
const Extensions = __webpack_require__(17);
const WebSocket = __webpack_require__(14);

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/**
 * Class representing a WebSocket server.
 *
 * @extends EventEmitter
 */
class WebSocketServer extends EventEmitter {
  /**
   * Create a `WebSocketServer` instance.
   *
   * @param {Object} options Configuration options
   * @param {String} options.host The hostname where to bind the server
   * @param {Number} options.port The port where to bind the server
   * @param {http.Server} options.server A pre-created HTTP/S server to use
   * @param {Function} options.verifyClient An hook to reject connections
   * @param {Function} options.handleProtocols An hook to handle protocols
   * @param {String} options.path Accept only connections matching this path
   * @param {Boolean} options.noServer Enable no server mode
   * @param {Boolean} options.clientTracking Specifies whether or not to track clients
   * @param {(Boolean|Object)} options.perMessageDeflate Enable/disable permessage-deflate
   * @param {Number} options.maxPayload The maximum allowed message size
   * @param {Function} callback A listener for the `listening` event
   */
  constructor (options, callback) {
    super();

    options = Object.assign({
      maxPayload: 100 * 1024 * 1024,
      perMessageDeflate: true,
      handleProtocols: null,
      clientTracking: true,
      verifyClient: null,
      noServer: false,
      backlog: null, // use default (511 as implemented in net.js)
      server: null,
      host: null,
      path: null,
      port: null
    }, options);

    if (options.port == null && !options.server && !options.noServer) {
      throw new TypeError('missing or invalid options');
    }

    if (options.port != null) {
      this._server = http.createServer((req, res) => {
        const body = http.STATUS_CODES[426];

        res.writeHead(426, {
          'Content-Length': body.length,
          'Content-Type': 'text/plain'
        });
        res.end(body);
      });
      this._server.allowHalfOpen = false;
      this._server.listen(options.port, options.host, options.backlog, callback);
    } else if (options.server) {
      this._server = options.server;
    }

    if (this._server) {
      this._ultron = new Ultron(this._server);
      this._ultron.on('listening', () => this.emit('listening'));
      this._ultron.on('error', (err) => this.emit('error', err));
      this._ultron.on('upgrade', (req, socket, head) => {
        this.handleUpgrade(req, socket, head, (client) => {
          this.emit(`connection${req.url}`, client);
          this.emit('connection', client);
        });
      });
    }

    if (options.clientTracking) this.clients = new Set();
    this.options = options;
    this.path = options.path;
  }

  /**
   * Close the server.
   *
   * @param {Function} cb Callback
   * @public
   */
  close (cb) {
    //
    // Terminate all associated clients.
    //
    if (this.clients) {
      for (const client of this.clients) client.terminate();
    }

    const server = this._server;

    if (server) {
      this._ultron.destroy();
      this._ultron = this._server = null;

      //
      // Close the http server if it was internally created.
      //
      if (this.options.port != null) return server.close(cb);
    }

    if (cb) cb();
  }

  /**
   * See if a given request should be handled by this server instance.
   *
   * @param {http.IncomingMessage} req Request object to inspect
   * @return {Boolean} `true` if the request is valid, else `false`
   * @public
   */
  shouldHandle (req) {
    if (this.options.path && url.parse(req.url).pathname !== this.options.path) {
      return false;
    }

    return true;
  }

  /**
   * Handle a HTTP Upgrade request.
   *
   * @param {http.IncomingMessage} req The request object
   * @param {net.Socket} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @public
   */
  handleUpgrade (req, socket, head, cb) {
    socket.on('error', socketError);

    const version = +req.headers['sec-websocket-version'];

    if (
      !this.shouldHandle(req) ||
      !req.headers.upgrade ||
      req.headers.upgrade.toLowerCase() !== 'websocket' ||
      !req.headers['sec-websocket-key'] ||
      version !== 8 && version !== 13
    ) {
      return abortConnection(socket, 400);
    }

    var protocol = (req.headers['sec-websocket-protocol'] || '').split(/, */);

    //
    // Optionally call external protocol selection handler.
    //
    if (this.options.handleProtocols) {
      protocol = this.options.handleProtocols(protocol);
      if (protocol === false) return abortConnection(socket, 401);
    } else {
      protocol = protocol[0];
    }

    //
    // Optionally call external client verification handler.
    //
    if (this.options.verifyClient) {
      const info = {
        origin: req.headers[`${version === 8 ? 'sec-websocket-origin' : 'origin'}`],
        secure: !!(req.connection.authorized || req.connection.encrypted),
        req
      };

      if (this.options.verifyClient.length === 2) {
        this.options.verifyClient(info, (verified, code, message) => {
          if (!verified) return abortConnection(socket, code || 401, message);

          this.completeUpgrade(protocol, version, req, socket, head, cb);
        });
        return;
      } else if (!this.options.verifyClient(info)) {
        return abortConnection(socket, 401);
      }
    }

    this.completeUpgrade(protocol, version, req, socket, head, cb);
  }

  /**
   * Upgrade the connection to WebSocket.
   *
   * @param {String} protocol The chosen subprotocol
   * @param {Number} version The WebSocket protocol version
   * @param {http.IncomingMessage} req The request object
   * @param {net.Socket} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @private
   */
  completeUpgrade (protocol, version, req, socket, head, cb) {
    //
    // Destroy the socket if the client has already sent a FIN packet.
    //
    if (!socket.readable || !socket.writable) return socket.destroy();

    const key = crypto.createHash('sha1')
      .update(req.headers['sec-websocket-key'] + GUID, 'binary')
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${key}`
    ];

    if (protocol) headers.push(`Sec-WebSocket-Protocol: ${protocol}`);

    const offer = Extensions.parse(req.headers['sec-websocket-extensions']);
    var extensions;

    try {
      extensions = acceptExtensions(this.options, offer);
    } catch (err) {
      return abortConnection(socket, 400);
    }

    const props = Object.keys(extensions);

    if (props.length) {
      const serverExtensions = props.reduce((obj, key) => {
        obj[key] = [extensions[key].params];
        return obj;
      }, {});

      headers.push(`Sec-WebSocket-Extensions: ${Extensions.format(serverExtensions)}`);
    }

    //
    // Allow external modification/inspection of handshake headers.
    //
    this.emit('headers', headers);

    socket.write(headers.concat('', '').join('\r\n'));

    const client = new WebSocket([req, socket, head], {
      maxPayload: this.options.maxPayload,
      protocolVersion: version,
      extensions,
      protocol
    });

    if (this.clients) {
      this.clients.add(client);
      client.on('close', () => this.clients.delete(client));
    }

    socket.removeListener('error', socketError);
    cb(client);
  }
}

module.exports = WebSocketServer;

/**
 * Handle premature socket errors.
 *
 * @private
 */
function socketError () {
  this.destroy();
}

/**
 * Accept WebSocket extensions.
 *
 * @param {Object} options The `WebSocketServer` configuration options
 * @param {Object} offer The parsed value of the `sec-websocket-extensions` header
 * @return {Object} Accepted extensions
 * @private
 */
function acceptExtensions (options, offer) {
  const pmd = options.perMessageDeflate;
  const extensions = {};

  if (pmd && offer[PerMessageDeflate.extensionName]) {
    const perMessageDeflate = new PerMessageDeflate(
      pmd !== true ? pmd : {},
      true,
      options.maxPayload
    );

    perMessageDeflate.accept(offer[PerMessageDeflate.extensionName]);
    extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
  }

  return extensions;
}

/**
 * Close the connection when preconditions are not fulfilled.
 *
 * @param {net.Socket} socket The socket of the upgrade request
 * @param {Number} code The HTTP response status code
 * @param {String} [message] The HTTP response body
 * @private
 */
function abortConnection (socket, code, message) {
  if (socket.writable) {
    message = message || http.STATUS_CODES[code];
    socket.write(
      `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
      'Connection: close\r\n' +
      'Content-type: text/html\r\n' +
      `Content-Length: ${Buffer.byteLength(message)}\r\n` +
      '\r\n' +
      message
    );
  }

  socket.removeListener('error', socketError);
  socket.destroy();
}


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function arrayToObject(parameters) {
    const keyValue = {};
    parameters.forEach(function (parameter) {
        const name = parameter.name;
        delete parameter.name;
        keyValue[name] = parameter;
    });
    return keyValue;
}

function decorate(to, category, object) {
    to.category = category;
    Object.keys(object).forEach(function (field) {
        // skip the 'name' field as it is part of the function prototype
        if (field === 'name') {
            return;
        }
        // commands and events have parameters whereas types have properties
        if (category === 'type' && field === 'properties' ||
            field === 'parameters') {
            to[field] = arrayToObject(object[field]);
        } else {
            to[field] = object[field];
        }
    });
}

function addCommand(chrome, domainName, command) {
    const handler = function (params, callback) {
        return chrome.send(domainName + '.' + command.name, params, callback);
    };
    decorate(handler, 'command', command);
    chrome[domainName][command.name] = handler;
}

function addEvent(chrome, domainName, event) {
    const eventName = domainName + '.' + event.name;
    const handler = function (handler) {
        if (typeof handler === 'function') {
            chrome.on(eventName, handler);
        } else {
            return new Promise(function (fulfill, reject) {
                chrome.once(eventName, fulfill);
            });
        }
    };
    decorate(handler, 'event', event);
    chrome[domainName][event.name] = handler;
}

function addType(chrome, domainName, type) {
    const help = {};
    decorate(help, 'type', type);
    chrome[domainName][type.id] = help;
}

function prepare(protocol) {
    const chrome = this;
    return new Promise(function (fulfill, reject) {
        // assign the protocol and generate the shorthands
        chrome.protocol = protocol;
        protocol.domains.forEach(function (domain) {
            const domainName = domain.domain;
            chrome[domainName] = {};
            // add commands
            (domain.commands || []).forEach(function (command) {
                addCommand(chrome, domainName, command);
            });
            // add events
            (domain.events || []).forEach(function (event) {
                addEvent(chrome, domainName, event);
            });
            // add types
            (domain.types || []).forEach(function (type) {
                addType(chrome, domainName, type);
            });
        });
        fulfill();
    });
}

module.exports.prepare = prepare;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const escapeStringRegexp = __webpack_require__(47);
const ansiStyles = __webpack_require__(48);
const supportsColor = __webpack_require__(53);

const template = __webpack_require__(55);

const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	obj.level = options.level === undefined ? supportsColor.level : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling chalk.constructor()
	// by itself will have a `this` of a previously constructed chalk object.
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
	ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], key);
		}
	};
}

ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
for (const model of Object.keys(ansiStyles.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.color.close,
					closeRe: ansiStyles.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], model);
			};
		}
	};
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.bgColor.close,
					closeRe: ansiStyles.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype.
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = argsLen !== 0 && String(arguments[0]);

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	const args = [].slice.call(arguments, 2);

	if (!Array.isArray(strings)) {
		return strings.toString();
	}

	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(args[i - 1].toString().replace(/[{}]/g, '\\$&'));
		parts.push(strings.raw[i]);
	}

	return template(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = supportsColor;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {
const colorConvert = __webpack_require__(50);

const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {};
	styles.color.ansi256 = {};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {};
	styles.bgColor.ansi256 = {};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (const key of Object.keys(colorConvert)) {
		if (typeof colorConvert[key] !== 'object') {
			continue;
		}

		const suite = colorConvert[key];

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(49)(module)))

/***/ }),
/* 49 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

var conversions = __webpack_require__(23);
var route = __webpack_require__(52);

var convert = {};

var models = Object.keys(conversions);

function wrapRaw(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(function (fromModel) {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	var routes = route(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

module.exports = convert;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

var conversions = __webpack_require__(23);

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

// https://jsperf.com/object-keys-vs-for-in-with-closure/3
var models = Object.keys(conversions);

function buildGraph() {
	var graph = {};

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	var graph = buildGraph();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

module.exports = function (fromModel) {
	var graph = deriveBFS(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};



/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const os = __webpack_require__(24);
const hasFlag = __webpack_require__(54);

const env = process.env;

const support = level => {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
};

let supportLevel = (() => {
	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		return 1;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return 0;
	}

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors.
		const osRelease = os.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if ('TRAVIS' in env || env.CI === 'Travis' || 'CIRCLECI' in env) {
			return 1;
		}

		return 0;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Hyper':
				return 3;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/^(screen|xterm)-256(?:color)?/.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	if (env.TERM === 'dumb') {
		return 0;
	}

	return 0;
})();

if ('FORCE_COLOR' in env) {
	supportLevel = parseInt(env.FORCE_COLOR, 10) === 0 ? 0 : (supportLevel || 1);
}

module.exports = process && support(supportLevel);


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = function (flag, argv) {
	argv = argv || process.argv;

	var terminatorPos = argv.indexOf('--');
	var prefix = /^-{1,2}/.test(flag) ? '' : '--';
	var pos = argv.indexOf(prefix + flag);

	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function data(parent) {
	return {
		styles: [],
		parent,
		contents: []
	};
}

const zeroBound = n => n < 0 ? 0 : n;
const lastIndex = a => zeroBound(a.length - 1);

const last = a => a[lastIndex(a)];

const takeWhileReverse = (array, predicate, start) => {
	const out = [];

	for (let i = start; i >= 0 && i <= start; i--) {
		if (predicate(array[i])) {
			out.unshift(array[i]);
		} else {
			break;
		}
	}

	return out;
};

/**
 * Checks if the character at position i in string is a normal character a.k.a a non control character.
 * */
const isNormalCharacter = (string, i) => {
	const char = string[i];
	const backslash = '\\';

	if (!(char === backslash || char === '{' || char === '}')) {
		return true;
	}

	const n = i === 0 ? 0 : takeWhileReverse(string, x => x === '\\', zeroBound(i - 1)).length;

	return n % 2 === 1;
};

const collectStyles = data => data ? collectStyles(data.parent).concat(data.styles) : ['reset'];

/**
 * Computes the style for a given data based on it's style and the style of it's parent. Also accounts for !style styles
 * which remove a style from the list if present.
 * */
const sumStyles = data => {
	const negateRegex = /^~.+/;
	let out = [];

	for (const style of collectStyles(data)) {
		if (negateRegex.test(style)) {
			const exclude = style.slice(1);
			out = out.filter(x => x !== exclude);
		} else {
			out.push(style);
		}
	}

	return out;
};

/**
 * Takes a string and parses it into a tree of data objects which inherit styles from their parent.
 * */
function parse(string) {
	const root = data(null);
	let pushingStyle = false;

	let current = root;

	for (let i = 0; i < string.length; i++) {
		const char = string[i];

		const addNormalCharacter = () => {
			const lastChunk = last(current.contents);

			if (typeof lastChunk === 'string') {
				current.contents[lastIndex(current.contents)] = lastChunk + char;
			} else {
				current.contents.push(char);
			}
		};

		if (pushingStyle) {
			if (' \t'.indexOf(char) > -1) {
				pushingStyle = false;
			} else if (char === '\n') {
				pushingStyle = false;
				addNormalCharacter();
			} else if (char === '.') {
				current.styles.push('');
			} else {
				current.styles[lastIndex(current.styles)] = (last(current.styles) || '') + char;
			}
		} else if (isNormalCharacter(string, i)) {
			addNormalCharacter();
		} else if (char === '{') {
			pushingStyle = true;
			const nCurrent = data(current);
			current.contents.push(nCurrent);
			current = nCurrent;
		} else if (char === '}') {
			current = current.parent;
		}
	}

	if (current !== root) {
		throw new Error('literal template has an unclosed block');
	}

	return root;
}

/**
 * Takes a tree of data objects and flattens it to a list of data objects with the inherited and negations styles
 * accounted for.
 * */
function flatten(data) {
	let flat = [];

	for (const content of data.contents) {
		if (typeof content === 'string') {
			flat.push({
				styles: sumStyles(data),
				content
			});
		} else {
			flat = flat.concat(flatten(content));
		}
	}

	return flat;
}

function assertStyle(chalk, style) {
	if (!chalk[style]) {
		throw new Error(`invalid Chalk style: ${style}`);
	}
}

/**
 * Checks if a given style is valid and parses style functions.
 * */
function parseStyle(chalk, style) {
	const fnMatch = style.match(/^\s*(\w+)\s*\(\s*([^)]*)\s*\)\s*/);
	if (!fnMatch) {
		assertStyle(chalk, style);
		return chalk[style];
	}

	const name = fnMatch[1].trim();
	const args = fnMatch[2].split(/,/g).map(s => s.trim());

	assertStyle(chalk, name);

	return chalk[name].apply(chalk, args);
}

/**
 * Performs the actual styling of the string, essentially lifted from cli.js.
 * */
function style(chalk, flat) {
	return flat.map(data => {
		const fn = data.styles.reduce(parseStyle, chalk);
		return fn(data.content.replace(/\n$/, ''));
	}).join('');
}

module.exports = (chalk, string) => style(chalk, flatten(parse(string)));


/***/ }),
/* 56 */
/***/ (function(module, exports) {

module.exports = {"name":"neswitch","version":"1.0.0","description":"Tell me when the Nintendo Switch approaches the MSRP.","main":"index.js","author":"Daniel Ochoa <daniel.o.ochoa@gmail.com>","license":"MIT","scripts":{"build":"webpack","lint":"./node_modules/.bin/eslint */**"},"bin":{"neswitch":"./bin/app.bundle.js"},"dependencies":{"chalk":"^2.0.1","chrome-launcher":"^0.4.0","chrome-remote-interface":"^0.24.3","commander":"^2.11.0","lighthouse-logger":"^1.0.0"},"devDependencies":{"babel-core":"^6.25.0","babel-loader":"^7.1.1","babel-plugin-transform-async-to-generator":"^6.24.1","babel-plugin-transform-object-rest-spread":"^6.23.0","babel-preset-env":"^1.6.0","babel-preset-es2016":"^6.24.1","eslint":"^3.19.0","eslint-config-airbnb":"^15.0.2","eslint-plugin-import":"^2.7.0","webpack":"^3.4.1","webpack-dev-server":"^2.6.1"},"false":{}}

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

const chromeLauncher = __webpack_require__(58);
const logger = __webpack_require__(22);
/**
 * Abstraction built on top of chrome-launcher to interact with chrome.
 */

class Chrome {
  constructor(options) {
    this.options = Object.assign({
      port: 3001,
      chromeFlags: ['--window-size=412,732', '--disable-gpu', options.headless ? '--headless' : '']
    }, options);
    return this._launchChrome();
  }

  _launchChrome() {
    return chromeLauncher.launch(this.options);
  }
}

module.exports = Chrome;

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(59));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHVDQUFrQyJ9

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = __webpack_require__(6);
const fs = __webpack_require__(0);
const chromeFinder = __webpack_require__(60);
const random_port_1 = __webpack_require__(66);
const flags_1 = __webpack_require__(67);
const utils_1 = __webpack_require__(68);
const net = __webpack_require__(27);
const rimraf = __webpack_require__(70);
const log = __webpack_require__(25);
const spawn = childProcess.spawn;
const execSync = childProcess.execSync;
const isWindows = process.platform === 'win32';
const _SIGINT = 'SIGINT';
const _SIGINT_EXIT_CODE = 130;
const _SUPPORTED_PLATFORMS = new Set(['darwin', 'linux', 'win32']);
function launch(opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        opts.handleSIGINT = utils_1.defaults(opts.handleSIGINT, true);
        const instance = new Launcher(opts);
        // Kill spawned Chrome process in case of ctrl-C.
        if (opts.handleSIGINT) {
            process.on(_SIGINT, () => __awaiter(this, void 0, void 0, function* () {
                yield instance.kill();
                process.exit(_SIGINT_EXIT_CODE);
            }));
        }
        yield instance.launch();
        return { pid: instance.pid, port: instance.port, kill: () => __awaiter(this, void 0, void 0, function* () { return instance.kill(); }) };
    });
}
exports.launch = launch;
class Launcher {
    constructor(opts = {}, moduleOverrides = {}) {
        this.opts = opts;
        this.tmpDirandPidFileReady = false;
        this.pollInterval = 500;
        this.fs = moduleOverrides.fs || fs;
        this.rimraf = moduleOverrides.rimraf || rimraf;
        this.spawn = moduleOverrides.spawn || spawn;
        log.setLevel(utils_1.defaults(this.opts.logLevel, 'silent'));
        // choose the first one (default)
        this.startingUrl = utils_1.defaults(this.opts.startingUrl, 'about:blank');
        this.chromeFlags = utils_1.defaults(this.opts.chromeFlags, []);
        this.requestedPort = utils_1.defaults(this.opts.port, 0);
        this.chromePath = this.opts.chromePath;
        this.enableExtensions = utils_1.defaults(this.opts.enableExtensions, false);
    }
    get flags() {
        let flags = flags_1.DEFAULT_FLAGS.concat([
            `--remote-debugging-port=${this.port}`,
            // Place Chrome profile in a custom location we'll rm -rf later
            `--user-data-dir=${this.userDataDir}`
        ]);
        if (this.enableExtensions) {
            flags = flags.filter(flag => flag !== '--disable-extensions');
        }
        if (process.platform === 'linux') {
            flags.push('--disable-setuid-sandbox');
        }
        flags.push(...this.chromeFlags);
        flags.push(this.startingUrl);
        return flags;
    }
    // Wrapper function to enable easy testing.
    makeTmpDir() {
        return utils_1.makeTmpDir();
    }
    prepare() {
        const platform = process.platform;
        if (!_SUPPORTED_PLATFORMS.has(platform)) {
            throw new Error(`Platform ${platform} is not supported`);
        }
        this.userDataDir = this.opts.userDataDir || this.makeTmpDir();
        this.outFile = this.fs.openSync(`${this.userDataDir}/chrome-out.log`, 'a');
        this.errFile = this.fs.openSync(`${this.userDataDir}/chrome-err.log`, 'a');
        // fix for Node4
        // you can't pass a fd to fs.writeFileSync
        this.pidFile = `${this.userDataDir}/chrome.pid`;
        log.verbose('ChromeLauncher', `created ${this.userDataDir}`);
        this.tmpDirandPidFileReady = true;
    }
    launch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.requestedPort !== 0) {
                this.port = this.requestedPort;
                // If an explict port is passed first look for an open connection...
                try {
                    return yield this.isDebuggerReady();
                }
                catch (err) {
                    log.log('ChromeLauncher', `No debugging port found on port ${this.port}, launching a new Chrome.`);
                }
            }
            if (!this.tmpDirandPidFileReady) {
                this.prepare();
            }
            if (this.chromePath === undefined) {
                const installations = yield chromeFinder[process.platform]();
                if (installations.length === 0) {
                    throw new Error('No Chrome Installations Found');
                }
                this.chromePath = installations[0];
            }
            this.pid = yield this.spawnProcess(this.chromePath);
            return Promise.resolve();
        });
    }
    spawnProcess(execPath) {
        return __awaiter(this, void 0, void 0, function* () {
            // Typescript is losing track of the return type without the explict typing.
            const spawnPromise = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (this.chrome) {
                    log.log('ChromeLauncher', `Chrome already running with pid ${this.chrome.pid}.`);
                    return resolve(this.chrome.pid);
                }
                // If a zero value port is set, it means the launcher
                // is responsible for generating the port number.
                // We do this here so that we can know the port before
                // we pass it into chrome.
                if (this.requestedPort === 0) {
                    this.port = yield random_port_1.getRandomPort();
                }
                log.verbose('ChromeLauncher', `Launching with command:\n"${execPath}" ${this.flags.join(' ')}`);
                const chrome = this.spawn(execPath, this.flags, { detached: true, stdio: ['ignore', this.outFile, this.errFile] });
                this.chrome = chrome;
                this.fs.writeFileSync(this.pidFile, chrome.pid.toString());
                log.verbose('ChromeLauncher', `Chrome running with pid ${chrome.pid} on port ${this.port}.`);
                resolve(chrome.pid);
            }));
            const pid = yield spawnPromise;
            yield this.waitUntilReady();
            return pid;
        });
    }
    cleanup(client) {
        if (client) {
            client.removeAllListeners();
            client.end();
            client.destroy();
            client.unref();
        }
    }
    // resolves if ready, rejects otherwise
    isDebuggerReady() {
        return new Promise((resolve, reject) => {
            const client = net.createConnection(this.port);
            client.once('error', err => {
                this.cleanup(client);
                reject(err);
            });
            client.once('connect', () => {
                this.cleanup(client);
                resolve();
            });
        });
    }
    // resolves when debugger is ready, rejects after 10 polls
    waitUntilReady() {
        const launcher = this;
        return new Promise((resolve, reject) => {
            let retries = 0;
            let waitStatus = 'Waiting for browser.';
            const poll = () => {
                if (retries === 0) {
                    log.log('ChromeLauncher', waitStatus);
                }
                retries++;
                waitStatus += '..';
                log.log('ChromeLauncher', waitStatus);
                launcher.isDebuggerReady()
                    .then(() => {
                    log.log('ChromeLauncher', waitStatus + `${log.greenify(log.tick)}`);
                    resolve();
                })
                    .catch(err => {
                    if (retries > 10) {
                        log.error('ChromeLauncher', err.message);
                        const stderr = this.fs.readFileSync(`${this.userDataDir}/chrome-err.log`, { encoding: 'utf-8' });
                        log.error('ChromeLauncher', `Logging contents of ${this.userDataDir}/chrome-err.log`);
                        log.error('ChromeLauncher', stderr);
                        return reject(err);
                    }
                    utils_1.delay(launcher.pollInterval).then(poll);
                });
            };
            poll();
        });
    }
    kill() {
        return new Promise(resolve => {
            if (this.chrome) {
                this.chrome.on('close', () => {
                    this.destroyTmp().then(resolve);
                });
                log.log('ChromeLauncher', 'Killing all Chrome Instances');
                try {
                    if (isWindows) {
                        execSync(`taskkill /pid ${this.chrome.pid} /T /F`);
                    }
                    else {
                        process.kill(-this.chrome.pid);
                    }
                }
                catch (err) {
                    log.warn('ChromeLauncher', `Chrome could not be killed ${err.message}`);
                }
                delete this.chrome;
            }
            else {
                // fail silently as we did not start chrome
                resolve();
            }
        });
    }
    destroyTmp() {
        return new Promise(resolve => {
            // Only clean up the tmp dir if we created it.
            if (this.userDataDir === undefined || this.opts.userDataDir !== undefined) {
                return resolve();
            }
            if (this.outFile) {
                this.fs.closeSync(this.outFile);
                delete this.outFile;
            }
            if (this.errFile) {
                this.fs.closeSync(this.errFile);
                delete this.errFile;
            }
            this.rimraf(this.userDataDir, () => resolve());
        });
    }
}
exports.Launcher = Launcher;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hyb21lLWxhdW5jaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hyb21lLWxhdW5jaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0dBSUc7QUFDSCxZQUFZLENBQUM7Ozs7Ozs7Ozs7QUFFYiw4Q0FBOEM7QUFDOUMseUJBQXlCO0FBQ3pCLGdEQUFnRDtBQUNoRCwrQ0FBNEM7QUFDNUMsbUNBQXNDO0FBQ3RDLG1DQUFvRDtBQUNwRCwyQkFBMkI7QUFDM0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3pDLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztBQUN2QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQztBQUMvQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUM7QUFDekIsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7QUFDOUIsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztBQTJCbkUsZ0JBQTZCLE9BQWdCLEVBQUU7O1FBQzdDLElBQUksQ0FBQyxZQUFZLEdBQUcsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXRELE1BQU0sUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXBDLGlEQUFpRDtRQUNqRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN0QixPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtnQkFDbEIsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRXhCLE1BQU0sQ0FBQyxFQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSyxFQUFFLElBQUksRUFBRSxxREFBWSxNQUFNLENBQU4sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFBLEdBQUEsRUFBQyxDQUFDO0lBQ3ZGLENBQUM7Q0FBQTtBQWhCRCx3QkFnQkM7QUFFRDtJQW9CRSxZQUFvQixPQUFnQixFQUFFLEVBQUUsa0JBQW1DLEVBQUU7UUFBekQsU0FBSSxHQUFKLElBQUksQ0FBYztRQW5COUIsMEJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQzlCLGlCQUFZLEdBQVcsR0FBRyxDQUFDO1FBbUJqQyxJQUFJLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsZUFBZSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUM7UUFDL0MsSUFBSSxDQUFDLEtBQUssR0FBRyxlQUFlLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQztRQUU1QyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUVyRCxpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxnQkFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxXQUFXLEdBQUcsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsYUFBYSxHQUFHLGdCQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN2QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxJQUFZLEtBQUs7UUFDZixJQUFJLEtBQUssR0FBRyxxQkFBYSxDQUFDLE1BQU0sQ0FBQztZQUMvQiwyQkFBMkIsSUFBSSxDQUFDLElBQUksRUFBRTtZQUN0QywrREFBK0Q7WUFDL0QsbUJBQW1CLElBQUksQ0FBQyxXQUFXLEVBQUU7U0FDdEMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUMxQixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxLQUFLLHNCQUFzQixDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFN0IsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCwyQ0FBMkM7SUFDM0MsVUFBVTtRQUNSLE1BQU0sQ0FBQyxrQkFBVSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVELE9BQU87UUFDTCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBOEIsQ0FBQztRQUN4RCxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLFFBQVEsbUJBQW1CLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDOUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUUzRSxnQkFBZ0I7UUFDaEIsMENBQTBDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxhQUFhLENBQUM7UUFFaEQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBRTdELElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7SUFDcEMsQ0FBQztJQUVLLE1BQU07O1lBQ1YsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7Z0JBRS9CLG9FQUFvRTtnQkFDcEUsSUFBSSxDQUFDO29CQUNILE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEMsQ0FBQztnQkFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNiLEdBQUcsQ0FBQyxHQUFHLENBQ0gsZ0JBQWdCLEVBQ2hCLG1DQUFtQyxJQUFJLENBQUMsSUFBSSwyQkFBMkIsQ0FBQyxDQUFDO2dCQUMvRSxDQUFDO1lBQ0gsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sYUFBYSxHQUFHLE1BQU0sWUFBWSxDQUFDLE9BQU8sQ0FBQyxRQUE4QixDQUFDLEVBQUUsQ0FBQztnQkFDbkYsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvQixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7Z0JBQ25ELENBQUM7Z0JBRUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUVELElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUM7S0FBQTtJQUVhLFlBQVksQ0FBQyxRQUFnQjs7WUFDekMsNEVBQTRFO1lBQzVFLE1BQU0sWUFBWSxHQUFvQixJQUFJLE9BQU8sQ0FBQyxDQUFPLE9BQU87Z0JBQzlELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNoQixHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLG1DQUFtQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7b0JBQ2pGLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztnQkFHRCxxREFBcUQ7Z0JBQ3JELGlEQUFpRDtnQkFDakQsc0RBQXNEO2dCQUN0RCwwQkFBMEI7Z0JBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLDJCQUFhLEVBQUUsQ0FBQztnQkFDcEMsQ0FBQztnQkFFRCxHQUFHLENBQUMsT0FBTyxDQUNQLGdCQUFnQixFQUFFLDZCQUE2QixRQUFRLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUNyQixRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDM0YsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Z0JBRXJCLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUUzRCxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLDJCQUEyQixNQUFNLENBQUMsR0FBRyxZQUFZLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dCQUM3RixPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLENBQUMsQ0FBQSxDQUFDLENBQUM7WUFFSCxNQUFNLEdBQUcsR0FBRyxNQUFNLFlBQVksQ0FBQztZQUMvQixNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM1QixNQUFNLENBQUMsR0FBRyxDQUFDO1FBQ2IsQ0FBQztLQUFBO0lBRU8sT0FBTyxDQUFDLE1BQW1CO1FBQ2pDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDWCxNQUFNLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUM1QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDYixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pCLENBQUM7SUFDSCxDQUFDO0lBRUQsdUNBQXVDO0lBQy9CLGVBQWU7UUFDckIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU07WUFDakMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFLLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHO2dCQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQixPQUFPLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMERBQTBEO0lBQ2xELGNBQWM7UUFDcEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBRXRCLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNO1lBQ2pDLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNoQixJQUFJLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQztZQUV4QyxNQUFNLElBQUksR0FBRztnQkFDWCxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztnQkFDRCxPQUFPLEVBQUUsQ0FBQztnQkFDVixVQUFVLElBQUksSUFBSSxDQUFDO2dCQUNuQixHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUV0QyxRQUFRLENBQUMsZUFBZSxFQUFFO3FCQUNyQixJQUFJLENBQUM7b0JBQ0osR0FBRyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BFLE9BQU8sRUFBRSxDQUFDO2dCQUNaLENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsR0FBRztvQkFDUixFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDakIsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3pDLE1BQU0sTUFBTSxHQUNSLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsaUJBQWlCLEVBQUUsRUFBQyxRQUFRLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQzt3QkFDcEYsR0FBRyxDQUFDLEtBQUssQ0FDTCxnQkFBZ0IsRUFBRSx1QkFBdUIsSUFBSSxDQUFDLFdBQVcsaUJBQWlCLENBQUMsQ0FBQzt3QkFDaEYsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQzt3QkFDcEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDckIsQ0FBQztvQkFDRCxhQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUMsQ0FBQyxDQUFDLENBQUM7WUFDVCxDQUFDLENBQUM7WUFDRixJQUFJLEVBQUUsQ0FBQztRQUVULENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUk7UUFDRixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTztZQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO29CQUN0QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNsQyxDQUFDLENBQUMsQ0FBQztnQkFFSCxHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLDhCQUE4QixDQUFDLENBQUM7Z0JBQzFELElBQUksQ0FBQztvQkFDSCxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNkLFFBQVEsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO29CQUNyRCxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNqQyxDQUFDO2dCQUNILENBQUM7Z0JBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDYixHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLDhCQUE4QixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDMUUsQ0FBQztnQkFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDckIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLDJDQUEyQztnQkFDM0MsT0FBTyxFQUFFLENBQUM7WUFDWixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsVUFBVTtRQUNSLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPO1lBQ3hCLDhDQUE4QztZQUM5QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNqQixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUN0QixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3RCLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBOVBELDRCQThQQztBQUFBLENBQUMifQ==

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

Object.defineProperty(exports, "__esModule", { value: true });
const fs = __webpack_require__(0);
const path = __webpack_require__(1);
const execSync = __webpack_require__(6).execSync;
const execFileSync = __webpack_require__(6).execFileSync;
const log = __webpack_require__(25);
const newLineRegex = /\r?\n/;
function darwin() {
    const suffixes = ['/Contents/MacOS/Google Chrome Canary', '/Contents/MacOS/Google Chrome'];
    const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
        '/Versions/A/Frameworks/LaunchServices.framework' +
        '/Versions/A/Support/lsregister';
    const installations = [];
    const customChromePath = resolveChromePath();
    if (customChromePath) {
        installations.push(customChromePath);
    }
    execSync(`${LSREGISTER} -dump` +
        ' | grep -i \'google chrome\\( canary\\)\\?.app$\'' +
        ' | awk \'{$1=""; print $0}\'')
        .toString()
        .split(newLineRegex)
        .forEach((inst) => {
        suffixes.forEach(suffix => {
            const execPath = path.join(inst.trim(), suffix);
            if (canAccess(execPath)) {
                installations.push(execPath);
            }
        });
    });
    // Retains one per line to maintain readability.
    // clang-format off
    const priorities = [
        { regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome.app`), weight: 50 },
        { regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome Canary.app`), weight: 51 },
        { regex: /^\/Applications\/.*Chrome.app/, weight: 100 },
        { regex: /^\/Applications\/.*Chrome Canary.app/, weight: 101 },
        { regex: /^\/Volumes\/.*Chrome.app/, weight: -2 },
        { regex: /^\/Volumes\/.*Chrome Canary.app/, weight: -1 },
    ];
    if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
        priorities.push({ regex: new RegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH), weight: 150 });
    }
    if (process.env.CHROME_PATH) {
        priorities.push({ regex: new RegExp(process.env.CHROME_PATH), weight: 151 });
    }
    // clang-format on
    return sort(installations, priorities);
}
exports.darwin = darwin;
function resolveChromePath() {
    if (canAccess(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
    }
    if (canAccess(process.env.LIGHTHOUSE_CHROMIUM_PATH)) {
        log.warn('ChromeLauncher', 'LIGHTHOUSE_CHROMIUM_PATH is deprecated, use CHROME_PATH env variable instead.');
        return process.env.LIGHTHOUSE_CHROMIUM_PATH;
    }
    return undefined;
}
/**
 * Look for linux executables in 3 ways
 * 1. Look into CHROME_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for google-chrome-stable & google-chrome executables by using the which command
 */
function linux() {
    let installations = [];
    // 1. Look into CHROME_PATH env variable
    const customChromePath = resolveChromePath();
    if (customChromePath) {
        installations.push(customChromePath);
    }
    // 2. Look into the directories where .desktop are saved on gnome based distro's
    const desktopInstallationFolders = [
        path.join(__webpack_require__(24).homedir(), '.local/share/applications/'),
        '/usr/share/applications/',
    ];
    desktopInstallationFolders.forEach(folder => {
        installations = installations.concat(findChromeExecutables(folder));
    });
    // Look for google-chrome-stable & google-chrome executables by using the which command
    const executables = [
        'google-chrome-stable',
        'google-chrome',
    ];
    executables.forEach((executable) => {
        try {
            const chromePath = execFileSync('which', [executable]).toString().split(newLineRegex)[0];
            if (canAccess(chromePath)) {
                installations.push(chromePath);
            }
        }
        catch (e) {
            // Not installed.
        }
    });
    if (!installations.length) {
        throw new Error('The environment variable CHROME_PATH must be set to ' +
            'executable of a build of Chromium version 54.0 or later.');
    }
    const priorities = [
        { regex: /chrome-wrapper$/, weight: 51 },
        { regex: /google-chrome-stable$/, weight: 50 },
        { regex: /google-chrome$/, weight: 49 },
    ];
    if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
        priorities.push({ regex: new RegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH), weight: 100 });
    }
    if (process.env.CHROME_PATH) {
        priorities.push({ regex: new RegExp(process.env.CHROME_PATH), weight: 101 });
    }
    return sort(uniq(installations.filter(Boolean)), priorities);
}
exports.linux = linux;
function win32() {
    const installations = [];
    const suffixes = [
        '\\Google\\Chrome SxS\\Application\\chrome.exe', '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const prefixes = [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']];
    const customChromePath = resolveChromePath();
    if (customChromePath) {
        installations.push(customChromePath);
    }
    prefixes.forEach(prefix => suffixes.forEach(suffix => {
        const chromePath = path.join(prefix, suffix);
        if (canAccess(chromePath)) {
            installations.push(chromePath);
        }
    }));
    return installations;
}
exports.win32 = win32;
function sort(installations, priorities) {
    const defaultPriority = 10;
    return installations
        .map((inst) => {
        for (const pair of priorities) {
            if (pair.regex.test(inst)) {
                return { path: inst, weight: pair.weight };
            }
        }
        return { path: inst, weight: defaultPriority };
    })
        .sort((a, b) => (b.weight - a.weight))
        .map(pair => pair.path);
}
function canAccess(file) {
    if (!file) {
        return false;
    }
    try {
        fs.accessSync(file);
        return true;
    }
    catch (e) {
        return false;
    }
}
function uniq(arr) {
    return Array.from(new Set(arr));
}
function findChromeExecutables(folder) {
    const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
    const chromeExecRegex = '^Exec=\/.*\/(google|chrome|chromium)-.*';
    let installations = [];
    if (canAccess(folder)) {
        // Output of the grep & print looks like:
        //    /opt/google/chrome/google-chrome --profile-directory
        //    /home/user/Downloads/chrome-linux/chrome-wrapper %U
        let execPaths = execSync(`grep -ER "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`)
            .toString()
            .split(newLineRegex)
            .map((execPath) => execPath.replace(argumentsRegex, '$1'));
        execPaths.forEach((execPath) => canAccess(execPath) && installations.push(execPath));
    }
    return installations;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hyb21lLWZpbmRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNocm9tZS1maW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUNILFlBQVksQ0FBQzs7QUFFYixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDbkQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLFlBQVksQ0FBQztBQUMzRCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUV6QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUM7QUFJN0I7SUFDRSxNQUFNLFFBQVEsR0FBRyxDQUFDLHNDQUFzQyxFQUFFLCtCQUErQixDQUFDLENBQUM7SUFFM0YsTUFBTSxVQUFVLEdBQUcsbURBQW1EO1FBQ2xFLGlEQUFpRDtRQUNqRCxnQ0FBZ0MsQ0FBQztJQUVyQyxNQUFNLGFBQWEsR0FBa0IsRUFBRSxDQUFDO0lBRXhDLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztJQUM3QyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDckIsYUFBYSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxRQUFRLENBQ0osR0FBRyxVQUFVLFFBQVE7UUFDckIsbURBQW1EO1FBQ25ELDhCQUE4QixDQUFDO1NBQzlCLFFBQVEsRUFBRTtTQUNWLEtBQUssQ0FBQyxZQUFZLENBQUM7U0FDbkIsT0FBTyxDQUFDLENBQUMsSUFBWTtRQUNwQixRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU07WUFDckIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDaEQsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVQLGdEQUFnRDtJQUNoRCxtQkFBbUI7SUFDbkIsTUFBTSxVQUFVLEdBQWU7UUFDN0IsRUFBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksNEJBQTRCLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDO1FBQ2pGLEVBQUMsS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1DQUFtQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBQztRQUN4RixFQUFDLEtBQUssRUFBRSwrQkFBK0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDO1FBQ3JELEVBQUMsS0FBSyxFQUFFLHNDQUFzQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUM7UUFDNUQsRUFBQyxLQUFLLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFDO1FBQy9DLEVBQUMsS0FBSyxFQUFFLGlDQUFpQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBQztLQUN2RCxDQUFDO0lBRUYsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFDekMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUM1QixVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBbERELHdCQWtEQztBQUVEO0lBQ0UsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztJQUNqQyxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsR0FBRyxDQUFDLElBQUksQ0FDSixnQkFBZ0IsRUFDaEIsK0VBQStFLENBQUMsQ0FBQztRQUNyRixNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQztJQUM5QyxDQUFDO0lBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSDtJQUNFLElBQUksYUFBYSxHQUFhLEVBQUUsQ0FBQztJQUVqQyx3Q0FBd0M7SUFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO0lBQzdDLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNyQixhQUFhLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELGdGQUFnRjtJQUNoRixNQUFNLDBCQUEwQixHQUFHO1FBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLDRCQUE0QixDQUFDO1FBQ2hFLDBCQUEwQjtLQUMzQixDQUFDO0lBQ0YsMEJBQTBCLENBQUMsT0FBTyxDQUFDLE1BQU07UUFDdkMsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDLENBQUMsQ0FBQztJQUVILHVGQUF1RjtJQUN2RixNQUFNLFdBQVcsR0FBRztRQUNsQixzQkFBc0I7UUFDdEIsZUFBZTtLQUNoQixDQUFDO0lBQ0YsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQWtCO1FBQ3JDLElBQUksQ0FBQztZQUNILE1BQU0sVUFBVSxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6RixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLENBQUM7UUFDSCxDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNYLGlCQUFpQjtRQUNuQixDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQ1gsc0RBQXNEO1lBQ3RELDBEQUEwRCxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFlO1FBQzdCLEVBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUM7UUFDdEMsRUFBQyxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBQztRQUM1QyxFQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDO0tBQ3RDLENBQUM7SUFFRixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztRQUN6QyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzVCLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQy9ELENBQUM7QUF4REQsc0JBd0RDO0FBRUQ7SUFDRSxNQUFNLGFBQWEsR0FBa0IsRUFBRSxDQUFDO0lBQ3hDLE1BQU0sUUFBUSxHQUFHO1FBQ2YsK0NBQStDLEVBQUUsMkNBQTJDO0tBQzdGLENBQUM7SUFDRixNQUFNLFFBQVEsR0FDVixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBRTNGLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztJQUM3QyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDckIsYUFBYSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU07UUFDaEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0MsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ0osTUFBTSxDQUFDLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBcEJELHNCQW9CQztBQUVELGNBQWMsYUFBdUIsRUFBRSxVQUFzQjtJQUMzRCxNQUFNLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFDM0IsTUFBTSxDQUFDLGFBQWE7U0FFZixHQUFHLENBQUMsQ0FBQyxJQUFZO1FBQ2hCLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFDLENBQUM7WUFDM0MsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUMsQ0FBQztJQUMvQyxDQUFDLENBQUM7U0FFRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7U0FFckMsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUVELG1CQUFtQixJQUFZO0lBQzdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNWLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0gsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDWCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUM7QUFFRCxjQUFjLEdBQWU7SUFDM0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQsK0JBQStCLE1BQWM7SUFDM0MsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLENBQUMsd0NBQXdDO0lBQzdFLE1BQU0sZUFBZSxHQUFHLHlDQUF5QyxDQUFDO0lBRWxFLElBQUksYUFBYSxHQUFrQixFQUFFLENBQUM7SUFDdEMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0Qix5Q0FBeUM7UUFDekMsMERBQTBEO1FBQzFELHlEQUF5RDtRQUN6RCxJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxlQUFlLEtBQUssTUFBTSw0QkFBNEIsQ0FBQzthQUN4RSxRQUFRLEVBQUU7YUFDVixLQUFLLENBQUMsWUFBWSxDQUFDO2FBQ25CLEdBQUcsQ0FBQyxDQUFDLFFBQWdCLEtBQUssUUFBUSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUV2RixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBZ0IsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQy9GLENBQUM7SUFFRCxNQUFNLENBQUMsYUFBYSxDQUFDO0FBQ3ZCLENBQUMifQ==

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Detect Electron renderer process, which is node, but we should
 * treat as a browser.
 */

if (typeof process !== 'undefined' && process.type === 'renderer') {
  module.exports = __webpack_require__(62);
} else {
  module.exports = __webpack_require__(64);
}


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(26);
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}


/***/ }),
/* 63 */
/***/ (function(module, exports) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Module dependencies.
 */

var tty = __webpack_require__(65);
var util = __webpack_require__(3);

/**
 * This is the Node.js implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(26);
exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(function (key) {
  return /^debug_/i.test(key);
}).reduce(function (obj, key) {
  // camel-case
  var prop = key
    .substring(6)
    .toLowerCase()
    .replace(/_([a-z])/g, function (_, k) { return k.toUpperCase() });

  // coerce string value into JS value
  var val = process.env[key];
  if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
  else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
  else if (val === 'null') val = null;
  else val = Number(val);

  obj[prop] = val;
  return obj;
}, {});

/**
 * The file descriptor to write the `debug()` calls to.
 * Set the `DEBUG_FD` env variable to override with another value. i.e.:
 *
 *   $ DEBUG_FD=3 node script.js 3>debug.log
 */

var fd = parseInt(process.env.DEBUG_FD, 10) || 2;

if (1 !== fd && 2 !== fd) {
  util.deprecate(function(){}, 'except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)')()
}

var stream = 1 === fd ? process.stdout :
             2 === fd ? process.stderr :
             createWritableStdioStream(fd);

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
  return 'colors' in exports.inspectOpts
    ? Boolean(exports.inspectOpts.colors)
    : tty.isatty(fd);
}

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

exports.formatters.o = function(v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts)
    .replace(/\s*\n\s*/g, ' ');
};

/**
 * Map %o to `util.inspect()`, allowing multiple lines if needed.
 */

exports.formatters.O = function(v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts);
};

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var name = this.namespace;
  var useColors = this.useColors;

  if (useColors) {
    var c = this.color;
    var prefix = '  \u001b[3' + c + ';1m' + name + ' ' + '\u001b[0m';

    args[0] = prefix + args[0].split('\n').join('\n' + prefix);
    args.push('\u001b[3' + c + 'm+' + exports.humanize(this.diff) + '\u001b[0m');
  } else {
    args[0] = new Date().toUTCString()
      + ' ' + name + ' ' + args[0];
  }
}

/**
 * Invokes `util.format()` with the specified arguments and writes to `stream`.
 */

function log() {
  return stream.write(util.format.apply(util, arguments) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  if (null == namespaces) {
    // If you set a process.env field to null or undefined, it gets cast to the
    // string 'null' or 'undefined'. Just delete instead.
    delete process.env.DEBUG;
  } else {
    process.env.DEBUG = namespaces;
  }
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  return process.env.DEBUG;
}

/**
 * Copied from `node/src/node.js`.
 *
 * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
 * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
 */

function createWritableStdioStream (fd) {
  var stream;
  var tty_wrap = process.binding('tty_wrap');

  // Note stream._type is used for test-module-load-list.js

  switch (tty_wrap.guessHandleType(fd)) {
    case 'TTY':
      stream = new tty.WriteStream(fd);
      stream._type = 'tty';

      // Hack to have stream not keep the event loop alive.
      // See https://github.com/joyent/node/issues/1726
      if (stream._handle && stream._handle.unref) {
        stream._handle.unref();
      }
      break;

    case 'FILE':
      var fs = __webpack_require__(0);
      stream = new fs.SyncWriteStream(fd, { autoClose: false });
      stream._type = 'fs';
      break;

    case 'PIPE':
    case 'TCP':
      var net = __webpack_require__(27);
      stream = new net.Socket({
        fd: fd,
        readable: false,
        writable: true
      });

      // FIXME Should probably have an option in net.Socket to create a
      // stream from an existing fd which is writable only. But for now
      // we'll just add this hack and set the `readable` member to false.
      // Test: ./node test/fixtures/echo.js < /etc/passwd
      stream.readable = false;
      stream.read = null;
      stream._type = 'pipe';

      // FIXME Hack to have stream not keep the event loop alive.
      // See https://github.com/joyent/node/issues/1726
      if (stream._handle && stream._handle.unref) {
        stream._handle.unref();
      }
      break;

    default:
      // Probably an error on in uv_guess_handle()
      throw new Error('Implement me. Unknown stream file type!');
  }

  // For supporting legacy API we put the FD here.
  stream.fd = fd;

  stream._isStdio = true;

  return stream;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init (debug) {
  debug.inspectOpts = {};

  var keys = Object.keys(exports.inspectOpts);
  for (var i = 0; i < keys.length; i++) {
    debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
  }
}

/**
 * Enable namespaces listed in `process.env.DEBUG` initially.
 */

exports.enable(load());


/***/ }),
/* 65 */
/***/ (function(module, exports) {

module.exports = require("tty");

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __webpack_require__(4);
/**
 * Return a random, unused port.
 */
function getRandomPort() {
    return new Promise((resolve, reject) => {
        const server = http_1.createServer();
        server.listen(0);
        server.once('listening', () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.once('error', reject);
    });
}
exports.getRandomPort = getRandomPort;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZG9tLXBvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyYW5kb20tcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHO0FBQ0gsWUFBWSxDQUFDOztBQUViLCtCQUFrQztBQUVsQzs7R0FFRztBQUNIO0lBQ0UsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU07UUFDakMsTUFBTSxNQUFNLEdBQUcsbUJBQVksRUFBRSxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDdkIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQztZQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFWRCxzQ0FVQyJ9

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FLAGS = [
    // Disable built-in Google Translate service
    '--disable-translate',
    // Disable all chrome extensions entirely
    '--disable-extensions',
    // Disable various background network services, including extension updating,
    //   safe browsing service, upgrade detector, translate, UMA
    '--disable-background-networking',
    // Disable fetching safebrowsing lists, likely redundant due to disable-background-networking
    '--safebrowsing-disable-auto-update',
    // Disable syncing to a Google account
    '--disable-sync',
    // Disable reporting to UMA, but allows for collection
    '--metrics-recording-only',
    // Disable installation of default apps on first run
    '--disable-default-apps',
    // Skip first run wizards
    '--no-first-run',
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmbGFncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHO0FBQ0gsWUFBWSxDQUFDOztBQUVBLFFBQUEsYUFBYSxHQUFHO0lBQzNCLDRDQUE0QztJQUM1QyxxQkFBcUI7SUFDckIseUNBQXlDO0lBQ3pDLHNCQUFzQjtJQUN0Qiw2RUFBNkU7SUFDN0UsNERBQTREO0lBQzVELGlDQUFpQztJQUNqQyw2RkFBNkY7SUFDN0Ysb0NBQW9DO0lBQ3BDLHNDQUFzQztJQUN0QyxnQkFBZ0I7SUFDaEIsc0RBQXNEO0lBQ3RELDBCQUEwQjtJQUMxQixvREFBb0Q7SUFDcEQsd0JBQXdCO0lBQ3hCLHlCQUF5QjtJQUN6QixnQkFBZ0I7Q0FDakIsQ0FBQyJ9

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __webpack_require__(1);
const child_process_1 = __webpack_require__(6);
const mkdirp = __webpack_require__(69);
function defaults(val, def) {
    return typeof val === 'undefined' ? def : val;
}
exports.defaults = defaults;
function delay(time) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, time));
    });
}
exports.delay = delay;
function makeTmpDir() {
    switch (process.platform) {
        case 'darwin':
        case 'linux':
            return makeUnixTmpDir();
        case 'win32':
            return makeWin32TmpDir();
        default:
            throw new Error(`Platform ${process.platform} is not supported`);
    }
}
exports.makeTmpDir = makeTmpDir;
function makeUnixTmpDir() {
    return child_process_1.execSync('mktemp -d -t lighthouse.XXXXXXX').toString().trim();
}
function makeWin32TmpDir() {
    const winTmpPath = process.env.TEMP || process.env.TMP ||
        (process.env.SystemRoot || process.env.windir) + '\\temp';
    const randomNumber = Math.floor(Math.random() * 9e7 + 1e7);
    const tmpdir = path_1.join(winTmpPath, 'lighthouse.' + randomNumber);
    mkdirp.sync(tmpdir);
    return tmpdir;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHO0FBQ0gsWUFBWSxDQUFDOzs7Ozs7Ozs7O0FBRWIsK0JBQTBCO0FBQzFCLGlEQUF1QztBQUN2QyxpQ0FBaUM7QUFFakMsa0JBQTRCLEdBQWtCLEVBQUUsR0FBTTtJQUNwRCxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssV0FBVyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDaEQsQ0FBQztBQUZELDRCQUVDO0FBRUQsZUFBNEIsSUFBWTs7UUFDdEMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDM0QsQ0FBQztDQUFBO0FBRkQsc0JBRUM7QUFFRDtJQUNFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLEtBQUssUUFBUSxDQUFDO1FBQ2QsS0FBSyxPQUFPO1lBQ1YsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzFCLEtBQUssT0FBTztZQUNWLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMzQjtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxPQUFPLENBQUMsUUFBUSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7QUFDSCxDQUFDO0FBVkQsZ0NBVUM7QUFFRDtJQUNFLE1BQU0sQ0FBQyx3QkFBUSxDQUFDLGlDQUFpQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkUsQ0FBQztBQUVEO0lBQ0UsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHO1FBQ2xELENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUM7SUFDOUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQzNELE1BQU0sTUFBTSxHQUFHLFdBQUksQ0FBQyxVQUFVLEVBQUUsYUFBYSxHQUFHLFlBQVksQ0FBQyxDQUFDO0lBRTlELE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDIn0=

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

var path = __webpack_require__(1);
var fs = __webpack_require__(0);
var _0777 = parseInt('0777', 8);

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
    if (typeof opts === 'function') {
        f = opts;
        opts = {};
    }
    else if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;
    
    var cb = f || function () {};
    p = path.resolve(p);
    
    xfs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), opts, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, opts, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                xfs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, opts, made) {
    if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;

    p = path.resolve(p);

    try {
        xfs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), opts, made);
                sync(p, opts, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = xfs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = rimraf
rimraf.sync = rimrafSync

var assert = __webpack_require__(8)
var path = __webpack_require__(1)
var fs = __webpack_require__(0)
var glob = __webpack_require__(28)

var defaultGlobOpts = {
  nosort: true,
  silent: true
}

// for EMFILE handling
var timeout = 0

var isWindows = (process.platform === "win32")

function defaults (options) {
  var methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ]
  methods.forEach(function(m) {
    options[m] = options[m] || fs[m]
    m = m + 'Sync'
    options[m] = options[m] || fs[m]
  })

  options.maxBusyTries = options.maxBusyTries || 3
  options.emfileWait = options.emfileWait || 1000
  if (options.glob === false) {
    options.disableGlob = true
  }
  options.disableGlob = options.disableGlob || false
  options.glob = options.glob || defaultGlobOpts
}

function rimraf (p, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  assert(p, 'rimraf: missing path')
  assert.equal(typeof p, 'string', 'rimraf: path should be a string')
  assert.equal(typeof cb, 'function', 'rimraf: callback function required')
  assert(options, 'rimraf: invalid options argument provided')
  assert.equal(typeof options, 'object', 'rimraf: options should be object')

  defaults(options)

  var busyTries = 0
  var errState = null
  var n = 0

  if (options.disableGlob || !glob.hasMagic(p))
    return afterGlob(null, [p])

  options.lstat(p, function (er, stat) {
    if (!er)
      return afterGlob(null, [p])

    glob(p, options.glob, afterGlob)
  })

  function next (er) {
    errState = errState || er
    if (--n === 0)
      cb(errState)
  }

  function afterGlob (er, results) {
    if (er)
      return cb(er)

    n = results.length
    if (n === 0)
      return cb()

    results.forEach(function (p) {
      rimraf_(p, options, function CB (er) {
        if (er) {
          if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") &&
              busyTries < options.maxBusyTries) {
            busyTries ++
            var time = busyTries * 100
            // try again, with the same exact callback as this one.
            return setTimeout(function () {
              rimraf_(p, options, CB)
            }, time)
          }

          // this one won't happen if graceful-fs is used.
          if (er.code === "EMFILE" && timeout < options.emfileWait) {
            return setTimeout(function () {
              rimraf_(p, options, CB)
            }, timeout ++)
          }

          // already gone
          if (er.code === "ENOENT") er = null
        }

        timeout = 0
        next(er)
      })
    })
  }
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_ (p, options, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, function (er, st) {
    if (er && er.code === "ENOENT")
      return cb(null)

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === "EPERM" && isWindows)
      fixWinEPERM(p, options, er, cb)

    if (st && st.isDirectory())
      return rmdir(p, options, er, cb)

    options.unlink(p, function (er) {
      if (er) {
        if (er.code === "ENOENT")
          return cb(null)
        if (er.code === "EPERM")
          return (isWindows)
            ? fixWinEPERM(p, options, er, cb)
            : rmdir(p, options, er, cb)
        if (er.code === "EISDIR")
          return rmdir(p, options, er, cb)
      }
      return cb(er)
    })
  })
}

function fixWinEPERM (p, options, er, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')
  if (er)
    assert(er instanceof Error)

  options.chmod(p, 666, function (er2) {
    if (er2)
      cb(er2.code === "ENOENT" ? null : er)
    else
      options.stat(p, function(er3, stats) {
        if (er3)
          cb(er3.code === "ENOENT" ? null : er)
        else if (stats.isDirectory())
          rmdir(p, options, er, cb)
        else
          options.unlink(p, cb)
      })
  })
}

function fixWinEPERMSync (p, options, er) {
  assert(p)
  assert(options)
  if (er)
    assert(er instanceof Error)

  try {
    options.chmodSync(p, 666)
  } catch (er2) {
    if (er2.code === "ENOENT")
      return
    else
      throw er
  }

  try {
    var stats = options.statSync(p)
  } catch (er3) {
    if (er3.code === "ENOENT")
      return
    else
      throw er
  }

  if (stats.isDirectory())
    rmdirSync(p, options, er)
  else
    options.unlinkSync(p)
}

function rmdir (p, options, originalEr, cb) {
  assert(p)
  assert(options)
  if (originalEr)
    assert(originalEr instanceof Error)
  assert(typeof cb === 'function')

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, function (er) {
    if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM"))
      rmkids(p, options, cb)
    else if (er && er.code === "ENOTDIR")
      cb(originalEr)
    else
      cb(er)
  })
}

function rmkids(p, options, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  options.readdir(p, function (er, files) {
    if (er)
      return cb(er)
    var n = files.length
    if (n === 0)
      return options.rmdir(p, cb)
    var errState
    files.forEach(function (f) {
      rimraf(path.join(p, f), options, function (er) {
        if (errState)
          return
        if (er)
          return cb(errState = er)
        if (--n === 0)
          options.rmdir(p, cb)
      })
    })
  })
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync (p, options) {
  options = options || {}
  defaults(options)

  assert(p, 'rimraf: missing path')
  assert.equal(typeof p, 'string', 'rimraf: path should be a string')
  assert(options, 'rimraf: missing options')
  assert.equal(typeof options, 'object', 'rimraf: options should be object')

  var results

  if (options.disableGlob || !glob.hasMagic(p)) {
    results = [p]
  } else {
    try {
      options.lstatSync(p)
      results = [p]
    } catch (er) {
      results = glob.sync(p, options.glob)
    }
  }

  if (!results.length)
    return

  for (var i = 0; i < results.length; i++) {
    var p = results[i]

    try {
      var st = options.lstatSync(p)
    } catch (er) {
      if (er.code === "ENOENT")
        return

      // Windows can EPERM on stat.  Life is suffering.
      if (er.code === "EPERM" && isWindows)
        fixWinEPERMSync(p, options, er)
    }

    try {
      // sunos lets the root user unlink directories, which is... weird.
      if (st && st.isDirectory())
        rmdirSync(p, options, null)
      else
        options.unlinkSync(p)
    } catch (er) {
      if (er.code === "ENOENT")
        return
      if (er.code === "EPERM")
        return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
      if (er.code !== "EISDIR")
        throw er

      rmdirSync(p, options, er)
    }
  }
}

function rmdirSync (p, options, originalEr) {
  assert(p)
  assert(options)
  if (originalEr)
    assert(originalEr instanceof Error)

  try {
    options.rmdirSync(p)
  } catch (er) {
    if (er.code === "ENOENT")
      return
    if (er.code === "ENOTDIR")
      throw originalEr
    if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")
      rmkidsSync(p, options)
  }
}

function rmkidsSync (p, options) {
  assert(p)
  assert(options)
  options.readdirSync(p).forEach(function (f) {
    rimrafSync(path.join(p, f), options)
  })

  // We only end up here once we got ENOTEMPTY at least once, and
  // at this point, we are guaranteed to have removed all the kids.
  // So, we know that it won't be ENOENT or ENOTDIR or anything else.
  // try really hard to delete stuff on windows, because it has a
  // PROFOUNDLY annoying habit of not closing handles promptly when
  // files are deleted, resulting in spurious ENOTEMPTY errors.
  var retries = isWindows ? 100 : 1
  var i = 0
  do {
    var threw = true
    try {
      var ret = options.rmdirSync(p, options)
      threw = false
      return ret
    } finally {
      if (++i < retries && threw)
        continue
    }
  } while (true)
}


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var pathModule = __webpack_require__(1);
var isWindows = process.platform === 'win32';
var fs = __webpack_require__(0);

// JavaScript implementation of realpath, ported from node pre-v6

var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

function rethrow() {
  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
  // is fairly slow to generate.
  var callback;
  if (DEBUG) {
    var backtrace = new Error;
    callback = debugCallback;
  } else
    callback = missingCallback;

  return callback;

  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }

  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
      else if (!process.noDeprecation) {
        var msg = 'fs: missing callback ' + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : rethrow();
}

var normalize = pathModule.normalize;

// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}

exports.realpathSync = function realpathSync(p, cache) {
  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs.lstatSync(base);
      knownHard[base] = true;
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  // NB: p.length changes.
  while (pos < p.length) {
    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      continue;
    }

    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // some known symbolic link.  no need to stat again.
      resolvedLink = cache[base];
    } else {
      var stat = fs.lstatSync(base);
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }

      // read the link if it wasn't read before
      // dev/ino always return 0 on windows, so skip the check.
      var linkTarget = null;
      if (!isWindows) {
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs.statSync(base);
        linkTarget = fs.readlinkSync(base);
      }
      resolvedLink = pathModule.resolve(previous, linkTarget);
      // track this, if given a cache.
      if (cache) cache[base] = resolvedLink;
      if (!isWindows) seenLinks[id] = linkTarget;
    }

    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }

  if (cache) cache[original] = p;

  return p;
};


exports.realpath = function realpath(p, cache, cb) {
  if (typeof cb !== 'function') {
    cb = maybeCallback(cache);
    cache = null;
  }

  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  function LOOP() {
    // stop if scanned past end of path
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }

    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      return process.nextTick(LOOP);
    }

    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // known symbolic link.  no need to stat again.
      return gotResolvedLink(cache[base]);
    }

    return fs.lstat(base, gotStat);
  }

  function gotStat(err, stat) {
    if (err) return cb(err);

    // if not a symlink, skip to the next path part
    if (!stat.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }

    // stat & read the link if not read before
    // call gotTarget as soon as the link target is known
    // dev/ino always return 0 on windows, so skip the check.
    if (!isWindows) {
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs.stat(base, function(err) {
      if (err) return cb(err);

      fs.readlink(base, function(err, target) {
        if (!isWindows) seenLinks[id] = target;
        gotTarget(err, target);
      });
    });
  }

  function gotTarget(err, target, base) {
    if (err) return cb(err);

    var resolvedLink = pathModule.resolve(previous, target);
    if (cache) cache[base] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }

  function gotResolvedLink(resolvedLink) {
    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
};


/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

var concatMap = __webpack_require__(73);
var balanced = __webpack_require__(74);

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}



/***/ }),
/* 73 */
/***/ (function(module, exports) {

module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

try {
  var util = __webpack_require__(3);
  if (typeof util.inherits !== 'function') throw '';
  module.exports = util.inherits;
} catch (e) {
  module.exports = __webpack_require__(76);
}


/***/ }),
/* 76 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = globSync
globSync.GlobSync = GlobSync

var fs = __webpack_require__(0)
var rp = __webpack_require__(29)
var minimatch = __webpack_require__(9)
var Minimatch = minimatch.Minimatch
var Glob = __webpack_require__(28).Glob
var util = __webpack_require__(3)
var path = __webpack_require__(1)
var assert = __webpack_require__(8)
var isAbsolute = __webpack_require__(10)
var common = __webpack_require__(30)
var alphasort = common.alphasort
var alphasorti = common.alphasorti
var setopts = common.setopts
var ownProp = common.ownProp
var childrenIgnored = common.childrenIgnored
var isIgnored = common.isIgnored

function globSync (pattern, options) {
  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  return new GlobSync(pattern, options).found
}

function GlobSync (pattern, options) {
  if (!pattern)
    throw new Error('must provide pattern')

  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  if (!(this instanceof GlobSync))
    return new GlobSync(pattern, options)

  setopts(this, pattern, options)

  if (this.noprocess)
    return this

  var n = this.minimatch.set.length
  this.matches = new Array(n)
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false)
  }
  this._finish()
}

GlobSync.prototype._finish = function () {
  assert(this instanceof GlobSync)
  if (this.realpath) {
    var self = this
    this.matches.forEach(function (matchset, index) {
      var set = self.matches[index] = Object.create(null)
      for (var p in matchset) {
        try {
          p = self._makeAbs(p)
          var real = rp.realpathSync(p, self.realpathCache)
          set[real] = true
        } catch (er) {
          if (er.syscall === 'stat')
            set[self._makeAbs(p)] = true
          else
            throw er
        }
      }
    })
  }
  common.finish(this)
}


GlobSync.prototype._process = function (pattern, index, inGlobStar) {
  assert(this instanceof GlobSync)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // See if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip processing
  if (childrenIgnored(this, read))
    return

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar)
}


GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
  var entries = this._readdir(abs, inGlobStar)

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix.slice(-1) !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this._emitMatch(index, e)
    }
    // This was the last one, and no stats were needed
    return
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix)
      newPattern = [prefix, e]
    else
      newPattern = [e]
    this._process(newPattern.concat(remain), index, inGlobStar)
  }
}


GlobSync.prototype._emitMatch = function (index, e) {
  if (isIgnored(this, e))
    return

  var abs = this._makeAbs(e)

  if (this.mark)
    e = this._mark(e)

  if (this.absolute) {
    e = abs
  }

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true

  if (this.stat)
    this._stat(e)
}


GlobSync.prototype._readdirInGlobStar = function (abs) {
  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false)

  var entries
  var lstat
  var stat
  try {
    lstat = fs.lstatSync(abs)
  } catch (er) {
    if (er.code === 'ENOENT') {
      // lstat failed, doesn't exist
      return null
    }
  }

  var isSym = lstat && lstat.isSymbolicLink()
  this.symlinks[abs] = isSym

  // If it's not a symlink or a dir, then it's definitely a regular file.
  // don't bother doing a readdir in that case.
  if (!isSym && lstat && !lstat.isDirectory())
    this.cache[abs] = 'FILE'
  else
    entries = this._readdir(abs, false)

  return entries
}

GlobSync.prototype._readdir = function (abs, inGlobStar) {
  var entries

  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return null

    if (Array.isArray(c))
      return c
  }

  try {
    return this._readdirEntries(abs, fs.readdirSync(abs))
  } catch (er) {
    this._readdirError(abs, er)
    return null
  }
}

GlobSync.prototype._readdirEntries = function (abs, entries) {
  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries

  // mark and cache dir-ness
  return entries
}

GlobSync.prototype._readdirError = function (f, er) {
  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f)
      this.cache[abs] = 'FILE'
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd)
        error.path = this.cwd
        error.code = er.code
        throw error
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict)
        throw er
      if (!this.silent)
        console.error('glob error', er)
      break
  }
}

GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

  var entries = this._readdir(abs, inGlobStar)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false)

  var len = entries.length
  var isSym = this.symlinks[abs]

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true)
  }
}

GlobSync.prototype._processSimple = function (prefix, index) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var exists = this._stat(prefix)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this._emitMatch(index, prefix)
}

// Returns either 'DIR', 'FILE', or false
GlobSync.prototype._stat = function (f) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return false

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return c

    if (needDir && c === 'FILE')
      return false

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (!stat) {
    var lstat
    try {
      lstat = fs.lstatSync(abs)
    } catch (er) {
      if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
        this.statCache[abs] = false
        return false
      }
    }

    if (lstat && lstat.isSymbolicLink()) {
      try {
        stat = fs.statSync(abs)
      } catch (er) {
        stat = lstat
      }
    } else {
      stat = lstat
    }
  }

  this.statCache[abs] = stat

  var c = true
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE'

  this.cache[abs] = this.cache[abs] || c

  if (needDir && c === 'FILE')
    return false

  return c
}

GlobSync.prototype._mark = function (p) {
  return common.mark(this, p)
}

GlobSync.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

var wrappy = __webpack_require__(31)
var reqs = Object.create(null)
var once = __webpack_require__(32)

module.exports = wrappy(inflight)

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb)
    return null
  } else {
    reqs[key] = [cb]
    return makeres(key)
  }
}

function makeres (key) {
  return once(function RES () {
    var cbs = reqs[key]
    var len = cbs.length
    var args = slice(arguments)

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args)
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len)
        process.nextTick(function () {
          RES.apply(null, args)
        })
      } else {
        delete reqs[key]
      }
    }
  })
}

function slice (args) {
  var length = args.length
  var array = []

  for (var i = 0; i < length; i++) array[i] = args[i]
  return array
}


/***/ })
/******/ ]);