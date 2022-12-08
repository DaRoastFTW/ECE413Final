/*
 * Project RineHeartMonitoring
 * Description: ECE 413 IOT Heart Monitoring Project
 * Authors: Rusty Rinehart, Ary Nath, Christopher Bremser
 * Date: 12/7/2022
 */
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <vector>

//Enable offline mode
SYSTEM_THREAD(ENABLED);
//default values
int frequency = -1;
int startHour = -1;
int startMin = -1;
int endHour = -1;
int endMin = -1;
int api_key = 0;
int measurementHour;
int measurementMin;

// Measurement window is minutes
int measurementWindow = 5;
enum state
{
  idle,
  wait,
  request,
  measurement,
  yellow,
  store
};
state currState;
int currYear;
int currMonth;
int currDay;
int currHour;
int currMinute;

// Measuring data from sensor
int heartRate;

// Sensor declarations
MAX30105 partSensor;
const byte rateSize = 4;
byte rates[rateSize];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAverage;

int32_t bufferLength;
int32_t spo2;
int8_t validSpo2;
int32_t dummyHeartRate;
int8_t dummyValidHeartRate;
uint32_t irBuffer[100];
uint32_t redBuffer[100];

//Set LED blinker indicators
LEDStatus blinkBlue(RGB_COLOR_BLUE, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);
LEDStatus flashYellow(RGB_COLOR_YELLOW, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);
LEDStatus flashGreen(RGB_COLOR_GREEN, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);

// Local Storage
struct data
{
  String date;
  String time;
  String heartRate;
  String spo2;
};
//localData holds all of the measurements locally until device is connected to internet
std::vector<data> localData;

String getValue(String json, String key)
{
  /*
    Helper Method that grabs a value given the key of a string in JSON format
  */
  int startKeyIndex = json.indexOf(key);
  int endKeyIndex = startKeyIndex + key.length();
  int startValueIndex = json.indexOf(":", endKeyIndex) + 1;
  int endValueIndex = json.indexOf(",", startValueIndex);

  String value = json.substring(startValueIndex, endValueIndex);
  //Strip off any extra special characters
  if (value.charAt(0) == '"')
  {
    value = value.remove(0, 1);
  }
  if (value.charAt(value.length() - 1) == '"' || value.charAt(value.length() - 1) == '}')
  {
    value.remove(value.length() - 1);
  }
  return value;
}
bool measurementInterval()
/*
  Returns true if in the time window of measurements
*/
{
  int start = startHour * 60 + startMin;
  int end = endHour * 60 + endMin;
  int curr = currHour * 60 + currMinute;
  //Loop through time to see if it is time to make a sensor reading
  for (int i = start; i <= end; i += frequency)
  {
    if (i == curr)
    {
      return true;
    }
  }
  return false;
}
void getTime()
{
  /*
    Updates all time values to current time
  */
  Time.zone(-7);
  currYear = Time.year();
  currMonth = Time.month();
  currDay = Time.day();
  currHour = Time.hour();
  currMinute = Time.minute();
}
void updateFrequency(const char *event, const char *data)
{
  /*
    Called whenever the user updates the frequency on the site
  */
  Serial.println(data);
  String data1(data);
  frequency = (getValue(data1, "frequency")).toInt();
}

void updateTime(const char *event, const char *data)
{
  /*
    Called whenever the user updates the time window on the site
  */
  Serial.println(data);
  String data1(data);
  startHour = (getValue(data1, "startHour")).toInt();
  startMin = (getValue(data1, "startMin")).toInt();
  endHour = (getValue(data1, "endHour")).toInt();
  endMin = (getValue(data1, "endMin")).toInt();

}
void tokenDelivery(const char *event, const char *data)
{
  /*
    Called when the server sends the API Key over to the particle
  */
  Serial.println(data);
  String data1(data);
  api_key = (getValue(data1, "apikey")).toInt();
}
void particleSync(const char *event, const char *data)
{
  /*
    Called when account.html is loaded in order to ensure device
    and server are synced
  */
  Serial.println(data);
  String data1(data);
  frequency = (getValue(data1, "frequency")).toInt();
  startHour = (getValue(data1, "startHour")).toInt();
  startMin = (getValue(data1, "startMin")).toInt();
  endHour = (getValue(data1, "endHour")).toInt();
  endMin = (getValue(data1, "endMin")).toInt();

}
bool fiveMins()
{
  /*
    Returns true if five minutes has elapsed since measurements were started
    to be requested.
  */
  int measurementTime = measurementHour * 60 + measurementMin;
  int now = currHour * 60 + currMinute;

  if (now >= measurementTime + measurementWindow)
  {
    return true;
  }
  return false;
}
bool inTimeRange()
{
  /*
    Returns true if current time falls within user defined range of day
  */
  bool inRange = true;
  if ((currHour < startHour) || ((currHour == startHour) && (currMinute < startMin)))
  {
    inRange = false;
  }
  if ((currHour > endHour) || ((currHour == endHour) && (currMinute > endMin)))
  {
    inRange = false;
  }
  return inRange;
}
bool checkFinger()
{
  /*
    Checks if finger is on sensor
  */
  if (partSensor.getIR() < 50000)
  {
    Serial.println("No fingy");
    return false;
  }
  return true;
}
void readHeart()
{
  // This is where we'll read in sensor data

  Serial.println("Reading Heartbeat...");
  // Take 100 samples
  for (int i = 0; i < 100; i++)
  {
    long irValue = partSensor.getIR();
    if (checkForBeat(irValue) == true)
    {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      // Serial.println(beatsPerMinute);
      if (beatsPerMinute < 255 && beatsPerMinute > 20)
      {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= rateSize;
        beatAverage = 0;
        for (byte x = 0; x < rateSize; x++)
        {
          beatAverage += rates[x];
        }
        beatAverage /= rateSize;
      }
    }
  }
  heartRate = beatAverage;
}
void readSPO2()
{
  /*
    Reads Blood Oxygen Saturation
  */
  Serial.println("Reading Blood Oxygen Saturation...");
  bufferLength = 100;
  // Take 100 samples to find the best value
  for (byte i = 0; i < bufferLength; i++)
  {
    while (partSensor.available() == false)
    {
      partSensor.check();
    }
    redBuffer[i] = partSensor.getRed();
    irBuffer[i] = partSensor.getIR();
    partSensor.nextSample();
  }
  maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSpo2, &dummyHeartRate, &dummyValidHeartRate);
}
// This is where we'll also read sensor data
void concatenate_string(char* s, char* s1)
{
  /*
    Helper method to combine two character arrays
  */
    int i;
 
    int j = strlen(s);
 
    for (i = 0; s1[i] != '\0'; i++) {
        s[i + j] = s1[i];
    }
 
    s[i + j] = '\0';
 
    return;
}

// setup() runs once, when the device is first turned on.
void setup()
{
  Serial.begin(9600);
  //Subscribe to all events
  Particle.subscribe("frequency", updateFrequency);
  Particle.subscribe("time range", updateTime);
  Particle.subscribe("initial sync", particleSync);
  Particle.subscribe("token delivery", tokenDelivery);
  // Set to initial state
  currState = idle;

  // Sensor setup
  if (!partSensor.begin(Wire, 400000))
  {
    Serial.println("MAX30105 has left the building");
    while (1);
  }

  
  partSensor.setup();
  partSensor.setPulseAmplitudeRed(0x0a);

  // partSensor.setPulseAmplitudeGreen(0);
}

// loop() runs over and over again, as quickly as it can execute.
void loop()
{
  // The core of your code will likely live here.
  //Grab updated time value
  getTime();
  data dataPoint;
  Serial.print(currMonth);
  Serial.print("/");
  Serial.print(currDay);
  Serial.print("/");
  Serial.print(currYear);
  Serial.print(" ");
  Serial.print(currHour);
  Serial.print(":");
  Serial.println(currMinute);
  // Beginning of state machine
  switch (currState)
  {
  case idle:
    Serial.println("Idle");
    //Move to wait if in measuring hours
    if (inTimeRange())
    {
      currState = wait;
    }
    break;
  case wait:
    Serial.println("Wait");
    //Move back to Idle if out of measuring hours
    if (!(inTimeRange()))
    {
      currState = idle;
    }
    //If in a measurement time slot, switch to request state and start 5 minute timer
    else if (measurementInterval() && !(currHour == measurementHour && currMinute == measurementMin))
    {
      currState = request;
      measurementHour = currHour;
      measurementMin = currMinute;
    }
    //If data stored locally and connected to internet, change to store state
    else if (localData.size() > 0 && Particle.connected())
    {
      
      currState = store;
    }
    break;
  case request:
    Serial.println("Request");
    //Blink blue while requesting measurements
    blinkBlue.setActive(true);
    //Go back to wait if user doesn't get a measurement in 5 minutes
    if (fiveMins())
    {
      currState = wait;
      blinkBlue.setActive(false);
    }
    else
    {
      //If user doesn't have finger on, don't measure
      if (checkFinger())
      {
        //Read two values
        readHeart();
        readSPO2();
        blinkBlue.setActive(false);
        currState = measurement;
      }
    }
    break;
  case measurement:
    Serial.println("Measurement");
    // Serial.print("Heart Rate: ");
    // Serial.print(heartRate);
    // Serial.print(" SPO2 ");
    // Serial.println(spo2);


    //Create timestamp string to bundle in with sending data
    dataPoint.date = String(currMonth) + "/" + String(currDay) + "/" + String(currYear);
    dataPoint.time = String(currHour) + ":" + String(currMinute);
    dataPoint.heartRate = String(heartRate);
    dataPoint.spo2 = String(spo2);
    //Add data to localStorage
    localData.push_back(dataPoint);
    //Flash yellow if no internet available
    if (Particle.connected())
    {
      currState = wait;
    }
    else
    {
      currState = yellow;
    }
    break;
  case yellow:
    flashYellow.setActive(true);
    delay(2000);
    flashYellow.setActive(false);
    currState = wait;
    break;
  case store:

    Serial.println("Store");
    for (int i = 0; i < localData.size(); i++)
    {
      //Loop through all data, build packet
      String dataStream = "";
      dataStream += api_key + " ";
      dataStream += localData.at(i).date + " ";
      dataStream += localData.at(i).time + " ";
      dataStream += localData.at(i).heartRate + " ";
      dataStream += localData.at(i).spo2;

      int strLength = dataStream.length();
      char charStream[strLength + 1];
      strcpy(charStream, dataStream.c_str());
      //Send data to Particle API
      Particle.publish("store", charStream);
    }
    //Flash green after data is sent
    flashGreen.setActive(true);
    delay(2000);
    flashGreen.setActive(false);
    //Clear local storage after data is sent to server
    localData.clear();
    currState = wait;
    break;
  }
  //Device updates every 5 seconds
  delay(5000);
}