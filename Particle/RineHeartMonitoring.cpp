/******************************************************/
//       THIS IS A GENERATED FILE - DO NOT EDIT       //
/******************************************************/

#include "Particle.h"
#line 1 "c:/Users/rrine/OneDrive/Documents/Particle/RineHeartMonitoring/src/RineHeartMonitoring.ino"
/*
 * Project RineHeartMonitoring
 * Description:
 * Author:
 * Date:
 */
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"

bool measurementInterval();
void getTime();
void updateFrequency(const char *event, const char *data);
void updateTime(const char *event, const char *data);
void particleSync(const char *event, const char *data);
bool fiveMins();
bool inTimeRange();
bool checkFinger();
void readHeart();
void readSPO2();
void setup();
void loop();
#line 12 "c:/Users/rrine/OneDrive/Documents/Particle/RineHeartMonitoring/src/RineHeartMonitoring.ino"
int frequency = -1;
int startHour = -1;
int startMin = -1;
int endHour = -1;
int endMin = -1;

int measurementHour;
int measurementMin;

// Measurement window is minutes
int measurementWindow = 1;
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

std::string getValue(std::string json, std::string key)
{
  int startKeyIndex = json.find(key);
  int endKeyIndex = startKeyIndex + key.length();
  int startValueIndex = json.find(":", endKeyIndex) + 1;
  int endValueIndex = json.find(",", startValueIndex);

  std::string value = json.substr(startValueIndex, endValueIndex - startValueIndex);
  if (value.front() == '"')
  {
    value = value.erase(0, 1);
  }
  if (value.back() == '"' || value.back() == '}')
  {
    value.pop_back();
  }
  return value;
}
bool measurementInterval()
{
  int start = startHour * 60 + startMin;
  int end = endHour * 60 + endMin;
  int curr = currHour * 60 + currMinute;
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
  Time.zone(-7);
  currYear = Time.year();
  currMonth = Time.month();
  currDay = Time.day();
  currHour = Time.hour();
  currMinute = Time.minute();
}
void updateFrequency(const char *event, const char *data)
{
  Serial.println(data);
  std::string data1(data);
  frequency = stoi(getValue(data1, "frequency"));
  Serial.println(frequency);
}

void updateTime(const char *event, const char *data)
{
  Serial.println(data);
  std::string data1(data);
  startHour = stoi(getValue(data1, "startHour"));
  startMin = stoi(getValue(data1, "startMin"));
  endHour = stoi(getValue(data1, "endHour"));
  endMin = stoi(getValue(data1, "endMin"));

  Serial.print(startHour);
  Serial.print(":");
  Serial.println(startMin);
  Serial.print(endHour);
  Serial.print(":");
  Serial.println(endMin);
}

void particleSync(const char *event, const char *data)
{
  Serial.println(data);
  std::string data1(data);
  frequency = stoi(getValue(data1, "frequency"));
  startHour = stoi(getValue(data1, "startHour"));
  startMin = stoi(getValue(data1, "startMin"));
  endHour = stoi(getValue(data1, "endHour"));
  endMin = stoi(getValue(data1, "endMin"));

  Serial.println("Particle Sync");
  Serial.println(frequency);
  Serial.print(startHour);
  Serial.print(":");
  Serial.println(startMin);
  Serial.print(endHour);
  Serial.print(":");
  Serial.println(endMin);
}
bool fiveMins()
{
  int measurementTime = measurementHour * 60 + measurementMin;
  int now = currHour * 60 + currMinute;
  //  Serial.print("MeasurementTime ");
  //  Serial.print(measurementTime);
  //  Serial.print(" now ");
  //  Serial.println(now);
  if (now >= measurementTime + measurementWindow)
  {
    return true;
  }
  return false;
}
bool inTimeRange()
{
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
  return true;
}
void readHeart()
{
  // This is where we'll read in sensor data

  // Serial.print("irValue ");
  // Serial.println(irValue);
  // Serial.print("checkForBeat ");
  // Serial.println(checkForBeat(irValue));
  Serial.println("Reading Heartbeat...");
  for (int i = 0; i < 100; i++)
  {
    long irValue = partSensor.getIR();
    if (checkForBeat(irValue) == true)
    {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      Serial.println(beatsPerMinute);
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
  Serial.println("Reading Blood Oxygen Saturation...");
  bufferLength = 100;
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

// setup() runs once, when the device is first turned on.
void setup()
{
  Serial.begin(9600);
  Particle.subscribe("frequency", updateFrequency);
  Particle.subscribe("time range", updateTime);
  Particle.subscribe("initial sync", particleSync);
  currState = request;

  // Sensor setup
  if (!partSensor.begin(Wire, 400000))
  {
    Serial.println("MAX30105 has left the building");
    while (1)
      ;
  }
  byte ledBrightness = 0x1f;
  byte sampleAverage = 8;
  byte ledMode = 3;
  int sampleRate = 100;
  int pulseWidth = 411;
  int adcRange = 4096;

  partSensor.setup();
  partSensor.setPulseAmplitudeRed(0x0a);

  // partSensor.setPulseAmplitudeGreen(0);
}

// loop() runs over and over again, as quickly as it can execute.
void loop()
{
  // The core of your code will likely live here.
  getTime();

  Serial.print(currMonth);
  Serial.print("/");
  Serial.print(currDay);
  Serial.print("/");
  Serial.print(currYear);
  Serial.print(" ");
  Serial.print(currHour);
  Serial.print(":");
  Serial.println(currMinute);
  switch (currState)
  {
  case idle:
    Serial.println("Idle");
    if (inTimeRange())
    {
      currState = wait;
    }
    break;
  case wait:
    Serial.println("Wait");
    if (!(inTimeRange()))
    {
      currState = idle;
    }
    else if (measurementInterval())
    {
      currState = request;
      measurementHour = currHour;
      measurementMin = currMinute;
    }
    break;
  case request:
    Serial.println("Request");
    // if(fiveMins()){
    //   currState = wait;
    // }
    // else{
    if (checkFinger())
    {
      readHeart();
      readSPO2();
      currState = measurement;
    }
    // }
    break;
  case measurement:
    Serial.println("Measurement");
    Serial.print("Heart Rate: ");
    Serial.print(heartRate);
    Serial.print(" SPO2 ");
    Serial.println(spo2);
    currState = request;
  }
  delay(5000);
}