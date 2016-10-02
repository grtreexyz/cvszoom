var debugdiv=document.createElement("div");
debugdiv.style.position='fixed';
debugdiv.style.backgroundColor='rgba(0,0,0,.5)';
debugdiv.style.color='white';
debugdiv.style.maxHeight='50%';
debugdiv.style.maxWidth='50%';
debugdiv.style.minWidth='20%';
debugdiv.style.overflow='auto';
document.body.appendChild(debugdiv);
function debugshow(v,isnew){
	var p=document.createElement('p');
	p.innerHTML=v;
	if(isnew){
		    for(var i=0;i<debugdiv.childNodes.length;i++){
		        debugdiv.removeChild(debugdiv.childNodes[i]);
		    }
		debugdiv.appendChild(p);}
		else{
		debugdiv.appendChild(p);}
}
