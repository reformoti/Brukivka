const test=require('node:test'),assert=require('node:assert/strict');
const {sanitizeDocument}=require('../paint.js');
const drawing=actions=>({paper:'#ffffff',actions});
const stroke={tool:'brush',color:'#26394b',width:8,points:[[10,20],[30,40]]};
test('saved drawings retain freehand points and normalize document dimensions',()=>{
 const doc=sanitizeDocument(drawing([stroke]));assert(doc);assert.equal(doc.width,1200);assert.equal(doc.height,800);assert.deepEqual(doc.actions[0].points,stroke.points);
 doc.actions[0].points[0][0]=99;assert.equal(stroke.points[0][0],10,'loaded drawings do not mutate stored input');
});
test('malformed saved drawings cannot inject unsupported tools, colors or coordinates',()=>{
 for(const invalid of [{...stroke,tool:'script'},{...stroke,color:'url(https://example.test)'},{...stroke,width:Infinity},{...stroke,points:[[NaN,5]]},{...stroke,points:[[-1,5]]},{...stroke,points:[[1201,5]]}])assert.equal(sanitizeDocument(drawing([invalid])),null);
});
test('erasers, geometric shapes and undoable clear/background operations can be restored',()=>{
 for(const tool of ['eraser','line','rect','ellipse','clear','paper'])assert(sanitizeDocument(drawing([{...stroke,tool,fill:true,points:['clear','paper'].includes(tool)?[]:stroke.points}])));
});
test('new Paint tools preserve transparent backgrounds and opacity without accepting invalid alpha',()=>{
 for(const tool of ['pencil','fill','arrow','triangle','diamond','star','roundrect','flipH','flipV']){const doc=sanitizeDocument({paper:'transparent',actions:[{...stroke,tool,opacity:.4}]});assert(doc);assert.equal(doc.paper,'transparent');assert.equal(doc.actions[0].opacity,.4);}
 assert(sanitizeDocument(drawing([{...stroke,tool:'text',text:'Привіт',fontSize:48,opacity:.5}])));
 for(const opacity of [-1,2,NaN,Infinity])assert.equal(sanitizeDocument(drawing([{...stroke,opacity}])),null);
 assert.equal(sanitizeDocument(drawing([{...stroke,tool:'text',text:'x',fontSize:1000}])),null);
});
