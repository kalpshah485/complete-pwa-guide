var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(function () {
      console.log("Service worker registered");
    })
    .catch(function (err) {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(function (swreg) {
      var options = {
        body: "You successfully subscribed to our Notification service!",
        icon: "/src/images/icons/app-icon-96x96.png",
        image: "/src/images/sf-boat.jpg",
        dir: "ltr",
        lang: "en-US",
        vibrate: [100, 50, 200],
        badge: "/src/images/icons/app-icon-96x96.png",
        tag: "confirm-notification",
        renotify: true,
        actions: [
          {
            action: "confirm",
            title: "Okay",
            icon: "/src/images/icons/app-icon-96x96.png",
          },
          {
            action: "cancel",
            title: "Cancel",
            icon: "/src/images/icons/app-icon-96x96.png",
          },
        ],
      };
      swreg.showNotification("Successfully Subscribed (From SW)", options);
    });
  }
}

function configurePushSub() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  var reg;
  navigator.serviceWorker.ready
    .then(function (swreg) {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(function (sub) {
      if (sub === null) {
        // Create a new subscription
        var vapidPublicKey =
          "BN_S2a37jOL9bsw8cvVcq44qxDU_04yhB0K5mwdcUExzk-0dQgoGJTiZQXwrTtzuu41HSLkL4A3HEwQI5j6wikw";
        var convertedVapidPublicKey = urlBase64Uint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      } else {
        // We have a subscription
      }
    })
    .then(function (newSub) {
      return fetch(
        "https://pwa-gram-dcb68-default-rtdb.firebaseio.com/subscriptions.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newSub),
        }
      );
    })
    .then(function (res) {
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

function askForNotificationPermission() {
  Notification.requestPermission(function (result) {
    console.log("User Choice", result);
    if (result !== "granted") {
      console.log("No notification permission granted!");
    } else {
      configurePushSub();
      // displayConfirmNotification();
    }
  });
}

if ("Notification" in window && "serviceWorker" in navigator) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermission
    );
  }
}
