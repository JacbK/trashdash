const int landfillButtonPin = 11; // Define the pin connected to the landfill button
const int recycleButtonPin = 10; // Define the pin connected to the recycle button
const int compostButtonPin = 9; // Define the pin connected to the compost button
const int RED_PIN = 13; // Define the pin connected to the LED
#define VIBROMETER_OUTPUT 12 // Define the pin connected to the Vibrometer

char incomingData;


void setup() {

  // Initialize button states
  pinMode(landfillButtonPin, INPUT); 
  pinMode(recycleButtonPin, INPUT); 
  pinMode(compostButtonPin, INPUT); 
  pinMode(VIBROMETER_OUTPUT, OUTPUT);
  pinMode(RED_PIN, OUTPUT);

  Serial.begin(9600); // Initialize serial communication
}

// Play loop
void loop() {

  // To take Serial input from the computer
  if (Serial.available() > 0) {
    incomingData = Serial.read();
    if(incomingData == 'y') {

        analogWrite(VIBROMETER_OUTPUT, 153);
        delay(500);
        analogWrite(VIBROMETER_OUTPUT, 0);
    } 
    if(incomingData == 'n') {
      digitalWrite(RED_PIN, HIGH);
      delay(500);
      digitalWrite(RED_PIN, LOW);
    }

  }

  // To send input to the computer
  int landfillButtonState = digitalRead(landfillButtonPin);
  int compostButtonState = digitalRead(recycleButtonPin);
  int recycleButtonState = digitalRead(compostButtonPin);
  

  // Sends input as a comma seperated string of values for parsing
  Serial.print(landfillButtonState);
  Serial.print(",");
  Serial.print(compostButtonState);
  Serial.print(",");
  Serial.println(recycleButtonState);

    

  delay(100); // Add a small delay 
}