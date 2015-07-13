
var markdown_prefilter_metadata = require( "./index.js" );
var fs = require( "fs" );

var debug = true;
var mpm = new markdown_prefilter_metadata();
var data = fs.readFileSync("./sample_article.md", "utf8");
var article = mpm.process(data, 1, debug);

fs.writeFileSync("./out/sample_article.json", JSON.stringify(article, null, "    "));

if (debug) {
  fs.writeFileSync("./out/debug.json", JSON.stringify(mpm.debug_info, null, "    "));
}           
