import {makePreview,readAsset} from "../../lib/england-share.mjs";
import {makeCard} from "../../lib/share-card.mjs";
export async function onRequestGet(context) {
  try {
    const model=await makePreview(new URL(context.request.url),path=>readAsset(context,path));
    const bytes=await makeCard(model);
    return new Response(bytes,{
      status:200,headers:{
        "Content-Type":"image/png",
        "Cache-Control":model.isCurrent?"public, max-age=300, s-maxage=900":"public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options":"nosniff",
      }
    });
  } catch(e) {
    return new Response("Image unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
