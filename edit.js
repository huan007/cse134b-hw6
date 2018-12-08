function init() {
   //Parse url
    let urlString = window.location.href;
    urlParams = parseURLParams(urlString);
    let index = urlParams.index;

    let uid = firebase.auth().currentUser.uid;
    //Go to that specific location of the image to grab the info
    let imageDBRef = firebase.database().ref().child(uid).child(index);

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
        let srcImageRef = firebase.storage().ref(srcPath);
        srcImageRef.getDownloadURL().then( url => {
            //Display the Image
            //Fill in the information (memeName, top text, bottom text)
        });
    });
}