[![npm](https://img.shields.io/npm/v/@konsumation/cloudflare-worker.svg)](https://www.npmjs.com/package/@konsumation/cloudflare-worker)
[![bundlejs](https://deno.bundlejs.com/?q=@konsumation/cloudflare-worker\&badge=detailed)](https://bundlejs.com/?q=@konsumation/cloudflare-worker)
[![downloads](http://img.shields.io/npm/dm/@konsumation/cloudflare-worker.svg?style=flat-square)](https://npmjs.org/package/@konsumation/cloudflare-worker)
[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fkonsumation%2Fcloudflare-worker%2Fbadge\&style=flat)](https://actions-badge.atrox.dev/konsumation/cloudflare-worker/goto)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/konsumation/cloudflare-worker/badge.svg)](https://snyk.io/test/github/konsumation/cloudflare-worker)
## Router

This template demonstrates using the [`itty-router`](https://github.com/kwhitley/itty-router) package to add routing to your Cloudflare Workers.

[`index.js`](https://github.com/cloudflare/worker-template-router/blob/master/index.js) is the content of the Workers script.

#### Wrangler

You can use [wrangler](https://github.com/cloudflare/wrangler) to generate a new Cloudflare Workers project based on this template by running the following command from your terminal:

```
wrangler generate myapp https://github.com/cloudflare/worker-template-router
```

Before publishing your code you need to edit `wrangler.toml` file and add your Cloudflare `account_id` - more information about configuring and publishing your code can be found [in the documentation](https://developers.cloudflare.com/workers/learning/getting-started#7-configure-your-project-for-deployment).

Once you are ready, you can publish your code by running the following command:

```
wrangler publish
```

