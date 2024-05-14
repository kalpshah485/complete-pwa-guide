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

workboxSW.precache([]);

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
