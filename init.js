const paramsString = window.location.search;
const searchParams = new URLSearchParams(paramsString);
const node = searchParams.get("cw");
if (node === null || node == '') {
    console.error('query param cw not found');
    return;
}
$.getJSON( node+".json", function( json ) {
    console.log( "$ JSON Data received, name is " + json.name);
});
