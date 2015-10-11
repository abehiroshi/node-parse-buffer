"use strict"

require("babel/register")({
  only: /src\/|test\//,
  plugins: ["espower"],
  extensions: [".js"]
})
