import { Router } from "itty-router";
import sha256 from "crypto-js/sha256";
import  cryptoJs from  "crypto-js";
import jsonwebtoken from "jsonwebtoken";

const router = Router();
//const TOKEN_KEY = "sasffaFAFA34";
router.get("/", () => {
  return new Response(
    "Hello, world! This is the root page of your Worker template."
  );
});

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
router.post("/postxxx", async (request) => {
  let fields = {
    asn: request.cf.asn,
    colo: request.cf.colo,
  };
  if (request.headers.get("Content-Type") === "application/json") {
    fields["json"] = await request.json();
  }
  const returnData = JSON.stringify(fields, null, 2);
  return new Response(returnData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
});

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
  const url = new URL(request.url);
  const { pathname } = url;
  let response = { pathname };
  const { username, password } = await request.json();

  const user = await KONSUM.get(`user:${username}`);
  if (user) {
    response = {
      error: "User exists.",
    };
  } else {
    const hashedPassword = sha256(password).toString(cryptoJs.enc.Hex);
    await KONSUM.put(`user:${username}`, hashedPassword);

    const token = jsonwebtoken.sign({ username }, TOKEN_KEY, {
      expiresIn: "2h",
    });

    await KONSUM.put(`user_token:${token}`, username);

    response = {
      token,
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
  const { username, password } = await request.json()
  const hashedPassword = sha256(password).toString(cryptoJs.enc.Hex)
  const storedPassword = await KONSUM.get(`user:${username}`)
  if (storedPassword === hashedPassword) {
    const token = jsonwebtoken.sign({ username }, TOKEN_KEY, {
      expiresIn: '2h',
    })

    await KONSUM.put(`user_token:${token}`, username)

    response = {
      token,
    }
  } else {
    response = {
      error: 'Invalid credientials.',
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
