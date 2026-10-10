for(const url of ['https://docs.msg91.com/whatsapp/get-templates']){
 const html=await fetch(url).then(r=>r.text());
 console.log(url,[...new Set(html.match(/https:\/\/api\.msg91\.com[^\s"<>]+|\/[A-Za-z0-9_-]*[Tt]emplate[A-Za-z0-9_-]*/g)||[])].slice(0,50));
 const index=html.indexOf('Get Templates');console.log(html.slice(Math.max(0,index-500),index+900));
 const endpoint=html.indexOf('get-template-client');console.log('endpoint context',html.slice(Math.max(0,endpoint-400),endpoint+1800));
}
