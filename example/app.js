//  Created by Uri Shaked on 8/27/11.
//  Copyright 2011 Uri Shaked. All rights reserved.

// open a single window
var window = Ti.UI.createWindow({
	backgroundColor:'black'
});
window.open();

// Create a short sound file composition
var timedia = require('org.urish.titanium.media');
Ti.API.info("module is => " + timedia);

function loadSample(name) {
    asset = timedia.createAVURLAsset(Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, name).nativePath);
    asset.name = name.split(".")[0];
    return asset;
}

var Do = loadSample("Do.m4a");
var Re = loadSample("Re.m4a");
var Mi = loadSample("Mi.m4a");
var Sol = loadSample("Sol.m4a");
var La = loadSample("La.m4a");

var sheetMusic = [
                  Sol, Mi, Re, Do,
                  Re, Mi, Sol, Mi, Re, Do,
                  [Re, 0.5], [Mi, 0.5], [Re, 0.5], [Mi, 0.5],
                  Sol, Mi, Sol, La, Mi, La,
                  Sol, Mi, Re, Do
                  ];

var composition = timedia.createAVComposition();
var track = composition.createAudioTrack();
var metadata = [];

var currentTime = timedia.zeroTime;
for (var i = 0; i < sheetMusic.length; i++) {
    var currentAsset = sheetMusic[i];
    var duration;
    if (currentAsset instanceof Array) {
        var multiplier = currentAsset[1];
        currentAsset = currentAsset[0];
        duration = currentAsset.duration.multiply(multiplier);
    } else {
        duration = currentAsset.duration;
    }
    track.insertAudio(currentTime, currentAsset, timedia.makeCMTimeRange(timedia.zeroTime, duration));
    
    var metadataItem = timedia.createAVMetadataItem();
    metadataItem.keySpace = "demo";
    metadataItem.key = "Note-" + i;
    metadataItem.value = currentAsset.name;
    metadataItem.time = currentTime;
    metadataItem.duration = duration;
    metadata[metadata.length] = metadataItem;
    
    currentTime = currentTime.add(duration);
}

var outputFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, "Music.m4a");
if (outputFile.exists()) {
    outputFile.deleteFile();
}

function addAudioMix(exportSession, mainTrack) {
    // Enable the following code to slowly mute the track
    var enableAudioMix = 0;
    if (enableAudioMix) {
        var audioMix = timedia.createAVAudioMix();
        var audioMixParams = timedia.createAVAudioMixInputParameters(mainTrack);
        audioMix.inputParameters = [audioMixParams];
        audioMixParams.setVolumeRange(1, 0, timedia.makeCMTimeRange(timedia.zeroTime, currentTime));
        exportSession.audioMix = audioMix;
    }
}

function exportCompleteCallback(e) {
    Ti.API.info("Export completed, file: " + outputFile.nativePath + ", status: " + e.status);
    alert("Export completed, file: " + outputFile.nativePath + ", status: " + e.status);
    
    var options = {
        contentURL:outputFile.nativePath,
        backgroundColor:'#111',
        scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
    };
    var activeMovie = Titanium.Media.createVideoPlayer(options);
    activeMovie.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_EMBEDDED;
    window.add(activeMovie);    
    activeMovie.play();
};

var exportSession = timedia.createAVAssetExportSession(composition, timedia.AVAssetExportPresetAppleM4A);
exportSession.outputURL = outputFile.nativePath;
exportSession.outputFileType = timedia.AVFileTypeAppleM4A;
exportSession.metadata = metadata;
addAudioMix(exportSession, track);
exportSession.addEventListener("complete", exportCompleteCallback);
alert("Exporting to: " + exportSession.outputURL);
exportSession.start();
