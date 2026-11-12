(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukMoney=api;})(typeof window==='undefined'?globalThis:window,()=>{
 'use strict';
 const LIMIT=1e120;
 const valid=n=>typeof n==='number'&&Number.isFinite(n)&&Number.isInteger(n)&&Math.abs(n)<=LIMIT;
 const normalize=(n,fallback=0,min=-LIMIT,max=LIMIT)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback;
 function add(balance,amount){return Math.max(-LIMIT,Math.min(LIMIT,balance+amount));}
 function format(value){const n=Number(value);if(!Number.isFinite(n))return '0';if(Math.abs(n)<1e18)return Math.round(n).toLocaleString('uk-UA');const [coefficient,exponent]=n.toExponential(3).split('e');const superscript={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};return Number(coefficient).toLocaleString('uk-UA',{maximumFractionDigits:3})+' × 10'+String(Number(exponent)).split('').map(c=>superscript[c]).join('');}
 function percent(balance,p){if(!valid(balance)||!Number.isInteger(p)||p<0||p>100||balance<=0)return 0;return Number.isSafeInteger(balance)?Number(BigInt(balance)*BigInt(p)/100n):Math.min(balance,Math.floor(balance*(p/100)));}
 return {LIMIT,valid,normalize,add,format,percent};
});
