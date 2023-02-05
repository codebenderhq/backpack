import { getCookies } from "https://deno.land/std/http/cookie.ts";


const getAuthToken = (req) => {
    const { id } = getCookies(req.headers);
  
  
    return id ? id : req.headers.get('authorization')
};

const isAuthenticated = (req) => {
    const id = getAuthToken(req);
    return id ? true : false;
};



window.space = {
    getAuthToken
}

const authenticate = async(pathname,request) => {

  if(!isAuthenticated(request)){

    const {pathname} = new URL(request.url)


    const {default:app} = await import('app.sauveur.dev/index.js')
    const appReq = new Request(`https://app.sauver.xyz/account?redirect=${request.headers.get('host')}`,{
        headers:{
            host: 'app.sauver.xyz'
        }
    })

    window._cwd = 'app.sauveur.dev'
    if(pathname !== '/'){

        return app(request)
    }


    return app(appReq)
        // return new Response(null,{
        //     status: 401,
        //     headers: {
        //         'WWW-Authenticate': 'Basic realm="Access to staging site"'
        //     }
        // })
      }
}

export default authenticate