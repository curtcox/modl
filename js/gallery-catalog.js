// Generated from the original app-owned documentation links.
export const catalog=[
  {
    "id": "diagram-1",
    "title": "Login flow",
    "tags": [
      "examples"
    ],
    "description": "A login flowchart",
    "document": {
      "src": "# A login flowchart\nstart small circle teal Start\nform  square blue Enter credentials\ncheck diamond orange Valid?\nhome  square teal Home page\nerror square red Show error\nstop  small circle gray End\n\nstart -> form -> check\ncheck -> home teal yes\ncheck -> error red no\nerror -> form dashed red retry\nhome -> stop\n",
      "pos": {
        "start": [
          360,
          45
        ],
        "form": [
          360,
          140
        ],
        "check": [
          360,
          255
        ],
        "home": [
          180,
          370
        ],
        "error": [
          560,
          370
        ],
        "stop": [
          180,
          470
        ]
      }
    }
  },
  {
    "id": "diagram-2",
    "title": "Order lifecycle",
    "tags": [
      "examples"
    ],
    "description": "Order lifecycle",
    "document": {
      "src": "# Order lifecycle\nnew       hex blue New\npaid      hex teal Paid\nshipped   hex purple Shipped\ndelivered hex pink Delivered\ncancelled hex red Cancelled\nrefunded  hex orange Refunded\n\nnew -> paid pay\npaid -> shipped ship\nshipped -> delivered deliver\nnew -> cancelled dashed red cancel\npaid -> refunded dashed orange refund\ndelivered -> refunded dotted orange return\n",
      "pos": {
        "new": [
          100,
          120
        ],
        "paid": [
          330,
          120
        ],
        "shipped": [
          560,
          120
        ],
        "delivered": [
          560,
          340
        ],
        "cancelled": [
          100,
          340
        ],
        "refunded": [
          330,
          340
        ]
      }
    }
  },
  {
    "id": "diagram-3",
    "title": "Company structure",
    "tags": [
      "examples"
    ],
    "description": "ceo  big square purple CEO",
    "document": {
      "src": "ceo  big square purple CEO\ncto  square blue CTO\ncfo  square teal CFO\ncoo  square pink COO\ndev  small square blue Engineering\nops  small square blue IT\nacct small square teal Accounting\nhr   small square pink People\n\nceo -> cto\nceo -> cfo\nceo -> coo\ncto -> dev\ncto -> ops\ncfo -> acct\ncoo -> hr\n",
      "pos": {
        "ceo": [
          360,
          80
        ],
        "cto": [
          150,
          250
        ],
        "cfo": [
          360,
          250
        ],
        "coo": [
          570,
          250
        ],
        "dev": [
          80,
          410
        ],
        "ops": [
          220,
          410
        ],
        "acct": [
          360,
          410
        ],
        "hr": [
          570,
          410
        ]
      }
    }
  },
  {
    "id": "diagram-4",
    "title": "Web and mobile clients",
    "tags": [
      "examples"
    ],
    "description": "image nodes: id [size] [shape] [color] url text",
    "document": {
      "src": "# image nodes: id [size] [shape] [color] url text\nuser  /curtcox.github.io/modl/docs/img/user.svg Visitor\nphone /curtcox.github.io/modl/docs/img/phone.svg Mobile app\ncdn   /curtcox.github.io/modl/docs/img/cloud.svg CDN\nweb   /curtcox.github.io/modl/docs/img/server.svg Web server\napi   /curtcox.github.io/modl/docs/img/server.svg API\ndb    /curtcox.github.io/modl/docs/img/database.svg Postgres\n\nuser -> cdn -> web\nphone -> api blue REST\nweb -> api\napi -> db bold orange SQL\n",
      "pos": {
        "user": [
          70,
          120
        ],
        "phone": [
          70,
          340
        ],
        "cdn": [
          240,
          120
        ],
        "web": [
          420,
          120
        ],
        "api": [
          420,
          340
        ],
        "db": [
          600,
          340
        ]
      }
    }
  },
  {
    "id": "diagram-5",
    "title": "Load-balanced web tier",
    "tags": [
      "examples"
    ],
    "description": "black",
    "document": {
      "src": "black\ninternet circle blue /en.wikipedia.org/wiki/Internet Internet\nfw       diamond red Firewall\nlb       hex orange Load balancer\nweb1     square teal web-1\nweb2     square teal web-2\nweb3     square teal web-3\ndb       square purple DB primary\nreplica  small square purple replica\n\ninternet -> fw -> lb bold\nlb -> web1\nlb -> web2\nlb -> web3\nweb1 -> db dotted\nweb2 -> db dotted\nweb3 -> db dotted\ndb -> replica dashed purple sync\n",
      "pos": {
        "internet": [
          360,
          60
        ],
        "fw": [
          360,
          170
        ],
        "lb": [
          360,
          270
        ],
        "web1": [
          170,
          390
        ],
        "web2": [
          360,
          390
        ],
        "web3": [
          550,
          390
        ],
        "db": [
          360,
          500
        ],
        "replica": [
          600,
          500
        ]
      }
    }
  },
  {
    "id": "diagram-6",
    "title": "ETL",
    "tags": [
      "examples"
    ],
    "description": "ETL pipeline",
    "document": {
      "src": "# ETL pipeline\ncsv    square blue /en.wikipedia.org/wiki/Comma-separated_values CSV files\nrest   square blue REST API\ningest hex teal Ingest\nclean  hex teal Clean\nstore  big square purple Warehouse\ndash   square orange Dashboard\nml     square pink ML model\n\ncsv -> ingest\nrest -> ingest\ningest -> clean -> store bold\nstore -> dash dashed nightly\nstore -> ml dashed weekly\n",
      "pos": {
        "csv": [
          80,
          130
        ],
        "rest": [
          80,
          330
        ],
        "ingest": [
          250,
          230
        ],
        "clean": [
          410,
          230
        ],
        "store": [
          600,
          230
        ],
        "dash": [
          520,
          430
        ],
        "ml": [
          700,
          430
        ]
      }
    }
  },
  {
    "id": "diagram-7",
    "title": "Feature branch merged back",
    "tags": [
      "examples"
    ],
    "description": "main    none gray main",
    "document": {
      "src": "main    none gray main\nfeature none teal feature\nc1 small circle gray\nc2 small circle gray\nc3 small circle gray\nf1 small circle teal\nf2 small circle teal\nm  small circle purple merge\n\nc1 -> c2 -> c3 -> m\nc2 -> f1 -> f2 teal\nf2 -> m dashed teal\n",
      "pos": {
        "main": [
          50,
          150
        ],
        "c1": [
          150,
          150
        ],
        "c2": [
          260,
          150
        ],
        "c3": [
          370,
          150
        ],
        "m": [
          590,
          150
        ],
        "feature": [
          50,
          280
        ],
        "f1": [
          370,
          280
        ],
        "f2": [
          480,
          280
        ]
      }
    }
  },
  {
    "id": "diagram-8",
    "title": "Computer science track",
    "tags": [
      "examples"
    ],
    "description": "cs101 square blue Intro to CS",
    "document": {
      "src": "cs101 square blue Intro to CS\nmath1 square teal Discrete math\ncs102 square blue Data structures\ncs201 square purple Algorithms\ncs202 square purple Systems\ncs301 square pink Compilers\ncs302 square pink Machine learning\n\ncs101 -> cs102 -> cs201 -> cs301\nmath1 -> cs201\ncs102 -> cs202 -> cs301\ncs201 -> cs302\nmath1 -> cs302 dashed recommended\n",
      "pos": {
        "cs101": [
          90,
          200
        ],
        "math1": [
          90,
          400
        ],
        "cs102": [
          270,
          120
        ],
        "cs202": [
          470,
          50
        ],
        "cs201": [
          470,
          240
        ],
        "cs301": [
          660,
          140
        ],
        "cs302": [
          660,
          400
        ]
      }
    }
  },
  {
    "id": "diagram-9",
    "title": "Bookmarks",
    "tags": [
      "examples"
    ],
    "description": "me     big circle purple Start here",
    "document": {
      "src": "me     big circle purple Start here\nsearch square blue   /duckduckgo.com Search\nwiki   square teal   /en.wikipedia.org Wikipedia\ncode   square gray   /github.com GitHub\nnews   square orange /news.ycombinator.com Hacker News\nmail   square pink   mailto:someone@example.com Email\ndocs   square purple /curtcox.github.io/modl/docs/ modl docs\n\nme -> search dotted\nme -> wiki dotted\nme -> code dotted\nme -> news dotted\nme -> mail dotted\nme -> docs dotted\n",
      "pos": {
        "me": [
          360,
          250
        ],
        "search": [
          360,
          70
        ],
        "wiki": [
          580,
          170
        ],
        "code": [
          580,
          350
        ],
        "news": [
          360,
          440
        ],
        "mail": [
          140,
          350
        ],
        "docs": [
          140,
          170
        ]
      }
    }
  },
  {
    "id": "diagram-10",
    "title": "Inner planets and Jupiter",
    "tags": [
      "examples"
    ],
    "description": "black",
    "document": {
      "src": "black\nsun     bigger circle orange /en.wikipedia.org/wiki/Sun Sun\nmercury tiny circle gray /en.wikipedia.org/wiki/Mercury_(planet)\nvenus   small circle orange /en.wikipedia.org/wiki/Venus\nearth   small circle blue /en.wikipedia.org/wiki/Earth\nmoon    tiny circle gray /en.wikipedia.org/wiki/Moon\nmars    small circle red /en.wikipedia.org/wiki/Mars\njupiter big circle brown /en.wikipedia.org/wiki/Jupiter Jupiter\n\nearth -> moon dotted gray\n",
      "pos": {
        "sun": [
          150,
          260
        ],
        "mercury": [
          310,
          260
        ],
        "venus": [
          380,
          260
        ],
        "earth": [
          460,
          260
        ],
        "moon": [
          460,
          340
        ],
        "mars": [
          540,
          260
        ],
        "jupiter": [
          670,
          260
        ]
      }
    }
  },
  {
    "id": "diagram-11",
    "title": "modl at a glance",
    "tags": [
      "examples"
    ],
    "description": "modl    big circle purple modl",
    "document": {
      "src": "modl    big circle purple modl\nsyntax  circle blue   /curtcox.github.io/modl/docs/structure.html Syntax\nnodes   small circle blue   /curtcox.github.io/modl/docs/nodes.html nodes\nedges   small circle blue   /curtcox.github.io/modl/docs/edges.html edges\nattrs   small circle blue   /curtcox.github.io/modl/docs/attributes.html attributes\nshare   circle orange /curtcox.github.io/modl/docs/sharing.html Sharing\nurl     small circle orange /curtcox.github.io/modl/docs/sharing.html#url URL\nhashbin small circle orange /curtcox.github.io/modl/docs/sharing.html#hashbin HashBin\nlook    circle teal   /curtcox.github.io/modl/docs/styles.html Looks\nstyles  small circle teal   /curtcox.github.io/modl/docs/styles.html styles\nimages  small circle teal   /curtcox.github.io/modl/docs/links.html#images images\n\nmodl -> syntax blue\nmodl -> share orange\nmodl -> look teal\nsyntax -> nodes blue\nsyntax -> edges blue\nsyntax -> attrs blue\nshare -> url orange\nshare -> hashbin orange\nlook -> styles teal\nlook -> images teal\n",
      "pos": {
        "modl": [
          360,
          290
        ],
        "syntax": [
          170,
          160
        ],
        "nodes": [
          60,
          70
        ],
        "edges": [
          200,
          50
        ],
        "attrs": [
          40,
          220
        ],
        "share": [
          560,
          160
        ],
        "url": [
          680,
          70
        ],
        "hashbin": [
          500,
          50
        ],
        "look": [
          360,
          470
        ],
        "styles": [
          180,
          500
        ],
        "images": [
          540,
          500
        ]
      }
    }
  },
  {
    "id": "diagram-12",
    "title": "Starter",
    "tags": [
      "examples"
    ],
    "description": "Diagram Editor — edit this text, then copy the URL",
    "document": {
      "src": "# Diagram Editor — edit this text, then copy the URL\n\n# nodes (id  [size] [shape] [color] [url] [text...])\nn square red /google.com Node N\nm circle blue /wikipedia.org Node M\nt triangle green /example.com Triangle\n\n# edges (a -> b (-> c...)  [size] [lineStyle] [color] [url] [text...])\nn -> m solid purple /news.ycombinator.com N to M\nm -> t small dotted teal /slashdot.org Dotted link\nt -> n dashed orange /github.com Back edge\n\n# you can define nodes implicitly by referencing them in edges:\na -> b -> c bold yellow /example.com Chain applies to each edge\n",
      "pos": {}
    }
  }
];
