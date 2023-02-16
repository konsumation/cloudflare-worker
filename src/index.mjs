import { Router } from "itty-router";
import sha256 from "crypto-js/sha256";
import cryptoJs from "crypto-js";
import jwt from "@tsndr/cloudflare-worker-jwt";

const router = Router();
const TOKEN_KEY = "sasffaFAFA34";
router.get("/", () => {
  return new Response(
    "Hello, world! This is the root page of your Worker template."
  );
});

const secret = "sasffaFAFA34";
const header = { alg: "HS256", typ: "JWT" };

router.get("/state", () => {
  return new Response(JSON.stringify({ version: "1.1.1" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

const corsHeader = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Origin": "*",
};

/*

$ curl -X POST https://konsum-cloudflare-worker.konsumation.workers.dev/post -H "Content-Type: application/json" -d '{"abc": "def"}'
*/

router.post("/post", async (request) => {
  // Create a base object with some fields.
  let fields = {
    asn: request.cf.asn,
    colo: request.cf.colo,
  };

  // If the POST data is JSON then attach it to our response.
  if (request.headers.get("Content-Type") === "application/json") {
    fields["json"] = await request.json();
  }

  // Serialise the JSON to a string.
  const returnData = JSON.stringify(fields, null, 2);

  return new Response(returnData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
});

router.post("/register", async (request) => {
  const { email, name, password } = await request.json();
  //console.log(email, name, password);
  const user = await KONSUM.get(`user:${email}`);
  const entitlements =
    "konsum,konsum.category.add,konsum.category.modify,konsum.category.delete,konsum.meter.add,konsum.meter.modify,konsum.meter.delete,konsum.note.add,konsum.note.modify,konsum.note.delete,konsum.value.add,konsum.value.delete";
  //TODO deside when user exists message return
  if (user) {
    response = {
      error: "User exists.",
    };
  } else {
    const hashedPassword = sha256(password).toString(cryptoJs.enc.Hex);

    const claims = {
      email,
      entitlements,
      exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // 2 hours
    };

    await KONSUM.put(
      `user:${email}`,
      JSON.stringify({ password:hashedPassword, name, entitlements })
    );

    const access_token = await jwt.sign(claims, TOKEN_KEY);

    //await KONSUM.put(`user_token:${token}`, username);

    response = {
      access_token,
      token_type: "bearer",
      //refresh_token: access_token,
    };
  }

  return new Response(JSON.stringify(response), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeader,
    },
  });
});

router.post("/authenticate", async (request) => {
  const { username, password } = await request.json();
  const hashedPassword = sha256(password).toString(cryptoJs.enc.Hex);
  const storedUser = JSON.parse(await KONSUM.get(`user:${username}`));
  if (!storedUser) {
    response = { error: " User does not exists" };
  } else {
    const storedPassword = storedUser.password;
    const entitlements = storedUser.entitlements;

    if (storedPassword === hashedPassword) {
      const claims = {
        name: username,
        //TODO get entitlements from database
        entitlements,
        exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // 2 hours
      };

      const access_token = await jwt.sign(claims, TOKEN_KEY);

      //const access_token = sign(header, username, secret);
      //await KONSUM.put(`user_token:${access_token}`, username);

      response = {
        access_token,
        token_type: "bearer",
        refresh_token: access_token,
      };
    } else {
      response = {
        error: "Invalid credientials.",
      };
    }
  }
  return new Response(JSON.stringify(response), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeader,
    },
  });
});

router.options("*", async (request) => {
  return new Response("OK", {
    headers: {
      ...corsHeader,
      "Content-Type": "application/json",
    },
  });
});

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all("*", () => new Response("404, not found!", { status: 404 }));

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener("fetch", (e) => {
  e.respondWith(router.handle(e.request));
});
