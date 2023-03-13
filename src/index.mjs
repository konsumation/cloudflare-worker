import { Router } from "itty-router";
import sha256 from "crypto-js/sha256";
import cryptoJs from "crypto-js";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { sendMail } from "./utils.mjs";

const router = Router();
const TOKEN_KEY = "sasffaFAFA34";
router.get("/", () => {
  return new Response(
    "Hello, world! This is the root page of your Worker template."
  );
});

const corsHeader = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Origin": "*",
};

function returnResponse(response) {
  return new Response(JSON.stringify(response), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeader,
    },
  });
}
function authMiddleware(request, response) {
  // Überprüfen Sie, ob der Authorization-Header vorhanden ist
  //console.log("middl");
  //console.log(request.headers.get("authorization"));

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  // Holen Sie den JWT-Token aus dem Authorization-Header
  const token = authHeader.split(" ")[1];

  // Überprüfen ob der Token gültig ist
  try {
    if (jwt.verify(token, TOKEN_KEY)) {
      const { payload } = jwt.decode(token);
      //console.log(payload);
      request.state = { user: payload };
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return response.status(401).json({ message: "Invalid token" });
  }
}

function enshureEntitlement(request, entitlement) {
  const user = request.state.user;

  if (user) {
    if (user.entitlements.indexOf(entitlement) >= 0) {
      return true;
    }
  }

  return false; //new Error(`missing ${entitlement}`);
}

router.get("/state", () => {
  return new Response(JSON.stringify({ version: "1.1.1" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

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

  return returnResponse(fields);
});

router.post("/register", async (request) => {
  const { email, name, password } = await request.json();
  //console.log(email, name, password);
  const user = await KONSUM.get(`user:${email}`);
  const entitlements = "confirmRegistration";
  //TODO deside when user exists message return
  if (user) {
    console.log("user exists");
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

    const access_token = await jwt.sign(claims, TOKEN_KEY);

    await KONSUM.put(
      `user:${email}`,
      JSON.stringify({
        password: hashedPassword,
        name,
        entitlements,
        access_token,
      })
    );

    const mailContent = `<p>Please confirm your email by clicking on the following link.</p>
<a href=https://konsum-cloudflare-worker.konsumation.workers.dev/confirmRegistration/${access_token}> Click here</a>`;

    const mailResponse = await fetch(
      sendMail(email, "konsum registration", mailContent, name)
    );

    if (!mailResponse.ok) {
      console.log("got error by sending mail");
      console.log(JSON.stringify(mailResponse, undefined, 2));
    }

    response = {
      access_token,
      token_type: "bearer",
      //refresh_token: access_token,
    };
  }
  return returnResponse(response);
});

router.post("/confirmRegistration/:token", async (request) => {
  const token = request.params.token;
  if (jwt.verify(token, TOKEN_KEY)) {
    const { payload } = jwt.decode(token);
    const dbkey = `user:${payload.name}`;
    const storedUser = JSON.parse(await KONSUM.get(dbkey));
    if (storedUser) {
      const entitlements =
        "konsum,konsum.category.add,konsum.category.modify,konsum.category.delete,konsum.meter.add,konsum.meter.modify,konsum.meter.delete,konsum.note.add,konsum.note.modify,konsum.note.delete,konsum.value.add,konsum.value.delete";
      delete storedUser.access_token;
      storedUser.entitlement = entitlements;
      await KONSUM.put(dbkey, JSON.stringify(storedUser));
    } else {
      //todo if user not found
    }
  } else {
    //TODO "token has expired, please send new confirm email"
  }
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
        entitlements,
        exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // 2 hours
      };

      const access_token = await jwt.sign(claims, TOKEN_KEY);

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

  return returnResponse(response);
});

router.get("/category", () => {
  //TODO Fullfill categories list
  response = [];
  return returnResponse(response);
});

router.put("/category/:category", authMiddleware, async (request) => {
  if (enshureEntitlement(request, "konsum.category.add")) {
    //TODO fullfill add category
    const category = new Category(
      request.params.category,
      master,
      request.body
    );
    await category.write(master.db);
    response = { message: "updated" };
  } else {
    response = { message: "missing entitlemenet: konsum.category.add" };
  }

  return returnResponse(response);
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
