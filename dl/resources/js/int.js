document.addEventListener("offline", function(){ alert("You are offline!, please connect to the Internet") }, false);


if (window.cordova && StatusBar)
{
    StatusBar.backgroundColorByHexString('#000');
}


document.addEventListener('deviceready', function () {
    // cordova.plugins.backgroundMode is now available
}, false);



cordova.plugins.backgroundMode.enable();
// or
cordova.plugins.backgroundMode.setEnabled(true);
