import {serve} from "https://deno.land/std/http/server.ts";
import { getCookies } from "https://deno.land/std/http/cookie.ts";
import "https://deno.land/std/dotenv/load.ts";

let resp;

const service = async (ext, pathname, req) => {
    resp = null
    if(!resp){
        for (const element of ext) {

            const _resp = await element(pathname, req)
            if(_resp){
                resp = _resp
                break;
            } 
        }
    }
  
}

const isAuthenticated = (req) => {
   const {id} = getCookies(req.headers)

   return id ? true : false

}

const middleware = async (request, info) => {
  
        const { pathname } = new URL(request.url);
        window.extPath = window?._cwd ? window._cwd: Deno.cwd() 
        
        if(!isAuthenticated(request)){

            console.log(Deno.env.get('env'))
            return Response.redirect(`https://${Deno.env.get('env') ? 'localhost:9001/account?domain=app.sauveur&redirect=localhost:9001?domain=dash.sauveur' : 'app.sauveur.xyz/account?redirect=dash.sauveur.xyx'} `)
            // return new Response(null,{
            //     status: 401,
            //     headers: {
            //         'WWW-Authenticate': 'Basic realm="Access to staging site"'
            //     }
            // })
        }

        try{ 
            const extensions = Deno.env.get('env') ? await import(`${window.extPath}/extensions.js`) : await import(`${window.extPath}/ext.js`)
            await service(Object.values(extensions),pathname,request)
            return resp
        }catch(err){
            window.dispactLog ? window.dispatchLog({msg:err.message, err}) : console.log(err)
            return Response.json({msg: 'Error:LEVEL1'},{status:500})
        }     
  
}

if(import.meta.main){
    const port = 9090
    serve(middleware, { port });
}


export default middleware