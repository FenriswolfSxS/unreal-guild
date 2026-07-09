V3 catch-all API deploy fix

This package replaces many small Pages Functions with one catch-all API function:
functions/api/[[path]].js

Why:
Cloudflare was compiling the Worker but failing during Function publishing with a generic internal error. This narrows the Functions surface area and keeps member auth routes live.

Test after deploy:
/api/health
/api/options
/api/classes
/api/ranks

Then register Fenriswolf as Leader using the rank verification password.
