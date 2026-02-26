const paramsString = window.location.search;
const searchParams = new URLSearchParams(paramsString);
const node = searchParams.get("cw");
$.getJSON( node+".json", function( json ) {
    console.log( "$ JSON Data received, name is " + json.name);
});
