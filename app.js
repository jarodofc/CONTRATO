(function(){
"use strict";

if(typeof pdfjsLib!=="undefined"){
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ===== Número por extenso ===== */
var _U=["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
var _D=["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
var _C=["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
function _n999(n){if(n===100)return "cem";var c=Math.floor(n/100),r=n%100,o=[];if(c)o.push(_C[c]);if(r){if(r<20)o.push(_U[r]);else{var d=Math.floor(r/10),u=r%10;o.push(u?_D[d]+" e "+_U[u]:_D[d]);}}return o.join(" e ");}
function _int(n){if(n===0)return "zero";var b=Math.floor(n/1e9),m=Math.floor((n%1e9)/1e6),k=Math.floor((n%1e6)/1e3),r=n%1000,p=[];if(b)p.push(_n999(b)+(b===1?" bilhão":" bilhões"));if(m)p.push(_n999(m)+(m===1?" milhão":" milhões"));if(k)p.push(k===1?"mil":_n999(k)+" mil");if(r)p.push(_n999(r));if(p.length===1)return p[0];var last=p.pop(),prev=p.pop();var j=(r>0&&r<100)||(r===0&&k===0)?" e ":" ";return p.concat([prev+j+last]).join(", ");}
function numeroParaExtenso(num){if(!isFinite(num))return "";var reais=Math.floor(num),cents=Math.round((num-reais)*100),p=[];if(reais>0)p.push(_int(reais)+(reais===1?" real":" reais"));if(cents>0)p.push(_int(cents)+(cents===1?" centavo":" centavos"));return p.length?p.join(" e "):"zero real";}

/* ===== Constantes ===== */
var FIXED={name:"JAROD M M JR",email:"CONTATO@JAROD.COM.BR",phone:"31999635303",cnpj:"67.897.810/0001-63"};
var PIX_FIXED="pix@jarod.com.br";
var CIDADE_FALLBACK="Belo Horizonte/MG";
var DEF_PARC=6,MAX_PARC=12;
var FIELD_IDS=["nome","cpf","rg","email","telefone","placa","renavam","chassi","anoFab","anoModelo","seguro","valor","parcelas","cidade"];
var CLIENT_FIELDS=["nome","cpf","rg","email","telefone"];
var VEH_FIELDS=["placa","renavam","chassi","anoFab","anoModelo"];
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

/* Remove acentos e caracteres não suportados pelo Helvetica do jsPDF */
function ascii(s){
  return String(s||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[–—]/g,"-")
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/[^\x20-\x7E]/g,"");
}

/* ===== Cálculos ===== */
function getParcelasCount(){var r=parseInt(val("parcelas",String(DEF_PARC)),10);if(!isFinite(r))return DEF_PARC;return Math.max(1,Math.min(MAX_PARC,r));}
function getVencimento(i){var iso=state.vencimentos[i];return iso?isoToBR(iso):"#VENCIMENTO#";}
function getValorParcela(){var t=parseMoney(val("valor"));if(!isFinite(t)||t<=0)return "#VALOR_PARCELA#";return formatBRL(t/getParcelasCount());}
function getMoney(){var r=val("valor");if(!r)return "R$ #VALOR#";var n=parseMoney(r);return isFinite(n)?formatBRL(n):"R$ "+esc(r);}
function getExtenso(){var v=parseMoney(val("valor"));return(!isFinite(v)||v<=0)?"#VALOR_EXTENSO#":numeroParaExtenso(v);}
function atualizarExtenso(){var v=parseMoney(val("valor"));$("valorExtenso").value=(isFinite(v)&&v>0)?numeroParaExtenso(v):"";}
function getCidade(){var c=val("cidade");return c&&c.charAt(0)!=="#" ? c : CIDADE_FALLBACK;}

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
    +'<tr><td>Ano Fabricação / Modelo</td><td>'+esc(val("anoFab","#ANO_FAB#"))+' / '+esc(val("anoModelo","#ANO_MODELO#"))+'</td></tr>'
    +'</table>';
}

/* ===== Render da pré-visualização ===== */
function render(){
  var nome=val("nome","#NOME#"),cpf=val("cpf","#CPF#"),rg=val("rg","#RG#"),email=val("email","#EMAIL#"),tel=val("telefone","#TELEFONE#"),seguro=val("seguro","#SEGURO#"),n=getParcelasCount(),cidade=getCidade();
  var h='<div class="paperhead"><div class="paperbrand"><b>'+FIXED.name+'</b><div>CNPJ '+FIXED.cnpj+'</div></div></div>'
  +'<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO SECURITÁRIA</h1>'
  +'<div class="lead">Instrumento particular de adesão e ativação de seguro, com intermediação da CONTRATADA</div>'
  +'<div class="parties">'
  +'<div class="party"><div class="partyhead">CONTRATANTE</div><p><b>Nome:</b> '+esc(nome)+'</p><p><b>CPF:</b> '+esc(cpf)+'</p><p><b>RG:</b> '+esc(rg)+'</p><p><b>E-mail:</b> '+esc(email)+'</p><p><b>Telefone:</b> '+esc(tel)+'</p></div>'
  +'<div class="party"><div class="partyhead">CONTRATADA</div><p><b>Razão social:</b> '+FIXED.name+'</p><p><b>CNPJ:</b> '+FIXED.cnpj+'</p><p><b>E-mail:</b> '+FIXED.email+'</p><p><b>Telefone:</b> '+FIXED.phone+'</p></div></div>'
  +'<p>As partes acima qualificadas têm, entre si, justo e contratado o presente instrumento, que se regerá pelas cláusulas e condições a seguir, às quais declaram ter lido, compreendido e aceito integralmente.</p>'
  +'<h2>CLÁUSULA 1ª — DO OBJETO</h2>'
  +'<p>1.1. O presente contrato tem por objeto formalizar a contratação dos serviços de intermediação e assessoria prestados pela CONTRATADA, relacionados ao produto securitário <b>'+esc(seguro)+'</b>, bem como o pagamento da respectiva taxa de adesão e ativação.</p>'
  +'<p>1.2. A CONTRATADA atua como intermediária entre o CONTRATANTE e a seguradora. A CONTRATADA não é seguradora, não assume risco securitário, não garante cobertura, não regula sinistro e não responde por indenizações previstas na apólice.</p>'
  +'<p>1.3. O produto está vinculado ao veículo a seguir identificado:</p>'
  +veiculoTable()
  +'<p>1.4. Este instrumento não substitui a proposta, a apólice, o certificado, o endosso nem as condições gerais do seguro, que permanecem prevalentes para todos os efeitos de cobertura.</p>'
  +'<h2>CLÁUSULA 2ª — DO VALOR E DA FORMA DE PAGAMENTO</h2>'
  +'<p>2.1. Pela intermediação e adesão, o CONTRATANTE pagará à CONTRATADA o valor total de <b>'+esc(getMoney())+'</b> ('+esc(getExtenso())+').</p>'
  +'<p>2.2. O pagamento será realizado em <b>'+n+' parcelas</b>, exclusivamente por Pix, conforme cronograma abaixo.</p>'
  +'<table class="paytable"><thead><tr><th>Parcela</th><th>Valor</th><th>Vencimento</th></tr></thead><tbody>'+renderParcelasRows(n)+'</tbody></table>'
  +'<table class="pix"><tr><td>CHAVE PIX</td><td>'+esc(PIX_FIXED)+'</td></tr><tr><td>Titular</td><td>'+FIXED.name+'</td></tr><tr><td>CNPJ</td><td>'+FIXED.cnpj+'</td></tr></table>'
  +'<p>2.3. O pagamento é considerado efetuado somente após a confirmação do crédito na conta da CONTRATADA. Os comprovantes deverão ser guardados pelo prazo mínimo de cinco anos.</p>'
  +'<p>2.4. O valor remunera exclusivamente a intermediação e a taxa de adesão, não correspondendo a prêmio de seguro.</p>'
  +'<h2>CLÁUSULA 3ª — DO ATRASO E DO INADIMPLEMENTO</h2>'
  +'<p>3.1. O atraso acarretará multa moratória de 2% sobre o valor em atraso, acrescida de juros de mora de 1% ao mês, calculados pro rata die, sem prejuízo da correção monetária pelo IPCA.</p>'
  +'<p>3.2. O atraso superior a 30 dias autoriza a suspensão dos serviços e o encaminhamento do débito para cobrança.</p>'
  +'<h2>CLÁUSULA 4ª — DAS OBRIGAÇÕES DA CONTRATADA</h2>'
  +'<p>4.1. A CONTRATADA se obriga a intermediar a contratação, prestar informações sobre o produto, encaminhar os documentos emitidos pela seguradora e manter sigilo sobre os dados pessoais, tratando-os conforme a Lei nº 13.709/2018.</p>'
  +'<p>4.2. A CONTRATADA não se responsabiliza por recusa de cobertura, por sinistros não cobertos, por informações incorretas prestadas pelo CONTRATANTE nem por fatos alheios à sua esfera de controle.</p>'
  +'<h2>CLÁUSULA 5ª — DAS OBRIGAÇÕES DO CONTRATANTE</h2>'
  +'<p>5.1. O CONTRATANTE se obriga a fornecer informações verdadeiras, manter os dados atualizados, pagar pontualmente as parcelas e observar as condições gerais da apólice.</p>'
  +'<p>5.2. Informação falsa ou inexata pode acarretar recusa de cobertura pela seguradora, sem responsabilidade da CONTRATADA.</p>'
  +'<h2>CLÁUSULA 6ª — DA RESCISÃO</h2>'
  +'<p>6.1. O contrato pode ser rescindido por acordo entre as partes, por inadimplemento após notificação prévia de 5 dias, ou por exercício do direito de arrependimento previsto no art. 49 do CDC, quando aplicável, no prazo legal.</p>'
  +'<p>6.2. A rescisão não afasta a obrigação de pagamento das parcelas vencidas até a data da efetiva rescisão nem das penalidades devidas.</p>'
  +'<h2>CLÁUSULA 7ª — DA PROTEÇÃO DE DADOS (LGPD)</h2>'
  +'<p>7.1. Os dados pessoais serão tratados para as finalidades estritamente relacionadas à execução deste contrato, nos termos da Lei nº 13.709/2018, sendo vedada a utilização para finalidades diversas sem consentimento específico.</p>'
  +'<p>7.2. O CONTRATANTE pode exercer os direitos do art. 18 da LGPD pelos canais indicados neste contrato.</p>'
  +'<h2>CLÁUSULA 8ª — DAS COMUNICAÇÕES</h2>'
  +'<p>8.1. As partes elegem os canais abaixo para todas as comunicações decorrentes deste contrato.</p>'
  +'<div class="comms"><div><strong>CONTRATANTE</strong>Telefone/WhatsApp: '+esc(tel)+'<br>E-mail: '+esc(email)+'</div><div><strong>CONTRATADA</strong>Telefone/WhatsApp: '+FIXED.phone+'<br>E-mail: '+FIXED.email+'</div></div>'
  +'<p>8.2. Considera-se válida a comunicação enviada para o e-mail ou WhatsApp informados, presumindo-se o recebimento após 24 horas do envio.</p>'
  +'<h2>CLÁUSULA 9ª — DO FORO</h2>'
  +'<p>9.1. Fica eleito o foro do domicílio do CONTRATANTE para dirimir controvérsias oriundas deste contrato, conforme art. 101, I, do CDC, quando aplicável a relação de consumo.</p>'
  +'<h2>CLÁUSULA 10ª — DAS DISPOSIÇÕES GERAIS</h2>'
  +'<p>10.1. A tolerância quanto ao descumprimento de obrigação não constitui novação, renúncia ou alteração do pactuado.</p>'
  +'<p>10.2. A eventual nulidade de qualquer cláusula não prejudica as demais, que permanecem válidas e eficazes.</p>'
  +'<p>10.3. Este contrato é firmado em caráter irrevogável e irretratável, obrigando as partes, seus herdeiros e sucessores.</p>'
  +'<p style="margin-top:18px">E, por estarem de acordo, as partes assinam o presente instrumento, declarando ter lido e compreendido todas as cláusulas.</p>'
  +'<p>'+esc(cidade)+', ______ de __________________________ de __________.</p>'
  +'<div class="signatures"><div><div class="signline">CONTRATANTE<br>Nome: '+esc(nome)+'<br>CPF: '+esc(cpf)+'</div></div><div><div class="signline">CONTRATADA<br>Nome: '+FIXED.name+'<br>CNPJ: '+FIXED.cnpj+'</div></div></div>';
  $("paper").innerHTML=h;
  var cf=0,i;for(i=0;i<CLIENT_FIELDS.length;i++){var v=val(CLIENT_FIELDS[i]);if(v&&v.charAt(0)!=="#")cf++;}
  var vf=0;for(i=0;i<VEH_FIELDS.length;i++){var w=val(VEH_FIELDS[i]);if(w&&w.charAt(0)!=="#")vf++;}
  $("status").textContent=cf+"/5 cliente • "+vf+"/5 veículo";
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

/* ===== Extração de texto do PDF do CRLV ===== */
function lerPdf(arquivo){
  return new Promise(function(resolve,reject){
    if(typeof pdfjsLib==="undefined"){reject(new Error("pdf.js não carregou. Verifique a internet."));return;}
    var reader=new FileReader();
    reader.onload=function(){
      var bytes=new Uint8Array(reader.result);
      pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
        var paginas=[],p=1;
        function proxima(){
          if(p>pdf.numPages){resolve(paginas.join("\n"));return;}
          pdf.getPage(p).then(function(page){
            page.getTextContent().then(function(tc){
              var itens=tc.items.map(function(it){return it.str;});
              paginas.push(itens.join(" "));
              p++;proxima();
            }).catch(reject);
          }).catch(reject);
        }
        proxima();
      }).catch(reject);
    };
    reader.onerror=reject;
    reader.readAsArrayBuffer(arquivo);
  });
}
function normalizar(s){
  return String(s||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^\S\r\n]+/g," ")
    .toUpperCase();
}
function extrairPlaca(txt){
  var m=txt.match(/\b([A-Z]{3}[\s\-]?[0-9][A-Z0-9][0-9]{2})\b/);
  if(!m)return "";
  var limpo=m[1].replace(/[\s\-]/g,"");
  if(!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(limpo))return "";
  return limpo;
}
function extrairRenavam(txt){
  var m=txt.match(/RENAVAM[^\d]{0,20}(\d[\d\s\.\-]{8,15}\d)/);
  if(m){var r=m[1].replace(/\D/g,"");if(r.length>=9&&r.length<=11)return r;}
  var m2=txt.match(/\b(\d{11})\b/);
  return m2?m2[1]:"";
}
function extrairChassi(txt){
  var m=txt.match(/CHASSI[^\w]{0,20}([A-HJ-NPR-Z0-9]{17})/);
  if(m)return m[1];
  var m2=txt.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if(m2){
    var c=m2[1];
    if(/[A-Z]/.test(c)&&/[0-9]/.test(c))return c;
  }
  return "";
}
function extrairAnos(txt){
  var mAno=txt.match(/ANO\s*(?:FABRICACAO|FAB|MODELO)[^\d]{0,15}(\d{4})[^\d]{0,30}(\d{4})/);
  if(mAno)return {fab:mAno[1],mod:mAno[2]};
  var m2=txt.match(/\b(19[89]\d{2}|20[0-4]\d{2})\b[^\d]{0,15}\b(19[89]\d{2}|20[0-4]\d{2})\b/);
  if(m2)return {fab:m2[1],mod:m2[2]};
  var m3=txt.match(/\b(19[89]\d{2}|20[0-4]\d{2})\b/);
  if(m3)return {fab:m3[1],mod:m3[1]};
  return {fab:"",mod:""};
}
function preencherDoPdf(textoBruto){
  var txt=normalizar(textoBruto);
  var placa=extrairPlaca(txt);
  if(placa)$("placa").value=placa;
  var ren=extrairRenavam(txt);
  if(ren)$("renavam").value=ren;
  var cha=extrairChassi(txt);
  if(cha)$("chassi").value=cha;
  var anos=extrairAnos(txt);
  if(anos.fab)$("anoFab").value=anos.fab;
  if(anos.mod)$("anoModelo").value=anos.mod;
  atualizarExtenso();render();
  var achados=[];
  if(placa)achados.push("Placa");
  if(ren)achados.push("Renavam");
  if(cha)achados.push("Chassi");
  if(anos.fab)achados.push("Ano Fab");
  if(anos.mod)achados.push("Ano Modelo");
  return achados;
}
function handleCrlv(e){
  var f=e.target.files&&e.target.files[0];
  var st=$("crlvStatus"),btn=$("btnExtrair");
  if(!f){state.crlvFile=null;st.textContent="Nenhum arquivo anexado.";st.className="hint";if(btn)btn.disabled=true;return;}
  if(f.type&&f.type!=="application/pdf"&&!/\.pdf$/i.test(f.name)){
    st.textContent="Apenas PDF digital é aceito.";
    st.className="hint";
    if(btn)btn.disabled=true;
    return;
  }
  state.crlvFile=f;
  st.textContent="Anexado: "+f.name+" — clique em Extrair dados.";
  st.className="hint file-ok";
  if(btn)btn.disabled=false;
  toast("PDF anexado.");
}
function extrair(){
  var f=state.crlvFile;
  if(!f){alert("Anexe o CRLV-e em PDF primeiro.");return;}
  var st=$("crlvStatus"),btn=$("btnExtrair");
  btn.disabled=true;
  st.textContent="Lendo o PDF...";
  st.className="hint";
  lerPdf(f).then(function(texto){
    if(!texto||!texto.trim()){
      st.textContent="O PDF não contém texto. Provavelmente é escaneado.";
      st.className="hint";
      btn.disabled=false;
      return;
    }
    var achados=preencherDoPdf(texto);
    if(!achados.length){
      st.textContent="PDF lido, mas nenhum campo foi reconhecido.";
      st.className="hint";
    } else {
      st.textContent="Extraído: "+achados.join(", ")+".";
      st.className="hint file-ok";
      toast("Dados extraídos.");
    }
    btn.disabled=false;
  }).catch(function(err){
    st.textContent="Falha ao ler o PDF: "+err.message;
    st.className="hint";
    btn.disabled=false;
  });
}

/* ===== Geração do PDF com jsPDF ===== */
function gerarPdf(){
  if(typeof window.jspdf==="undefined"||!window.jspdf.jsPDF){
    alert("jsPDF não carregou. Verifique a internet e recarregue a página.");
    return;
  }
  var jsPDF=window.jspdf.jsPDF;
  var doc=new jsPDF({unit:"mm",format:"a4"});
  var W=210, H=297, M=15, usable=W-M*2;
  var y=0;
  var pageNum=1;

  function cabecalho(){
    doc.setFont("helvetica","bold");
    doc.setFontSize(9);
    doc.text(ascii(FIXED.name)+" | CNPJ "+FIXED.cnpj, W/2, 12, {align:"center"});
    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    doc.line(M,14,W-M,14);
    y=20;
  }
  function rodape(){
    doc.setFont("helvetica","normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text("Pagina "+pageNum, W-M, H-8, {align:"right"});
    doc.text("JAROD - Intermediacao Securitaria", M, H-8);
    doc.setTextColor(0);
  }
  function novaPagina(){
    rodape();
    doc.addPage();
    pageNum++;
    cabecalho();
  }
  function quebra(h){
    if(y+h>H-14){novaPagina();}
  }
  function texto(txt,size,bold,align){
    size=size||10;
    bold=!!bold;
    doc.setFont("helvetica",bold?"bold":"normal");
    doc.setFontSize(size);
    var linhas=doc.splitTextToSize(ascii(txt),usable);
    for(var i=0;i<linhas.length;i++){
      quebra(5);
      doc.text(linhas[i],align==="center"?W/2:M,y,align==="center"?{align:"center"}:undefined);
      y+=5;
    }
  }
  function titulo(txt){
    quebra(10);
    y+=2;
    doc.setFont("helvetica","bold");
    doc.setFontSize(10);
    doc.text(ascii(txt),M,y);
    y+=6;
  }
  function espaco(h){y+=h||3;}

  /* ====== Página 1 ====== */
  cabecalho();

  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  var tituloLinhas=doc.splitTextToSize("CONTRATO DE PRESTACAO DE SERVICOS DE INTERMEDIACAO SECURITARIA",usable);
  for(var t=0;t<tituloLinhas.length;t++){
    doc.text(tituloLinhas[t],W/2,y+5,{align:"center"});
    y+=6;
  }
  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  doc.text("Instrumento particular de adesao e ativacao de seguro, com intermediacao da CONTRATADA",W/2,y,{align:"center"});
  y+=8;

  /* Partes */
  var nome=val("nome",""),cpf=val("cpf",""),rg=val("rg",""),email=val("email",""),tel=val("telefone","");
  doc.setDrawColor(150);
  doc.setLineWidth(0.2);
  var boxTop=y, boxH=34;
  doc.rect(M,boxTop,usable/2,boxH);
  doc.rect(M+usable/2,boxTop,usable/2,boxH);
  doc.setFillColor(235,235,235);
  doc.rect(M,boxTop,usable/2,6,"F");
  doc.rect(M+usable/2,boxTop,usable/2,6,"F");
  doc.setFont("helvetica","bold");
  doc.setFontSize(9);
  doc.text("CONTRATANTE",M+2,boxTop+4.2);
  doc.text("CONTRATADA",M+usable/2+2,boxTop+4.2);
  doc.setFont("helvetica","normal");
  doc.setFontSize(8.5);
  var yL=boxTop+10, xL=M+2, xR=M+usable/2+2;
  doc.text(ascii("Nome: "+nome),xL,yL);
  doc.text(ascii("Razao: "+FIXED.name),xR,yL);
  doc.text(ascii("CPF: "+cpf),xL,yL+4.5);
  doc.text(ascii("CNPJ: "+FIXED.cnpj),xR,yL+4.5);
  doc.text(ascii("RG: "+rg),xL,yL+9);
  doc.text(ascii("E-mail: "+FIXED.email),xR,yL+9);
  doc.text(ascii("E-mail: "+email),xL,yL+13.5);
  doc.text(ascii("Telefone: "+FIXED.phone),xR,yL+13.5);
  doc.text(ascii("Telefone: "+tel),xL,yL+18);
  y=boxTop+boxH+4;

  texto("As partes acima qualificadas tem, entre si, justo e contratado o presente instrumento, que se regera pelas clausulas e condicoes a seguir, as quais declaram ter lido, compreendido e aceito integralmente.",9);

  titulo("CLAUSULA 1 - DO OBJETO");
  texto("1.1. O presente contrato tem por objeto formalizar a contratacao dos servicos de intermediacao e assessoria prestados pela CONTRATADA, relacionados ao produto securitario "+val("seguro","")+", bem como o pagamento da respectiva taxa de adesao e ativacao.",9);
  texto("1.2. A CONTRATADA atua como intermediaria entre o CONTRATANTE e a seguradora. A CONTRATADA nao e seguradora, nao assume risco securitario, nao garante cobertura, nao regula sinistro e nao responde por indenizacoes previstas na apolice.",9);
  texto("1.3. O produto esta vinculado ao veiculo a seguir identificado:",9);

  /* Tabela veículo */
  var veh=[["Placa",val("placa","")],["Renavam",val("renavam","")],["Chassi",val("chassi","")],["Ano Fabricacao / Modelo",val("anoFab","")+" / "+val("anoModelo","")]];
  quebra(veh.length*6+2);
  var yv=y;
  for(var k=0;k<veh.length;k++){
    doc.setFillColor(235,235,235);
    doc.rect(M,yv,50,6,"F");
    doc.setDrawColor(150);
    doc.rect(M,yv,50,6);
    doc.rect(M+50,yv,usable-50,6);
    doc.setFont("helvetica","bold");
    doc.setFontSize(8.5);
    doc.text(ascii(veh[k][0]),M+2,yv+4);
    doc.setFont("helvetica","normal");
    doc.text(ascii(veh[k][1]),M+52,yv+4);
    yv+=6;
  }
  y=yv+4;

  texto("1.4. Este instrumento nao substitui a proposta, a apolice, o certificado, o endosso nem as condicoes gerais do seguro, que permanecem prevalentes para todos os efeitos de cobertura.",9);

  /* ====== Página 2 ====== */
  novaPagina();

  titulo("CLAUSULA 2 - DO VALOR E DA FORMA DE PAGAMENTO");
  texto("2.1. Pela intermediacao e adesao, o CONTRATANTE pagara a CONTRATADA o valor total de
