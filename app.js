(function(){
"use strict";

if(typeof pdfjsLib!=="undefined"){
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ===== Número por extenso (PT-BR) ===== */
var _U=["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
var _D=["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
var _C=["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
function _n999(n){if(n===100)return "cem";var c=Math.floor(n/100),r=n%100,o=[];if(c)o.push(_C[c]);if(r){if(r<20)o.push(_U[r]);else{var d=Math.floor(r/10),u=r%10;o.push(u?_D[d]+" e "+_U[u]:_D[d]);}}return o.join(" e ");}
function _int(n){if(n===0)return "zero";var b=Math.floor(n/1e9),m=Math.floor((n%1e9)/1e6),k=Math.floor((n%1e6)/1e3),r=n%1000,p=[];if(b)p.push(_n999(b)+(b===1?" bilhão":" bilhões"));if(m)p.push(_n999(m)+(m===1?" milhão":" milhões"));if(k)p.push(k===1?"mil":_n999(k)+" mil");if(r)p.push(_n999(r));if(p.length===1)return p[0];var last=p.pop(),prev=p.pop();var j=(r>0&&r<100)||(r===0&&k===0)?" e ":" ";return p.concat([prev+j+last]).join(", ");}
function numeroParaExtenso(num){if(!isFinite(num))return "";var reais=Math.floor(num),cents=Math.round((num-reais)*100),p=[];if(reais>0)p.push(_int(reais)+(reais===1?" real":" reais"));if(cents>0)p.push(_int(cents)+(cents===1?" centavo":" centavos"));return p.length?p.join(" e "):"zero real";}

/* ===== Constantes ===== */
var FIXED={name:"JAROD M M JR",email:"CONTATO@JAROD.COM.BR",phone:"31999635303",cnpj:"67.897.810/0001-63"};
var PIX_FIXED="pix@jarod.com.br";
var DEF_PARC=6,MAX_PARC=12;
var FIELD_IDS=["nome","cpf","rg","email","telefone","placa","renavam","chassi","marcaModelo","cor","anoFab","anoModelo","seguro","valor","parcelas","cidade"];
var CLIENT_FIELDS=["nome","cpf","rg","email","telefone"];
var VEH_FIELDS=["placa","renavam","chassi","marcaModelo","cor","anoFab","anoModelo"];
var state={vencimentos:{},crlvFile:null};

/* ===== Helpers ===== */
function $(id){return document.getElementById(id);}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m];});}
function val(id,fb){var el=$(id);if(!el||!el.value)return fb||"";return el.value.trim()||fb||"";}
function parseMoney(s){if(!s)return NaN;var c=String(s).replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");var n=parseFloat(c);return isFinite(n)?n:NaN;}
function formatBRL(n){return isFinite(n)?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"";}
function isoToBR(iso){if(!iso)return "";var p=iso.split("-");return p[2]+"/"+p[1]+"/"+p[0];}
function addDaysISO(d){var x=new Date();x.setHours(12,0,0,0);x.setDate(x.getDate()+d);var y=x.getFullYear(),m=("0"+(x.getMonth()+1)).slice(-2),dd=("0"+x.getDate()).slice(-2);return y+"-"+m+"-"+dd;}
function toast(t){var x=$("toast");if(!x)return;x.textContent=t;x.style.display="block";setTimeout(function(){x.style.display="none";},2200);}

/* ===== Cálculos ===== */
function getParcelasCount(){var r=parseInt(val("parcelas",String(DEF_PARC)),10);if(!isFinite(r))return DEF_PARC;return Math.max(1,Math.min(MAX_PARC,r));}
function getVencimento(i){var iso=state.vencimentos[i];return iso?isoToBR(iso):"#VENCIMENTO#";}
function getValorParcela(){var t=parseMoney(val("valor"));if(!isFinite(t)||t<=0)return "#VALOR_PARCELA#";return formatBRL(t/getParcelasCount());}
function getMoney(){var r=val("valor");if(!r)return "R$ #VALOR#";var n=parseMoney(r);return isFinite(n)?formatBRL(n):"R$ "+esc(r);}
function getExtenso(){var v=parseMoney(val("valor"));return(!isFinite(v)||v<=0)?"#VALOR_EXTENSO#":numeroParaExtenso(v);}
function atualizarExtenso(){var v=parseMoney(val("valor"));$("valorExtenso").value=(isFinite(v)&&v>0)?numeroParaExtenso(v):"";}

/* ===== Templates ===== */
function renderParcelasRows(n){
  var vp=getValorParcela(),rows="";
  for(var i=1;i<=n;i++){rows+="<tr><td>"+i+"ª</td><td>"+esc(vp)+"</td><td>"+esc(getVencimento(i))+"</td></tr>";}
  return rows;
}
function veiculoTable(){
  return '<table class="vehtable">'
    +'<tr><td>Placa</td><td>'+esc(val("placa","#PLACA#"))+'</td></tr>'
    +'<tr><td>Renavam</td><td>'+esc(val("renavam","#RENAVAM#"))+'</td></tr>'
    +'<tr><td>Chassi</td><td>'+esc(val("chassi","#CHASSI#"))+'</td></tr>'
    +'<tr><td>Marca / Modelo / Versão</td><td>'+esc(val("marcaModelo","#MARCA_MODELO#"))+'</td></tr>'
    +'<tr><td>Cor</td><td>'+esc(val("cor","#COR#"))+'</td></tr>'
    +'<tr><td>Ano Fab. / Modelo</td><td>'+esc(val("anoFab","#ANO_FAB#"))+' / '+esc(val("anoModelo","#ANO_MODELO#"))+'</td></tr>'
    +'</table>';
}

/* ===== Render ===== */
function render(){
  var nome=val("nome","#NOME#"),cpf=val("cpf","#CPF#"),rg=val("rg","#RG#"),email=val("email","#EMAIL#"),tel=val("telefone","#TELEFONE#"),seguro=val("seguro","#SEGURO#"),n=getParcelasCount();
  var h='<div class="paperhead"><div class="paperbrand"><b>'+FIXED.name+'</b><div>CNPJ '+FIXED.cnpj+'</div></div></div>'
  +'<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>'
  +'<div class="lead">Instrumento particular para formalização das condições de pagamento referentes à adesão e ativação de seguro</div>'
  +'<div class="parties"><div class="party"><div class="partyhead">CONTRATANTE / CLIENTE</div><p><b>Nome:</b> '+esc(nome)+'</p><p><b>CPF:</b> '+esc(cpf)+'</p><p><b>RG:</b> '+esc(rg)+'</p><p><b>E-mail:</b> '+esc(email)+'</p><p><b>Telefone:</b> '+esc(tel)+'</p></div>'
  +'<div class="party"><div class="partyhead">CONTRATADA / PRESTADORA</div><p><b>Nome:</b> '+FIXED.name+'</p><p><b>CNPJ:</b> '+FIXED.cnpj+'</p><p><b>E-mail:</b> '+FIXED.email+'</p><p><b>Telefone:</b> '+FIXED.phone+'</p></div></div>'
  +'<p>Pelo presente instrumento particular, as partes acima identificadas têm entre si justo e contratado o presente instrumento, mediante as cláusulas e condições seguintes.</p>'
  +'<h2>1. DO OBJETO</h2><p>1.1. O presente contrato tem por objeto estabelecer as condições de pagamento da taxa de adesão e ativação do seguro referente ao produto/serviço securitário <b>'+esc(seguro)+'</b>, tendo como veículo relacionado o abaixo descrito:</p>'+veiculoTable()
  +'<p>1.2. Este instrumento trata especificamente da obrigação de pagamento da taxa de adesão/ativação, não substituindo a apólice, certificado, proposta de seguro ou as condições gerais do seguro.</p>'
  +'<h2>2. DO VALOR</h2><p>2.1. O valor total referente à adesão e ativação é de <b>'+esc(getMoney())+'</b> ('+esc(getExtenso())+').</p>'
  +'<h2>3. DA FORMA DE PAGAMENTO</h2><p>3.1. O CONTRATANTE realizará o pagamento de forma parcelada, exclusivamente por meio de Pix, conforme o cronograma abaixo.</p>'
  +'<table class="paytable"><thead><tr><th>Parcela</th><th>Valor</th><th>Vencimento</th></tr></thead><tbody>'+renderParcelasRows(n)+'</tbody></table>'
  +'<table class="pix"><tr><td>CHAVE PIX</td><td>'+esc(PIX_FIXED)+'</td></tr><tr><td>Titular</td><td>'+FIXED.name+'</td></tr><tr><td>CNPJ</td><td>'+FIXED.cnpj+'</td></tr></table>'
  +'<p>3.2. O pagamento será considerado realizado após a efetiva confirmação/compensação do valor.</p>'
  +'<h2>4. DO ATRASO</h2><p>4.1. Em caso de atraso no pagamento de qualquer parcela, poderão incidir multa, juros e demais encargos somente na medida permitida pela legislação aplicável.</p>'
  +'<h2>5. DA QUITAÇÃO</h2><p>5.1. Após a confirmação do pagamento integral, será fornecida quitação da obrigação referente à taxa de adesão e ativação.</p>'
  +'<h2>6. DA RESCISÃO E DO CANCELAMENTO</h2><p>6.1. Eventual cancelamento, desistência, devolução de valores ou rescisão observará a legislação aplicável e as condições específicas do produto contratado.</p>'
  +'<h2>7. DAS COMUNICAÇÕES</h2><p>7.1. As partes poderão utilizar os seguintes canais para comunicações relacionadas a este contrato.</p>'
  +'<div class="comms"><div><strong>CONTRATANTE / CLIENTE</strong>Telefone/WhatsApp: '+esc(tel)+'<br>E-mail: '+esc(email)+'</div><div><strong>CONTRATADA / PRESTADORA</strong>Telefone/WhatsApp: '+FIXED.phone+'<br>E-mail: '+FIXED.email+'</div></div>'
  +'<h2>8. DO FORO</h2><p>8.1. Fica eleito o foro competente nos termos da legislação aplicável para dirimir eventuais questões decorrentes deste instrumento.</p>'
  +'<p style="margin-top:18px">E, por estarem de acordo, as partes assinam o presente instrumento.</p>'
  +'<p>'+esc(val("cidade","#CIDADE#"))+', ______ de __________________________ de __________.</p>'
  +'<div class="signatures"><div><div class="signline">CONTRATANTE / CLIENTE<br>Nome: '+esc(nome)+'<br>CPF: '+esc(cpf)+'</div></div><div><div class="signline">CONTRATADA / PRESTADORA<br>Nome: '+FIXED.name+'<br>CNPJ: '+FIXED.cnpj+'</div></div></div>';
  $("paper").innerHTML=h;
  var cf=0,i;for(i=0;i<CLIENT_FIELDS.length;i++){var v=val(CLIENT_FIELDS[i]);if(v&&v.charAt(0)!=="#")cf++;}
  var vf=0;for(i=0;i<VEH_FIELDS.length;i++){var w=val(VEH_FIELDS[i]);if(w&&w.charAt(0)!=="#")vf++;}
  $("status").textContent=cf+"/5 cliente • "+vf+"/7 veículo";
}

/* ===== Parcelas ===== */
function buildParcelasForm(){
  var n=getParcelasCount();
  for(var m=1;m<=n;m++){if(!state.vencimentos[m])state.vencimentos[m]=addDaysISO(30*m);}
  var html="";
  for(var i=1;i<=n;i++){
    html+='<div class="field"><label>'+i+'ª parcela — vencimento</label><input class="venc" data-i="'+i+'" type="date" value="'+esc(state.vencimentos[i])+'"></div>';
  }
  $("parcelasForm").innerHTML=html;
  var vs=$("parcelasForm").querySelectorAll(".venc");
  for(var j=0;j<vs.length;j++){
    (function(el){
      el.addEventListener("input",function(e){
        state.vencimentos[e.target.getAttribute("data-i")]=e.target.value;
        render();
      });
    })(vs[j]);
  }
}

/* ===== PDF → imagem ===== */
function pdfParaImagem(arquivo){
  return new Promise(function(resolve,reject){
    if(typeof pdfjsLib==="undefined"){reject(new Error("pdf.js não carregou"));return;}
    var reader=new FileReader();
    reader.onload=function(){
      var bytes=new Uint8Array(reader.result);
      pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
        pdf.getPage(1).then(function(page){
          var viewport=page.getViewport({scale:2.0});
          var canvas=document.createElement("canvas");
          canvas.width=viewport.width;canvas.height=viewport.height;
          var ctx=canvas.getContext("2d");
          page.render({canvasContext:ctx,viewport:viewport}).promise.then(function(){
            resolve(canvas.toDataURL("image/png"));
          });
        });
      }).catch(reject);
    };
    reader.onerror=reject;
    reader.readAsArrayBuffer(arquivo);
  });
}

/* ===== OCR ===== */
function rodarOcr(fonteImagem,cbStatus){
  if(typeof Tesseract==="undefined"){alert("Tesseract não carregou. Verifique a internet.");return;}
  Tesseract.recognize(fonteImagem,"por",{logger:function(m){if(m.status==="recognizing text")cbStatus(Math.round(m.progress*100));}})
.then(function(res){console.log("===== TEXTO OCR =====");console.log(res.data.text);console.log("===== FIM =====");preencherDoOcr((res.data.text||"").toUpperCase());toast("Dados extraídos. Revise antes de gerar.");})  .catch(function(err){alert("Falha no OCR: "+err.message);});
}

function preencherDoOcr(txt){
  var t=String(txt||"").replace(/\s+/g," ");

  var mPlaca=t.match(/\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b/);
  if(mPlaca)$("placa").value=mPlaca[1];

  var mRen=t.match(/RENAVAM[^\d]{0,15}(\d[\d\s]{9,13}\d)/);
  if(mRen)$("renavam").value=mRen[1].replace(/\s/g,"");
  else{var mRen2=t.match(/\b(\d{11})\b/);if(mRen2)$("renavam").value=mRen2[1];}

  var mCha=t.match(/CHASSI[^\w]{0,15}([A-HJ-NPR-Z0-9]{17})/);
  if(mCha)$("chassi").value=mCha[1];
  else{var mCha2=t.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);if(mCha2)$("chassi").value=mCha2[1];}

  /* ===== MARCA / MODELO / VERSÃO ===== */
  /* Formato do CRLV: MARCA/MODELO VERSÃO  (ex: CHEVROLET/ONIX 1.4MT LT) */
  var mMar=t.match(/(?:MARCA\s*\/?\s*MODELO|MARCA MODELO)[^\w]{0,5}([A-Z0-9][A-Z0-9 \/\.\-]{2,80})/);
  if(!mMar){
    /* fallback: pega bloco com barra no meio, tipo CHEVROLET/ONIX 1.4MT LT */
    mMar=t.match(/\b([A-Z]{3,}[\/][A-Z0-9][A-Z0-9 \/\.\-]{2,80})/);
  }
  if(mMar){
    var mm=mMar[1].trim().replace(/\s+/g," ");
    /* corta se pegou rótulos seguintes juntos */
    mm=mm.replace(/\s*(ANO|COR|CHASSI|RENAVAM|PLACA|COMBUST|CATEG|ESPEC|POTENC|CILIND|FABRIC|MODELO|MARCA)[\s:].*$/,"").trim();
    $("marcaModelo").value=mm;
  }

  var mAno=t.match(/\b(19\d{2}|20\d{2})\b[^\d]{0,10}\b(19\d{2}|20\d{2})\b/);
  if(mAno){$("anoFab").value=mAno[1];$("anoModelo").value=mAno[2];}

  var mCor=t.match(/COR[:\s]{0,5}([A-Z]{3,15})/);
  if(mCor)$("cor").value=mCor[1].trim();

  atualizarExtenso();render();
}

/* ===== Upload + extração ===== */
function handleCrlv(e){
  var f=e.target.files&&e.target.files[0];
  var st=$("crlvStatus"),btn=$("btnExtrair");
  if(!f){state.crlvFile=null;st.textContent="Nenhum arquivo anexado.";st.className="hint";if(btn)btn.disabled=true;return;}
  state.crlvFile=f;
  st.textContent="Anexado: "+f.name+" — clique em Extrair dados.";
  st.className="hint file-ok";
  if(btn)btn.disabled=false;
  toast("Arquivo anexado. Clique em Extrair dados.");
}

function extrair(){
  var f=state.crlvFile;
  if(!f){alert("Anexe um PDF ou imagem primeiro.");return;}
  var st=$("crlvStatus"),btn=$("btnExtrair");
  btn.disabled=true;
  if(f.type==="application/pdf"||/\.pdf$/i.test(f.name)){
    st.textContent="Convertendo PDF em imagem...";
    st.className="hint";
    pdfParaImagem(f).then(function(dataUrl){
      st.textContent="Lendo imagem do PDF com OCR... 0%";
      rodarOcr(dataUrl,function(p){st.textContent="OCR do PDF: "+p+"%";});
      setTimeout(function(){st.textContent="OCR concluído. Confira os campos.";st.className="hint file-ok";btn.disabled=false;},1500);
    }).catch(function(err){
      st.textContent="Falha ao converter PDF: "+err.message;
      st.className="hint";
      btn.disabled=false;
    });
  } else if(f.type&&f.type.indexOf("image/")===0){
    var rd=new FileReader();
    rd.onload=function(ev){
      st.textContent="OCR na imagem... 0%";
      rodarOcr(ev.target.result,function(p){st.textContent="OCR: "+p+"%";});
      setTimeout(function(){st.textContent="OCR concluído. Confira os campos.";st.className="hint file-ok";btn.disabled=false;},1500);
    };
    rd.readAsDataURL(f);
  } else {
    st.textContent="Formato não suportado. Use PDF ou imagem.";
    st.className="hint";
    btn.disabled=false;
  }
}

/* ===== Botões ===== */
function printContract(){render();window.print();}

function resetForm(){
  for(var i=0;i<FIELD_IDS.length;i++){if($(FIELD_IDS[i]))$(FIELD_IDS[i]).value="";}
  $("parcelas").value=DEF_PARC;
  if($("crlvFile"))$("crlvFile").value="";
  if($("crlvStatus")){$("crlvStatus").textContent="Nenhum arquivo anexado.";$("crlvStatus").className="hint";}
  if($("btnExtrair"))$("btnExtrair").disabled=true;
  state.crlvFile=null;state.vencimentos={};
  buildParcelasForm();atualizarExtenso();render();toast("Formulário limpo.");
}

function fillDemo(){
  $("nome").value="CLIENTE EXEMPLO";$("cpf").value="000.000.000-00";$("rg").value="00.000.000-0";
  $("email").value="cliente@exemplo.com";$("telefone").value="(00) 00000-0000";
  $("placa").value="ABC1D23";$("renavam").value="01234567890";$("chassi").value="9BWZZZ377VT004251";
  $("marcaModelo").value="CHEVROLET/ONIX 1.4MT LT";$("cor").value="Prata";$("anoFab").value="2014";$("anoModelo").value="2014";
  $("seguro").value="Seguro / Plano contratado";$("valor").value="1.200,00";$("parcelas").value=DEF_PARC;$("cidade").value="Belo Horizonte/MG";
  state.vencimentos={};buildParcelasForm();atualizarExtenso();render();toast("Exemplo preenchido.");
}

/* ===== Exposição global ===== */
window.App={resetForm:resetForm,printContract:printContract,fillDemo:fillDemo,extrair:extrair};

/* ===== Listeners ===== */
for(var i=0;i<FIELD_IDS.length;i++){
  (function(id){
    var el=$(id);if(!el)return;
    if(id==="parcelas"){el.addEventListener("input",function(){state.vencimentos={};buildParcelasForm();render();});}
    else if(id==="valor"){el.addEventListener("input",function(){atualizarExtenso();render();});}
    else{el.addEventListener("input",render);}
  })(FIELD_IDS[i]);
}
if($("crlvFile"))$("crlvFile").addEventListener("change",handleCrlv);

/* ===== Init ===== */
buildParcelasForm();atualizarExtenso();render();

})();
