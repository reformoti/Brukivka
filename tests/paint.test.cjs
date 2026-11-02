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
