#include "Thermistor/Thermistor.h"
#include "Ubidots/Ubidots.h"
#include "pid/pid.h"
#include "Adafruit_SSD1306/Adafruit_SSD1306.h"

#define TOKEN ""
#define DATA_SOURCE_TAG ""
Ubidots ubidots(TOKEN);

//OLED reset pin and initialization
#define OLED_RESET D4
Adafruit_SSD1306 display(OLED_RESET);

// Thermistor pin locations
#define ThermPin0  A0
#define ThermPin1  A1

// Voltage divider resistor values
// Need to manually find in order to get best readings
#define ThermRes0 9700.00
#define ThermRes1 10000.00

// Relay pin
#define RelayPin D2

// Board LED pin
#define LED D7

// PID by time value
#define WindowSize 5000

// Configure the Thermistor classes
Thermistor Thermistor0(ThermPin0, ThermRes0);
Thermistor Thermistor1(ThermPin1, ThermRes1);

// Define temp variables
double temp0, temp1;
double setTemp0, setTemp1;


// Define PID Variables we'll be connecting to
double output;
//Specify the links and initial tuning parameters
PID electricPID(&temp0, &output, &setTemp0, 2, 5, 1, PID::DIRECT);

const int POST_RATE = 30000; // Time between posts, in ms.
unsigned long lastPost = 0; // global variable to keep track of last post time
unsigned long windowStartTime; // global variable to keep track of last PID
bool cook = false;

void setup()   {
  Serial.begin(9600);

  // Setup relay pin
  pinMode(RelayPin, OUTPUT);
  pinMode(LED, OUTPUT);

  // Initialize the Thermistor classes
  Thermistor0.begin();
  Thermistor1.begin();

  //******PID Setup******
  windowStartTime = millis();
  setTemp0 = 0;
  electricPID.SetOutputLimits(0, WindowSize);  //tell the PID to range between 0 and the full window size
  electricPID.SetMode(PID::AUTOMATIC);  //turn the PID on
  //*********************

  //******OLED Display Setup******
  // by default, we'll generate the high voltage from the 3.3v line internally!
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);  // initialize with the I2C addr 0x3D (for the 128x64)
  // clear the screen and buffer
  display.clearDisplay();
  // set text size/color
  display.setTextSize(2);
  display.setTextColor(WHITE);
  //******************************
}

void loop() {
  tempHandler();
  cookHandler();
  printToOLED();
}

void tempHandler() {

    if (lastPost + POST_RATE < millis()) {
        lastPost = millis(); // Reset timer

        // Get temps in fahrenheit
        temp0 = Thermistor0.getTempF(true);
    	temp1 = Thermistor1.getTempF(true);

    	// Pull data from Ubidots
        setTemp0 = ubidots.getValueWithDatasource(DATA_SOURCE_TAG, "SetTemp");

        // Debug Info sent to Particle Dashboard
    	Particle.publish("temp0", String(temp0));
    	Particle.publish("temp1", temp1);
        Particle.publish("setTemp0", String(setTemp0));

        // Send the current temperatures to Ubidots
        ubidots.add("Temp0", temp0);
        ubidots.add("Temp1", temp1);
        ubidots.sendAll();
    }
}

void cookHandler() {
    // If we are in cook mode do a PID calc.
    if(cook){
      pid();
    } else{
      digitalWrite(RelayPin,HIGH); // Keep it off. (SAFETY)
    }
}

void printToOLED() {
    // Print temperatures on the OLED display
    display.clearDisplay();
    display.setCursor(0,0);
    printTemp(temp0, setTemp0, "Temp1:");
    //printTemp(temp1, setTemp1, "Meat1:");

    // Write to the OLED
    display.display();
}

// Print the temperature on the OLED
void printTemp(int temp, int setTemp, String name) {

  display.print(name);
  display.print(temp);
  if(cook) {
    display.print("/");
    display.print(setTemp);
  }
  // degrees F symbol
  //display.write((uint8_t) 247);
  display.println("F");
}

// Do the PID calculation
void pid(){
  // PID compute
  electricPID.Compute();

  /************************************************
   * turn the output pin on/off based on pid output
   ************************************************/
  if(millis() - windowStartTime > WindowSize)
  { //time to shift the Relay Window
    windowStartTime += WindowSize;
  }
  if(output < millis() - windowStartTime){
      digitalWrite(RelayPin,HIGH);
  }
  else{
      digitalWrite(RelayPin,LOW);
  }
  //***********************************************
}

// // Untested blower control
// // Credit : http://hruska.us/tempmon/
// unsigned char DoControlAlgorithm(int setPoint, int currentTemp) {
//     // For integral, determine how often to update integral sum
//     // Integral is used to null out offset, so can be independent of offset size
//     int PID_I_FREQ = 6;

//     // So far, just using P=5 is looking good....
//     double PID_P = 5;
//     double PID_I = 0.02;
//     double PID_D = 0;
//     double PID_BIAS = 3;

// 	unsigned char fanSpeed = 0;
// 	// state we need to save
// 	static float integralSum = 0, prevError = 0;
// 	static unsigned char integralCount = 0;

// 	float error, proportional, integral = 0;
// 	float derivative, control, prelimitcontrol;

// 	// calculate the current error
// 	error = setPoint - currentTemp;

// 	// proportional term
// 	proportional = PID_P * error;

// 	// derivative
// 	derivative = error - prevError;
// 	derivative = derivative * PID_D;
// 	prevError = error;

// 	// control value is % (0 - 100)
// 	control = PID_BIAS + proportional + derivative;

// 	prelimitcontrol = control;
// 	// integral term. see if it's time to do an integral update (and
// 	// that integral term isn't 0)
// 	if (++integralCount >= PID_I_FREQ) {
// 		integralCount = 0;

// 		// integral accumulation - include "anti windup" test.
// 		// Don't change the integral being accumulated if the control value is
// 		// already at 100% and the integral error is positive (which would increase
// 		// the control value even more), and don't change the integral sum if
// 		// the control value is already at 0% and the integral error is negative
// 		// (which would decrease the control value even more)
// 		// Since we've already added it in, remove it here if necessary

// 		if (error >= 0) {
// 			integral = PID_I * error;
// 			if (control + integralSum < 100) {
// 				// experiment
// 				integralSum += integral;
// 			}
// 		} else {
// 			// A possibility to try here....if error is negative, increase the rate
// 			// that we slow the fan down by multiplying PID_I
// 			// i.e. integral = PID_I*2 * error;
// 			integral = PID_I * error;
// 			if (control + integralSum > 0) {
// 				integralSum += integral;
// 			}
// 		}

// 	}
// 	control += integralSum;

// 	// limit control
// 	if (control > 100)
// 		control = 100;
// 	else if (control < 0)
// 		control = 0;

// 	// convert to PWM setting ( 0 - 255), (50 is to round instead of truncate)
// 	fanSpeed = ((control * 255) + 50) / 100;

// 	return fanSpeed;
// }
