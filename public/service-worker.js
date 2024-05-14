importScripts("workbox-sw.prod.v2.1.3.js");
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "google-fonts",
    cacheExpiration: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  })
);

workboxSW.router.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "material-css",
  })
);

workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: "post-images",
  })
);

workboxSW.router.registerRoute(
  "https://pwa-gram-dcb68-default-rtdb.firebaseio.com/posts.json",
  function (args) {
    console.log(args);
    return fetch(args.event.request).then(function (res) {
      var clonedResponse = res.clone();
      clearAllData("posts")
        .then(function () {
          return clonedResponse.json();
        })
        .then(function (data) {
          for (const key in data) {
            writeData("posts", data[key]);
          }
        });
      return res;
    });
  }
);

workboxSW.router.registerRoute(
  function (routeData) {
    console.log(routeData.event, "accept html or not");
    return routeData.event.request.headers.get("accept").includes("text/html");
  },
  function (args) {
    console.log(args);
    return caches.match(args.event.request).then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(args.event.request)
          .then(function (res) {
            return caches.open("dynamic").then(function (cache) {
              // trimCache(CACHE_DYNAMIC_NAME, 10);
              cache.put(args.event.request.url, res.clone());
              return res;
            });
          })
          .catch(function (err) {
            return caches.match("/offline.html").then(function (res) {
              return res;
            });
          });
      }
    });
  }
);

workboxSW.precache([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "d15f69e0526655214592ebd50f3c48ad"
  },
  {
    "url": "manifest.json",
    "revision": "d11c7965f5cfba711c8e74afa6c703d7"
  },
  {
    "url": "offline.html",
    "revision": "2fc7d7f6804f95bbe0b7653ae1644b6c"
  },
  {
    "url": "src/css/app.css",
    "revision": "59d917c544c1928dd9a9e1099b0abd71"
  },
  {
    "url": "src/css/feed.css",
    "revision": "82acfd694cfe44eb2b2ba97867888c78"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "3016893a8d18342948d969e8ab2ef269"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "72c38cf2bc03aa2d27e5566fbe866905"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "1591dd473d28207180abd491a2cfce90"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "2f39a65376f814a4b4c24e8828989981"
  }
]);

self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing new posts");
    event.waitUntil(
      readAllData("sync-posts").then(function (data) {
        for (var dt of data) {
          // var postData = new FormData();
          // postData.append("id", dt.id);
          // postData.append("title", dt.title);
          // postData.append("location", dt.location);
          // postData.append("file", dt.picture, dt.id + ".png");
          fetch(
            "https://pwa-gram-dcb68-default-rtdb.firebaseio.com/posts.json",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                rawLocation: dt.rawLocation,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/pwa-gram-dcb68.appspot.com/o/sf-boat.jpg?alt=media&token=0b8f143e-795d-4793-9a7a-22f48adf5908",
              }),
            }
          )
            .then(function (res) {
              // webpush.setVapidDetails(
              //   "mailto:kalpshah485@gmail.com",
              //   "BN_S2a37jOL9bsw8cvVcq44qxDU_04yhB0K5mwdcUExzk-0dQgoGJTiZQXwrTtzuu41HSLkL4A3HEwQI5j6wikw",
              //   "sJPjnIaAfOICQU7-5BDCTcDkTANq8ttS9D5JGPM4VCg"
              // );
              fetch(
                "https://pwa-gram-dcb68-default-rtdb.firebaseio.com/posts.json"
              )
                .then(function (getRes) {
                  return getRes.json();
                })
                .then(function (data) {
                  console.log(data);
                });
              console.log("Sent Data", res);
              if (res.ok) {
                deleteItemFromData("sync-posts", dt.id);
              }
            })
            .catch(function (err) {
              console.log("Error while sending data", err);
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  var notification = event.notification;
  var action = event.action;
  console.log(notification);

  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
  }
});
