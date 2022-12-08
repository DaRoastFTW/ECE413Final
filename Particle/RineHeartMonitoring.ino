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
#include <vector>
SYSTEM_THREAD(ENABLED);
int frequency = -1;
int startHour = -1;
int startMin = -1;
int endHour = -1;
int endMin = -1;
int api_key = 0;
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

LEDStatus blinkBlue(RGB_COLOR_BLUE, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);
LEDStatus flashYellow(RGB_COLOR_YELLOW, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);
LEDStatus flashGreen(RGB_COLOR_GREEN, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);

// Local Storage
struct data
{
  // char date[15];
  // char time[15];
  // char heartRate[5];
  // char spo2[5];
  String date;
  String time;
  String heartRate;
  String spo2;
};
std::vector<data> localData;

String getValue(String json, String key)
{
  int startKeyIndex = json.indexOf(key);
  int endKeyIndex = startKeyIndex + key.length();
  int startValueIndex = json.indexOf(":", endKeyIndex) + 1;
  int endValueIndex = json.indexOf(",", startValueIndex);

  String value = json.substring(startValueIndex, endValueIndex);
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
  String data1(data);
  frequency = (getValue(data1, "frequency")).toInt();
  Serial.println(frequency);
}

void updateTime(const char *event, const char *data)
{
  Serial.println(data);
  String data1(data);
  startHour = (getValue(data1, "startHour")).toInt();
  startMin = (getValue(data1, "startMin")).toInt();
  endHour = (getValue(data1, "endHour")).toInt();
  endMin = (getValue(data1, "endMin")).toInt();

  Serial.print(startHour);
  Serial.print(":");
  Serial.println(startMin);
  Serial.print(endHour);
  Serial.print(":");
  Serial.println(endMin);
}
void tokenDelivery(const char *event, const char *data)
{
  Serial.println(data);
  String data1(data);
  api_key = (getValue(data1, "apikey")).toInt();
}
void particleSync(const char *event, const char *data)
{
  Serial.println(data);
  String data1(data);
  frequency = (getValue(data1, "frequency")).toInt();
  startHour = (getValue(data1, "startHour")).toInt();
  startMin = (getValue(data1, "startMin")).toInt();
  endHour = (getValue(data1, "endHour")).toInt();
  endMin = (getValue(data1, "endMin")).toInt();

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
void concatenate_string(char* s, char* s1)
{
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
  Particle.subscribe("frequency", updateFrequency);
  Particle.subscribe("time range", updateTime);
  Particle.subscribe("initial sync", particleSync);
  Particle.subscribe("token delivery", tokenDelivery);
  currState = idle;

  // Sensor setup
  if (!partSensor.begin(Wire, 400000))
  {
    Serial.println("MAX30105 has left the building");
    while (1);
  }
  // byte ledBrightness = 0x1f;
  // byte sampleAverage = 8;
  // byte ledMode = 3;
  // int sampleRate = 100;
  // int pulseWidth = 411;
  // int adcRange = 4096;

  partSensor.setup();
  partSensor.setPulseAmplitudeRed(0x0a);

  // partSensor.setPulseAmplitudeGreen(0);
}

// loop() runs over and over again, as quickly as it can execute.
void loop()
{
  // The core of your code will likely live here.
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
    else if (measurementInterval() && !(currHour == measurementHour && currMinute == measurementMin))
    {
      currState = request;
      measurementHour = currHour;
      measurementMin = currMinute;
    }
    else if (localData.size() > 0)
    {
      
      currState = store;
    }
    break;
  case request:
    Serial.println("Request");
    blinkBlue.setActive(true);
    if (fiveMins())
    {
      currState = wait;
      blinkBlue.setActive(false);
    }
    else
    {
      if (checkFinger())
      {

        readHeart();
        readSPO2();
        blinkBlue.setActive(false);
        currState = measurement;
      }
    }
    break;
  case measurement:
    Serial.println("Measurement");
    Serial.print("Heart Rate: ");
    Serial.print(heartRate);
    Serial.print(" SPO2 ");
    Serial.println(spo2);

    // char currMonthString[5];
    // char currDayString[5];
    // char currYearString[5];
    // char currHourString[5];
    // char currMinuteString[5];
    // char heartRateString[5];
    // char spo2String[5];

    // std::sprintf(currMonthString, "%d", currMonth);
    // std::sprintf(currDayString, "%d", currDay);
    // std::sprintf(currYearString, "%d", currYear);
    // std::sprintf(currHourString, "%d", currMonth);
    // std::sprintf(currMinuteString, "%d", currMonth);
    // std::sprintf(heartRateString, "%d", currMonth);
    // std::sprintf(spo2String, "%d", currMonth);

    dataPoint.date = String(currMonth) + "/" + String(currDay) + "/" + String(currYear);
    dataPoint.time = String(currHour) + ":" + String(currMinute);
    dataPoint.heartRate = String(heartRate);
    dataPoint.spo2 = String(spo2);
    localData.push_back(dataPoint);
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
    // Placeholder for webhooking into particle cloud here. idk this well.
    Serial.println("Store");
    Serial.println(localData.size());
    for (int i = 0; i < localData.size(); i++)
    {
      String dataStream = "";
      dataStream += api_key + " ";
      dataStream += localData.at(i).date + " ";
      dataStream += localData.at(i).time + " ";
      dataStream += localData.at(i).heartRate + " ";
      dataStream += localData.at(i).spo2;

      int strLength = dataStream.length();
      char charStream[strLength + 1];
      strcpy(charStream, dataStream.c_str());
      Particle.publish("store", charStream);
      // Get ACK
    }
    flashGreen.setActive(true);
    delay(2000);
    flashGreen.setActive(false);
    localData.clear();
    currState = wait;
    break;
  }
  delay(5000);
}