(function(){
"use strict";

if(typeof pdfjsLib!=="undefined"){
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ============================================================
   Número por extenso (PT-BR)
   ============================================================ */
var _U=["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
var _D=["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
var _C=["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
function _n999(n){if(n===100)return "cem";var c=Math.floor(n/100),r=n%100,o=[];if(c)o.push(_C[c]);if(r){if(r<20)o.push(_U[r]);else{var d=Math.floor(r/10),u=r%10;o.push(u?_D[d]+" e "+_U[u]:_D[d]);}}return o.join(" e ");}
function _int(n){if(n===0)return "zero";var b=Math.floor(n/1e9),m=Math.floor((n%1e9)/1e6),k=Math.floor((n%1e6)/1e3),r=n%1000,p=[];if(b)p.push(_n999(b)+(b===1?" bilhão":" bilhões"));if(m)p.push(_n999(m)+(m===1?" milhão":" milhões"));if(k)p.push(k===1?"mil":_n999(k)+" mil");if(r)p.push(_n999(r));if(p.length===1)return p[0];var last=p.pop(),prev=p.pop();var j=(r>0&&r<100)||(r===0&&k===0)?" e ":" ";return p.concat([prev+j+last]).join(", ");}
function numeroParaExtenso(num){if(!isFinite(num))return "";var reais=Math.floor(num),cents=Math.round((num-reais)*100),p=[];if(reais>0)p.push(_int(reais)+(reais===1?" real":" reais"));if(cents>0)p.push(_int(cents)+(cents===1?" centavo":" centavos"));return p.length?p.join(" e "):"zero real";}

/* ============================================================
   Constantes
   ============================================================ */
var FIXED={name:"JAROD M M JR",email:"CONTATO@JAROD.COM.BR",phone:"31999635303",cnpj:"67.897.810/0001-63"};
var PIX_FIXED="pix@jarod.com.br";
var DEF_PARC=6,MAX_PARC=12;
var FIELD_IDS=["nome","cpf","rg","email","telefone","placa","renavam","chassi","anoFab","anoModelo","seguro","valor","parcelas","cidade"];
var CLIENT_FIELDS=["nome","cpf","rg","email","telefone"];
var VEH_FIELDS=["placa","renavam","chassi","anoFab","anoModelo"];
var state={vencimentos:{},crlvFile:null};

/* ============================================================
   Helpers
   ============================================================ */
function $(id){return document.getElementById(id);}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m];});}
function val(id,fb){var el=$(id);if(!el||!el.value)return fb||"";return el.value.trim()||fb||"";}
function parseMoney(s){if(!s)return NaN;var c=String(s).replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");var n=parseFloat(c);return isFinite(n)?n:NaN;}
function formatBRL(n){return isFinite(n)?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"";}
function isoToBR(iso){if(!iso)return "";var p=iso.split("-");return p[2]+"/"+p[1]+"/"+p[0];}
function addDaysISO(d){var x=new Date();x.setHours(12,0,0,0);x.setDate(x.getDate()+d);var y=x.getFullYear(),m=("0"+(x.getMonth()+1)).slice(-2),dd=("0"+x.getDate()).slice(-2);return y+"-"+m+"-"+dd;}
function toast(t){var x=$("toast");if(!x)return;x.textContent=t;x.style.display="block";setTimeout(function(){x.style.display="none";},2200);}

/* ============================================================
   Cálculos
   ============================================================ */
function getParcelasCount(){var r=parseInt(val("parcelas",String(DEF_PARC)),10);if(!isFinite(r))return DEF_PARC;return Math.max(1,Math.min(MAX_PARC,r));}
function getVencimento(i){var iso=state.vencimentos[i];return iso?isoToBR(iso):"#VENCIMENTO#";}
function getValorParcela(){var t=parseMoney(val("valor"));if(!isFinite(t)||t<=0)return "#VALOR_PARCELA#";return formatBRL(t/getParcelasCount());}
function getMoney(){var r=val("valor");if(!r)return "R$ #VALOR#";var n=parseMoney(r);return isFinite(n)?formatBRL(n):"R$ "+esc(r);}
function getExtenso(){var v=parseMoney(val("valor"));return(!isFinite(v)||v<=0)?"#VALOR_EXTENSO#":numeroParaExtenso(v);}
function atualizarExtenso(){var v=parseMoney(val("valor"));$("valorExtenso").value=(isFinite(v)&&v>0)?numeroParaExtenso(v):"";}

/* ============================================================
   Templates
   ============================================================ */
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

/* ============================================================
   Render do contrato
   ============================================================ */
function render(){
  var nome=val("nome","#NOME#"),cpf=val("cpf","#CPF#"),rg=val("rg","#RG#");
  var email=val("email","#EMAIL#"),tel=val("telefone","#TELEFONE#");
  var seguro=val("seguro","#SEGURO#"),n=getParcelasCount();
  var cidade=val("cidade","#CIDADE#");

  var h='<div class="paperhead"><div class="paperbrand"><b>'+FIXED.name+'</b><div>CNPJ '+FIXED.cnpj+'</div></div></div>'
  +'<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS E INTERMEDIAÇÃO SECURITÁRIA</h1>'
  +'<div class="lead">Instrumento particular de adesão e ativação de seguro, com intermediação e condições de pagamento</div>'

  +'<div class="parties">'
  +'<div class="party"><div class="partyhead">CONTRATANTE / CLIENTE</div>'
  +'<p><b>Nome:</b> '+esc(nome)+'</p>'
  +'<p><b>CPF:</b> '+esc(cpf)+'</p>'
  +'<p><b>RG:</b> '+esc(rg)+'</p>'
  +'<p><b>E-mail:</b> '+esc(email)+'</p>'
  +'<p><b>Telefone:</b> '+esc(tel)+'</p>'
  +'</div>'
  +'<div class="party"><div class="partyhead">CONTRATADA / PRESTADORA</div>'
  +'<p><b>Nome:</b> '+FIXED.name+'</p>'
  +'<p><b>CNPJ:</b> '+FIXED.cnpj+'</p>'
  +'<p><b>E-mail:</b> '+FIXED.email+'</p>'
  +'<p><b>Telefone:</b> '+FIXED.phone+'</p>'
  +'</div>'
  +'</div>'

  +'<p>As partes acima qualificadas, doravante designadas simplesmente CONTRATANTE e CONTRATADA, têm entre si justo e contratado o presente instrumento, mediante as cláusulas e condições seguintes, que mutuamente aceitam e outorgam.</p>'

  +'<h2>CLÁUSULA 1ª — DO OBJETO</h2>'
  +'<p>1.1. O presente contrato tem por objeto a prestação de serviços de intermediação securitária e o estabelecimento das condições de pagamento da taxa de adesão e ativação relativa ao produto securitário <b>'+esc(seguro)+'</b>, tendo como veículo vinculado o abaixo descrito:</p>'
  +veiculoTable()
  +'<p>1.2. A CONTRATADA atua exclusivamente como intermediadora entre o CONTRATANTE e a sociedade seguradora escolhida, não sendo a CONTRATADA responsável pela cobertura securitária, cujas condições são regidas pela apólice, proposta, certificado e condições gerais emitidas pela seguradora.</p>'
  +'<p>1.3. O presente instrumento regula apenas a taxa de adesão e ativação devida à CONTRATADA, não substituindo, alterando ou ampliando a apólice de seguro, que permanece regida pelos documentos emitidos pela seguradora.</p>'

  +'<h2>CLÁUSULA 2ª — DO VALOR E DA FORMA DE PAGAMENTO</h2>'
  +'<p>2.1. O valor total dos serviços de adesão e ativação é de <b>'+esc(getMoney())+'</b> ('+esc(getExtenso())+').</p>'
  +'<p>2.2. O CONTRATANTE realizará o pagamento de forma parcelada, exclusivamente por meio de Pix, conforme o cronograma abaixo.</p>'
  +'<table class="paytable"><thead><tr><th>Parcela</th><th>Valor</th><th>Vencimento</th></tr></thead><tbody>'+renderParcelasRows(n)+'</tbody></table>'
  +'<table class="pix">'
  +'<tr><td>CHAVE PIX</td><td>'+esc(PIX_FIXED)+'</td></tr>'
  +'<tr><td>Titular</td><td>'+FIXED.name+'</td></tr>'
  +'<tr><td>CNPJ</td><td>'+FIXED.cnpj+'</td></tr>'
  +'</table>'
  +'<p>2.3. O pagamento será considerado efetivado após a confirmação/compensação do crédito. O CONTRATANTE deverá guardar os respectivos comprovantes de Pix.</p>'
  +'<p>2.4. O atraso no pagamento de qualquer parcela sujeitará o CONTRATANTE a multa moratória de 2% (dois por cento) sobre o valor em atraso, juros de mora de 1% (um por cento) ao mês, calculados pro rata die, e correção monetária pelo índice IPCA, sem prejuízo das medidas de cobrança cabíveis.</p>'

  +'<h2>CLÁUSULA 3ª — DAS OBRIGAÇÕES DA CONTRATADA</h2>'
  +'<p>3.1. A CONTRATADA obriga-se a: (i) intermediar a contratação do produto securitário junto à seguradora escolhida; (ii) prestar as informações necessárias sobre as etapas do processo; (iii) emitir o recibo de quitação ao término do pagamento integral; (iv) tratar os dados pessoais do CONTRATANTE em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>'
  +'<p>3.2. A CONTRATADA não se responsabiliza por recusas, restrições ou condições impostas pela seguradora na análise de risco, nem por sinistros, indenizações ou negativas de cobertura, que são de competência exclusiva da seguradora.</p>'

  +'<h2>CLÁUSULA 4ª — DAS OBRIGAÇÕES DO CONTRATANTE</h2>'
  +'<p>4.1. O CONTRATANTE obriga-se a: (i) fornecer informações verdadeiras, exatas e completas sobre si e sobre o veículo; (ii) efetuar o pagamento das parcelas nas datas acordadas; (iii) comunicar alterações relevantes que possam impactar a contratação; (iv) ler e observar as condições gerais da apólice emitida pela seguradora.</p>'
  +'<p>4.2. A prestação de informação falsa ou omissão de fato relevante poderá acarretar a recusa da cobertura pela seguradora e a rescisão do presente instrumento, sem prejuízo das perdas e danos.</p>'

  +'<h2>CLÁUSULA 5ª — DA VIGÊNCIA E DA RESCISÃO</h2>'
  +'<p>5.1. Este instrumento vigora a partir da data de assinatura até a quitação integral das parcelas e o cumprimento das obrigações previstas nas cláusulas anteriores.</p>'
  +'<p>5.2. O contrato poderá ser rescindido: (i) por acordo entre as partes, mediante termo escrito; (ii) por inadimplemento de qualquer obrigação, após notificação prévia de 10 (dez) dias; (iii) por determinação legal ou regulatória.</p>'
  +'<p>5.3. Em caso de rescisão por iniciativa do CONTRATANTE após o início da vigência do seguro, os valores eventualmente devidos serão apurados conforme as condições gerais da apólice e a regulamentação da SUSEP, vedado o enriquecimento sem causa de qualquer das partes.</p>'

  +'<h2>CLÁUSULA 6ª — DA PROTEÇÃO DE DADOS</h2>'
  +'<p>6.1. As partes obrigam-se a tratar os dados pessoais compartilhados em razão deste contrato conforme a Lei 13.709/2018 (LGPD), utilizando-os exclusivamente para as finalidades previstas neste instrumento e nos documentos da seguradora.</p>'

  +'<h2>CLÁUSULA 7ª — DAS COMUNICAÇÕES</h2>'
  +'<p>7.1. As comunicações relativas a este contrato serão realizadas preferencialmente pelos canais abaixo indicados, sendo válidas as notificações enviadas para os endereços eletrônicos informados.</p>'
  +'<div class="comms">'
  +'<div><strong>CONTRATANTE / CLIENTE</strong>Telefone/WhatsApp: '+esc(tel)+'<br>E-mail: '+esc(email)+'</div>'
  +'<div><strong>CONTRATADA / PRESTADORA</strong>Telefone/WhatsApp: '+FIXED.phone+'<br>E-mail: '+FIXED.email+'</div>'
  +'</div>'

  +'<h2>CLÁUSULA 8ª — DO FORO</h2>'
  +'<p>8.1. As partes elegem o foro da comarca do domicílio do CONTRATANTE para dirimir quaisquer controvérsias oriundas deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja, ressalvadas as hipóteses de competência legal obrigatória previstas no Código de Defesa do Consumidor.</p>'

  +'<h2>CLÁUSULA 9ª — DAS DISPOSIÇÕES GERAIS</h2>'
  +'<p>9.1. A tolerância de qualquer das partes quanto ao descumprimento de obrigação da outra não implica novação, renúncia ou alteração do pactuado.</p>'
  +'<p>9.2. A nulidade ou invalidade de qualquer cláusula não afeta as demais, que permanecem válidas e exigíveis.</p>'
  +'<p>9.3. Este instrumento substitui todo e qualquer entendimento anterior, verbal ou escrito, relativo ao seu objeto.</p>'

  +'<p style="margin-top:18px">E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, na presença das testemunhas abaixo identificadas.</p>'
  +'<p>'+esc(cidade)+', ______ de __________________________ de __________.</p>'

  +'<div class="signatures">'
  +'<div><div class="signline">CONTRATANTE / CLIENTE<br>Nome: '+esc(nome)+'<br>CPF: '+esc(cpf)+'</div></div>'
  +'<div><div class="signline">CONTRATADA / PRESTADORA<br>Nome: '+FIXED.name+'<br>CNPJ: '+FIXED.cnpj+'</div></div>'
  +'</div>'
  +'<div class="signatures" style="margin-top:30px">'
  +'<div><div class="signline">TESTEMUNHA 1<br>Nome:<br>CPF:</div></div>'
  +'<div><div class="signline">TESTEMUNHA 2<br>Nome:<br>CPF:</div></div>'
  +'</div>';

  $("paper").innerHTML=h;

  var cf=0,i;for(i=0;i<CLIENT_FIELDS.length;i++){var v=val(CLIENT_FIELDS[i]);if(v&&v.charAt(0)!=="#")cf++;}
  var vf=0;for(i=0;i<VEH_FIELDS.length;i++){var w=val(VEH_FIELDS[i]);if(w&&w.charAt(0)!=="#")vf++;}
  $("status").textContent=cf+"/5 cliente • "+vf+"/5 veículo";
}

/* ============================================================
   Parcelas (vencimento automático)
   ============================================================ */
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

/* ============================================================
   PDF → imagem (para OCR de PDF escaneado)
   ============================================================ */
function pdfParaImagem(arquivo){
  return new Promise(function(resolve,reject){
    if(typeof pdfjsLib==="undefined"){reject(new Error("pdf.js não carregou"));return;}
    var reader=new FileReader();
    reader.onload=function(){
      var bytes=new Uint8Array(reader.result);
      pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
        pdf.getPage(1).then(function(page){
          var viewport=page.getViewport({scale:3.0});
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

/* ============================================================
   OCR
   ============================================================ */
function rodarOcr(fonteImagem,cbStatus){
  if(typeof Tesseract==="undefined"){alert("Tesseract não carregou. Verifique a internet.");return;}
  Tesseract.recognize(fonteImagem,"por",{
    logger:function(m){if(m.status==="recognizing text")cbStatus(Math.round(m.progress*100));}
  }).then(function(res){
    preencherDoOcr((res.data.text||"").toUpperCase());
    toast("Dados extraídos. Revise antes de gerar.");
  }).catch(function(err){
    alert("Falha no OCR: "+err.message);
  });
}

/* ============================================================
   Extração dos quatro campos do CRLV
   Placa, Renavam, Chassi, Ano Fab / Modelo
   ============================================================ */
function preencherDoOcr(txt){
  var t=String(txt||"").replace(/\s+/g," ");

  /* Placa: padrão antigo (ABC1234) ou Mercosul (ABC1D23) */
  var mP=t.match(/\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b/);
  if(mP)$("placa").value=mP[1].substring(0,7);

  /* Renavam: 11 dígitos, aceita separadores após rótulo ou isolado */
  var mR=t.match(/RENAVAM[^\d]{0,25}((?:\d[\s.\-]?){11})/);
  if(!mR)mR=t.match(/\b((?:\d[\s.\-]?){11})\b/);
  if(mR)$("renavam").value=mR[1].replace(/\D/g,"");

  /* Chassi: 17 caracteres, sem I, O e Q (padrão VIN) */
  var mC=t.match(/CHASSI[^\w]{0,25}([A-HJ-NPR-Z0-9]{17})/);
  if(!mC)mC=t.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if(mC)$("chassi").value=mC[1];

  /* Anos: fabricação e modelo, próximos */
  var mA=t.match(/(?:ANO\s*(?:FAB|FABRICACAO|FABRICAÇÃO|MODELO)[^\d]{0,20})?(\d{4})[^\d]{0,15}(\d{4})/);
  if(!mA)mA=t.match(/\b(19\d{2}|20\d{2})\b[^\d]{0,15}\b(19\d{2}|20\d{2})\b/);
  if(mA){
    $("anoFab").value=mA[1];
    $("anoModelo").value=mA[2];
  }

  atualizarExtenso();
  render();
}

/* ============================================================
   Upload + extração
   ============================================================ */
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
    st.textContent="Lendo PDF digital...";
    st.className="hint";
    var rd=new FileReader();
    rd.onload=function(){
      var bytes=new Uint8Array(rd.result);
      pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
        var paginas=[],p=1;
        function proxima(){
          if(p>pdf.numPages){
            var texto=paginas.join("\n");
            if(/[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/.test(texto.toUpperCase())||texto.replace(/\s/g,"").length>200){
              preencherDoOcr(texto.toUpperCase());
              st.textContent="Extração concluída (PDF digital). Confira os campos.";
              st.className="hint file-ok";
              btn.disabled=false;
            } else {
              st.textContent="PDF escaneado. Rodando OCR na imagem...";
              pdfParaImagem(f).then(function(dataUrl){
                rodarOcr(dataUrl,function(pr){st.textContent="OCR do PDF: "+pr+"%";});
                setTimeout(function(){st.textContent="OCR concluído. Confira os campos.";st.className="hint file-ok";btn.disabled=false;},1500);
              }).catch(function(err){
                st.textContent="Falha ao converter PDF: "+err.message;
                st.className="hint";
                btn.disabled=false;
              });
            }
            return;
          }
          pdf.getPage(p).then(function(page){
            page.getTextContent().then(function(tc){
              var t=tc.items.map(function(it){return it.str;}).join(" ");
              paginas.push(t);
              p++;
              proxima();
            });
          });
        }
        proxima();
      }).catch(function(err){
        st.textContent="Falha ao ler PDF: "+err.message;
        st.className="hint";
        btn.disabled=false;
      });
    };
    rd.onerror=function(){
      st.textContent="Falha ao ler o arquivo.";
      st.className="hint";
      btn.disabled=false;
    };
    rd.readAsArrayBuffer(f);

  } else if(f.type&&f.type.indexOf("image/")===0){
    var rd2=new FileReader();
    rd2.onload=function(ev){
      st.textContent="OCR na imagem... 0%";
      rodarOcr(ev.target.result,function(p){st.textContent="OCR: "+p+"%";});
      setTimeout(function(){st.textContent="OCR concluído. Confira os campos.";st.className="hint file-ok";btn.disabled=false;},1500);
    };
    rd2.readAsDataURL(f);

  } else {
    st.textContent="Formato não suportado. Use PDF ou imagem.";
    st.className="hint";
    btn.disabled=false;
  }
}

/* ============================================================
   Botões
   ============================================================ */
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
  $("nome").value="CLIENTE EXEMPLO";
  $("cpf").value="000.000.000-00";
  $("rg").value="00.000.000-0";
  $("email").value="cliente@exemplo.com";
  $("telefone").value="(00) 00000-0000";
  $("placa").value="SHB2A43";
  $("renavam").value="01316253888";
  $("chassi").value="9BD358AFNNYL93309";
  $("anoFab").value="2022";
  $("anoModelo").value="2022";
  $("seguro").value="Seguro / Plano contratado";
  $("valor").value="1.200,00";
  $("parcelas").value=DEF_PARC;
  $("cidade").value="Belo Horizonte/MG";
  state.vencimentos={};
  buildParcelasForm();atualizarExtenso();render();
  toast("Exemplo preenchido.");
}

/* ============================================================
   Exposição global + listeners + init
   ============================================================ */
window.App={resetForm:resetForm,printContract:printContract,fillDemo:fillDemo,extrair:extrair};

for(var i=0;i<FIELD_IDS.length;i++){
  (function(id){
    var el=$(id);if(!el)return;
    if(id==="parcelas"){el.addEventListener("input",function(){state.vencimentos={};buildParcelasForm();render();});}
    else if(id==="valor"){el.addEventListener("input",function(){atualizarExtenso();render();});}
    else{el.addEventListener("input",render);}
  })(FIELD_IDS[i]);
}
if($("crlvFile"))$("crlvFile").addEventListener("change",handleCrlv);

buildParcelasForm();atualizarExtenso();render();

})();
