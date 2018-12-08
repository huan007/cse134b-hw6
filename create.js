var bareMinimum = {
    oldIndex: 0,
    index: 0,
    currentMemePath: null,
    currentFileName: null
}

function init() {
    document.getElementById("createButton").addEventListener("click", onclick_create);
    let fileButton = document.getElementById("uploadButton");

    //Add listener
    fileButton.addEventListener("change", e => {
        let topInput = document.getElementById("topTextInput");
        let bottomInput = document.getElementById("bottomTextInput");
        imageLoader(e.target.files[0], "memeCanvas", topInput.value, bottomInput.value);
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
            bareMinimum.oldIndex = bareMinimum.index;
            bareMinimum.index = snapshot.numChildren();
        });
        //Keep an eye on index. Change if database is updated
        dbRefUser.on("value", snapshot => {
            bareMinimum.oldIndex = bareMinimum.index;
            bareMinimum.index = snapshot.numChildren();
            console.log(`Updated Index to (${bareMinimum.index})`);
        });
		
		var el = window.document.getElementById('topTextInput');
		var el2 = window.document.getElementById('bottomText');
		if(el)
		{
			el.addEventListener('onchange', changeText(), true);	
		}
		if(el2)
		{
			el.addEventListener('pnchange', changeText(), true)
		}
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
    let progressElement = document.getElementById("progress");

    //Render image and upload it to fire storage
    let canvas = document.getElementById("memeCanvas");
    let imgData = canvas.toDataURL("image/jpeg", 0.7);
    //Render Icon
    let iconCanvas = document.createElement("canvas");
    iconCanvas.width = 100;
    iconCanvas.height = 100;
    let iconctx = iconCanvas.getContext('2d');
    iconctx.drawImage(canvas,0,0, canvas.width, canvas.height, 0, 0, iconCanvas.width, iconCanvas.height);
    let iconImgData = iconCanvas.toDataURL("image/jpeg", 0.8);

    //Get file and compress it to save bandwidth
    let file = document.getElementById("uploadButton").files[0];
    let originalCanvas;
    var fileReader = new FileReader();
    fileReader.onload = function(event) {
        img = new Image();
        img.onload = function(){
            originalCanvas = document.createElement("canvas");
            originalCanvas.width = img.width;
            originalCanvas.height = img.height;
            let originalCtx = originalCanvas.getContext('2d');
            originalCtx.drawImage(img,0,0);
            let fileName =`${bareMinimum.index}-${file.name}`;
            //Create Storage Ref
            let storageRef = firebase.storage().ref().child(firebase.auth().currentUser.uid);
            let memeFileRef = storageRef.child(fileName);
            //Upload the file
            let uploadTask = memeFileRef.putString(originalCanvas.toDataURL("image/jpeg", 0.7), "data_url");
            bareMinimum.currentMemePath = memeFileRef.fullPath;
            bareMinimum.currentFileName = fileName;
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
                    //Create Storage Ref
                    let iconFileRef = storageRef.child("icon_" + bareMinimum.currentFileName);
                    memeFileRef = storageRef.child("rendered_" + bareMinimum.currentFileName);
                    let iconImagePath = iconFileRef.fullPath;
                    let renderedImagePath = memeFileRef.fullPath;
                    console.log(`Rendered Path: ${renderedImagePath}`);
                    //Upload the file
                    let iconUploadTask = iconFileRef.putString(iconImgData, "data_url");
                    iconUploadTask.on("state_changed",
                        function onChange(snapshot) {

                        },
                        function onError(error) {
                            //TODO: Log Error or let user know that there was an error uploading
                            console.log("There was an error while uploading");
                        },
                        function onComplete() {
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
                                        bottomTextElement.value, bareMinimum.currentMemePath, renderedImagePath, iconImagePath);
                                }
                            );
                        }
                    );
                }
            );
        }
        img.src = fileReader.result;
    }
    fileReader.readAsDataURL(file);
}

function createMeme(memeName, topText, bottomText, srcImagePath, renderedImagePath, iconPath) {
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
        renderedImagePath: renderedImagePath,
        iconPath: iconPath
    });
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
    ctx.font = '30pt impact';
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


function changeText(){ 
	var rt = document.getElementById('topTextInput').value; 
	var rb = document.getElementById('bottomTextInput').value;
	let canvas = document.getElementById('memeCanvas');
	var input = document.getElementById('uploadButton');
	imageLoader(input.files[0], "memeCanvas", rt, rb);
	
}
