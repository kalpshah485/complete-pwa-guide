var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");
var videoPlayer = document.querySelector("#player");
var canvasElement = document.querySelector("#canvas");
var captureBtn = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");
var picture;
var locationBtn = document.querySelector("#location-btn");
var locationLoader = document.querySelector("#location-loader");
var fetchedLocation = {
  lat: 0,
  lng: 0,
};

locationBtn.addEventListener("click", function (event) {
  if (!("geolocation" in navigator)) {
    return;
  }
  var sawAlert = false;

  locationBtn.style.display = "none";
  locationLoader.style.display = "block";

  navigator.geolocation.getCurrentPosition(
    function (position) {
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      fetchedLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      locationInput.value = "In Munich";
      locationInput.classList.add("is-focused");
    },
    function (err) {
      console.log(err);
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      if (!sawAlert) {
        alert("Couldn't fetch location, please enter manually");
        sawAlert = true;
      }
      fetchedLocation = {
        lat: 0,
        lng: 0,
      };
    },
    {
      timeout: 7000,
    }
  );
});

function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
}

function initializeMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.moxGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error("getUserMedia is not implemented!"));
      }
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = "block";
    })
    .catch(function (err) {
      console.log(err);
      imagePickerArea.style.display = "block";
    });
}

captureBtn.addEventListener("click", function (event) {
  canvasElement.style.display = "block";
  videoPlayer.style.display = "none";
  captureBtn.style.display = "none";
  var context = canvasElement.getContext("2d");
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvas.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );
  videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});

function openCreatePostModal() {
  setTimeout(() => {
    createPostArea.style.transform = "translateY(0)";
  }, 1);
  initializeMedia();
  initializeLocation();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);
      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
      deferredPrompt = null;
    });
  }
}

function closeCreatePostModal() {
  // createPostArea.style.display = "none";
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  canvasElement.style.display = "none";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
  }
  setTimeout(function () {
    createPostArea.style.transform = "translateY(100vh)";
  });
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// not in use
function onSaveButtonClicked(event) {
  console.log("clicked.");
  if ("caches" in window) {
    caches.open("user-requested").then(function (cache) {
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg");
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = "url(" + data.image + ")";
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  // var cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "Save";
  // cardSaveButton.addEventListener("click", onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var url = "https://pwa-gram-dcb68-default-rtdb.firebaseio.com/posts.json";
var networkDataReceived = false;

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    console.log("From web:", data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ("indexedDB" in window) {
  readAllData("posts").then(function (data) {
    if (!networkDataReceived) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
}

function sendData() {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image:
        "https://firebasestorage.googleapis.com/v0/b/pwa-gram-dcb68.appspot.com/o/sf-boat.jpg?alt=media&token=0b8f143e-795d-4793-9a7a-22f48adf5908",
      rawLocation: {
        lat: fetchedLocation.lat,
        lng: fetchedLocation.lng,
      },
    }),
  }).then(function (res) {
    // webpush.setVapidDetails(
    //   "mailto:kalpshah485@gmail.com",
    //   "BN_S2a37jOL9bsw8cvVcq44qxDU_04yhB0K5mwdcUExzk-0dQgoGJTiZQXwrTtzuu41HSLkL4A3HEwQI5j6wikw",
    //   "sJPjnIaAfOICQU7-5BDCTcDkTANq8ttS9D5JGPM4VCg"
    // );
    fetch(url)
      .then(function (getRes) {
        return getRes.json();
      })
      .then(function (data) {
        console.log(data);
      });
    console.log("Sent Data", res);
    updateUI();
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("please enter valid data!");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    console.log(titleInput.value, locationInput.value);
    navigator.serviceWorker.ready.then(function (sw) {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
      };
      writeData("sync-posts", post)
        .then(function () {
          return sw.sync.register("sync-new-posts");
        })
        .then(function () {
          var snackbarContainer = document.querySelector("#confirmation-toast");
          var data = {
            message: "Your Post has saved for syncing!",
          };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
