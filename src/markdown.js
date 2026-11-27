// Lossless Markdown block scanner with conservative inline-code masking.
// Not a CommonMark AST: unsupported constructs are explicitly documented.
import { createHash } from 'node:crypto';
const hash = s => createHash('sha256').update(s).digest('hex');
const bytes = (s,i) => Buffer.byteLength(s.slice(0,i),'utf8');
function maskInlineCode(line) {
  const chars=[...line]; // mask by UTF-16 positions instead, retaining original offsets
  const mask=Array.from({length:line.length},(_,i)=>line[i]);
  const re=/(`+)([\s\S]*?)\1/g;
  for (const m of line.matchAll(re)) for(let i=m.index;i<m.index+m[0].length;i++) mask[i]=' ';
  return mask.join('');
}
export function parseMarkdownV17(text,file='<input>') {
  const lines=text.match(/[^\n]*\n|[^\n]+$/g)??[];
  const nodes=[]; let pos=0, fence=null, frontmatter=lines[0]?.trim()==='---', indentCode=false;
  for(let i=0;i<lines.length;i++) {
    const raw=lines[i],line=raw.replace(/\r?\n$/,''),trim=line.trim();
    let kind='prose', content=line;
    if(frontmatter){kind='frontmatter';if(i>0&&trim==='---')frontmatter=false;}
    else if(fence){kind='code_block';if(new RegExp(`^\\s{0,3}${fence.marker}{${fence.length},}\\s*$`).test(line))fence=null;}
    else {
      const opener=line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if(opener){kind='code_block';fence={marker:opener[1][0],length:opener[1].length};}
      else if(!trim){kind='blank';indentCode=false;}
      else if(/^( {4}|\t)/.test(line)){kind='code_block';indentCode=true;}
      else if(indentCode){kind='prose';indentCode=false;}
      if(kind==='prose'){
        if(/^ {0,3}>/.test(line))kind='quotation';
        else if(/^ {0,3}#{1,6}(?:\s|$)/.test(line))kind='heading';
        else if(/^ {0,3}(?:[-*+]\s+|\d+[.)]\s+)/.test(line))kind='list_item';
        else if(/^ {0,3}(?:---+|===+)\s*$/.test(line))kind='separator';
      }
    }
    const start=pos;
    nodes.push({id:`L${i+1}`,kind,text:line,maskedText:kind==='prose'||kind==='heading'||kind==='list_item'?maskInlineCode(content):'',startOffset:bytes(text,start),endOffset:bytes(text,start+line.length),startLine:i+1,endLine:i+1,charStart:start});
    pos+=raw.length;
  }
  return {schemaVersion:'1.7',file,hash:hash(text),nodes,text,limitations:['Not a complete CommonMark AST','Nested block containers and HTML blocks are not fully classified','Inline-code scanner is conservative and does not parse all delimiter edge cases']};
}
