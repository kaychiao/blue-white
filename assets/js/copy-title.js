// Preserve the complete sentence; emphasis never adds or removes words.
window.copyTitleParts = note => {
  if(typeof note?.title!=='string'||typeof note.accent!=='string'||!note.accent)return null;
  const comma=note.title.indexOf('，');if(comma<0)return null;
  const first=note.title.slice(0,comma+1),second=note.title.slice(comma+1),at=second.indexOf(note.accent);
  if(at<0||!/[。！？]$/.test(second))return null;
  return {first,before:second.slice(0,at),accent:note.accent,after:second.slice(at+note.accent.length)};
};
