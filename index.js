/**
 * markdown-prefilter-metadata
 * https://github.com/devsparks/markdown-prefilter-metadata
 *
 * Copyright (c) 2015 Michael Kortstiege
 * Licensed under the MIT license.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MarkdownPrefilterMetadata = (function () {
    function MarkdownPrefilterMetadata() {
        _classCallCheck(this, MarkdownPrefilterMetadata);

        this.debug = false;
        this.debug_info = {};
        this.rules = {
            concat: { regex: / _\n$/, skip: false },
            blank_line: { regex: /^(-+|_+|=+|\.+)\n$/, skip: true },
            newline: { regex: /\n$/, skip: false },
            separator: { regex: /:$/, skip: false }
        };

        this.patterns = {
            identifier: /^[_A-Za-z]{1}[_A-Za-z-0-9]*[_A-Za-z0-9 \t]*$/,
            concat: " _\n",
            newline: "\n"
        };
    }

    _createClass(MarkdownPrefilterMetadata, [{
        key: "tokenize",
        value: function tokenize() {
            var str = arguments.length <= 0 || arguments[0] === undefined ? "" : arguments[0];

            var char_buffer = "";
            var result = [];
            var lastpos = 0;
            for (var i = 0; i < str.length; i++) {
                char_buffer += str.charAt(i);
                for (var r in this.rules) {
                    var match = this.rules[r].regex.exec(char_buffer);
                    if (match) {
                        var idx = match.index;
                        var parts = this.splitStringAtPosition(char_buffer, idx);
                        if (parts[0]) {
                            result.push({ token: "string", data: parts[0], pos: lastpos + "-" + (lastpos + match.index - 1) });
                        }
                        if (parts[1] && !this.rules[r].skip) {
                            result.push({ token: r, data: parts[1], pos: lastpos + match.index + "-" + i });
                        }
                        char_buffer = "";
                        lastpos = i + 1;
                    }
                }
            }
            result.push({ token: "string", data: char_buffer, pos: lastpos + "-" + (lastpos + char_buffer.length - 1) });
            if (this.debug) {
                this.debug_info["tokenizer"] = _extends({}, result);
            }
            return result;
        }
    }, {
        key: "splitStringAtPosition",
        value: function splitStringAtPosition(str, idx) {
            var chars = str.split("");
            var p1 = "";
            var p2 = "";
            for (var i = 0; i < idx; i++) {
                p1 += chars[i];
            }
            for (var i = idx; i < chars.length; i++) {
                p2 += chars[i];
            }
            return [p1, p2];
        }
    }, {
        key: "trimLeft",
        value: function trimLeft(str) {
            return str.replace(/^\s\s*/, "");
        }
    }, {
        key: "trimRight",
        value: function trimRight(str) {
            return str.replace(/\s\s*$/, "");
        }
    }, {
        key: "parse",
        value: function parse() {
            var obj = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            var result = [];
            var prior_previous_token = "";
            var previous_token = "";
            var ln = obj.length;
            for (var i = 0; i < ln; i++) {
                var token = obj[i].token;
                var data = obj[i].data;
                var next_token = "";
                var next_data = "";
                if (i < ln - 1) {
                    next_token = obj[i + 1].token;
                    next_data = obj[i + 1].data;
                }
                var over_next_token = "";
                var over_next_data = "";
                if (i < ln - 2) {
                    over_next_token = obj[i + 2].token;
                    over_next_data = obj[i + 2].data;
                }
                var target_array = result[result.length - 1];
                if (token === "string" && data.match(this.patterns.identifier) && next_token === "separator") {
                    token = "identifier";
                    obj[i].token = token;
                    result.push([data.toLowerCase().trim(), ""]);
                } else if (token === "string") {
                    if (next_token === "newline") {
                        data = this.trimRight(data);
                    }
                    target_array[target_array.length - 1] += this.trimLeft(data);
                } else if (token === "separator" && previous_token !== "identifier") {
                    target_array[target_array.length - 1] += data.trim();
                } else if (token === "concat") {
                    data = data.substring(0, data.length - this.patterns.concat.length);
                    target_array[target_array.length - 1] += data.trim() + this.patterns.newline;
                } else if (token === "newline") {
                    if (next_token === "string" && next_data.match(this.patterns.identifier) && over_next_token === "separator") {} else {
                        target_array.push("");
                    }
                }
                prior_previous_token = previous_token;
                previous_token = token;
            }
            if (this.debug) {
                this.debug_info["parser"] = _extends({}, result);
            }
            return result;
        }
    }, {
        key: "build",
        value: function build() {
            var obj = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            var data = {};
            var ln = obj.length;
            for (var i = 0; i < ln; i++) {
                var tmp = obj[i];
                var key = tmp.shift();
                var value = "";
                if (tmp.length === 1) {
                    value = tmp.join("");
                } else {
                    value = tmp;
                }
                data[key] = value;
            }
            return data;
        }
    }, {
        key: "extract_metadata",
        value: function extract_metadata(datablock) {
            return this.build(this.parse(this.tokenize(datablock)));
        }
    }, {
        key: "process",
        value: function process(str, flag, debug) {
            if (str === undefined) str = "";

            if (debug) {
                this.debug = true;
            }
            if (!flag) {
                var line_endings = [{ name: "Unix (LF)", regex: /[^\r]\n/g, value: "\n" }, { name: "Windows (CR+LF)", regex: /\r\n/g, value: "\r\n" }, { name: "Unix (LF)", regex: /\r[^\n]/g, value: "\r" }];
                var eol = "";
                var max = 0;
                for (var i = 0; i < line_endings.length; i++) {
                    var m = "";
                    try {
                        m = str.match(line_endings[i].regex).length;
                    } catch (e) {
                        m = 0;
                    }
                    if (m > 0 && m > max) {
                        eol = line_endings[i].value;
                    }
                }
                if (eol) {
                    this.patterns.newline = eol;
                }
            }
            str = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            var obj = { metadata: {}, markdown: "" };
            if (str.charAt(0) === "%") {
                var blocks = str.split(/^$\n/mg);
                obj.metadata = this.extract_metadata(blocks.shift().substring(1).replace(/\n$/, ""));
                for (var i = 0; i < blocks.length; i++) {
                    blocks[i] = blocks[i].replace(/\n/g, this.patterns.newline);
                }
                obj.markdown = blocks.join(this.patterns.newline);
            } else {
                obj.markdown = str;
            }
            return obj;
        }
    }]);

    return MarkdownPrefilterMetadata;
})();

exports["default"] = MarkdownPrefilterMetadata;
module.exports = exports["default"];

//skip