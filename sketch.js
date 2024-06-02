let trashPieces = [];
let landfill = [];
let recycle = [];
let compost = [];
let trashCanX;
let trashCanWidth = 100;
let trashCanType = 'landfill';
let score = 0;
let video;
let poseNet;
let pose;
let gameState = 'menu';
let land;
let recy;
let comp;
let font;
let landKey;
let recyKey;
let compKey;
let speedMultiplier = 3;
let pHtmlMsg;
let serialOptions = { baudRate: 115200  };
let serial;
let wrongBinPopupTime = 0; // Time when the wrong bin popup should be displayed
let wrongBinPopupDuration = 2000;
let oceanPopupTime = 0;
let highScore;


let lives = 3; // Initial number of lives

// Ocean background variables
let waveOffset = 0;

function setup() {
  landfill.push(loadImage('images/1.png'));
  landfill.push(loadImage('images/9.png'));
  landfill.push(loadImage('images/11.png'));
  compost.push(loadImage('images/2.png'));
  compost.push(loadImage('images/8.png'));
  compost.push(loadImage('images/12.png'));
  recycle.push(loadImage('images/3.png'));
  recycle.push(loadImage('images/7.png'));
  recycle.push(loadImage('images/10.png'));
  highScore = localStorage.getItem('highScore') || 0;
  highScore = parseInt(highScore);
  
  land = loadImage('images/4.png');
  recy = loadImage('images/6.png');
  comp = loadImage('images/5.png');
  fontN = loadFont('ARCADE_N.TTF');
  fontR = loadFont('ARCADE_R.TTF');
  fontI = loadFont('ARCADE_I.TTF');
  textFont(fontN);
  
  
  createCanvas(windowWidth, windowHeight);
  trashCanX = width / 2 - trashCanWidth / 2;
  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on('pose', gotPoses);
  
   serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);

  // Add in a lil <p> element to provide messages. This is optional
  pHtmlMsg = createP("Click anywhere on this page to open the serial connection dialog");
  pHtmlMsg.style('color', 'deeppink');
}

/**
 * Callback function by serial.js when there is an error on web serial
 * 
 * @param {} eventSender 
 */
 function onSerialErrorOccurred(eventSender, error) {
  console.log("onSerialErrorOccurred", error);
  pHtmlMsg.html(error);
}

/**
 * Callback function by serial.js when web serial connection is opened
 * 
 * @param {} eventSender 
 */
function onSerialConnectionOpened(eventSender) {
  pHtmlMsg.html("Serial connection opened successfully");
}

/**
 * Callback function by serial.js when web serial connection is closed
 * 
 * @param {} eventSender 
 */
function onSerialConnectionClosed(eventSender) {
  console.log("onSerialConnectionClosed");
  pHtmlMsg.html("onSerialConnectionClosed");
}

/**
 * Callback function serial.js when new web serial data is received
 * 
 * @param {*} eventSender 
 * @param {String} newData new data received over serial
 */
function onSerialDataReceived(eventSender, newData) {
  const values = newData.split(",");
  landKey = parseFloat(values[0]);
  recyKey = parseFloat(values[1]);
  compKey = parseFloat(values[2]);
  if (gameState === 'game') {
    if (landKey === 1) {
      trashCanType = 'landfill';
    } else if (recyKey === 1) {
      trashCanType = 'recycle';
    } else if (compKey === 1) {
      trashCanType = 'compost';
    }
  }
  pHtmlMsg.html("onSerialDataReceived: " + newData);
}

/**
 * Called automatically by the browser through p5.js when mouse clicked
 */
function mouseClicked() {
  if (!serial.isOpen()) {
    serial.connectAndOpen(null, serialOptions);
  }
}

function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
  }
}

function modelReady() {
  console.log('PoseNet is ready!');
}

function drawGameOver() {
  background(135, 206, 235); // Clear the background

  fill(0, 0, 0, 100); // Transparent black color for the shadow box
  rectMode(CENTER);
  rect(width / 2, height / 2, width * 0.9, height * 0.8, 20); // Shadow box with rounded corners

  push();
  translate(width / 2, height / 2);
  scale(0.9, 0.8); // Scale the content to fit inside the shadow box
  translate(-width / 2, -height / 2);

  textFont(fontN); // Set the normal font for headings
  textSize(40);
  fill('white');
  textAlign(CENTER, CENTER);
  text('Game Over', width / 2, height / 3);

  textSize(20);
  text('Your Score: ' + score, width / 2, height / 2);

  // Check if the current score is higher than the high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore.toString()); // Save the new high score to localStorage
  }

  // Display the high score
  text('High Score: ' + highScore, width / 2, height / 2 + 30);

  textFont(fontR); // Set the regular font for the restart button
  textSize(16);
  fill(240, 240, 240);
  text('Press Enter to play again', width / 2, height / 1.5);

  pop();
}

function draw() {
  drawOceanBackground(); // Draw the ocean background

  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'tutorial') {
    drawTutorial();
  } else if (gameState === 'game') {
    if (lives > 0) { // Check if the player has lives left
      (drawGame)();
    } else { // Game over
      gameState = 'gameOver';
    }
  }
  else if (gameState === 'gameOver') {
    drawGameOver(); // Call the drawGameOver function when the game state is 'gameOver'
  }
}

function drawOceanBackground() {
  background(135, 206, 235); // Sky blue color

  // Draw the ocean
  noStroke();
  fill(30, 144, 255); // Deep blue color for the ocean
  beginShape();
  vertex(0, height * 0.7);
  
  // Create waves
  let waveHeight = 10;
  let waveWidth = 0.05;
  for (let x = 0; x < width + 20; x += 20) {
    let y = sin(waveOffset + x * waveWidth) * waveHeight + height * 0.7;
    vertex(x, y + 50);
  }
  
  vertex(width, height);
  vertex(0, height);
  endShape();

  // Animate the waves
  waveOffset += 0.03;

  // Draw the sun
  push();
  translate(width * 0.8, height * 0.15);
  fill(255, 255, 0);
  ellipse(0, 0, 100, 100); // Sun bod

  // Draw sun glow
  noStroke();
  fill(255, 255, 0, 100); // Yellow color with transparency for glow
  ellipse(0, 0, 150, 150); // Outer glow
  fill(255, 255, 0, 150); // Brighter yellow color with transparency for glow
  ellipse(0, 0, 120, 120); // Inner glow

  pop();
}

function drawMenu() {
  textSize(40);
  fill('white');
  textAlign(CENTER, CENTER);
  text('Trash Dash', width / 2, height / 2.5);
  textSize(10);
  text('Collect the trash to save the ocean, correctly!', width / 2, height / 2.5 + 30);
  textSize(16);
  fill(240, 240, 240);
  textSize(10);
  textFont(fontI);
  text('Press 1 to start the game', width / 2, height / 1.75);
  text('Press 2 for tutorial', width / 2, height / 1.75 + 25);
  textFont(fontR);
}

function drawTutorial() {
  // Draw the background
  background(135, 206, 235);

  // Draw the slightly translucent shadow box
  fill(0, 0, 0, 100); // Transparent black color for the shadow box
  rectMode(CENTER);
  rect(width / 2, height / 2, width * 0.9, height * 0.8, 20); // Shadow box with rounded corners

  // Draw the text and images inside the shadow box
  push();
  translate(width / 2, height / 2);
  scale(0.9, 0.8); // Scale the content to fit inside the shadow box
  translate(-width / 2, -height / 2);

  textFont(fontN); // Set the normal font for headings
  textSize(40);
  fill('white');
  textAlign(CENTER, CENTER);
  text('Tutorial', width / 2, height / 6);

  // Set the italic font for body text
  textSize(16);
  fill(250, 250, 250);
  text("Player 1:", width / 2, height / 3.5);
  textSize(10);
  textFont(fontI);
  text('Catch the falling trash by', width / 2, height / 3);
  text('leaning with your shoulders before it hits the ocean.', width / 2, height / 3 + 20);

  textSize(16);
  textFont(fontN);
  text("Player 2:", width / 2, height / 2.2);
  textSize(10);
  fill(250, 250, 250);
  textFont(fontI);
  text('Switch the trash can that is currently', width / 2, height / 2);
  text('being used to match the falling trash.', width / 2, height / 2 + 20);

  // Landfill bin
  textFont(fontN);
  textSize(10);
  fill('white');
  text('Landfill bin', width / 4, height / 1.70);
  image(landfill[0], width / 4 - 150, height / 1.75 + 30, 70, 70); // Larger trash image
  image(land, width / 4 - 20, height / 1.75 + 30, 70, 70); // Larger corresponding bin image
  drawArrow(width / 4 - 70, height / 1.75 + 55, width / 4 - 40, height / 1.75 + 55, 15); // Larger arrow
  textFont(fontI);
  textSize(10);
  fill(240, 240, 240);
  text('Gray items', width / 4, height / 1.75 + 140);

  // Recycle bin
  textFont(fontN);
  textSize(10);
  fill('white');
  text('Recycle bin', width / 2, height / 1.70);
  image(recycle[0], width / 2 - 100, height / 1.75 + 20, 90, 90); // Larger trash image
  image(recy, width / 2 + 20, height / 1.75 + 30, 70, 70); // Larger corresponding bin image
  drawArrow(width / 2 - 15, height / 1.75 + 55, width / 2 + 15, height / 1.75 + 55, 15); // Larger arrow
  textFont(fontI);
  textSize(10);
  fill(240, 240, 240);
  text('Green items', width / 2, height / 1.75 + 140);

  // Compost bin
  textFont(fontN);
  textSize(10);
  fill('white');
  text('Compost bin', width / 1.35, height / 1.70);
  image(compost[0], width / 1.35 - 45, height / 1.75 + 30, 70, 70); // Larger trash image
  image(comp, width / 1.35 + 70, height / 1.75 + 30, 70, 70); // Larger corresponding bin image
  drawArrow(width / 1.35 + 20, height / 1.75 + 65, width / 1.35 + 55, height / 1.75 + 65, 15); // Larger arrow
  textFont(fontI);
  textSize(10);
  fill(240, 240, 240);
  text('Brown items', width / 1.35, height / 1.75 + 140);

  textFont(fontR); // Set the regular font for the back button
  textSize(10);
  fill(240, 240, 240);
  text('Press Enter to go back to the main menu', width / 2, height / 1.1);

  pop();
}

// Function to draw an arrow
function drawArrow(x1, y1, x2, y2, arrowSize) {
  push();
  stroke(255); // White color for the arrow
  strokeWeight(2);
  line(x1, y1, x2, y2); // Draw the arrow line
  
  // Draw the arrowhead
  let angle = atan2(y2 - y1, x2 - x1);
  translate(x2, y2);
  rotate(angle);
  line(0, 0, -arrowSize, -arrowSize);
  line(0, 0, -arrowSize, arrowSize);
  pop();
}

function drawGame() {
  if (lives <= 0) {
    // End the game
    gameState = 'gameOver';
    return; // Exit the drawGame function
  }

  if (trashCanType === 'landfill') {
    image(land, trashCanX, height - 100, trashCanWidth, 100);
  } else if (trashCanType === 'recycle') {
    image(recy, trashCanX, height - 100, trashCanWidth, 100);
  } else {
    image(comp, trashCanX, height - 100, trashCanWidth, 100);
  }

  if (pose) {
    let leftShoulder = pose.leftShoulder;
    let rightShoulder = pose.rightShoulder;
    if (leftShoulder.y > rightShoulder.y) {
      trashCanX -= 5;
    } else if (leftShoulder.y < rightShoulder.y) {
      trashCanX += 5;
    }
  }

  trashCanX = constrain(trashCanX, 0, width - trashCanWidth);

  for (let i = trashPieces.length - 1; i >= 0; i--) {
    let trash = trashPieces[i];
    image(trash.image, trash.x, trash.y, 50, 50);

    trash.y += trash.speed;

    if (trash.y >= height - 100 && trash.x >= trashCanX && trash.x <= trashCanX + trashCanWidth) {
      if (trash.type === trashCanType) {
        // Trash piece is within the horizontal bounds of the trash can and matches the bin type
        score++;
        if (serial.isOpen()){
          serial.write('y');
        }
        speedMultiplier += 0.2; // Increase the speed multiplier
      } else {
        if (serial.isOpen()){
          serial.write('n');
        }
        wrongBinPopupTime = millis();
        score = max(score - 1, 0);
        push(); // Start a new drawing state
        fill(0); // Set the text color to black
        textSize(20); // Set the text size
        textAlign(CENTER, CENTER); // Center the text horizontally and vertically
        text("You put the trash in the wrong bin!", width / 2, height / 2); // Display the message
        pop();
      }
      trashPieces.splice(i, 1);
      spawnTrash();
    }

    if (trash.y >= height) {
      lives--;
      speedMultiplier = max(2, speedMultiplier - 5);
      oceanPopupTime = millis();
      trashPieces.splice(i, 1);
      spawnTrash();
    }
  }
  
  if (millis() - wrongBinPopupTime < wrongBinPopupDuration) {
    // Display the popup if the current time is within the popup duration
    push(); // Start a new drawing state
    fill(0, map(millis() - wrongBinPopupTime, 0, wrongBinPopupDuration, 255, 0)); // Set the text color to black with fading alpha value
    textSize(20); // Set the text size
    textAlign(CENTER, CENTER); // Center the text horizontally and vertically
    text("That was the wrong bin!", width / 2, height / 2); // Display the message
    pop(); // Restore the previous drawing state
  } else {
    wrongBinPopupTime = 0; // Reset the popup time to 0 after the duration has elapsed
  }
  
  if (millis() - oceanPopupTime < wrongBinPopupDuration) {
    // Display the popup if the current time is within the popup duration
    push(); // Start a new drawing state
    fill(0, map(millis() - oceanPopupTime, 0, wrongBinPopupDuration, 255, 0)); // Set the text color to black with fading alpha value
    textSize(20); // Set the text size
    textAlign(CENTER, CENTER); // Center the text horizontally and vertically
    text("The trash fell into the ocean!", width / 2, height / 2); // Display the message
    pop(); // Restore the previous drawing state
  } else {
    oceanPopupTime = 0; // Reset the popup time to 0 after the duration has elapsed
  }

  fill(0);
  text('Score: ' + score, 60, 20);
  text('Lives: ' + lives, 60, 40);
}

function spawnTrash() {
  let trashType = random(['landfill', 'recycle', 'compost']);
  let trashX = random(width - 20);
  let trashSpeed = 1 * speedMultiplier;
  let trashImage;

  if (trashType === 'landfill') {
    let randomIndex = floor(random(landfill.length));
    trashImage = landfill[randomIndex];
  } else if (trashType === 'recycle') {
    let randomIndex = floor(random(recycle.length));
    trashImage = recycle[randomIndex];
  } else {
    let randomIndex = floor(random(compost.length));
    trashImage = compost[randomIndex];
  }

  trashPieces.push({ x: trashX, y: 0, type: trashType, speed: trashSpeed, image: trashImage });
}

function keyPressed() {
  if (gameState === 'menu') {
    if (key === '1') {
      gameState = 'game';
      score = 0;
      trashPieces = [];
      spawnTrash();
    } else if (key === '2') {
      gameState = 'tutorial';
    }
  } else if (gameState === 'tutorial') {
    if (keyCode === ENTER) {
      gameState = 'menu';
    }
  } else if (gameState === 'game') {
    if (key === 'q') {
      trashCanType = 'landfill';
    } else if (key === 'w') {
      trashCanType = 'recycle';
    } else if (key === 'e') {
      trashCanType = 'compost';
    }
  }
  else if (gameState === 'gameOver') { // Add this condition
    if (keyCode === ENTER) {
      gameState = 'menu'; // Reset the game state to the menu
      score = 0; // Reset the score
      lives = 3; // Reset the number of lives
      trashPieces = []; // Clear the trash pieces array
    }
  }
}