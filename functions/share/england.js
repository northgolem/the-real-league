import {makePreview,html,readAsset} from "../../lib/england-share.mjs";
export async function onRequestGet(context) {
  try {
    const model=await makePreview(new URL(context.request.url),path=>readAsset(context,path));
    return new Response(html(model),{
      status:200,headers: {
        "Content-Type":"text/html; charset=utf-8",
        "Cache-Control":model.isCurrent?"public, max-age=300, s-maxage=900":"public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options":"nosniff",
        "Referrer-Policy":"strict-origin-when-cross-origin",
      }
    });
  } catch(e) {
    return new Response("This alternative football league is unavailable. Please return to https://usurperleague.com/england/",{
      status:503,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}
    });
  }
}
