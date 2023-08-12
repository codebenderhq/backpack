import "https://deno.land/std/dotenv/load.ts";
import deploy from "./middleware/deploy.js";
import * as extensions from "./middleware/index.js";
import "./lib/index.ts";
import logView from "./views/logger.js";

let resp;

const service = async (ext, pathname, req) => {
  resp = null;
  if(pathname === "/logs" && req.method === "GET"){
    resp = logView(req)
  }

  if (!resp) {
    for (const element of ext) {
      const _resp = await element(pathname, req);
      if (_resp) {
        resp = _resp;
        break;
      }
    }
  }
};


const webLogs = async(req,res) => {
  const request = await req
  const response = await res

  const referer = request.headers.get('referer')
//  if(request.method === "POST") console.log(request)
//  console.log(request)


  logger.info('request/response',{request:{method:request.method, uri: request.url, referer},response: {status: response.status} });
}
/**
 * Web Framework, this makes all requests go through FRAME
 * @param {Request} request
 * @return {Response} response
 */
export const web = async (request, info) => {
  const { pathname } = req(request);
  window.extPath = window?._cwd ? window._cwd : Deno.cwd();

  try {
    await service(Object.values(extensions), pathname, request);
    resp = resp ? resp : new Response('Not Found', {status: "404"});
    webLogs(request,resp)
    return resp;
  } catch (err) {
    logger.info(err);
    return Response.json({ msg: "Error:LEVEL1", err: err.message }, {
      status: 500,
    });
  }
};

/**
* Deconstruct the request object into valuble information
*
* @param {Request} request

* @return {pathname: string}
*/
export const req = (request) => {
  const { pathname, hostname, username, search, searchParams } = new URL(
    request.url,
  );

  return { pathname, hostname, username, search, searchParams };
};

globalThis.oomph = {
  req,
  deploy,
  web,
};

const initHost = (request) => {
  globalThis.oomph.user_request = req(request);
};

const launch = async (entry_point) => {
  console.log("loading", entry_point);
  const exec = (await import(`app/${entry_point}`)).default;

  console.log(Deno.cwd())
  const options = {
    port: 8001,
  };

  //  Prod Enviroment Configuration
  if (Deno.env.get("env") !== "dev") {
    const decoder = new TextDecoder("utf-8");

    options.port = 443;
    options.cert = decoder.decode(await Deno.readFile(Deno.env.get("CERT")));
    options.key = decoder.decode(await Deno.readFile(Deno.env.get("KEY")));

    //ACME service
    Deno.serve({ port: 80 }, (req) => {
      const { pathname } = new URL(req.url);

      console.log(req);
      const host = req.headers.get("host");

      if (pathname.includes(".well-known")) {
        return serveFile(req, `/apps${pathname}`);
      } else {
        return new Response(null, {
          status: 301,
          headers: {
            Location: `https://${host.replace("www.", "")}${pathname}`,
          },
        });
      }
    });
  }

  Deno.serve(options, (request) => {
    initHost(request);
    return exec(request);
  });
};

if (import.meta.main) {
  const [src] = Deno.args;

  if (src === "--web") {
    try{
      Deno.serve(web);
    }catch{
      Deno.serve({ port: 9000 },web);
    }

  } else {
    launch(src);
  }
  console.log("oomph launched");
}
