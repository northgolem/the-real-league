/* Dependency-free 1200×630 social preview PNG for Cloudflare Workers.
 * The retro-scoreboard lettering is built with original bitmap glyphs and
 * real match results; no external images, fonts or image APIs required. */
const W=1200,H=630;
const dark=[18,54,40,255],mid=[31,89,63,255],gold=[183,143,68,255],
  paper=[248,245,231,255],warm=[229,219,192,255],muted=[87,109,83,255],
  white=[255,252,239,255];
const glyphs={
"A":["01110","10001","10001","11111","10001","10001","10001"],
"B":["11110","10001","10001","11110","10001","10001","11110"],
"C":["01111","10000","10000","10000","10000","10000","01111"],
"D":["11110","10001","10001","10001","10001","10001","11110"],
"E":["11111","10000","10000","11110","10000","10000","11111"],
"F":["11111","10000","10000","11110","10000","10000","10000"],
"G":["01111","10000","10000","10111","10001","10001","01110"],
"H":["10001","10001","10001","11111","10001","10001","10001"],
"I":["11111","00100","00100","00100","00100","00100","11111"],
"J":["00111","00010","00010","00010","10010","10010","01100"],
"K":["10001","10010","10100","11000","10100","10010","10001"],
"L":["10000","10000","10000","10000","10000","10000","11111"],
"M":["10001","11011","10101","10101","10001","10001","10001"],
"N":["10001","11001","10101","10011","10001","10001","10001"],
"O":["01110","10001","10001","10001","10001","10001","01110"],
"P":["11110","10001","10001","11110","10000","10000","10000"],
"Q":["01110","10001","10001","10001","10101","10010","01101"],
"R":["11110","10001","10001","11110","10100","10010","10001"],
"S":["01111","10000","10000","01110","00001","00001","11110"],
"T":["11111","00100","00100","00100","00100","00100","00100"],
"U":["10001","10001","10001","10001","10001","10001","01110"],
"V":["10001","10001","10001","10001","10001","01010","00100"],
"W":["10001","10001","10001","10101","10101","10101","01010"],
"X":["10001","10001","01010","00100","01010","10001","10001"],
"Y":["10001","10001","01010","00100","00100","00100","00100"],
"Z":["11111","00001","00010","00100","01000","10000","11111"],
"0":["01110","10011","10101","10101","11001","10001","01110"],
"1":["00100","01100","00100","00100","00100","00100","01110"],
"2":["01110","10001","00001","00010","00100","01000","11111"],
"3":["11110","00001","00001","01110","00001","00001","11110"],
"4":["00010","00110","01010","10010","11111","00010","00010"],
"5":["11111","10000","10000","11110","00001","00001","11110"],
"6":["01110","10000","10000","11110","10001","10001","01110"],
"7":["11111","00001","00010","00100","01000","01000","01000"],
"8":["01110","10001","10001","01110","10001","10001","01110"],
"9":["01110","10001","10001","01111","00001","00001","01110"],
" ":["00000","00000","00000","00000","00000","00000","00000"],
"&":["01100","10010","10100","01000","10101","10010","01101"],
"/":["00001","00001","00010","00100","01000","10000","10000"],
".":["00000","00000","00000","00000","00000","00100","00100"],
":":["00000","00100","00100","00000","00100","00100","00000"],
"-":["00000","00000","00000","11111","00000","00000","00000"],
"'":["00100","00100","00010","00000","00000","00000","00000"],
"(":["00010","00100","01000","01000","01000","00100","00010"],
")":["01000","00100","00010","00010","00010","00100","01000"],
",":["00000","00000","00000","00000","00100","00100","01000"],
"!":["00100","00100","00100","00100","00100","00000","00100"],
"?":["01110","10001","00001","00010","00100","00000","00100"],
};
const pixels=new Uint8Array(W*H*4);
function fill(c){for(let i=0;i<pixels.length;i+=4){pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=255}}
function rect(x,y,w,h,c){
 const x1=Math.max(0,Math.floor(x)),y1=Math.max(0,Math.floor(y));
 const x2=Math.min(W,Math.ceil(x+w)),y2=Math.min(H,Math.ceil(y+h));
 for(let yy=y1;yy<y2;yy++)for(let xx=x1;xx<x2;xx++){
   const i=(yy*W+xx)*4;pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=255;
 }
}
function textLine(message,x,y,size,color,align="left"){
 const chars=String(message).toUpperCase().split("");
 const width=(chars.length*6-1)*size;
 let offset=align==="center"?x-width/2:x;
 for(const char of chars){
  const symbol=glyphs[char]||glyphs["?"];
  for(let row=0;row<7;row++)for(let col=0;col<5;col++){
    if(symbol[row][col]==="1")rect(offset+col*size,y+row*size,size,size,color);
  }
  offset+=6*size;
 }
 return width;
}
function maxSize(message,limit,big=11){
 const chars=String(message).length;
 return Math.max(3,Math.min(big,Math.floor(limit/(Math.max(1,chars)*6))));
}
function lines(sentence,limit){
 const result=[],words=sentence.split(" ");let line="";
 for(const word of words){
  const candidate=line?line+" "+word:word;
  if(candidate.length>limit && line){result.push(line);line=word;}else line=candidate;
 }
 if(line)result.push(line);
 return result;
}
function crc32(buffer){
 let crc=0xFFFFFFFF;
 for(const value of buffer){
  crc^=value;
  for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);
 }
 return (crc^0xFFFFFFFF)>>>0;
}
function uint32(value){return new Uint8Array([value>>>24,(value>>>16)&255,(value>>>8)&255,value&255])}
function chunk(type,payload){
 const tag=new TextEncoder().encode(type);
 const body=new Uint8Array(tag.length+payload.length);body.set(tag);body.set(payload,tag.length);
 const output=new Uint8Array(12+payload.length);
 output.set(uint32(payload.length),0);output.set(body,4);output.set(uint32(crc32(body)),8+payload.length);
 return output;
}
export async function makeCard(result){
 fill(paper);
 // Quiet print-like background texture and soft page edges.
 for(let y=140;y<H;y+=22)rect(0,y,W,1,[241,237,220,255]);
 rect(0,0,W,139,dark);rect(0,139,W,8,gold);
 rect(0,591,W,39,dark);
 // A small crowned football mark assembled from original geometry.
 rect(62,39,93,5,gold);
 rect(69,20,12,32,gold);rect(102,13,12,38,gold);rect(135,20,12,32,gold);
 rect(69,47,79,9,gold);rect(81,57,54,6,gold);
 rect(87,67,39,38,white);rect(96,76,21,19,dark);
 textLine("THE USURPER LEAGUE",183,35,5,white);
 textLine("ENGLAND  /  YOUR RULES  /  REAL RESULTS",183,96,2,gold);
 const club=result.champion.toUpperCase();
 const font=maxSize(club,1070,11);
 textLine("AND THE LEAGUE LEADER IS...",62,184,3,muted);
 textLine(club,62,237,font,dark);
 const bottom=237+font*7;
 textLine(result.season+(result.isCurrent?"  /  TOP OF THE TABLE":"  /  CHAMPIONS"),
   62,bottom+26,4,mid);
 rect(61,bottom+81,1070,2,warm);
 const detail="YOU KICKED OUT: "+(result.selected.length?result.selected.join(" / ").toUpperCase():"NOBODY");
 const info=lines(detail,55);
 let yy=bottom+108;
 for(const line of info.slice(0,2)){textLine(line,62,yy,3,muted);yy+=32}
 // Reserve the footer for a clear call to action, regardless of name length.
 rect(0,591,W,39,dark);
 textLine(result.points+" PTS  /  "+result.remaining+" CLUBS  /  "+
   result.removed+" GAMES ERASED",61,601,2,white);
 const shortURL="USURPERLEAGUE.COM";textLine(shortURL,1160-(shortURL.length*6-1)*2,601,2,gold);
 const unfiltered=new Uint8Array((W*4+1)*H);
 for(let y=0;y<H;y++){
  const p=y*(W*4+1);unfiltered[p]=0;
  unfiltered.set(pixels.subarray(y*W*4,(y+1)*W*4),p+1);
 }
 const compressor=new CompressionStream("deflate");
 const writer=compressor.writable.getWriter();
 const finish=writer.write(unfiltered).then(()=>writer.close());
 const compressed=new Uint8Array(await new Response(compressor.readable).arrayBuffer());
 await finish;
 const signature=new Uint8Array([137,80,78,71,13,10,26,10]);
 const ihdr=new Uint8Array(13);
 ihdr.set(uint32(W),0);ihdr.set(uint32(H),4);ihdr[8]=8;ihdr[9]=6; // RGBA true colour
 const pieces=[signature,chunk("IHDR",ihdr),chunk("IDAT",compressed),chunk("IEND",new Uint8Array())];
 const out=new Uint8Array(pieces.reduce((n,a)=>n+a.length,0));
 let offset=0;for(const item of pieces){out.set(item,offset);offset+=item.length}
 return out;
}
