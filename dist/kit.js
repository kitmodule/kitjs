(function (global) {

    const kitmodule = global.kitmodule || (global.kitmodule = {});

    function isLocalhost() {
        if (kitmodule._isLocalHost === undefined) {
            const hostname = location.hostname;
            kitmodule._isLocalHost =
                ["localhost", "127.0.0.1", "::1"].includes(hostname) ||
                hostname.startsWith("127.");
        }
        return kitmodule._isLocalHost;
    }

    function kitDebug(isLocal = true) {
        if (isLocal) console.log(kitmodule)
    };


    kitmodule.debug = kitDebug
    kitmodule.isLocalhost = isLocalhost
    kitDebug(isLocalhost())

})(typeof window !== "undefined" ? window : globalThis);


(function (global) {

    const kitmodule = global.kitmodule || (global.kitmodule = {});

    function KitScript(source) {
        this.source = source
    }

    KitScript.prototype.version = function () {
        // Nếu không truyền url thì mặc định lấy script hiện tại

        if (!this.source) return null;

        // Regex tìm version dạng x.y.z
        let match = this.source.match(/\/(\d+\.\d+\.\d+)\//);
        return match ? match[1] : null;
    }

    KitScript.prototype.param = function (param) {
        const searchParams = new URL(this.source).searchParams;
        const value = searchParams.get(param)
        if (searchParams.has(param)) return value
        return undefined
    }

    kitmodule.scriptParam = (source, param) => new KitScript(source).param(param)
    kitmodule.scriptVersion = (source) => new KitScript(source).version()


})(typeof window !== "undefined" ? window : globalThis);


(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});
    const { query: KitQuery } = kitmodule

    function KitURL(href = window.location.href) {
        this.url = new URL(href);
        this.params = this.url.searchParams;
    }

    KitURL.prototype.query = function () {
        return KitQuery(this.url)
    }

    KitURL.prototype.getParam = function (key) {
        return this.params.get(key);
    };

    KitURL.prototype.getParams = function () {
        const result = {};
        for (const [key, value] of this.params.entries()) {
            if (result.hasOwnProperty(key)) {
                if (Array.isArray(result[key])) {
                    result[key].push(value);
                } else {
                    result[key] = [result[key], value];
                }
            } else {
                result[key] = value;
            }
        }
        return result;
    };

    KitURL.prototype.deleteParam = function (key) {
        this.params.delete(key);
        return this;
    };

    KitURL.prototype.extractParam = function (key) {
        const value = this.getParam(key);
        if (value !== null) this.deleteParam(key);
        return value;
    };

    KitURL.prototype.replaceState = function () {
        const newSearch = this.params.toString();
        const newUrl = `${this.url.pathname}${newSearch ? `?${newSearch}` : ''}${this.url.hash}`;
        window.history.replaceState({}, '', newUrl);
        return this;
    };


    kitmodule.url = KitURL


})(typeof window !== "undefined" ? window : globalThis);
(function (global) {

    const kitmodule = global.kitmodule || (global.kitmodule = {});

    function KitBase64(charString) {
        this.charString = charString
    }


    KitBase64.prototype.encode = function () {
        if (typeof TextEncoder === 'undefined') {
            throw new Error('TextEncoder is not supported in this environment.');
        }
        const bytes = new TextEncoder().encode(this.charString);
        const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
        return btoa(binary);
    }

    KitBase64.prototype.decode = function () {
        if (typeof TextDecoder === 'undefined') {
            throw new Error('TextDecoder is not supported in this environment.');
        }
        const binary = atob(this.charString);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    kitmodule.base64 = KitBase64;
    kitmodule.base64Encode = (text) => new KitBase64(text).encode()
    kitmodule.base64Decode = (text) => new KitBase64(text).decode()

})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});

    function KitMinimize(baseChars) {
        this.baseChars = baseChars
    }

    KitMinimize.prototype.encode = function (str) {
        const bytes = new TextEncoder().encode(str);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const bigint = BigInt('0x' + hex);
        return this.fromBigInt(bigint);
    }

    KitMinimize.prototype.decode = function (str) {
        const bigint = this.toBigInt(str);
        let hex = bigint.toString(16);
        if (hex.length % 2 !== 0) { hex = '0' + hex; }
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.slice(i, i + 2), 16));
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
    }


    KitMinimize.prototype.toBigInt = function (input) {
        const baseChars = this.baseChars
        const base = BigInt(baseChars.length);
        let result = BigInt(0);
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            const index = baseChars.indexOf(char);
            if (index === -1) {
                throw new Error(`Invalid character '${char}'`);
            }
            result = result * base + BigInt(index);
        }
        return result;
    }

    KitMinimize.prototype.fromBigInt = function (bigint) {
        const baseChars = this.baseChars
        const base = BigInt(baseChars.length);
        if (bigint === BigInt(0)) return baseChars[0];
        let result = '';
        while (bigint > 0) {
            const mod = bigint % base;
            result = baseChars[Number(mod)] + result;
            bigint = bigint / base;
        }
        return result;
    }

    kitmodule.minimize = KitMinimize;


})(typeof window !== "undefined" ? window : globalThis);

(function (global) {

    const kitmodule = global.kitmodule || (global.kitmodule = {});

    const kitMinimize = (v) => new kitmodule.minimize(v)
    const kitBase64 = (v) => new kitmodule.base64(v)

    
    function KitHasher(input) {
        this.value = input
        this.ensign = null
    }

    function extractDigits(str) {
        return str.split('').filter(c => c >= '0' && c <= '9').join('')
    };

    KitHasher.prototype.decodeRemaining = function (encodedRemaining, base62) {
        const numericBase = extractDigits(base62);
        const bigintValue = kitMinimize(base62).toBigInt(encodedRemaining);
        const decimalStr = kitMinimize(numericBase).toBigInt(bigintValue);
        return Number(decimalStr);
    }

    KitHasher.prototype.decode = function (hashToken) {
        const BASE_LENGTH = 62;

        if (hashToken.length <= BASE_LENGTH + 2) {
            throw new Error("Token không hợp lệ: độ dài quá ngắn.");
        }

        // Tách base và phần còn lại
        const base = hashToken.slice(0, BASE_LENGTH);
        let rest = hashToken.slice(BASE_LENGTH);

        // Lấy salt1 và độ dài created
        const salt1 = rest[0];
        const createdLength = base.indexOf(salt1);
        if (createdLength < 0) throw new Error("Salt1 không hợp lệ.");
        rest = rest.slice(1);

        // Lấy phần created
        const created = rest.slice(0, createdLength);
        rest = rest.slice(createdLength);

        // Lấy salt2 và độ dài remaining
        const salt2 = rest[0];
        const remainingLength = base.indexOf(salt2);
        if (remainingLength < 0) throw new Error("Salt2 không hợp lệ.");
        rest = rest.slice(1);

        // Lấy phần remaining
        const remainingHash = rest.slice(0, remainingLength);
        // Giải mã remaining thành Unix timestamp
        const remainingString = this.decodeRemaining(remainingHash, base);
        const remaining = Number(remainingString)



        const expirated = new Date(Date.now() + remaining)

        return { base, created, remaining, expirated };
    }

    KitHasher.prototype.encode = function (hash) {
        let { base } = this.decode(hash)
        let text64 = kitBase64(this.value).encode()
        var result = hash + kitMinimize(base).encode(text64)
        return result;
    }

    async function fetchHasher(name) {
        if (this.ensign) return this.ensign;

        try {
            const response = await fetch('/api/hasher/' + name, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Không thể lấy ensign từ server');
            }

            const result = await response.json();

            if (result.success) {

                return result.data;
            }

            if (result.message) {
                return new Error(result.message)
            }
            return null;

        } catch (error) {
            console.error('Lỗi khi lấy ensign:', error);
            throw error;
        }
    }

    KitHasher.prototype.fetch = async function (name) {
        const hash = await fetchHasher(name);
        if (hash) { return this.encode(hash) }
        return
    }




    kitmodule.hasher = KitHasher;


})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});

    const defaultAllowedTags = [
        // HTML cơ bản
        "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li",
        "span", "div", "img", "h1", "h2", "h3", "h4", "h5", "h6",
        "table", "thead", "tbody", "tr", "td", "th",
        "blockquote", "code", "pre", "image",

        // SVG cơ bản
        "svg", "path", "circle", "rect", "line", "polygon", "polyline", "ellipse", "g",
        "defs", "linearGradient", "radialGradient", "stop", "filter", "feGaussianBlur",
        "feOffset", "feBlend", "feColorMatrix", "clipPath", "pattern", "use", "symbol"
    ];


    const defaultAllowedAttributes = {
        "a": ["href", "title", "target", "rel"],
        "img": ["src", "alt", "title", "width", "height"],
        "svg": ["viewBox", "viewbox", "width", "height", "xmlns", "fill", "stroke", "stroke-width", "role", "aria-hidden", "style"],

        "pattern": ["x", "y", "width", "height"],
        "path": ["d", "fill", "stroke", "stroke-width", "transform"],
        "circle": ["cx", "cy", "r", "fill", "stroke", "stroke-width"],
        "rect": ["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width", "style"],
        "ellipse": ["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width"],
        "line": ["x1", "y1", "x2", "y2", "stroke", "stroke-width"],
        "polyline": ["points", "fill", "stroke", "stroke-width"],
        "polygon": ["points", "fill", "stroke", "stroke-width"],
        "text": ["x", "y", "fill", "font-size", "text-anchor", "transform"],
        "image": ["x", "y", "width", "height", "href", "xlink:href"],
        "use": ["href", "xlink:href", "width", "height", "x", "y"],
        "*": ["class", "id", "style"], // style vẫn bị loại bỏ ở bước dưới
    };

    const forbiddenTags = ["script", "style", "iframe", "object", "embed", "link", "meta"];

    function kitSanitize(inputHTML, options = {}) {
        const allowedTags = options.allowedTags || defaultAllowedTags;
        const allowedAttributes = options.allowedAttributes || defaultAllowedAttributes;

        const parser = new DOMParser();
        const doc = parser.parseFromString(inputHTML, "text/html");

        function isSafeUrl(url) {
            if (!url) return false;
            const safeProtocols = ["http:", "https:", "mailto:", "tel:", "data:"];
            try {
                const parsed = new URL(url, location.origin);
                return safeProtocols.includes(parsed.protocol);
            } catch {
                return false;
            }
        }

        function cleanNode(node) {
            let child = node.firstChild;
            while (child) {
                const next = child.nextSibling;

                if (child.nodeType === Node.ELEMENT_NODE) {
                    const tagName = child.tagName.toLowerCase();

                    if (forbiddenTags.includes(tagName) || !allowedTags.includes(tagName)) {
                        child.remove();
                    } else {
                        [...child.attributes].forEach(attr => {
                            const attrName = attr.name.toLowerCase();

                            const allowedForTag = allowedAttributes[tagName] || [];
                            const allowedForAll = allowedAttributes["*"] || [];
                            if (![...allowedForTag, ...allowedForAll].includes(attrName)) {
                                child.removeAttribute(attr.name);
                                return;
                            }

                            if (attrName.startsWith("on")) {
                                child.removeAttribute(attr.name);
                                return;
                            }

                            if (attrName === "style") {
                                const css = attr.value;
                                // Chặn các chuỗi nguy hiểm như javascript:, url(
                                if (/javascript:|expression\(|url\s*\(/i.test(css)) {
                                    child.removeAttribute(attr.name);
                                } else {
                                    // giữ lại
                                }
                                return;
                            }

                            // Check href/src for safe protocols
                            if ((attrName === "href" || attrName === "src" || attrName === "xlink:href") && !isSafeUrl(attr.value)) {
                                child.removeAttribute(attr.name);
                                return;
                            }

                            // target="_blank" safety
                            if (tagName === "a" && attrName === "target" && attr.value === "_blank") {
                                const rel = child.getAttribute("rel") || "";
                                if (!rel.includes("noopener")) {
                                    child.setAttribute("rel", (rel + " noopener noreferrer").trim());
                                }
                            }
                        });

                        cleanNode(child);
                    }
                } else if (child.nodeType === Node.COMMENT_NODE) {
                    child.remove();
                } else if (child.nodeType !== Node.TEXT_NODE) {
                    child.remove();
                }

                child = next;
            }
        }

        cleanNode(doc.body);

        return doc.body.innerHTML;
    }

    kitmodule.sanitizeHTML = kitSanitize;
})(typeof window !== "undefined" ? window : globalThis);

(function (global) {

    const kitmodule = global.kitmodule || (global.kitmodule = {});

    function kitLexer(input) {
        const length = input.length;
        const tokens = [];
        let i = 0;

        const isDigit = (ch) => ch >= '0' && ch <= '9';
        const isAlpha = (ch) => /[a-zA-Z_$]/.test(ch);
        const isAlphaNum = (ch) => /[a-zA-Z0-9_$]/.test(ch);
        const isWhitespace = (ch) => /\s/.test(ch);

        const punctuators = new Set([
            '===', '!==', '==', '!=', '<=', '>=', '<<', '>>', '>>>',
            '**', '&&', '||',
            '+', '-', '*', '/', '%', '**',
            '<', '>', '=', '!', '&', '|', '^', '~',
            '?', ':', '.', ',', ';',
            '(', ')', '{', '}', '[', ']',
            '++', '--'
        ]);

        function peek(offset = 0) {
            return input[i + offset];
        }

        function consume() {
            return input[i++];
        }

        function readNumber() {
            let num = '';
            let start = i;
            while (isDigit(peek())) num += consume();

            if (peek() === '.') {
                num += consume();
                while (isDigit(peek())) num += consume();
            }
            let end = i - 1;
            return { type: 'number', value: parseFloat(num), start, end };
        }

        function readIdentifier() {
            let id = '';
            let start = i;
            while (peek() != null && isAlphaNum(peek())) id += consume();
            let end = i - 1;
            return { type: 'identifier', value: id, start, end };
        }

        function readString() {
            const quote = consume(); // ", ', `
            let str = '';
            let start = i - 1;
            while (i < length && peek() !== quote) {
                const ch = consume();
                str += (ch === '\\') ? consume() : ch;
            }
            consume(); // closing quote
            let end = i - 1;
            return { type: 'string', value: str, quote, start, end };
        }

        function readOperatorOrPunctuator() {
            for (let len = 3; len >= 1; len--) {
                if (i + len > input.length) continue;
                const candidate = input.slice(i, i + len);
                if (punctuators.has(candidate)) {
                    let start = i;
                    i += len;
                    let end = i - 1;

                    // Phân loại theo nhóm
                    if (['(', ')'].includes(candidate)) return { type: 'paren', value: candidate, start, end };
                    if (['{', '}'].includes(candidate)) return { type: 'brace', value: candidate, start, end };
                    if (['[', ']'].includes(candidate)) return { type: 'bracket', value: candidate, start, end };
                    if ([':', '.', ',', '?'].includes(candidate)) return { type: 'punctuator', value: candidate, start, end };
                    if (candidate === ';') return { type: 'semicolon', value: ';', start, end };

                    return { type: 'operator', value: candidate, start, end };
                }
            }

            let start = i;
            let val = consume();
            let end = i - 1;
            return { type: 'unknown', value: val, start, end };
        }

        while (i < length) {
            const ch = peek();

            if (isWhitespace(ch)) {
                i++; // skip whitespace, not tokenized
                continue;
            }

            if (isDigit(ch)) {
                tokens.push(readNumber());
                continue;
            }
            if (isAlpha(ch)) {
                tokens.push(readIdentifier());
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') {
                tokens.push(readString());
                continue;
            }
            tokens.push(readOperatorOrPunctuator());
        }

        return tokens;
    }


    kitmodule.lexer = kitLexer

})(typeof window !== "undefined" ? window : globalThis);

(function (global) {

    const kitmodule = global.kitmodule || (global.kitmodule = {});
    function kitAST(tokens) {
        let i = 0;

        const PRECEDENCE = {
            '||': 1,
            '&&': 2,
            '==': 3, '!=': 3, '===': 3, '!==': 3,
            '<': 4, '>': 4, '<=': 4, '>=': 4,
            '+': 5, '-': 5,
            '*': 6, '/': 6, '%': 6,
        };

        function peek(offset = 0) {
            return tokens[i + offset];
        }

        function consume() {
            return tokens[i++];
        }

        function match(type, value) {
            const token = peek();
            return token && token.type === type && (!value || token.value === value);
        }

        function expect(type, value) {
            const token = consume();
            if (!token || token.type !== type || (value && token.value !== value)) {
                throw new Error(`Expected ${type} '${value}', got ${token?.type} '${token?.value}'`);
            }
            return token;
        }

        // Hàm parse member expression (dùng sau khi có một expr identifier)
        function parseMemberExpression(expr) {
            while (true) {
                if (match('punctuator', '.')) {
                    consume();
                    const property = parsePrimary();
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property,
                        computed: false
                    };
                } else if (match('bracket', '[')) {
                    consume();
                    const property = parseExpression();
                    expect('bracket', ']');
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property,
                        computed: true
                    };
                } else {
                    break;
                }
            }
            return expr;
        }

        // Hàm parse callee sau new: chỉ nhận Identifier hoặc MemberExpression bắt đầu từ Identifier
        function parseCallee() {
            const token = peek();
            if (token.type === 'identifier') {
                const idToken = consume();
                let expr = { type: 'Identifier', name: idToken.value };
                expr = parseMemberExpression(expr);
                return expr;
            } else if (match('paren', '(')) {
                consume();
                const expr = parseExpression();
                expect('paren', ')');
                return expr;
            } else {
                throw new Error("Expected constructor (identifier or member) after 'new'");
            }
        }

        function parsePrimary() {
            const token = peek();

            if (!token) throw new Error("Unexpected end of input");

            // Xử lý cú pháp new Constructor(...)
            if (token.type === 'identifier' && token.value === 'new') {
                consume(); // bỏ token 'new'
                const callee = parseCallee(); // parse constructor
                expect('paren', '(');
                const args = [];
                if (!match('paren', ')')) {
                    do {
                        args.push(parseExpression());
                    } while (match('punctuator', ',') && consume());
                }
                expect('paren', ')');
                return {
                    type: 'NewExpression',
                    callee,
                    arguments: args
                };
            }

            if (match('paren', '(')) {
                consume();
                const expr = parseExpression();
                expect('paren', ')');
                return expr;
            }

            if (match('brace', '{')) {
                return parseObjectExpression();
            }

            if (match('bracket', '[')) {
                return parseArrayExpression();
            }

            if (token.type === 'number') {
                consume();
                return { type: 'Literal', value: token.value };
            }

            if (token.type === 'string') {
                consume();
                return { type: 'Literal', value: token.value };
            }

            if (match('operator', '++') || match('operator', '--')) {
                const op = consume().value;
                const argument = parsePrimary();
                return {
                    type: 'UpdateExpression',
                    operator: op,
                    argument,
                    prefix: true
                };
            }

            // if (token.type === 'identifier') {
            //     consume();
            //     return { type: 'Identifier', name: token.value };
            // }

            if (token.type === 'identifier') {
                consume();
                let node = { type: 'Identifier', name: token.value };
                // Postfix
                if (match('operator', '++') || match('operator', '--')) {
                    const op = consume().value;
                    return {
                        type: 'UpdateExpression',
                        operator: op,
                        argument: node,
                        prefix: false
                    };
                }
                return node;
            }

            if (token.type === 'operator' && ['!', '+', '-', '~'].includes(token.value)) {
                const op = token.value;
                consume();
                const argument = parsePrimary();
                return {
                    type: 'UnaryExpression',
                    operator: op,
                    argument,
                    prefix: true
                };
            }

            throw new Error(`Unexpected token: ${token.type} ${token.value}`);
        }

        function parseMemberAndCall(expr) {
            while (true) {
                if (match('punctuator', '.')) {
                    consume();
                    const property = parsePrimary();
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property,
                        computed: false
                    };
                } else if (match('bracket', '[')) {
                    consume();
                    const property = parseExpression();
                    expect('bracket', ']');
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property,
                        computed: true
                    };
                } else if (match('paren', '(')) {
                    consume();
                    const args = [];
                    if (!match('paren', ')')) {
                        do {
                            args.push(parseExpression());
                        } while (match('punctuator', ',') && consume());
                    }
                    expect('paren', ')');
                    expr = {
                        type: 'CallExpression',
                        callee: expr,
                        arguments: args
                    };
                } else {
                    break;
                }
            }
            return expr;
        }

        function parseBinaryExpression(minPrecedence = 0) {
            let left = parseMemberAndCall(parsePrimary());

            while (true) {
                const token = peek();
                if (!token || token.type !== 'operator') break;

                const precedence = PRECEDENCE[token.value];
                if (precedence === undefined || precedence < minPrecedence) break;

                const op = token.value;
                consume();
                const right = parseBinaryExpression(precedence + 1);

                left = {
                    type: 'BinaryExpression',
                    operator: op,
                    left,
                    right
                };
            }

            return left;
        }

        function parseTernary() {
            let test = parseBinaryExpression();

            if (match('punctuator', '?')) {
                consume();
                const consequent = parseExpression();
                expect('punctuator', ':');
                const alternate = parseExpression();

                return {
                    type: 'ConditionalExpression',
                    test,
                    consequent,
                    alternate
                };
            }

            return test;
        }

        function parseAssignment() {
            const left = parseTernary();

            if (match('operator', '=')) {
                const op = consume().value;
                const right = parseAssignment();
                return {
                    type: 'AssignmentExpression',
                    operator: op,
                    left,
                    right
                };
            }

            return left;
        }

        function parseArrayExpression() {
            expect('bracket', '[');
            const elements = [];
            while (!match('bracket', ']')) {
                elements.push(parseExpression());
                if (!match('bracket', ']')) expect('punctuator', ',');
            }
            expect('bracket', ']');
            return { type: 'ArrayExpression', elements };
        }

        function parseObjectExpression() {
            expect('brace', '{');
            const properties = [];
            while (!match('brace', '}')) {
                const keyToken = expect('identifier');
                const key = { type: 'Identifier', name: keyToken.value };
                expect('punctuator', ':');
                const value = parseExpression();
                properties.push({ type: 'Property', key, value });
                if (!match('brace', '}')) expect('punctuator', ',');
            }
            expect('brace', '}');
            return { type: 'ObjectExpression', properties };
        }

        function parseExpression() {
            return parseAssignment();
        }

        function parseProgram() {
            const body = [];
            while (i < tokens.length) {
                const expr = parseExpression();
                body.push(expr);
                if (match('semicolon', ';')) consume();
                else break;
            }
            return { type: 'Program', body };
        }

        return parseProgram();
    }

    kitmodule.ast = kitAST

})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});
    const { lexer: kitLexer } = kitmodule
    function kitExpression(code) {
        if (code.startsWith("{") && code.endsWith("}")) {
            code = code.slice(1, -1).trim();
        }

        // Chuẩn hóa dấu phân cách
        code = code.replace(/,/g, ";");

        const tokens = kitLexer(code);
        const result = {};
        let i = 0;

        function next() {
            return tokens[i++];
        }

        function peek(offset = 0) {
            return tokens[i + offset];
        }

        function parseKey() {
            const token = next();
            if (!token) return null;

            let key = "";

            // Trường hợp key là chuỗi
            if (token.type === "string") {
                return token.quote + token.value + token.quote;
            }

            // Trường hợp key là số
            if (token.type === "number") {
                return token.value;
            }

            // Trường hợp key là identifier (hỗ trợ - và _)
            if (token.type === "identifier") {
                key += token.value;

                // Cho phép thêm các ký tự `-` và `_` như một phần của key
                while (
                    peek() &&
                    ['-', '_'].includes(peek().value) &&
                    peek(1) && peek(1).type === 'identifier'
                ) {
                    key += next().value; // dấu - hoặc _
                    key += next().value; // identifier tiếp theo
                }

                // Gọi hàm như func(300) hoặc func-name(300)
                if (peek() && peek().value === "(") {
                    let depth = 0;
                    while (peek()) {
                        const t = peek();
                        key += t.value;
                        if (t.value === "(") depth++;
                        else if (t.value === ")") depth--;
                        next();
                        if (depth === 0) break;
                    }
                }

                return key;
            }

            return null;
        }

        function parseValue() {
            if (i >= tokens.length) return '';

            const startToken = tokens[i];
            let startIndex = startToken.start;

            let depth = 0;
            while (i < tokens.length) {
                const t = peek();

                if (t.value === ';' && depth === 0) {
                    break;
                }

                if (["(", "[", "{"].includes(t.value)) {
                    depth++;
                } else if ([")", "]", "}"].includes(t.value)) {
                    depth--;
                }

                next();
            }
            const endToken = tokens[i - 1];
            let endIndex = endToken.end;

            // Cắt nguyên đoạn trong code gốc, giữ nguyên dấu cách, định dạng
            return code.slice(startIndex, endIndex + 1);
        }

        while (i < tokens.length) {
            const key = parseKey();
            if (!key) break;

            const colon = next();
            if (!colon || colon.value !== ":") break;

            const value = parseValue();

            const separator = peek();
            if (separator && separator.value === ";") next();

            result[key] = value;
        }

        return result;
    }


    kitmodule.expression = kitExpression
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});
    const { sanitizeHTML: kitSanitize } = kitmodule;

    const types = {
        Program: "Program",
        Literal: "Literal",
        Identifier: "Identifier",
        UnaryExpression: "UnaryExpression",
        BinaryExpression: "BinaryExpression",
        AssignmentExpression: "AssignmentExpression",
        MemberExpression: "MemberExpression",
        CallExpression: "CallExpression",
        NewExpression: "NewExpression",
        ConditionalExpression: "ConditionalExpression",
        UpdateExpression: "UpdateExpression",
    };

    const constants = {
        TRUE: true,
        FALSE: false,
        NULL: null,
        UNDEFINED: undefined,
        NAN: NaN,
        INFINITY: Infinity
    };

    const builtins = {
        Math, Date, Array, Object, Number, String, Boolean, JSON, RegExp,
        Map, Set, WeakMap, WeakSet,
        Error, TypeError, RangeError, Promise
    };

    const funcs = {
        console: {
            log: console.log.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            info: console.info.bind(console),
            table: console.table?.bind(console),
            dir: console.dir?.bind(console),
            clear: console.clear?.bind(console)
        },
        alert: (msg) => typeof msg === 'string' && window.alert(kitSanitize(msg)),
        confirm: (msg) => typeof msg === 'string' && window.confirm(kitSanitize(msg)),
        prompt: window.prompt.bind(window),
        setTimeout: window.setTimeout.bind(window),
        setInterval: window.setInterval.bind(window),
        clearTimeout: window.clearTimeout.bind(window),
        clearInterval: window.clearInterval.bind(window),
        parseInt, parseFloat, isNaN, isFinite,
        encodeURI, decodeURI, encodeURIComponent, decodeURIComponent,
        escape, unescape
    };

    const utilities = {
        // String utilities
        toUpperCase: (str) => typeof str === 'string' ? str.toUpperCase() : str,
        toLowerCase: (str) => typeof str === 'string' ? str.toLowerCase() : str,
        trim: (str) => typeof str === 'string' ? str.trim() : str,
        slice: (str, start, end) => typeof str === 'string' ? str.slice(start, end) : str,
        // Math utilities
        random: () => Math.random(),
        round: (n) => typeof n === 'number' ? Math.round(n) : n,
        floor: (n) => typeof n === 'number' ? Math.floor(n) : n,
        ceil: (n) => typeof n === 'number' ? Math.ceil(n) : n,
        max: Math.max,
        min: Math.min,
        abs: Math.abs
    };

    // Safe globals, chỉ cho phép gọi những function được định nghĩa
    const safeGlobals = {
        ...builtins,
        ...funcs,
        ...utilities,
        self: { ...builtins, ...funcs, ...utilities }
    };

    const operators = {
        binary: {
            "===": (a, b) => a === b,
            "!==": (a, b) => a !== b,
            "==": (a, b) => a == b,
            "!=": (a, b) => a != b,
            ">": (a, b) => a > b,
            "<": (a, b) => a < b,
            ">=": (a, b) => a >= b,
            "<=": (a, b) => a <= b,
            "+": (a, b) => a + b,
            "-": (a, b) => a - b,
            "*": (a, b) => a * b,
            "/": (a, b) => a / b,
            "%": (a, b) => a % b,
            "&&": (a, b) => a && b,
            "||": (a, b) => a || b,
        },
        unary: {
            "!": a => !a,
            "+": a => +a,
            "-": a => -a,
            "~": a => ~a,
        }
    };

    function kitEvaluate(ast, state = {}, context = {}) {
        function getFromContext(name) {

            if (constants.hasOwnProperty(name.toUpperCase())) return constants[name.toUpperCase()];
            if (safeGlobals.hasOwnProperty(name)) return safeGlobals[name];
            if (context.hasOwnProperty(name)) return context[name];
            if (state.hasOwnProperty(name)) return state[name];
            return undefined;
        }

        function evalNode(node) {
    

            switch (node.type) {
                case types.Program:
                    let last;
                    for (const expr of node.body) last = evalNode(expr);
                    return last;

                case types.Literal:
                    return node.value;

                case types.UpdateExpression: {
                    let oldValue = evalNode(node.argument);
                    let newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;
                    assign(evalNode, node.argument, newValue);
                    return node.prefix ? newValue : oldValue;
                }

                case types.Identifier:
                    return getFromContext(node.name);

                case types.UnaryExpression:
                    return operators.unary[node.operator](evalNode(node.argument));

                case types.BinaryExpression:
                    return operators.binary[node.operator](evalNode(node.left), evalNode(node.right));

                case types.AssignmentExpression:
                    return assign(evalNode, node.left, evalNode(node.right));

                case types.MemberExpression: {
                    // Nếu property lại là UpdateExpression => nghĩa là parser build sai AST
                    if (node.property.type === types.UpdateExpression) {
                        const obj = evalNode(node.object);
                        if (obj == null) throw new Error(`Cannot read property of ${obj}`);

                        const prop = node.property.argument.name;
                        const oldVal = obj[prop];
                        const newVal = node.property.operator === '++' ? oldVal + 1 : oldVal - 1;
                        obj[prop] = newVal;

                        return node.property.prefix ? newVal : oldVal;
                    }

                    // Trường hợp MemberExpression bình thường
                    const obj = evalNode(node.object);
                    if (obj == null) throw new Error(`Cannot read property of ${obj}`);
                    const prop = node.computed ? evalNode(node.property) : node.property.name;
                    return obj[prop];
                }


                case types.CallExpression: {
                    const calleeNode = node.callee;
                    let fn, thisArg;

                    if (calleeNode.type === types.MemberExpression) {
                        thisArg = evalNode(calleeNode.object);
                        const prop = calleeNode.computed ? evalNode(calleeNode.property) : calleeNode.property.name;
                        fn = thisArg?.[prop];
                    } else {
                        fn = evalNode(calleeNode);
                        thisArg = context?.this || null;
                    }

                    if (typeof fn !== "function") throw new Error("CallExpression: callee is not a function");

                    const args = node.arguments.map(evalNode);
                    return fn.apply(thisArg, args);
                }

                case types.NewExpression: {
                    const ctor = evalNode(node.callee);
                    if (typeof ctor !== "function") throw new Error("NewExpression: callee is not a constructor");
                    const args = node.arguments.map(evalNode);
                    return new ctor(...args);
                }

                case types.ConditionalExpression:
                    return evalNode(node.test) ? evalNode(node.consequent) : evalNode(node.alternate);

                default:
                    throw new Error(`Unknown AST node type: ${node.type}`);
            }
        }

        function assign(evalNode, target, value) {

            if (target.type === types.Identifier) {
                state[target.name] = value;
                return value;
            }
            if (target.type === types.MemberExpression) {
                const obj = evalNode(target.object);
                if (obj == null) throw new Error(`Cannot set property of ${obj}`);
                const prop = target.computed ? evalNode(target.property) : target.property.name;
                obj[prop] = value;
                return value;
            }
            throw new Error("Invalid assignment target");
        }

        return evalNode(ast);
    }

    kitmodule.evaluate = kitEvaluate;

})(typeof window !== "undefined" ? window : globalThis);

(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});
    const { lexer: kitLexer, ast: kitAST, evaluate: kitEvaluate } = kitmodule
    // Compile expression to getter/assign function with AST cache
    function kitCompile(expr) {
        // 1. Tokenize
        const tokens = kitLexer(expr);
        // 2. Parse
        const ast = kitAST(tokens);

        // Getter: chỉ cần context (state), globals (context bổ sung), thisArg
        function getter(state = {}, context = {}) {
            // context: state, globals: context bổ sung, thisArg: this
            return kitEvaluate(ast, state, context);
        }

        // Nếu là assignment
        if (ast.type === "AssignmentExpression") {
            getter.assign = (state, value, context = {}) => {
                // Gán tạm giá trị mới cho right
                const right = ast.right;
                const originalRight = right;
                ast.right = { type: "Literal", value };
                const result = kitEvaluate(ast, state, context);
                ast.right = originalRight;
                return result;
            };
        }

        return getter;
    }
    kitmodule.compile = kitCompile
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {

    const kitmodule = global.kitmodule || (global.kitmodule = {});
    const { sanitizeHTML: kitSanitizer } = kitmodule
    function kitDirective(component) {



        return {
            if(el, expr, extra = {}) {
                if (extra && extra.update) return
                const parent = el.parentNode;
                const placeholder = document.createComment("kit:if");
                el.removeAttribute(component.$directive("if"));
                // giữ lại bản gốc để clone
                const template = el.cloneNode(true);
                parent.insertBefore(placeholder, el);
                el.remove();

                // node hiện tại hiển thị
                let currentNode = null;
                // console.log(el);

                component.$addEffect(placeholder, () => {

                    const shouldShow = !!component.$evaluator(expr, placeholder, null, extra);

                    if (shouldShow && !currentNode) {
                        // clone mới từ template
                        const node = template.cloneNode(true);
                        parent.insertBefore(node, placeholder.nextSibling);
                        currentNode = node;

                        component.$binding(node, "if", extra)

                    } else if (!shouldShow && currentNode) {

                        component.$cleanup(currentNode)
                        currentNode.remove();
                        currentNode = null;
                    }
                });
            },


            for(el, expr, extra = {}) {
                const exprs = component._parseExpr(expr).trim();
                if (!exprs) return;

                el.removeAttribute(component.$directive("for"));

                const template = el.cloneNode(true);
                const parent = el.parentNode;



                const placeholder = document.createComment("kit:for");

                parent.insertBefore(placeholder, el);

                el.remove();


                var implicit;
                var list = [];

                switch (typeof exprs) {
                    case "string":

                        if (!/\s/g.test(exprs)) {
                            list = component.$evaluator(exprs, el, null, extra);
                        } else {
                            implicit = parseForExpression(exprs)
                            if (implicit.$items) {
                                list = component.$evaluator(implicit.$items, el, null, extra);;
                            } else {
                                console.err("Invalid for expression: missing items", el, expr);
                            }

                        }
                        break;
                    case "object":
                        list = component.$evaluator(exprs.items, el, null, extra);;

                        break;
                }



                const nodeMap = new Map();


         

                component.$addEffect(placeholder, () => {
                    const newKeys = new Set();

               
                    list.forEach((item, index) => {



                        item.$items = list
                        item.$index = index
                        item.$count = list.length
                        item.$first = index === 0
                        item.$even = index % 2 === 0
                        item.$odd = index % 2 === 1

                        const key = item.$key = item[implicit.$key] ?? item.id ?? item.node ?? null

                        if (!key) console.log("$key chưa được định nghĩa")

                        let node = nodeMap.get(key);
                        newKeys.add(key)




                        if (!node) {
                            node = template.content
                                ? template.content.cloneNode(true)
                                : template.cloneNode(true);






                            nodeMap.set(key, node);

                            const nextItem = list[index + 1];
                            const nextNode = nextItem ? nodeMap.get(nextItem.$key) : placeholder;

                            // Nếu tìm được node của item kế tiếp thì chèn trước nó,
                            // nếu không thì mặc định chèn trước end marker.
                            parent.insertBefore(node, nextNode || placeholder);
                            var extra = { $item: item, $implicit: implicit };
                            component.$binding(node, "for", extra);

                        }



                    });




                    // cleanup node không còn trong list
                    Array.from(nodeMap.keys()).forEach((key) => {


                        if (!newKeys.has(key)) {

                            const node = nodeMap.get(key);
                            component.$cleanup(node)
                            parent.removeChild(node);
                            nodeMap.delete(key);
                        }

                    });


                });
            },



            show(el, expr, extra = {}) {
                // console.log(extra)
                component.$addEffect(el, () => {

                    el.hidden = !component.$evaluator(expr, el, null, extra);
                })

            },
            class(el, expression, extra = {}) {
                component.$addEffect(el, () => {
                    const exprs = component._parseExpr(expression);
                    if (!exprs) return;

                    if (typeof exprs === 'string') {
                        const add = component.$evaluator(exprs, el, null, extra);
                        if (add) el.classList.add(add);

                        const remove = component.$evaluator(reverseTernary(exprs), el, null, extra);
                        if (remove) el.classList.remove(remove);
                        return;
                    }

                    if (typeof exprs === 'object') {
                        for (const [cls, cond] of Object.entries(exprs)) {
                            el.classList.toggle(cls, !!component.$evaluator(cond, el, null, extra));
                        }
                    }
                });
            },
            style(el, expression, extra = {}) {
                component.$addEffect(el, () => {
                    const exprs = component._parseExpr(expression);
                    if (!exprs || typeof exprs !== 'object') return;

                    for (const [prop, val] of Object.entries(exprs)) {
                        el.style[prop] = component.$evaluator(val, el, null, extra);
                    }
                });
            },
            bind(el, expression, extra = {}) {

                component.$addEffect(el, () => {
                    const exprs = component._parseExpr(expression);
                    if (!exprs) return;

                    if (typeof exprs === 'string') {
                        const value = component.$evaluator(exprs, el, null, extra);
                        const tag = el.tagName.toLowerCase();
                        switch (tag) {
                            case 'input':
                            case 'textarea':
                            case 'select':
                                if (["checkbox", "radio"].includes(el.type)) {
                                    el.checked = Boolean(value);
                                } else {
                                    el.value = value;
                                }
                                break;
                            case 'img':
                                el.src = value;
                                break;
                            case 'a':
                                el.href = value;
                                break;
                            default:
                                el.textContent = value;
                        }
                        return;
                    }

                    if (typeof exprs === 'object') {
                        for (const [prop, val] of Object.entries(exprs)) {
                            const result = component.$evaluator(val, el, null, extra);
                            switch (prop) {
                                case "text":
                                    el.textContent = result ?? "";
                                    break;
                                case "html":
                                    if (result) {
                                        el.innerHTML = kitSanitizer(result);
                                    } else {
                                        el.innerHTML = "";
                                    }
                                    break;
                                default:
                                    if (result) {
                                        el.setAttribute(prop, result);
                                    } else {
                                        el.removeAttribute(prop);
                                    }
                                    break;
                            }
                        }
                    }

                });
            },

            model(el, expr, extra = {}) {

                const exprs = component._parseExpr(expr);
                if (!exprs) return;

                if (typeof exprs === 'string') {
                    const tag = el.tagName.toLowerCase();
                    switch (tag) {
                        case 'input':
                        case 'textarea':
                        case 'select':
                            el.value = component.$evaluator(exprs, el, null, extra);


                            el.addEventListener('input', () => {
                                if (["checkbox", "radio"].includes(el.type)) {
                                    // el.checked = Boolean(value);

                                    if (Object.keys(extra).length > 0) {
                                        deepSet(extra, exprs, el.checked)
                                    } else {
                                        component.$scope[exprs] = el.checked
                                    }
                                } else {
                                    if (Object.keys(extra).length > 0) {
                                        deepSet(extra, exprs, el.value)
                                    } else {
                                        component.$scope[exprs] = el.value
                                    }
                                }


                            });
                            break;


                            break;
                    }
                }



                component.$addEffect(el, () => {
                    if (typeof exprs === 'string') {
                        const val = component.$evaluator(exprs, el, null, extra);
                        if (el.value !== val) el.value = val;
                    }

                });
            }
        };
    }

    function deepSet(obj, path, value) {
        const keys = path.split(".");
        const lastKey = keys.pop();

        // Đi sâu đến object cha
        const target = keys.reduce((acc, key) => {
            if (acc[key] === undefined) {
                acc[key] = {}; // nếu chưa có thì tạo mới
            }
            return acc[key];
        }, obj);

        // Gán giá trị cuối cùng
        return target[lastKey] = value;
    }



    // Helper
    function reverseTernary(expr) {
        const match = expr.match(/^(.*?)\?(.*?):(.*)$/);
        if (!match) return null;

        let [, condition, truthy, falsy] = match;
        return `!(${condition.trim()}) ? ${truthy.trim()} : ${falsy.trim()}`;
    }

    function parseForExpression(expr) {
        const result = {};

        // tách loop và alias
        const [loopPart, ...aliasParts] = expr.split(";").map(s => s.trim());

        let item, index, collection;

        // (item, i) of items
        let m = loopPart.match(/^(?:let\s+)?\(([^)]+)\)\s+(?:in|of)\s+(.+)$/);
        if (m) {
            const vars = m[1].split(",").map(s => s.trim());
            item = vars[0];
            index = vars[1];
            collection = m[2];
        }

        // let item of items
        if (!m) {
            m = loopPart.match(/^(?:let\s+)?(\w+)(?:\s*,\s*(\w+))?\s+(?:in|of)\s+(.+)$/);
            if (m) {
                item = m[1];
                index = m[2];
                collection = m[3];
            }
        }

        // item of items
        if (!m) {
            m = loopPart.match(/^(\w+)\s+(?:in|of)\s+(.+)$/);
            if (m) {
                item = m[1];
                collection = m[2];
            }
        }

        if (item) result["$item"] = item;
        if (index) result["$index"] = index;
        if (collection) result["$items"] = collection.trim();

        // alias
        aliasParts.forEach(part => {
            let m;

            // let name = $meta
            m = part.match(/^let\s+(\w+)\s*=\s*(\$\w+)$/);
            if (m) {
                const [, alias, meta] = m;
                result[meta] = alias;
                return;
            }

            // name as $meta
            m = part.match(/^(\w+)\s+as\s+(\$\w+)$/);
            if (m) {
                const [, alias, meta] = m;
                result[meta] = alias;
            }
        });


        return result;
    }

    // nếu invert = true thì đảo key/value
    function invertObject(obj) {
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            result[v] = k;
        }
        return result;
    }


    kitmodule.directive = kitDirective

})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});
    function kitReactive() {
        const bucket = new WeakMap(); // target -> Map(key -> Set(effect))
        let activeEffect = null;
        let shouldTrack = true;

        const jobQueue = new Set();
        let isFlushing = false;
        function schedule(job) {
            jobQueue.add(job);
            if (!isFlushing) {
                isFlushing = true;
                Promise.resolve().then(() => {
                    jobQueue.forEach(fn => fn());
                    jobQueue.clear();
                    isFlushing = false;
                });
            }
        }

        const ITERATE_KEY = Symbol("iterate"); // key special cho vòng lặp array

        // maps để hỗ trợ instrument array
        const originalToProxy = new WeakMap();
        const proxyToRaw = new WeakMap();

        function track(target, key) {
            if (!activeEffect || !shouldTrack) return;
            let depsMap = bucket.get(target);
            if (!depsMap) {
                depsMap = new Map();
                bucket.set(target, depsMap);
            }
            let deps = depsMap.get(key);
            if (!deps) {
                deps = new Set();
                depsMap.set(key, deps);
            }
            if (!deps.has(activeEffect)) {
                deps.add(activeEffect);
                activeEffect.deps.push(deps);
            }
        }

        function trigger(target, key) {
            const depsMap = bucket.get(target);
            if (!depsMap) return;
            const deps = depsMap.get(key);
            if (!deps) return;

            const effectsToRun = new Set(deps);
            effectsToRun.forEach(effectFn => {
                if (effectFn.scheduler) {
                    effectFn.scheduler(effectFn);
                } else {
                    effectFn();
                }
            });
        }

        function cleanup(effectFn) {
            for (const dep of effectFn.deps) {
                dep.delete(effectFn);
            }
            effectFn.deps.length = 0;
        }

        function effect(fn, options = {}) {
            const effectFn = () => {
                cleanup(effectFn);
                activeEffect = effectFn;
                const result = fn();
                activeEffect = null;
                return result;
            };
            effectFn.deps = [];
            effectFn.scheduler = options.scheduler;

            effectFn.cleanup = () => {
                cleanup(effectFn);
            };
            if (!options.lazy) {
                effectFn();
            }
            return effectFn;
        }

        // Instrument một số method của Array để trigger iterate/length khi gọi trực tiếp
        const arrayInstrumentations = Object.create(null);
        ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(method => {
            arrayInstrumentations[method] = function (...args) {
                // 'this' sẽ là proxy khi method được gọi từ proxy
                const raw = proxyToRaw.get(this) || this;
                // tạm tắt track để tránh thu thập dependency do các truy cập nội bộ khi chạy method
                shouldTrack = false;
                const res = Array.prototype[method].apply(raw, args);
                shouldTrack = true;

                // Sau khi thay đổi, trigger iterate + length
                trigger(raw, ITERATE_KEY);
                trigger(raw, 'length');
                return res;
            };
        });

        function reactive(obj, cache = new WeakMap()) {
            if (typeof obj !== 'object' || obj === null) return obj;
            // trả lại proxy đã tạo nếu có
            if (originalToProxy.has(obj)) return originalToProxy.get(obj);
            if (cache.has(obj)) return cache.get(obj);

            const proxy = new Proxy(obj, {
                get(target, key, receiver) {
                    // hỗ trợ kiểm tra nhanh
                    if (key === '__isReactive') return true;

                    // nếu là method instrumented (push/pop/...) trả về function đã bind
                    if (Array.isArray(target) && Object.prototype.hasOwnProperty.call(arrayInstrumentations, key)) {
                        return arrayInstrumentations[key].bind(receiver);
                    }

                    const res = Reflect.get(target, key, receiver);

                    // track key truy xuất
                    track(target, key);

                    // nếu là iterator truy xuất (for..of), track iterate key
                    if (Array.isArray(target) && key === Symbol.iterator) {
                        // trả về generator tận dụng target gốc để track từng index
                        return function* () {
                            track(target, ITERATE_KEY);
                            for (let i = 0; i < target.length; i++) {
                                track(target, String(i));
                                yield reactive(target[i], cache);
                            }
                        };
                    }

                    return (typeof res === 'object' && res !== null) ? reactive(res, cache) : res;
                },
                set(target, key, value, receiver) {
                    const oldVal = target[key];
                    const hadKey = Object.prototype.hasOwnProperty.call(target, key);
                    const result = Reflect.set(target, key, value, receiver);

                    if (!hadKey) {
                        // thêm property mới (ví dụ: thêm index mới vào array)
                        trigger(target, ITERATE_KEY);
                    }

                    if (oldVal !== value) {
                        trigger(target, key);

                        // nếu thay đổi length của array → trigger iterate
                        if (Array.isArray(target) && key === 'length') {
                            trigger(target, ITERATE_KEY);
                        }
                    }
                    return result;
                },
                deleteProperty(target, key) {
                    const hadKey = Object.prototype.hasOwnProperty.call(target, key);
                    const result = Reflect.deleteProperty(target, key);
                    if (hadKey) {
                        trigger(target, ITERATE_KEY);
                        trigger(target, key);
                    }
                    return result;
                }
            });

            // ánh xạ hai chiều để instrumentations truy xuất raw từ proxy
            originalToProxy.set(obj, proxy);
            proxyToRaw.set(proxy, obj);
            cache.set(obj, proxy);
            return proxy;
        }

        function computed(getter) {
            let value;
            let dirty = true;
            let dep = new Set(); // chứa các effect phụ thuộc vào computed.value

            const runner = effect(getter, {
                lazy: true,
                scheduler: () => {
                    dirty = true;
                    // thông báo cho các effect đang track computed.value
                    dep.forEach(effectFn => effectFn());
                }
            });

            const computedRef = {
                get value() {
                    if (activeEffect) {
                        // thu thập dependency thủ công
                        dep.add(activeEffect);
                    }
                    if (dirty) {
                        value = runner();
                        dirty = false;
                    }
                    return value;
                }
            };

            return computedRef;
        }


        function watch(source, callback, options = {}) {
            let getter = typeof source === 'function' ? source : () => source;
            let oldValue;
            let cleanupFn;

            function onCleanup(fn) {
                cleanupFn = fn;
            }

            const job = () => {
                if (cleanupFn) cleanupFn();
                const newValue = runner();
                callback(newValue, oldValue, onCleanup);
                oldValue = newValue;
            };

            const runner = effect(() => getter(), {
                lazy: true,
                scheduler: () => schedule(job)
            });

            if (options.immediate) {
                job();
            } else {
                oldValue = runner();
            }

            return () => cleanup(runner);
        }

        function stop(runner) {
            cleanup(runner);
        }

        return { reactive, effect, computed, watch, stop };
    }


    kitmodule.reactive = kitReactive
})(typeof window !== 'undefined' ? window : globalThis);


(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});
    const { reactive: kitReactive, directive: kitDirective, expression: kitExpression, compile: kitCompile } = kitmodule

    function KitComponent(element, options, context) {


        const { prefix, attribute, symbol, kit } = context
        this.$symbol = symbol
        this[symbol] = {}

        this.$addSymbol("context", context)
        this.$addSymbol("name", context.name(element))
        this.$addSymbol("attribute", attribute)
        this.$addSymbol("element", element)
        this.$addSymbol("prefix", prefix)
        this.$addSymbol("kit", kit)
        this.$addSymbol("options", normalizeOptions(options))
        this.$addSymbol("dataset", extractDataset(element, kit, prefix))
        this.$addSymbol("parent", context.parent(element))
        this.$addSymbol("alias", alias(element, attribute) || this.$dataset.alias)
        this.$addSymbol("directives", { ...kitDirective(this), event: (el, expr, extra) => this._hanldeEvents(el, expr, extra) })
        this.$addSymbol("itself", itSelf(this))

        this.$compiles = new Map()
        this.$binded = new Map()

        this.$methods = {}
        this.$deriveds = {}


        var { state, methods, deriveds } = this.$options;
        if (this.$dataset.hasOwnProperty("state")) {

            var stateData = this._parseExpr(this.$dataset.state)
            if (stateData && typeof stateData === "object") {
                for (const key in stateData) {
                    stateData[key] = this.$evaluator(stateData[key]) // ép sang số rồi cộng 1
                }
                state = { ...state, ...stateData }
            }
        }


        for (const key in this.$dataset) {
            const stateString = "state";
            if (key !== stateString && key.startsWith(stateString)) {
                const rawKey = key.slice(stateString.length); // cắt bỏ "state"
                const prop = rawKey.charAt(0).toLowerCase() + rawKey.slice(1); // viết thường chữ cái đầu
                let value = this.$evaluator(this.$dataset[key]);
                state[prop] = value;
            }
        }







        const { reactive, effect, stop, watch, computed } = kitReactive();
        this.$reactive = reactive
        this.$computed = computed
        this.$effect = effect
        this.$stop = stop
        this.$scope = reactive(state);

        // Gắn methods (không reactive hóa chúng)
        for (const key in methods) {
            if (typeof methods[key] === 'function') {
                const method = methods[key].bind(this)
                // this.$scope[key] = method
                this.$methods[key] = method

                Object.defineProperty(this.$scope, key, {
                    value: method,
                    enumerable: true,
                    writable: false, // không thể gán lại
                    configurable: false // không thể redefine
                });
            }
        }

        // Derived properties (computed)
        for (const key in deriveds) {
            const desc = deriveds[key];
            const target = desc.value || desc.get;
            if (typeof target === "function") {
                this.$deriveds[key] = target
                const c = this.$computed(() => target.call(this.$scope));

                Object.defineProperty(this.$scope, key, {
                    enumerable: true,
                    configurable: true,
                    get() { return c.value; }
                });


            }
        }

        for (const key in state) {

            Object.defineProperty(this, key, {
                get: () => this.$scope[key],
                set: (value) => { this.$scope[key] = value },
            });
        }

        if (this.$parent) {
            const parent = this.$parent; // giữ reference trong closure
            this.$scope.$parent = {}
            for (const key in parent.$scope) {
                if (parent.$deriveds.hasOwnProperty(key)) {
                    const c = this.$computed(() => parent.$deriveds[key].call(this.$scope.$parent));
                    Object.defineProperty(this.$scope.$parent, key, {
                        enumerable: true,
                        configurable: true,
                        get() { return c.value; }
                    });
                    continue
                }

                if (typeof parent.$scope[key] === "function") {
                    const func = parent.$scope[key]
                    Object.defineProperty(this.$scope.$parent, key, {
                        value: func,
                        enumerable: true,
                        writable: false, // không thể gán lại
                        configurable: false // không thể redefine
                    });
                    continue
                }
            }

            parent.$effect(() => {
                for (const key in parent.$scope) {

                    if (key.startsWith("$")) return
                    if (!parent.$deriveds.hasOwnProperty(key)) {
                        const val = parent.$scope[key]
                        if (val !== undefined && typeof val !== "function" && !parent.$deriveds.hasOwnProperty(key) && this.$scope.$parent[key] != val) {
                            this.$scope.$parent[key] = val
                        }
                    }
                }
            })


            this.$effect(() => {

                for (const key in parent.$scope) {
                    if (key.startsWith("$")) return
                    const val = this.$scope.$parent[key]
                    if (val !== undefined && typeof val !== "function" && !parent.$deriveds.hasOwnProperty(key) && parent.$scope[key] != val) {
                        parent.$scope[key] = val
                    }
                }

            })

        }



        this.$destroyed = false;
        this.$binding(element)




    }

    KitComponent.prototype.$binder = function (element, extra = null) {
        if (!this.$binded.has(element)) {

            this.$binded.set(element, {
                events: [],
                effects: [],
                extra: extra,
            });
        }
        return this.$binded.get(element);
    }

    KitComponent.prototype.$addEffect = function (element, func) {
        const effect = this.$effect(func)
        this.$binder(element).effects.push(effect)
    }

    KitComponent.prototype.$addEvent = function (element, type, handler) {
        this.$binder(element).events.push({ type, handler })
    }



    KitComponent.prototype.$binding = function (element, skip = false, extra = {}) {
        // console.log(this._bindings)


        // chạy directive
        this.$finds(element).forEach(el => {
            if (!this.$element.contains(el)) return
            for (const [directive, handler] of Object.entries(this.$directives)) {
                if (skip && directive === skip) continue


                const attr = this.$directive(directive);
                const expr = el.getAttribute(attr);
                if (expr != null) {

                    handler(el, expr, extra);
                }
            }

        });
    };


    KitComponent.prototype.$cleanup = function (element) {
        const list = Array.from(this.$finds(element))
        if (!list.includes(element)) { list.push(element) }
        list.forEach(el => {
            const binder = this.$binder(el)
            if (!binder) return;

            binder.effects.forEach(effect => this.$stop(effect))
            binder.events.forEach(({ type, handler }) => {
                switch (type) {
                    case "intersect":
                        handler.disconnect?.();
                        break;
                    default:
                        el.removeEventListener(type, handler);
                }
            })

            let test = this.$binded.delete(el)

        })

    }

    KitComponent.prototype.$finds = function (element, isChild = true) {
        if (!element) return []

        const selector = Object.keys(this.$directives).map(dir => this.$selector(dir)).join(", ");


        let candidates = Array.from(element.querySelectorAll(selector));


        // nếu chính element match thì add trước
        if (element.matches(selector)) {
            candidates.push(element);
        }

        if (isChild === false) return candidates

        // lọc: chỉ giữ node thuộc root hiện tại
        return candidates.filter(el => {
            const parentComp = el.closest(this.$context.selector);
            return parentComp === this.$element; // chỉ lấy trong component này
        });

    }


    KitComponent.prototype._hanldeEvents = function (node, raw, extra = {}) {
        const exprs = this._parseExpr(raw)
        if (typeof exprs === 'object') {
            for (const [eventer, expr] of Object.entries(exprs)) {

                switch (eventer) {
                    case "copy":

                    case "click-outside":
                        const selector = this.$selector("ignore", "outside")
                        const ignores = this.$element.querySelectorAll(selector)
                        const exceptions = ignores.length > 0 ? ignores : [this.$element]
                        this._handleOutside(expr, exceptions, node);
                        break;

                    case "intersect":
                    // case "intersect-enter":
                    case "leave":
                    // case "intersect-leave":
                    case "appear":
                    // case "intersect-once":
                    case "exit":
                        // case "intersect-exit":

                        this._handleIntersect(expr, eventer, node);
                        break;
                    default:
                        const handler = e => this.$evaluator(expr, node, e, extra);
                        const { event, timer } = parseEvents(eventer)

                        if (timer == 0) {
                            node.addEventListener(event, handler);
                            this.$addEvent(node, { type: event, handler });
                            break;
                        }

                        const finalHandler = debounce(handler, timer, this);
                        node.addEventListener(event, finalHandler);
                        this.$addEvent(node, { type: event, handler });
                        break;

                }
            }
            return
        }

        if (typeof exprs === 'string') {
            let event;
            const tag = node.tagName.toLowerCase();
            switch (tag) {
                default:
                    event = "click";
            }
            const handler = e => this.$evaluator(exprs, node, e, extra);

            node.addEventListener(event, handler);
            this.$addEvent(node, { type: event, handler });
            return
        }
    }


    KitComponent.prototype.$addSymbol = function (key, value) {
        const symbol = this.$symbol
        this[symbol][key] = value;
        Object.defineProperty(KitComponent.prototype, "$" + key, {
            get: function () { return this[symbol][key]; },
            configurable: true,
        });
    };






    Object.defineProperty(KitComponent.prototype, "$refs", {
        get: function () {

            if (this._refs && this._refs.size > 0) {
                return this._refs
            }
            this._refs = this.$collect("ref")
            return this._refs
        }
    });


    KitComponent.prototype.$ref = function (key) {
        return this.$refs.get(key) || null
    }


    Object.defineProperty(KitComponent.prototype, "$items", {
        get: function () {
            if (this._items && this._items.size > 0) {
                return this._items
            }
            this._items = this.$collect("item")
            return this._items
        }
    });

    KitComponent.prototype.$item = function (key) {
        return this.items.get(key) || null
    }

    KitComponent.prototype.$collection = function (directive, target) {
        return Object.fromEntries(this.$collect(directive))
    }


    KitComponent.prototype.$collect = function (directive, target) {
        const result = new Map()
        const elements = this.$references(directive, target)
        const attribute = this.$directive(directive)

        elements.forEach(item => {
            const key = item.getAttribute(attribute)
            result.set(key, item)
        })
        return result
    }


    KitComponent.prototype.$references = function (directive, target) {
        const selector = this.$selector(directive, target)
        return this.$element.querySelectorAll(selector) || []
    }


    KitComponent.prototype.$directive = function (dir) {
        return [this.$prefix, this.$kit, dir].filter(Boolean).join("-")
    }


    KitComponent.prototype.$selector = function (dir, target) {
        const attr = this.$directive(dir)
        if (target) return `[${attr}=${target}]`
        return `[${attr}]`
    }

    KitComponent.prototype.$expression = function (expr) {
        let result = kitExpression(expr)

        if (Object.keys(result).length === 0) {
            return expr
        }
        return result
    }

    KitComponent.prototype._parseExpr = function (expr) {
        let result = kitExpression(expr)

        if (Object.keys(result).length === 0) {
            return expr
        }
        return result
    }

    KitComponent.prototype.$compile = function (expr) {
        if (!this.$compiles.has(expr)) {
            this.$compiles.set(expr, kitCompile(expr));
        }
        return this.$compiles.get(expr);
    }

    KitComponent.prototype.$evaluator = function (expr, element = null, event = null, extra = {}) {
        try {

            if (!expr) return;
            let expression = expr.trim();

            const fn = this.$compile(expression);


            if (extra && Object.keys(extra).length > 0) {
                if (extra.$item) {

                    extra.$index = extra.$item.$index
                    extra.$even = extra.$item.$even
                    extra.$odd = extra.$item.$odd
                    extra.$count = extra.$item.$count
                    extra.$first = extra.$item.$first
                    extra.$last = extra.$item.$last
                    if (extra.$implicit) {
                        let itemAlias = extra.$implicit.$item
                        if (itemAlias) { extra[itemAlias] = extra.$item }

                        for (const [key, val] of Object.entries(extra.$implicit)) {

                            if (key in extra) {
                                extra[val] = extra[key]
                            }
                        }
                    }
                }


            }




            const context = {
                // $parent: this.$parent,
                $event: event,
                $el: element,
                ...extra,
                // ...this.$methods,
            };


            // nếu có assign thì ưu tiên gán
            if (typeof fn.assign === "function" && /\=/.test(cacheKey)) {
                return fn.assign(this.$scope, extra.value, context);
            }

            // đảm bảo this = node
            return fn(this.$scope, context);

        } catch (err) {
            console.error("[kitComponent._eval] Error evaluating expression:", expr, err);
            return undefined;
        }
    }





    KitComponent.prototype._handleOutside = function (expr, exceptions = [], node) {
        const whitelist = Array.from(new Set(exceptions)); // loại trùng
        const handler = (e) => {
            const target = e.target;
            const isInside = whitelist.some(el => el.contains(target));
            if (isInside) return;
            this.$evaluator(expr, node, e);
        };
        document.addEventListener("click", handler);
        this.$addEvent(document, "click", handler)
        // this._events.push({ node: document, event: "click", handler });
    }

    KitComponent.prototype._handleIntersect = function (expr, type, el) {
        if (!el) return;

        // Map type thành event + once
        const mapType = {
            "appear": { event: "enter", once: true },    // enter 1 lần
            "intersect": { event: "enter", once: false },// enter nhiều lần
            "leave": { event: "leave", once: false },    // leave nhiều lần
            "exit": { event: "leave", once: true }       // leave 1 lần
        };

        const typeInfo = mapType[type];
        if (!typeInfo) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                const isEnter = entry.isIntersecting;
                const isLeave = !entry.isIntersecting;

                if ((typeInfo.event === "enter" && isEnter) ||
                    (typeInfo.event === "leave" && isLeave)) {

                    // Gọi callback
                    this.$evaluator(expr, el);

                    // Nếu once, ngừng quan sát element
                    if (typeInfo.once) {
                        obs.unobserve(el);
                    }
                }
            });
        }, { threshold: 0 });

        // Bắt đầu quan sát
        observer.observe(el);

        // Lưu observer để destroy sau này
        // this._events.push({ node: el, event: "intersect", handler: observer });
        this.$addEvent(el, "intersect", observer)
    };





    KitComponent.prototype._kitDestroy = function () {
        if (this._destroyed) return;
        this._destroyed = true;

        // Hủy tất cả event listeners
        this._events.forEach(({ node, event, handler }) => {
            switch (event) {
                case "intersect":
                    handler.disconnect?.();
                    break;
                default:
                    node.removeEventListener(event, handler);
            }

        });
        this._events = [];

        // Hủy effect nếu hệ thống reactive hỗ trợ cleanup
        if (typeof this.$effect.cleanup === 'function') {
            this.$effect.cleanup(); // tuỳ theo bạn implement reactive ra sao
        }




        // Optionally: xóa mọi thứ liên quan
        this.$element._kits?.delete(this.$name);
        this.$element = null;
        this.$state = null;
        this._methods = null;
        this._directives = null;
        this.$dataset = null;
    };

    KitComponent.prototype.$debounce = function (fn, delay) {
        return debounce(fn, delay, this)
    }

    function debounce(fn, delay, thisTarget) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(thisTarget, args), delay);
        };
    };

    function alias(element, attribute) {

        const name = element.getAttribute(attribute);
        return name.startsWith('$') ? name : null;
    }

    function origin(element, attribute) {
        return element.getAttribute(attribute);
    }

    function itSelf(self) {

        const element = self.$element
        const id = element.id;
        if (id) return `#${id}`;

        var alias = element.getAttribute(self.$attribute);
        if (alias.startsWith('$')) return `[${self.$attribute}="${alias}"]`


        const name = element.getAttribute("name");
        return `[${this.$attribute}="${alias}"][name=${name}]`;
    }





    function normalizeOptions(options) {

        if ('state' in options || 'methods' in options || 'computed' in options) {
            return {
                state: JSON.parse(JSON.stringify(options.state)),
                methods: Object.assign({}, options.methods),
                deriveds: Object.getOwnPropertyDescriptors(options.computed || {})
            };
        }

        return parseOptions(options); // function bạn đã có sẵn
    }

    function parseOptions(options) {
        var state = {};
        var methods = {};
        var deriveds = {}
        const descriptors = Object.getOwnPropertyDescriptors(options)
        for (const key in descriptors) {
            const desc = descriptors[key]
            if (typeof descriptors[key].get === 'function') {
                deriveds[key] = desc
                continue;
            }
            if (typeof descriptors[key].value === 'function') {
                methods[key] = desc.value
                continue;
            }
            state[key] = desc.value
        }
        return { state, methods, deriveds }
    }



    function extractDataset(element, name, prefix) {
        if (!element) return null;
        const result = {};

        const startAttr = prefix ? [prefix, name].join("-") : name;

        for (const attr of element.getAttributeNames()) {
            if (attr.startsWith(startAttr + "-")) {
                const shortKey = attr.slice((startAttr + "-").length);
                const shortKeySplit = shortKey.split("-");

                // camelCase giống dataset
                const finalKey = shortKeySplit
                    .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
                    .join("");

                result[finalKey] = element.getAttribute(attr);
            }
        }
        return result;
    }




    function parseEvents(eventText) {
        if (!eventText.endsWith(")")) return { event: eventText, timer: 0 }

        const match = eventText.match(/^(\w+)\((\d+)\)$/);
        if (!match) return { event: eventText, timer: 0 };

        return {
            event: match[1],        // e.g., "input"
            timer: parseInt(match[2]) // e.g., 500
        };
    }

    // const instance = (el, op, at) => new KitComponent(el, op, at)
    // kitmodule.component = instance;
    kitmodule.component = KitComponent;

})(typeof window !== 'undefined' ? window : globalThis);


(function (global) {
    const kitmodule = global.kitmodule || (global.kitmodule = {});
    const { component: kitComponent, scriptVersion: kitScriptVersion, scriptParam: kitScriptParam } = kitmodule
    const sourceScript = document.currentScript.src
    const kit = "kit"

    function KitComponents() {

        this.kit = kit
        this.prefix = "data"
        this.symbol = Symbol(kit)
        this.component = "scope"
        this.attribute = ([this.prefix, this.kit, this.component].filter(Boolean)).join("-")
        this.selector = `[${this.attribute}]`
        this.observing = false;
        this.registers = new Map();   // Lưu component đã define
        this.instances = new WeakMap(); // Lưu instance component đang hoạt động
        this.aliases = new Map(); // Lưu các component có bí danh
        this.aliaser = {}


        this.version = kitScriptVersion(sourceScript) || null;
    }

    KitComponents.prototype.target = function (name) {
        return `[${this.attribute}="${name}"]`
    };

    KitComponents.prototype.targets = function (name) {
        return `${this.target(name)}, ${this.target(`$${name}`)} `
    };

    KitComponents.prototype.is = function (element) {
        return element.hasAttribute(this.attribute)
    };

    KitComponents.prototype.get = function (element) {
        return this.instances.get(element) || null
    };

    KitComponents.prototype.find = function (element, name) {
        if (name) return element.querySelectorAll(this.targets(name)) || []
        return element.querySelectorAll(this.selector) || []
    };

    KitComponents.prototype.ready = function () {
        document.addEventListener('DOMContentLoaded', () => {
            const elements = this.find(document);
            elements.forEach(el => { this.register(el) });
        });
        return this
    };

    KitComponents.prototype.define = function (name, options = {}) {

        this.registers.set(name, options);
        // const elements = this.find(document, name);
        // elements.forEach(el => this.register(el));
    };



    KitComponents.prototype.addAlias = function (instance) {
        const alias = instance.$alias
        if (!alias) return
        if (this.aliases.has(alias)) {
            console.error("duplicate alias ", alias)
            return
        }
        this.aliases.set(alias, instance)

        Object.defineProperty(this.aliaser, alias, {
            get: () => this.aliases.get(alias),
            configurable: true,
            enumerable: true,
        });

    };

    KitComponents.prototype.name = function (element) {
        const name = element.getAttribute(this.attribute);
        return name.startsWith('$') ? name.slice(1) : name;
    };

    KitComponents.prototype.parent = function (element) {
        const parent = element.parentElement?.closest(this.selector);
   
        return parent ? this.instances.get(parent) : null;
    };


    KitComponents.prototype.register = function (element) {
        const name = this.name(element);
        const options = this.registers.get(name) || {};

        if (!this.instances.has(element)) {
         
            const instance = new kitComponent(element, options, this);
            this.instances.set(element, instance);
            instance.initial?.();
            this.addAlias(instance)
        } 
    };


    KitComponents.prototype.destroy = function (element) {
        const instance = this.instances.get(element);
        if (instance) {
            // if (typeof instance._alias === "function") {
            //     const alias = instance.$alias
            //     if (alias && !this.aliases.hasOwnProperty(alias) && this.aliases[alias] === instance) {
            //         delete this.aliases[alias];
            //     }
            // }
            if (typeof instance.destroy === "function") {
                instance._kitDestroy();
            }

        }
        this.instances.delete(element);
    };

    KitComponents.prototype.observe = function () {
        if (this.observing) return;

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;

                    if (this.is(node)) {
                        this.register(node);
                    }

                    const inner = this.find(node);
                    inner?.forEach(el => this.register(el));

                }

                for (const node of mutation.removedNodes) {
                    if (!(node instanceof HTMLElement)) continue;

                    if (this.is(node)) {
                        this.destroy(node);
                    }

                    const inner = this.find(node);
                    inner?.forEach(el => this.destroy(el));
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        this.observing = true;
    };

    // Thủ công refresh lại toàn bộ DOM
    KitComponents.prototype.refresh = function () {
        document.querySelectorAll(selector).forEach(el => this.register(el));
    };

    // Gán instance ra global
    const instance = new KitComponents();


    kitmodule.components = instance;
    global.Kit = instance
    global[kit] = instance.aliaser
    instance.ready().observe();
})(typeof window !== 'undefined' ? window : globalThis);
