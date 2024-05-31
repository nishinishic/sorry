let allConnections = [];
let vidWidth = 480;
let vidHeight = 360;
let p5live;
let nameField;
let gatherText;
let frozenFrames = {}; // Object to store the frozen frames

function setup() {
  createCanvas(windowWidth, windowHeight);

  myVideo = createCapture(VIDEO, gotMineConnectOthers);
  myVideo.size(vidWidth, vidHeight);
  myVideo.hide();
  allConnections['Me'] = {
    'video': myVideo,
    'name': "Me",
    'x': random(width),
    'y': random(height)
  };
  nameField = createInput("(type in the box to apologize with me and others)"); //"No Name"
  nameField.changed(enteredName);
  nameField.style('position', 'absolute');
  nameField.style('width', '330px');
  nameField.style('font-size', '15px'); // Change the text size here

  // Create the paragraph element for the text
  gatherText = createP('"gather. say sorry."');
  gatherText.style('position', 'absolute');
  gatherText.style('font-size', '40px');
  gatherText.style('color', 'blue'); // Adjust the color as needed
  gatherText.style('text-align', 'center'); // Center text alignment
  gatherText.style('width', '100%'); // Take the full width of the page
  gatherText.style('top', '10px'); // Position at the top with some margin
  gatherText.style('left', '0'); // Start from the left edge
  gatherText.position((windowWidth - gatherText.width) / 2, 10); // Position at the top of the page

  // Set a timeout to freeze the video streams after 447 seconds
  setTimeout(freezeVideos, 447000); // 447000 milliseconds = 447 seconds
}

function gotMineConnectOthers(myStream) {
  p5live = new p5LiveMedia(this, "CAPTURE", myStream, "arbitraryDataRoomName");
  p5live.on('stream', gotOtherStream);
  p5live.on('disconnect', lostOtherStream);
  p5live.on('data', gotData);
}

function draw() {
  background(255, 0, 0);
  stroke(255);

  // Set the desired font size for the text
  textSize(20); // Change this value to set your preferred font size
  fill(0, 255, 0); // Change this value to set your preferred text color

  for (var id in allConnections) {
    let thisConnectJSON = allConnections[id];
    let x = thisConnectJSON.x;
    let y = thisConnectJSON.y;

    // Display either the video or the frozen frame
    if (frozenFrames[id]) {
      image(frozenFrames[id], x, y, vidWidth, vidHeight);
    } else {
      image(thisConnectJSON.video, x, y, vidWidth, vidHeight);
    }

    stroke(0);
    text(thisConnectJSON.name, x - 20, y - 20);
  }

  // Position the input box at the bottom center of the canvas
  nameField.position((width - nameField.width) / 2, height - nameField.height - 50);
}

// We got a new stream!
function gotOtherStream(stream, id) {
  otherVideo = stream;
  otherVideo.size(vidWidth, vidHeight);
  allConnections[id] = {
    'video': otherVideo,
    'name': id,
    'x': 0,
    'y': 0
  };
  otherVideo.hide();
  mouseDragged(); //send them your location
  enteredName(); //send them your name
}

function lostOtherStream(id) {
  print("lost connection " + id);
  delete allConnections[id];
}

function mouseDragged() {
  //change locally
  allConnections['Me'].x = mouseX;
  allConnections['Me'].y = mouseY;
  //send to others
  let dataToSend = {
    dataType: 'location',
    x: mouseX,
    y: mouseY
  };
  // Send it
  p5live.send(JSON.stringify(dataToSend));
}

function enteredName() {
  //change locally
  allConnections['Me'].name = nameField.value();
  let dataToSend = {
    dataType: 'name',
    name: nameField.value()
  };
  print(dataToSend);
  // Send it
  p5live.send(JSON.stringify(dataToSend));
}

function gotData(data, id) {
  let d = JSON.parse(data);

  print(d.dataType);
  if (d.dataType == 'name') {
    allConnections[id].name = d.name;
  } else if (d.dataType == 'location') {
    allConnections[id].x = d.x;
    allConnections[id].y = d.y;
  } else if (d.dataType == 'freeze') {
    // Freeze the video streams on receiving the freeze signal
    freezeVideos();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  gatherText.position((windowWidth - gatherText.width) / 2, 10); // Reposition the text when the window is resized
}

// Function to freeze the video streams
function freezeVideos() {
  for (let id in allConnections) {
    let thisConnectJSON = allConnections[id];
    let video = thisConnectJSON.video;

    // Capture the current frame as a frozen frame
    video.loadPixels();
    let frozenFrame = createImage(video.width, video.height);
    frozenFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
    frozenFrames[id] = frozenFrame;

    // Stop the video stream
    video.stop();
  }

  // Send a freeze signal to other clients
  let dataToSend = {
    dataType: 'freeze'
  };
  p5live.send(JSON.stringify(dataToSend));
}
