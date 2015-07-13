/**
 * markdown-prefilter-metadata
 * https://github.com/devsparks/markdown-prefilter-metadata
 *
 * Copyright (c) 2015 Michael Kortstiege
 * Licensed under the MIT license.
 */

class MarkdownPrefilterMetadata {

    constructor () {
      this.debug = false;
      this.debug_info = {};
      this.rules = {
          concat:     { regex: / _\n$/,               skip: false },
          blank_line: { regex: /^(-+|_+|=+|\.+)\n$/,  skip: true  },
          newline:    { regex: /\n$/,                 skip: false },
          separator:  { regex: /:$/,                  skip: false } 
      };
      
      this.patterns = {
         identifier:  /^[_A-Za-z]{1}[_A-Za-z-0-9]*[_A-Za-z0-9 \t]*$/,
         concat:      " _\n",
         newline:     "\n"
      };
    }
    
    tokenize (str = '') {   
        let char_buffer = '';
        let result = [];
        let lastpos = 0;
        for (let i = 0; i < str.length; i++) {
            char_buffer += str.charAt(i);
            for (let r in this.rules) {
                let match = this.rules[r].regex.exec(char_buffer);
                if (match) {
                    let idx = match.index;
                    let parts = this.splitStringAtPosition(char_buffer, idx);
                    if (parts[0]) {
                        result.push( { token: "string", data: parts[0], pos: lastpos + "-" + (lastpos + match.index - 1) } );
                    }
                    if (parts[1] && !this.rules[r].skip) {
                        result.push( { token: r, data: parts[1], pos: lastpos + match.index + "-" + i } );
                    }
                    char_buffer = '';
                    lastpos = i + 1;
                }
            }
        }
        result.push( { token: "string", data: char_buffer, pos: lastpos + "-" + (lastpos + char_buffer.length - 1) } );
        if ( this.debug ) {
            this.debug_info["tokenizer"] = Object.assign({}, result);
        }
        return result;
    }
    
    splitStringAtPosition (str, idx) {
        let chars = str.split('');
        let p1 = "";
        let p2 = "";
        for (let i = 0; i < idx; i++) {
            p1 += chars[i];
        }
        for (let i = idx; i < chars.length; i++) {
            p2 += chars[i];
        }
        return([p1, p2]);
    }
    
    trimLeft (str) {
        return str.replace(/^\s\s*/, '');   
    }
    
    trimRight (str) {
        return str.replace(/\s\s*$/, '');   
    }
 
    parse (obj = {}) {
        let result = [];
        let prior_previous_token = "";
        let previous_token = "";
        let ln = obj.length;
        for (let i = 0; i < ln; i++) {
            let token = obj[i].token;
            let data = obj[i].data;
            let next_token = "";
            let next_data = "";
            if (i < ln - 1) {
                next_token = obj[i+1].token;
                next_data = obj[i+1].data;
            } 
            let over_next_token = "";
            let over_next_data = "";
            if (i < ln - 2) {
                over_next_token = obj[i+2].token;
                over_next_data = obj[i+2].data;
            } 
            let target_array = result[result.length-1];
            if (token === "string" && data.match( this.patterns.identifier ) && next_token === "separator") {
                token = "identifier";
                obj[i].token = token;
                result.push( [ data.toLowerCase().trim(), "" ] );
            }
            else if ( token === "string" ) {
                if ( next_token === "newline" ) {
                    data = this.trimRight( data )
                }
                target_array[target_array.length-1] += this.trimLeft( data );
            }
            else if ( token === "separator" &&  previous_token !== "identifier" ) {
                target_array[target_array.length-1] += data.trim();
            }
            else if (token === "concat") {
               data = data.substring(0, data.length - this.patterns.concat.length);
               target_array[target_array.length-1] += data.trim() + this.patterns.newline;
            }
            else if (token === "newline" ) {
                if ( next_token === "string" && next_data.match( this.patterns.identifier ) && over_next_token === "separator" ) {
                    //skip
                }
                else {
                    target_array.push( "" );
                }
            }
            prior_previous_token = previous_token;
            previous_token = token;
        }
        if ( this.debug ) {
            this.debug_info["parser"] = Object.assign({}, result);
        }
        return result;
    }
    
    build (obj = {}) {
        let data = {};
        let ln = obj.length;
        for (let i = 0; i < ln; i++) {
            let tmp = obj[i];
            let key = tmp.shift();
            let value = "";
            if (tmp.length === 1) {
                value = tmp.join( "" );        
            }
            else {
                value = tmp;  
            }
            data[key] = value;
        }
        return data;
    }
    
    extract_metadata (datablock) {
        return this.build( this.parse( this.tokenize( datablock ) ) );  
    }
    
    process (str = '', flag, debug) {
        if ( debug ) {
            this.debug = true;
        }
        if (!flag) {
            let line_endings = [
                { name: "Unix (LF)",        regex: /[^\r]\n/g,  value: "\n" },
                { name: "Windows (CR+LF)",  regex: /\r\n/g,     value: "\r\n" },
                { name: "Unix (LF)",        regex: /\r[^\n]/g,  value: "\r" }
            ];
            let eol = "";
            let max = 0;
            for (let i = 0; i < line_endings.length; i++) {
                let m = "";
                try {
                    m = str.match( line_endings[i].regex ).length;
                } catch(e) { 
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
        str = str.replace( /\r\n/g, "\n" ).replace( /\r/g, "\n" );
        let obj = { metadata: { }, markdown: "" };
        if ( str.charAt(0) === "%") {
            let blocks = str.split( /^$\n/mg );
            obj.metadata = this.extract_metadata( blocks.shift().substring(1).replace( /\n$/, "" ) );
            for (let i = 0; i < blocks.length; i++) {
                blocks[i] = blocks[i].replace( /\n/g, this.patterns.newline );
            }
            obj.markdown = blocks.join( this.patterns.newline ); 
        }
        else {
            obj.markdown = str;
        }
        return obj;
    }
}

export default MarkdownPrefilterMetadata;
