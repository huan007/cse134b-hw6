var bareMinimum = {
    index: 0,
    currentMemePath: null,
    currentFileName: null
}

function init() {
    document.getElementById("createButton").addEventListener("click", onclick_create);
    let progressElement = document.getElementById("progress");
    let fileButton = document.getElementById("uploadButton");
    let userNameInput = document.getElementById("userNameInput");

    //Add listener
    fileButton.addEventListener("change", e => {
        //Get file
        let file = e.target.files[0];
        //Create Storage Ref
        let storageRef = firebase.storage().ref().child(firebase.auth().currentUser.uid);
        let memeFileRef = storageRef.child(file.name);
        //Upload the file
        let uploadTask = memeFileRef.put(file);
        bareMinimum.currentMemePath = memeFileRef.fullPath;
        bareMinimum.currentFileName = file.name;
        uploadTask.on("state_changed",
            function onChange(snapshot) {
                let bytesTransferred = snapshot.bytesTransferred;
                let totalBytes = snapshot.totalBytes;
                progressElement.value = Math.round((bytesTransferred / totalBytes) * 100);
            },
            function onError(error) {
                //TODO: Log Error or let user know that there was an error uploading
                console.log("There was an error while uploading");
                bareMinimum.currentMemePath = null;
                bareMinimum.currentFileName = null;
            },
            function onComplete() {
                //TODO: Tell user that we finished uploading. Perhaps change picture
                let topInput = document.getElementById("topTextInput");
                let bottomInput = document.getElementById("bottomTextInput");
                imageLoader(e.target.files[0], "memeCanvas", topInput.value, bottomInput.value);
            }
        );
    });

    //Add event listener to watch when the user is logged in
    firebase.auth().onAuthStateChanged(onAuthenticationChanged);
}

function onAuthenticationChanged(user) {
    //If the user is logged in
    if (user) {
        let dbRefRoot = firebase.database().ref();
        let dbRefUser = dbRefRoot.child(user.uid);
        //First get the index value
        dbRefUser.once('value').then(function (snapshot) {
            bareMinimum.index = snapshot.numChildren();
        });
        //Keep an eye on index. Change if database is updated
        dbRefUser.on("value", snapshot => {
            bareMinimum.index = snapshot.numChildren();
            console.log(`Updated Index to (${bareMinimum.index})`);
            console.log("Updating Div...");
            displayMemes(snapshot);
            console.log("Done updating.");
        });
    }

    //If the user logged out
    else {
        console.log("User logged out");
    }

}

function onclick_create() {
    //Get inputs
    let memeNameElement = document.getElementById("memeNameInput");
    let topTextElement = document.getElementById("topTextInput");
    let bottomTextElement = document.getElementById("bottomTextInput");

    //Render image and upload it to fire storage
    let canvas = document.getElementById("memeCanvas");
    let imgData = canvas.toDataURL();
    console.log(`Data: ${imgData}`);
    //Create Storage Ref
    let storageRef = firebase.storage().ref().child(firebase.auth().currentUser.uid);
    let memeFileRef = storageRef.child("rendered_" + bareMinimum.currentFileName);
    let renderedImagePath = memeFileRef.fullPath;
    console.log(`Rendered Path: ${renderedImagePath}`);
    //Upload the file
    let renderedUploadTask = memeFileRef.putString(imgData, "data_url");
    renderedUploadTask.on("state_changed",
        function onChange(snapshot) {

        },
        function onError(error) {
            //TODO: Log Error or let user know that there was an error uploading
            console.log("There was an error while uploading");
        },
        function onComplete() {
            //TODO: Tell user that we finished uploading. Perhaps change picture
            createMeme(memeNameElement.value, topTextElement.value,
                bottomTextElement.value, bareMinimum.currentMemePath, renderedImagePath);
        }
    );
}

function createMeme(memeName, topText, bottomText, srcImagePath, renderedImagePath) {
    //Check if the user is logged in. If not then don't create a meme
    if (!firebase.auth().currentUser) {
        console.log("You are not logged in");
        return;
    }

    if (!(memeName && topText && bottomText && srcImagePath && renderedImagePath)) {
        console.log("One or more parameters are empty");
        return;
    }

    let dbRefRoot = firebase.database().ref();
    let dbRefUser = dbRefRoot.child(firebase.auth().currentUser.uid);
    let memeRef = dbRefUser.child(bareMinimum.index);

    memeRef.set({
        memeName: memeName,
        topText: topText,
        bottomText: bottomText,
        srcImagePath: srcImagePath,
        renderedImagePath: renderedImagePath
    });
}

function saveI(i) {
    return function(url) {
        let imageString = `<img src="${url}" width="400px" height="auto">`;
        let memeDivElement = document.querySelector(`#memeDisplayDiv #meme-${i}`);
        memeDivElement.insertAdjacentHTML("beforeend", imageString);
    };
}

function imageLoader(fileURL, canvasID, topText, bottomText) {

    if (!(fileURL && canvasID && topText && bottomText)) {
        console.log("One or more parameters are empty");
        return;
    }

    let canvas = document.getElementById(`${canvasID}`);
    ctx = canvas.getContext('2d');
    var fileReader = new FileReader();
    fileReader.onload = function(event) {
        img = new Image();
        img.onload = function(){
            ctx.drawImage(img,0,0, img.width, img.height, 0, 0, canvas.width, canvas.height);
            drawMeme(canvasID, topText, bottomText);
        }
        img.src = fileReader.result;
    }
    fileReader.readAsDataURL(fileURL);
}

function drawMeme(canvasID, topText, bottomText) {
    let canvas = document.getElementById(`${canvasID}`);
    ctx = canvas.getContext('2d');
    ctx.lineWidth  = 5;
    ctx.font = '30pt sans-serif';
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    // Draw the text
    //Draw top text
    x = canvas.width/2;
    y = canvas.height/9;
    ctx.strokeText(topText, x, y);
    ctx.fillText(topText, x, y);
    //Draw bottom text
    x = canvas.width/2;
    y = canvas.height - canvas.height/12;
    ctx.strokeText(bottomText, x, y);
    ctx.fillText(bottomText, x, y);
}

function displayMemes(snapshot) {
    let displayDiv = document.getElementById("memeDisplayDiv");
    displayDiv.innerHTML = "";

    //Loop through the snapshot and display the meme
    let count = 0;
    snapshot.forEach(function(childSnapshot) {
        //There will be no data but there will be child data with key/val
        //Fetch data of this meme
        console.log(`Child #${count}`);
        let memeName = childSnapshot.child("memeName").val();
        let topText = childSnapshot.child("topText").val();
        let bottomText = childSnapshot.child("bottomText").val();
        let srcImagePath = childSnapshot.child("srcImagePath").val();
        let renderedImagePath = childSnapshot.child("renderedImagePath").val();

        //Display it to the div
        let htmlString = `<div id="meme-${count}"></div>`;
        firebase.storage().ref(renderedImagePath).getDownloadURL().then(saveI(count));

        displayDiv.insertAdjacentHTML("beforeend", htmlString);
        count++;
    });

}