var bareMinimum = {
    oldIndex: 0,
    index: 0,
    currentMemePath: null,
    currentFileName: null,
    selectedIndex: 0
}

function init() {
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

function saveI(i, memeName) {
    return function(url) {
        let imageString = `<img class="memeIcons" src="${url}" width="100px" height="auto" onclick="onImageClick(${i})">`;
        let memeDivElement = document.querySelector(`#memeDisplayDiv #meme-${i}`);
        memeDivElement.insertAdjacentHTML("beforeend", imageString);
    };
}

function onImageClick(i) {
    bareMinimum.selectedIndex = i;
    let uid = firebase.auth().currentUser.uid;
    //Go to that specific location of the image to grab the info
    let imageDBRef = firebase.database().ref().child(uid).child(i);

    //Read once to get the data
    imageDBRef.once('value').then(function (snapshot) {
        //Now we should have the info of the image
        let memeName = snapshot.child("memeName").val();
        let topText = snapshot.child("topText").val();
        let bottomText = snapshot.child("bottomText").val();
        //This is the source path to the original image without texts
        let srcPath = snapshot.child("srcImagePath").val();
        //This is the path to the rendered image with texts
        let renderedPath = snapshot.child("renderedImagePath").val();

        //This is how you get the image. Replace srcPath with renderedPath if you want
        //the rendered image
        let srcImageRef = firebase.storage().ref(renderedPath);
		console.log(renderedPath);
        srcImageRef.getDownloadURL().then( url => {
            //Put your stuffs in here. Remember this is ASYNC
			var img = document.getElementById('imgdisplay');
			if(img.firstChild)
			{
				img.innerHTML = '';
				let imgstring = `<img src="${url}">`;
				img.insertAdjacentHTML("beforeend", imgstring);
			}
			else{
				let imgstring = `<img src="${url}">`;
				img.insertAdjacentHTML("beforeend", imgstring);
			}
			let downloadLink = document.getElementById("downloadLink");
			downloadLink.href = url;
			downloadLink.download = "meme.jpeg";
        });
    });
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
        let iconPath = childSnapshot.child("iconPath").val();

        //Display it to the div
        let htmlString = `<div id="meme-${count}"></div>`;
        firebase.storage().ref(iconPath).getDownloadURL().then(saveI(count, memeName));

        displayDiv.insertAdjacentHTML("beforeend", htmlString);
        count++;
    });

}

function onClick_edit () {
    window.location.href = `edit.html?index=${bareMinimum.selectedIndex}`;
}
